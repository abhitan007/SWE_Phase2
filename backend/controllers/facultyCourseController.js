const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const AttendanceSession = require('../models/AttendanceSession');
const Enrollment = require('../models/Enrollment');
const CourseOffering = require('../models/CourseOffering');
const { toDataUrl, sendDataUrl } = require('../utils/fileHelper');

// ─── My Courses ───

exports.getMyCourseOfferings = async (req, res) => {
  try {
    const offerings = await CourseOffering.find({
      $or: [
        { faculty: req.user.userId },
        { instructors: req.user.userId }
      ]
    })
      .populate({ path: 'course', select: 'code name credits description type' })
      .populate('faculty', 'name userId')
      .populate('instructors', 'name userId')
      .sort({ year: -1, semester: 1 });
    res.json(offerings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch course offerings' });
  }
};

// ─── Assignments ───

exports.createAssignment = async (req, res) => {
  try {
    const { courseOfferingId } = req.params;
    const offering = await CourseOffering.findById(courseOfferingId);
    const isAuthorized = offering &&
      (offering.faculty?.toString() === req.user.userId.toString() ||
       (offering.instructors || []).some(i => i.toString() === req.user.userId.toString()));
    if (!isAuthorized) return res.status(403).json({ error: 'Not authorized for this course' });

    const data = { ...req.body, courseOffering: courseOfferingId, faculty: req.user.userId };
    if (req.file) {
      data.attachmentData = toDataUrl(req.file);
      data.attachmentFileName = req.file.originalname;
    }
    const assignment = await Assignment.create(data);
    // Return without attachmentData to keep response lean
    const out = assignment.toObject();
    delete out.attachmentData;
    res.status(201).json(out);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create assignment' });
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const { courseOfferingId } = req.params;
    const assignments = await Assignment.find({ courseOffering: courseOfferingId })
      .select('-attachmentData')
      .sort({ createdAt: -1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
};

exports.updateAssignment = async (req, res) => {
  try {
    const existing = await Assignment.findById(req.params.assignmentId);
    if (!existing) return res.status(404).json({ error: 'Assignment not found' });

    const allowed = await verifyCourseOwnership(existing.courseOffering, req.user.userId);
    if (!allowed) return res.status(403).json({ error: 'Not authorized for this assignment' });

    // Once any submission exists, deadline edits are frozen so faculty can't
    // retroactively flip late submissions to on-time.
    const newDeadline = req.body.deadline ? new Date(req.body.deadline) : null;
    if (newDeadline && newDeadline.getTime() !== new Date(existing.deadline).getTime()) {
      const submissionCount = await Submission.countDocuments({ assignment: existing._id });
      if (submissionCount > 0) {
        return res.status(400).json({ error: 'Cannot change deadline after submissions exist' });
      }
    }

    const update = { $set: { ...req.body } };
    delete update.$set.attachmentData; // prevent overwriting with raw body
    delete update.$set.faculty;        // faculty owner is immutable
    delete update.$set.courseOffering; // course is immutable
    if (req.file) {
      update.$set.attachmentData = toDataUrl(req.file);
      update.$set.attachmentFileName = req.file.originalname;
    }
    const assignment = await Assignment.findByIdAndUpdate(
      req.params.assignmentId, update, { new: true, runValidators: true }
    ).select('-attachmentData');
    res.json(assignment);
  } catch (err) {
    console.error('updateAssignment:', err);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
};

exports.downloadAssignmentAttachment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment?.attachmentData) return res.status(404).json({ error: 'No attachment found' });

    // Faculty must teach the offering; students must be enrolled in it.
    if (req.user.role === 'student') {
      const enr = await Enrollment.findOne({
        student: req.user.userId,
        courseOffering: assignment.courseOffering,
        status: { $in: ['enrolled', 'completed'] }
      });
      if (!enr) return res.status(403).json({ error: 'Not enrolled in this course' });
    } else if (req.user.role !== 'admin') {
      const allowed = await verifyCourseOwnership(assignment.courseOffering, req.user.userId);
      if (!allowed) return res.status(403).json({ error: 'Not authorized for this course' });
    }

    sendDataUrl(res, assignment.attachmentData, assignment.attachmentFileName || 'attachment');
  } catch (err) {
    console.error('downloadAssignmentAttachment:', err);
    res.status(500).json({ error: 'Failed to download attachment' });
  }
};

exports.publishAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOneAndUpdate(
      { _id: req.params.assignmentId, faculty: req.user.userId },
      { isPublished: true },
      { new: true }
    ).select('-attachmentData');
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to publish assignment' });
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOneAndDelete({
      _id: req.params.assignmentId,
      faculty: req.user.userId
    });
    if (!assignment) return res.status(404).json({ error: 'Assignment not found or not authorized' });
    res.json({ message: 'Assignment deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
};

// ─── Submission Review ───

exports.getSubmissions = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    const allowed = await verifyCourseOwnership(assignment.courseOffering, req.user.userId);
    if (!allowed) return res.status(403).json({ error: 'Not authorized for this assignment' });
    const submissions = await Submission.find({ assignment: req.params.assignmentId })
      .select('-fileData')
      .populate('student', 'name userId email');
    res.json(submissions);
  } catch (err) {
    console.error('getSubmissions:', err);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
};

exports.downloadSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.submissionId);
    if (!submission?.fileData) return res.status(404).json({ error: 'No file found' });
    sendDataUrl(res, submission.fileData, submission.fileName || 'submission');
  } catch (err) {
    res.status(500).json({ error: 'Failed to download submission' });
  }
};

exports.gradeSubmission = async (req, res) => {
  try {
    const { score, feedback } = req.body;
    const submission = await Submission.findById(req.params.submissionId).populate('assignment');
    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    const offeringId = submission.assignment?.courseOffering;
    if (offeringId) {
      const allowed = await verifyCourseOwnership(offeringId, req.user.userId);
      if (!allowed) return res.status(403).json({ error: 'Not authorized to grade this submission' });
    } else if (submission.assignment?.faculty?.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to grade this submission' });
    }

    const numericScore = Number(score);
    if (Number.isNaN(numericScore)) return res.status(400).json({ error: 'score must be a number' });
    const maxScore = submission.assignment?.maxScore ?? 100;
    if (numericScore < 0 || numericScore > maxScore) {
      return res.status(400).json({ error: `score must be between 0 and ${maxScore}` });
    }

    submission.score = numericScore;
    submission.feedback = feedback;
    submission.gradedBy = req.user.userId;
    submission.gradedAt = new Date();
    await submission.save();
    res.json(submission);
  } catch (err) {
    console.error('gradeSubmission:', err);
    res.status(500).json({ error: 'Failed to grade submission' });
  }
};

// ─── Attendance ───

const verifyCourseOwnership = async (courseOfferingId, facultyId) => {
  const offering = await CourseOffering.findById(courseOfferingId);
  if (!offering) return false;
  const isInstructor = offering.instructors?.some(i => i.toString() === facultyId);
  return isInstructor || offering.faculty?.toString() === facultyId;
};

exports.markAttendance = async (req, res) => {
  try {
    const { courseOfferingId } = req.params;
    if (!await verifyCourseOwnership(courseOfferingId, req.user.userId)) {
      return res.status(403).json({ error: 'Not authorized for this course' });
    }
    const { date, records } = req.body;
    const session = await AttendanceSession.findOneAndUpdate(
      { courseOffering: courseOfferingId, date: new Date(date) },
      { faculty: req.user.userId, records },
      { new: true, upsert: true }
    );
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
};

exports.getAttendanceSessions = async (req, res) => {
  try {
    const { courseOfferingId } = req.params;
    if (!await verifyCourseOwnership(courseOfferingId, req.user.userId)) {
      return res.status(403).json({ error: 'Not authorized for this course' });
    }
    const sessions = await AttendanceSession.find({ courseOffering: courseOfferingId })
      .populate('records.student', 'name userId')
      .sort({ date: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};

// ─── Roster & Grades ───

exports.getRoster = async (req, res) => {
  try {
    const { courseOfferingId } = req.params;
    if (!await verifyCourseOwnership(courseOfferingId, req.user.userId)) {
      return res.status(403).json({ error: 'Not authorized for this course' });
    }
    const enrollments = await Enrollment.find({
      courseOffering: courseOfferingId,
      status: 'enrolled'
    }).populate('student', 'name userId email');
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch roster' });
  }
};

exports.submitGrades = async (req, res) => {
  try {
    const { courseOfferingId } = req.params;
    if (!await verifyCourseOwnership(courseOfferingId, req.user.userId)) {
      return res.status(403).json({ error: 'Not authorized for this course' });
    }
    const { grades } = req.body;
    if (!Array.isArray(grades)) return res.status(400).json({ error: 'grades must be an array' });

    const results = [];
    const skipped = [];
    for (const g of grades) {
      // Each enrollment must belong to THIS courseOffering — prevents cross-course
      // grade injection by passing a different course's enrollmentId.
      const enrollment = await Enrollment.findOneAndUpdate(
        { _id: g.enrollmentId, courseOffering: courseOfferingId },
        { grade: g.grade, gradePoints: g.gradePoints, isLocked: true, status: 'completed' },
        { new: true, runValidators: true }
      );
      if (enrollment) results.push(enrollment);
      else skipped.push(g.enrollmentId);
    }
    res.json({ message: 'Grades submitted', results, skipped });
  } catch (err) {
    console.error('submitGrades:', err);
    res.status(500).json({ error: 'Failed to submit grades' });
  }
};
