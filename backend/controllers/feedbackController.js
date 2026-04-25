const FeedbackWindow = require('../models/FeedbackWindow');
const FeedbackResponse = require('../models/FeedbackResponse');
const Enrollment = require('../models/Enrollment');

// ─── Faculty: Open/Close Feedback Window ───

exports.openWindow = async (req, res) => {
  try {
    const { courseOfferingId } = req.params;
    const { startDate, endDate, questions } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    // Close any existing active window for this offering first
    await FeedbackWindow.updateMany(
      { courseOffering: courseOfferingId, isActive: true },
      { isActive: false }
    );

    const window = await FeedbackWindow.create({
      courseOffering: courseOfferingId,
      openedBy: req.user.userId,
      startDate,
      endDate,
      questions: questions || [
        { text: 'How would you rate the overall course quality?', type: 'rating' },
        { text: 'How effective was the teaching methodology?', type: 'rating' },
        { text: 'How well-organized was the course material?', type: 'rating' },
        { text: 'Rate the availability and helpfulness of the instructor(s).', type: 'rating' },
        { text: 'Any additional comments or suggestions?', type: 'text' }
      ]
    });
    res.status(201).json(window);
  } catch (err) {
    res.status(500).json({ error: 'Failed to open feedback window' });
  }
};

exports.closeWindow = async (req, res) => {
  try {
    const window = await FeedbackWindow.findByIdAndUpdate(
      req.params.windowId,
      { isActive: false },
      { new: true }
    );
    if (!window) return res.status(404).json({ error: 'Feedback window not found' });
    res.json(window);
  } catch (err) {
    res.status(500).json({ error: 'Failed to close feedback window' });
  }
};

// ─── Student: Submit Feedback ───

exports.getActiveWindow = async (req, res) => {
  try {
    const { courseOfferingId } = req.params;
    const now = new Date();
    const window = await FeedbackWindow.findOne({
      courseOffering: courseOfferingId,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    });
    if (!window) return res.status(404).json({ error: 'No active feedback window' });
    res.json(window);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch feedback window' });
  }
};

exports.submitFeedback = async (req, res) => {
  try {
    const { courseOfferingId } = req.params;
    const { answers, overallRating, comments } = req.body;

    if (!overallRating || overallRating < 1 || overallRating > 5) {
      return res.status(400).json({ error: 'A valid overall rating (1–5) is required' });
    }

    // Only enrolled (or completed) students can submit feedback for this course
    const enrollment = await Enrollment.findOne({
      student: req.user.userId,
      courseOffering: courseOfferingId,
      status: { $in: ['enrolled', 'completed'] }
    });
    if (!enrollment) {
      return res.status(403).json({ error: 'You can only submit feedback for courses you are enrolled in' });
    }

    const now = new Date();
    const window = await FeedbackWindow.findOne({
      courseOffering: courseOfferingId,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    });
    if (!window) return res.status(400).json({ error: 'Feedback window is not currently open' });

    // Per-student dedup. We track that *this* student submitted for *this* window
    // in a separate marker doc so the FeedbackResponse itself stays anonymous.
    const FeedbackSubmissionMarker = require('../models/FeedbackSubmissionMarker');
    try {
      await FeedbackSubmissionMarker.create({ feedbackWindow: window._id, student: req.user.userId });
    } catch (markerErr) {
      if (markerErr.code === 11000) {
        return res.status(409).json({ error: 'You have already submitted feedback for this course' });
      }
      throw markerErr;
    }

    // Sanitize answers: keep only meaningful values
    const cleanAnswers = (answers || []).map(a => {
      const clean = { questionIndex: a.questionIndex };
      if (a.rating && a.rating > 0) clean.rating = a.rating;
      if (a.text && a.text.trim()) clean.text = a.text.trim();
      return clean;
    });

    await FeedbackResponse.create({
      feedbackWindow: window._id,
      courseOffering: courseOfferingId,
      answers: cleanAnswers,
      overallRating,
      comments: comments?.trim() || ''
    });

    res.status(201).json({ message: 'Feedback submitted successfully' });
  } catch (err) {
    console.error('submitFeedback error:', err);
    res.status(500).json({ error: err.message || 'Failed to submit feedback' });
  }
};

// ─── Faculty: View Aggregate Results ───

exports.getResults = async (req, res) => {
  try {
    const { courseOfferingId } = req.params;

    // Faculty can only read feedback for offerings they teach. Admin bypasses.
    if (req.user.role === 'faculty') {
      const CourseOffering = require('../models/CourseOffering');
      const offering = await CourseOffering.findById(courseOfferingId).select('faculty instructors');
      const isOwner = offering && (
        offering.faculty?.toString() === req.user.userId ||
        (offering.instructors || []).some(i => i.toString() === req.user.userId)
      );
      if (!isOwner) return res.status(403).json({ error: 'Not authorized for this course' });
    }

    const responses = await FeedbackResponse.find({ courseOffering: courseOfferingId });

    // Fetch the latest window so we can return actual question texts
    const window = await FeedbackWindow.findOne({ courseOffering: courseOfferingId })
      .sort({ createdAt: -1 });

    if (responses.length === 0) {
      return res.json({
        totalResponses: 0,
        averageRating: null,
        questionResults: [],
        comments: [],
        questions: window?.questions || []
      });
    }

    const avgRating = responses.reduce((s, r) => s + (r.overallRating || 0), 0) / responses.length;

    // Aggregate per-question ratings
    const questionMap = {};
    for (const resp of responses) {
      for (const ans of resp.answers) {
        if (!questionMap[ans.questionIndex]) questionMap[ans.questionIndex] = { ratings: [], texts: [] };
        if (ans.rating) questionMap[ans.questionIndex].ratings.push(ans.rating);
        if (ans.text) questionMap[ans.questionIndex].texts.push(ans.text);
      }
    }

    const questions = window?.questions || [];
    const questionResults = Object.entries(questionMap).map(([idx, data]) => ({
      questionIndex: parseInt(idx),
      questionText: questions[parseInt(idx)]?.text || `Question ${parseInt(idx) + 1}`,
      questionType: questions[parseInt(idx)]?.type || 'rating',
      averageRating: data.ratings.length > 0 ? (data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length).toFixed(2) : null,
      responseCount: data.ratings.length + data.texts.length,
      textResponses: data.texts
    }));

    res.json({
      totalResponses: responses.length,
      averageRating: avgRating.toFixed(2),
      comments: responses.filter(r => r.comments).map(r => r.comments),
      questionResults,
      questions  // include raw questions for reference
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch feedback results' });
  }
};

// ─── Admin: System-wide Feedback Evaluation ───

exports.getAllFeedback = async (req, res) => {
  try {
    const windows = await FeedbackWindow.find()
      .populate({
        path: 'courseOffering',
        populate: { path: 'course', select: 'code name' }
      })
      .populate('openedBy', 'name')
      .sort({ createdAt: -1 });
    
    const result = [];
    for (const w of windows) {
      const count = await FeedbackResponse.countDocuments({ feedbackWindow: w._id });
      const responses = await FeedbackResponse.find({ feedbackWindow: w._id });
      const avgRating = count > 0 ? (responses.reduce((s, r) => s + (r.overallRating || 0), 0) / count).toFixed(2) : null;
      result.push({
        _id: w._id,
        courseOffering: w.courseOffering,
        openedBy: w.openedBy,
        startDate: w.startDate,
        endDate: w.endDate,
        isActive: w.isActive,
        totalResponses: count,
        averageRating: avgRating
      });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch feedback data' });
  }
};
