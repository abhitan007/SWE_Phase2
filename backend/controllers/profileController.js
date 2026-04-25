const User = require('../models/User');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, department, hostel, room } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name, department, hostel, room },
      { new: true, runValidators: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    console.error('updateProfile:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
