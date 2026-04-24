const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  documentId: { type: String, required: true, unique: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['transcript'], default: 'transcript' },
  fileData: { type: String, required: true }, // base64 PDF
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
