const User = require('../models/User');
const BlacklistToken = require('../models/BlacklistToken');
const { generateToken } = require('../utils/jwt');

exports.login = async (req, res) => {
  try {
    const { userId, password, role } = req.body;
    const user = await User.findOne({ userId });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    if (role && user.role !== role) {
      return res.status(403).json({ error: `Access denied. You are a ${user.role}, not a ${role}.` });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(user._id, user.role);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 
    });

    res.json({ message: 'Logged in successfully', role: user.role, name: user.name });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (token) {
      await BlacklistToken.create({ token });
    }
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    const avatarPath = '/api/uploads/avatars/' + req.file.filename;
    const user = await User.findByIdAndUpdate(req.user.userId, { avatar: avatarPath }, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { userId, email } = req.body;
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    // In production, send OTP via email. Here we mock it.
    res.json({ message: 'OTP sent to your registered IITG email address.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password has been successfully reset.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ error: 'Current password is incorrect' });

    // Password strength validation
    if (newPassword.length < 8 || newPassword.length > 16) {
      return res.status(400).json({ error: 'Password must be 8-16 characters' });
    }
    if (!/[A-Z]/.test(newPassword)) return res.status(400).json({ error: 'Password must contain an uppercase letter' });
    if (!/[a-z]/.test(newPassword)) return res.status(400).json({ error: 'Password must contain a lowercase letter' });
    if (!/[0-9]/.test(newPassword)) return res.status(400).json({ error: 'Password must contain a digit' });
    if (!/[!@#$%^&*]/.test(newPassword)) return res.status(400).json({ error: 'Password must contain a special character' });
    if (newPassword.toLowerCase().includes(user.userId.toLowerCase())) {
      return res.status(400).json({ error: 'Password must not contain your username' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
