const Course = require('../models/Course');
const CourseOffering = require('../models/CourseOffering');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isRetired: false })
      .populate('prerequisites', 'code name')
      .populate('department', 'name code');
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { code, name, credits, description, prerequisites, department } = req.body;
    const course = await Course.create({ code, name, credits, description, prerequisites, department });
    res.status(201).json(course);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Course code already exists' });
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createOffering = async (req, res) => {
  try {
    const { facultyUserId, semester, year, capacity } = req.body;
    if (!facultyUserId || !semester || !year) {
      return res.status(400).json({ error: 'facultyUserId, semester and year are required' });
    }

    const facultyUser = await User.findOne({ userId: facultyUserId, role: 'faculty' });
    if (!facultyUser) return res.status(404).json({ error: `Faculty ID "${facultyUserId}" not found` });

    const course = await Course.findById(req.params.id).populate('department', 'name code');
    if (!course) return res.status(404).json({ error: 'Course not found' });

    if (course.department && facultyUser.department) {
      const deptCode = (course.department.code || '').toLowerCase();
      const deptName = (course.department.name || '').toLowerCase();
      const facultyDept = facultyUser.department.toLowerCase();
      if (facultyDept !== deptCode && facultyDept !== deptName) {
        return res.status(400).json({
          error: `Faculty department "${facultyUser.department}" does not match course department "${course.department.code || course.department.name}"`
        });
      }
    }

    const offering = await CourseOffering.create({
      course: req.params.id,
      faculty: facultyUser._id,
      semester,
      year: parseInt(year),
      capacity: parseInt(capacity) || 60,
      isOpen: true
    });

    const populated = await offering.populate([
      { path: 'course', select: 'code name credits' },
      { path: 'faculty', select: 'name userId' }
    ]);
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
};

exports.retireCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, { isRetired: true }, { new: true });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json({ message: 'Course retired', course });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAvailableCourses = async (req, res) => {
  try {
    const offerings = await CourseOffering.find({ isOpen: true })
      .populate({
        path: 'course',
        match: { isRetired: false },
        populate: [
          { path: 'department', select: 'name code' },
          { path: 'prerequisites', select: 'code name' }
        ]
      })
      .populate('faculty', 'name');

    const active = offerings.filter(o => o.course);

    if (req.user?.role === 'student') {
      const existing = await Enrollment.find({ student: req.user.userId });
      const enrolledIds = new Set(existing.map(e => e.courseOffering.toString()));
      return res.json(active.filter(o => !enrolledIds.has(o._id.toString())));
    }

    res.json(active);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
