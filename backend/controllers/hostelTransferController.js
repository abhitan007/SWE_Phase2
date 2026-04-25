const HostelTransfer = require('../models/HostelTransfer');

exports.create = async (req, res) => {
  try {
    const { currentHostel, currentRoom, preferredHostel, preferredRoom, reason } = req.body;
    if (!currentHostel || !currentRoom || !preferredHostel || !reason) {
      return res.status(400).json({ error: 'currentHostel, currentRoom, preferredHostel and reason are required' });
    }
    if (currentHostel === preferredHostel && (currentRoom || '') === (preferredRoom || '')) {
      return res.status(400).json({ error: 'Preferred hostel/room must differ from current' });
    }
    const transfer = await HostelTransfer.create({
      student: req.user.userId,
      currentHostel, currentRoom, preferredHostel, preferredRoom, reason
    });
    res.status(201).json(transfer);
  } catch (err) {
    console.error('hostelTransfer.create:', err);
    res.status(500).json({ error: 'Failed to create transfer request' });
  }
};

exports.getMyTransfers = async (req, res) => {
  try {
    const transfers = await HostelTransfer.find({ student: req.user.userId }).sort({ createdAt: -1 });
    res.json(transfers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transfer requests' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const transfers = await HostelTransfer.find()
      .populate('student', 'name userId email')
      .sort({ createdAt: -1 });
    res.json(transfers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transfer requests' });
  }
};

exports.review = async (req, res) => {
  try {
    const { status, reviewRemarks } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: "status must be 'Approved' or 'Rejected'" });
    }
    const transfer = await HostelTransfer.findByIdAndUpdate(
      req.params.id,
      { status, reviewRemarks, reviewedBy: req.user.userId, reviewedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!transfer) return res.status(404).json({ error: 'Transfer request not found' });
    res.json(transfer);
  } catch (err) {
    console.error('hostelTransfer.review:', err);
    res.status(500).json({ error: 'Failed to review transfer request' });
  }
};
