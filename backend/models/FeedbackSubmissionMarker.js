const mongoose = require('mongoose');

// Tracks which student submitted feedback for which window — so we can enforce
// "one response per student per window" without storing the student on the
// actual FeedbackResponse (which stays anonymous).
const feedbackSubmissionMarkerSchema = new mongoose.Schema({
  feedbackWindow: { type: mongoose.Schema.Types.ObjectId, ref: 'FeedbackWindow', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

feedbackSubmissionMarkerSchema.index({ feedbackWindow: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('FeedbackSubmissionMarker', feedbackSubmissionMarkerSchema);
