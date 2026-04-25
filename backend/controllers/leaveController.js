const LeaveRequest = require('../models/LeaveRequest');

exports.create = async (req, res) => {
  try {
    const { type, startDate, endDate, reason } = req.body;
    if (!type || !startDate || !endDate || !reason) {
      return res.status(400).json({ error: 'type, startDate, endDate and reason are required' });
    }
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ error: 'End date must be on or after start date' });
    }
    const leave = await LeaveRequest.create({
      student: req.user.userId,
      type, startDate, endDate, reason
    });
    res.status(201).json(leave);
  } catch (err) {
    console.error('leave.create:', err);
    res.status(500).json({ error: 'Failed to create leave request' });
  }
};

exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ student: req.user.userId }).sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find()
      .populate('student', 'name userId email')
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
};

exports.review = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: "status must be 'Approved' or 'Rejected'" });
    }
    const leave = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      { status, reviewedBy: req.user.userId, reviewedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });
    res.json(leave);
  } catch (err) {
    console.error('leave.review:', err);
    res.status(500).json({ error: 'Failed to review leave request' });
  }
};

exports.cancel = async (req, res) => {
  try {
    const leave = await LeaveRequest.findOneAndDelete({
      _id: req.params.id,
      student: req.user.userId,
      status: 'Pending'
    });
    if (!leave) return res.status(404).json({ error: 'Pending leave request not found or unauthorized' });
    res.json({ message: 'Leave request cancelled successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel leave request' });
  }
};
