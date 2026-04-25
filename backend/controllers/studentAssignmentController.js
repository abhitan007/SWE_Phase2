const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Enrollment = require('../models/Enrollment');
const AttendanceSession = require('../models/AttendanceSession');
const { toDataUrl, sendDataUrl } = require('../utils/fileHelper');

// ─── Student Assignments ───

exports.getMyAssignments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user.userId, status: 'enrolled' });
    const courseOfferingIds = enrollments.map(e => e.courseOffering);
    const assignments = await Assignment.find({
      courseOffering: { $in: courseOfferingIds },
      isPublished: true
    }).select('-attachmentData')
      .populate({ path: 'courseOffering', populate: { path: 'course', select: 'code name' } })
      .sort({ deadline: 1 });

    // Attach each student's own submission to the assignment
    const assignmentIds = assignments.map(a => a._id);
    const submissions = await Submission.find({
      assignment: { $in: assignmentIds },
      student: req.user.userId
    }).select('-fileData');

    const submissionMap = {};
    for (const sub of submissions) {
      submissionMap[sub.assignment.toString()] = sub;
    }

    const enriched = assignments.map(a => ({
      ...a.toObject(),
      mySubmission: submissionMap[a._id.toString()] || null
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
};

exports.submitAssignment = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File is required' });
    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    // Student must be enrolled in the assignment's course offering.
    const enr = await Enrollment.findOne({
      student: req.user.userId,
      courseOffering: assignment.courseOffering,
      status: 'enrolled'
    });
    if (!enr) return res.status(403).json({ error: 'Not enrolled in this course' });

    // Per-assignment file type whitelist (if configured on the assignment)
    if (Array.isArray(assignment.allowedFileTypes) && assignment.allowedFileTypes.length > 0) {
      const ext = (req.file.originalname.split('.').pop() || '').toLowerCase();
      const allowed = assignment.allowedFileTypes
        .map(t => String(t).toLowerCase().replace(/^\./, ''));
      if (!allowed.includes(ext) && !allowed.includes(req.file.mimetype.toLowerCase())) {
        return res.status(400).json({ error: `File type not allowed. Permitted: ${assignment.allowedFileTypes.join(', ')}` });
      }
    }

    const isLate = new Date() > new Date(assignment.deadline);
    const submission = await Submission.findOneAndUpdate(
      { assignment: req.params.assignmentId, student: req.user.userId },
      {
        fileData: toDataUrl(req.file),
        fileName: req.file.originalname,
        submittedAt: new Date(),
        isLate
      },
      { new: true, upsert: true }
    );
    const out = submission.toObject();
    delete out.fileData;
    res.status(201).json(out);
  } catch (err) {
    console.error('submitAssignment:', err);
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
};

exports.getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user.userId })
      .select('-fileData')
      .populate('assignment', 'title maxScore deadline');
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
};

exports.downloadMySubmission = async (req, res) => {
  try {
    const submission = await Submission.findOne({
      _id: req.params.submissionId,
      student: req.user.userId
    });
    if (!submission?.fileData) return res.status(404).json({ error: 'No file found' });
    sendDataUrl(res, submission.fileData, submission.fileName || 'submission');
  } catch (err) {
    res.status(500).json({ error: 'Failed to download submission' });
  }
};

// ─── Student Attendance ───

exports.getMyAttendance = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user.userId, status: { $in: ['enrolled', 'completed'] } });
    const courseOfferingIds = enrollments.map(e => e.courseOffering);

    const sessions = await AttendanceSession.find({
      courseOffering: { $in: courseOfferingIds }
    }).populate({ path: 'courseOffering', populate: { path: 'course', select: 'code name' } });

    const summaryMap = {};
    for (const session of sessions) {
      const coId = session.courseOffering._id.toString();
      if (!summaryMap[coId]) {
        summaryMap[coId] = { courseOffering: session.courseOffering, total: 0, attended: 0 };
      }
      summaryMap[coId].total++;
      const record = session.records.find(r => r.student.toString() === req.user.userId);
      if (record && record.status === 'present') summaryMap[coId].attended++;
    }
    const summary = Object.values(summaryMap).map(s => ({
      ...s,
      percentage: s.total > 0 ? Math.round((s.attended / s.total) * 100) : 0
    }));
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};
