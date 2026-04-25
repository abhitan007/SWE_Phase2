const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['present', 'absent', 'late'], default: 'absent' }
});

const attendanceSessionSchema = new mongoose.Schema({
  courseOffering: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseOffering', required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  records: [attendanceRecordSchema]
}, { timestamps: true });

attendanceSessionSchema.index({ courseOffering: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
