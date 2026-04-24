const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true },
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  body: { type: String, required: true },
  courseOffering: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseOffering', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attachment: {
    fileName: { type: String },
    fileData: { type: String }, // base64 data URL
    fileSize: { type: Number },
  },
  replies: [replySchema],
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
