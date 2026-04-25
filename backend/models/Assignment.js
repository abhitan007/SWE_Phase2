const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  courseOffering: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseOffering', required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  deadline: { type: Date, required: true },
  maxScore: { type: Number, default: 100 },
  isPublished: { type: Boolean, default: true },
  allowedFileTypes: [{ type: String }],
  attachmentFileName: { type: String },
  attachmentData: { type: String }, // base64 data URL
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
