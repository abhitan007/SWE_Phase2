const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseOffering: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseOffering', required: true },
  semester: { type: String, required: true },
  year: { type: Number, required: true },
  status: { type: String, enum: ['enrolled', 'dropped', 'completed'], default: 'enrolled' },
  grade: { type: String },
  gradePoints: { type: Number },
  isLocked: { type: Boolean, default: false }
}, { timestamps: true });

enrollmentSchema.index({ student: 1, courseOffering: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
