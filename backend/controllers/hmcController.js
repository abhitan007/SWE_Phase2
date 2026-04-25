const HMCMember = require('../models/HMCMember');
const User = require('../models/User');

const verifyWarden = async (userId) => {
  const user = await User.findById(userId).select('role');
  if (user?.role === 'admin') return true;
  const member = await HMCMember.findOne({ user: userId, isActive: true });
  return member && member.role === 'Warden';
};

exports.getAll = async (req, res) => {
  try {
    const members = await HMCMember.find({ isActive: true })
      .populate('user', 'name userId email department');
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch HMC members' });
  }
};

exports.add = async (req, res) => {
  try {
    if (!await verifyWarden(req.user.userId)) return res.status(403).json({ error: 'Only Wardens can manage HMC members' });
    
    // Allow passing a string 'userId' and look up the ObjectId
    const User = require('../models/User');
    const userDoc = await User.findOne({ userId: req.body.user });
    if (!userDoc) return res.status(404).json({ error: `User with ID ${req.body.user} not found` });
    
    const member = await HMCMember.create({ ...req.body, user: userDoc._id });
    res.status(201).json(member);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'User is already an HMC member' });
    res.status(500).json({ error: 'Failed to add HMC member' });
  }
};

exports.update = async (req, res) => {
  try {
    if (!await verifyWarden(req.user.userId)) return res.status(403).json({ error: 'Only Wardens can manage HMC members' });
    // Whitelist updatable fields. `user` is immutable (use add/remove instead).
    const { role, isActive } = req.body;
    const update = {};
    if (role !== undefined) update.role = role;
    if (isActive !== undefined) update.isActive = isActive;
    const member = await HMCMember.findByIdAndUpdate(req.params.id, update, {
      new: true, runValidators: true
    });
    if (!member) return res.status(404).json({ error: 'HMC member not found' });
    res.json(member);
  } catch (err) {
    console.error('hmc.update:', err);
    res.status(500).json({ error: 'Failed to update HMC member' });
  }
};

exports.remove = async (req, res) => {
  try {
    if (!await verifyWarden(req.user.userId)) return res.status(403).json({ error: 'Only Wardens can manage HMC members' });
    await HMCMember.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'HMC member removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove HMC member' });
  }
};
