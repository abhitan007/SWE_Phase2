const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, enum: ['Maintenance', 'Electrical', 'Network', 'Cleanliness', 'Other'], required: true },
  description: { type: String, required: true },
  hostel: { type: String },
  room: { type: String },
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved'], default: 'Open' },
  attachment: { type: String },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
