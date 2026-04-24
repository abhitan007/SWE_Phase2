const path = require('path');
const fs = require('fs');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const AttendanceSession = require('../models/AttendanceSession');
const Enrollment = require('../models/Enrollment');
const CourseOffering = require('../models/CourseOffering');

// ─── My Courses ───

exports.getMyCourseOfferings = async (req, res) => {
  try {
    const offerings = await CourseOffering.find({ faculty: req.user.userId })
      .populate({ path: 'course', select: 'code name credits description' })
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
    if (!offering || offering.faculty.toString() !== req.user.userId) {
      if (req.file) fs.unlinkSync(req.file.path).catch?.(() => {});
      return res.status(403).json({ error: 'Not authorized for this course' });
    }
    const data = { ...req.body, courseOffering: courseOfferingId, faculty: req.user.userId };
    if (req.file) {
      data.attachments = [req.file.filename];
      data.attachmentFileName = req.file.originalname;
    }
    const assignment = await Assignment.create(data);
    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create assignment' });
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const { courseOfferingId } = req.params;
    const assignments = await Assignment.find({ courseOffering: courseOfferingId }).sort({ createdAt: -1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
};

exports.updateAssignment = async (req, res) => {
  try {
    const update = { $set: { ...req.body } };
    if (req.file) {
      update.$set.attachments = [req.file.filename];
      update.$set.attachmentFileName = req.file.originalname;
    }
    const assignment = await Assignment.findOneAndUpdate(
      { _id: req.params.assignmentId, faculty: req.user.userId },
      update,
      { new: true }
    );
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update assignment' });
  }
};

exports.downloadAssignmentAttachment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment || !assignment.attachments?.length) {
      return res.status(404).json({ error: 'No attachment found' });
    }
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const filePath = path.join(uploadsDir, assignment.attachments[0]);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on server' });
    res.download(filePath, assignment.attachmentFileName || assignment.attachments[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to download attachment' });
  }
};

exports.publishAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOneAndUpdate(
      { _id: req.params.assignmentId, faculty: req.user.userId },
      { isPublished: true },
      { new: true }
    );
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
    const assignment = await Assignment.findOne({ _id: req.params.assignmentId, faculty: req.user.userId });
    if (!assignment) return res.status(403).json({ error: 'Not authorized for this assignment' });
    const submissions = await Submission.find({ assignment: req.params.assignmentId })
      .populate('student', 'name userId email');
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
};

exports.gradeSubmission = async (req, res) => {
  try {
    const { score, feedback } = req.body;
    const submission = await Submission.findById(req.params.submissionId).populate('assignment');
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    if (submission.assignment?.faculty?.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to grade this submission' });
    }
    submission.score = score;
    submission.feedback = feedback;
    submission.gradedBy = req.user.userId;
    submission.gradedAt = new Date();
    await submission.save();
    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: 'Failed to grade submission' });
  }
};

// ─── Attendance ───

const verifyCourseOwnership = async (courseOfferingId, facultyId) => {
  const offering = await CourseOffering.findById(courseOfferingId);
  return offering && offering.faculty?.toString() === facultyId;
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
    const results = [];
    for (const g of grades) {
      const enrollment = await Enrollment.findByIdAndUpdate(
        g.enrollmentId,
        { grade: g.grade, gradePoints: g.gradePoints, isLocked: true, status: 'completed' },
        { new: true }
      );
      results.push(enrollment);
    }
    res.json({ message: 'Grades submitted', results });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit grades' });
  }
};
