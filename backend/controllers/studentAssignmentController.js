const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Enrollment = require('../models/Enrollment');
const AttendanceSession = require('../models/AttendanceSession');

// ─── Student Assignments ───

exports.getMyAssignments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user.userId, status: 'enrolled' });
    const courseOfferingIds = enrollments.map(e => e.courseOffering);
    const assignments = await Assignment.find({
      courseOffering: { $in: courseOfferingIds },
      isPublished: true
    }).populate({ path: 'courseOffering', populate: { path: 'course', select: 'code name' } })
      .sort({ deadline: 1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
};

exports.submitAssignment = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File is required' });
    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    const isLate = new Date() > new Date(assignment.deadline);
    const submission = await Submission.findOneAndUpdate(
      { assignment: req.params.assignmentId, student: req.user.userId },
      {
        filePath: req.file.path,
        fileName: req.file.originalname,
        submittedAt: new Date(),
        isLate
      },
      { new: true, upsert: true }
    );
    res.status(201).json(submission);
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
};

exports.getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user.userId })
      .populate('assignment', 'title maxScore deadline');
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
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

    // Build per-course summary
    const summaryMap = {};
    for (const session of sessions) {
      const coId = session.courseOffering._id.toString();
      if (!summaryMap[coId]) {
        summaryMap[coId] = { courseOffering: session.courseOffering, total: 0, attended: 0 };
      }
      summaryMap[coId].total++;
      const record = session.records.find(r => r.student.toString() === req.user.userId);
      if (record && record.status === 'present') {
        summaryMap[coId].attended++;
      }
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
