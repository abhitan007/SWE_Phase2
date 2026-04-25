const User = require('../models/User');
const FacultyProfile = require('../models/FacultyProfile');
const CourseOffering = require('../models/CourseOffering');

exports.getAllFaculty = async (req, res) => {
  try {
    const faculty = await FacultyProfile.find()
      .populate('user', 'name email userId')
      .populate('department', 'name code')
      .populate({ path: 'assignedOfferings', populate: { path: 'course', select: 'code name' } });
    res.json(faculty);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createFaculty = async (req, res) => {
  let user = null;
  try {
    const { userId, name, email, password, employeeId, designation, department } = req.body;
    user = await User.create({ userId, name, email, password, role: 'faculty', department });
    const profile = await FacultyProfile.create({
      user: user._id,
      employeeId: employeeId || userId,
      designation: designation || undefined
    });
    res.status(201).json({ user: { _id: user._id, userId, name, email }, profile });
  } catch (err) {
    if (user) await User.findByIdAndDelete(user._id).catch(() => {});
    if (err.code === 11000) return res.status(409).json({ error: 'User ID, email, or employee ID already exists' });
    res.status(500).json({ error: err.message || 'Server error' });
  }
};

exports.updateFaculty = async (req, res) => {
  try {
    const profile = await FacultyProfile.findById(req.params.id).populate('user');
    if (!profile) return res.status(404).json({ error: 'Faculty not found' });

    const { name, email, designation, department } = req.body;
    // Keep User.department in sync — many filters (course eligibility, dept
    // analytics) read off of User.department.
    await User.findByIdAndUpdate(profile.user._id, { name, email, department }, { runValidators: true });
    await FacultyProfile.findByIdAndUpdate(req.params.id, { designation, department }, { runValidators: true });

    res.json({ message: 'Faculty updated successfully' });
  } catch (err) {
    console.error('updateFaculty:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.assignCourse = async (req, res) => {
  try {
    const { offeringId } = req.body;
    const profile = await FacultyProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ error: 'Faculty not found' });

    // Set as primary AND ensure they are in the instructors[] list.
    const offering = await CourseOffering.findByIdAndUpdate(
      offeringId,
      { faculty: profile.user, $addToSet: { instructors: profile.user } },
      { new: true, runValidators: true }
    );
    if (!offering) return res.status(404).json({ error: 'Course offering not found' });

    await FacultyProfile.findByIdAndUpdate(req.params.id, { $addToSet: { assignedOfferings: offeringId } });

    res.json({ message: 'Course assigned to faculty', offering });
  } catch (err) {
    console.error('assignCourse:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateFacultyStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const profile = await FacultyProfile.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    );
    if (!profile) return res.status(404).json({ error: 'Faculty not found' });
    res.json({ message: `Faculty ${isActive ? 'activated' : 'deactivated'}`, profile });
  } catch (err) {
    console.error('updateFacultyStatus:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
