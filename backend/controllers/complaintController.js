const Complaint = require('../models/Complaint');

exports.create = async (req, res) => {
  try {
    const { category, description, hostel, room } = req.body;
    if (!category || !description || !hostel) {
      return res.status(400).json({ error: 'category, description and hostel are required' });
    }
    const data = {
      student: req.user.userId,
      category, description, hostel, room
    };
    if (req.file) {
      const base64Data = req.file.buffer.toString('base64');
      data.attachment = `data:${req.file.mimetype};base64,${base64Data}`;
    }
    const complaint = await Complaint.create(data);
    res.status(201).json(complaint);
  } catch (err) {
    console.error('complaint.create:', err);
    res.status(500).json({ error: 'Failed to file complaint' });
  }
};

exports.getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ student: req.user.userId }).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('student', 'name userId email')
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Open', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({ error: "status must be 'Open', 'In Progress' or 'Resolved'" });
    }
    const update = { $set: { status, resolvedBy: req.user.userId } };
    if (status === 'Resolved') {
      update.$set.resolvedAt = new Date();
    } else {
      update.$unset = { resolvedAt: '' };
    }
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id, update, { new: true, runValidators: true }
    );
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    res.json(complaint);
  } catch (err) {
    console.error('complaint.updateStatus:', err);
    res.status(500).json({ error: 'Failed to update complaint' });
  }
};
