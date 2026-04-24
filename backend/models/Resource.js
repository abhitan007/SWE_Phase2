const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  courseOffering: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseOffering', required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileData: { type: String, required: true }, // base64 data URL
  fileName: { type: String, required: true },
  fileSize: { type: Number },
  category: { type: String, enum: ['lecture', 'tutorial', 'reference', 'other'], default: 'other' }
}, { timestamps: true });

module.exports = mongoose.model('Resource', resourceSchema);
