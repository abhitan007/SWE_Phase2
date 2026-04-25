const Course = require('../models/Course');
const CourseOffering = require('../models/CourseOffering');
const Department = require('../models/Department');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');

exports.getCourses = async (req, res) => {
  try {
    // Admins can opt-in to see retired courses via ?includeRetired=true.
    const filter = (req.user?.role === 'admin' && req.query.includeRetired === 'true')
      ? {}
      : { isRetired: false };
    const courses = await Course.find(filter)
      .populate('prerequisites', 'code name')
      .populate('department', 'name code')
      .populate('allowedDepartments', 'name code')
      .populate('allowedPrograms', 'name');
    res.json(courses);
  } catch (err) {
    console.error('getCourses:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const {
      code, name, credits, description, prerequisites, department,
      type, allowedDepartments, allowedPrograms
    } = req.body;
    const course = await Course.create({
      code, name, credits, description, prerequisites, department,
      type: type || 'core',
      allowedDepartments: allowedDepartments || [],
      allowedPrograms: allowedPrograms || [],
    });
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

    const offering = await CourseOffering.create({
      course: req.params.id,
      faculty: facultyUser._id,
      instructors: [facultyUser._id],
      semester,
      year: parseInt(year),
      capacity: parseInt(capacity) || 60,
      isOpen: true
    });

    const populated = await offering.populate([
      { path: 'course', select: 'code name credits' },
      { path: 'faculty', select: 'name userId' },
      { path: 'instructors', select: 'name userId' }
    ]);
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
};

// Admin: add / remove co-instructor OR change primary instructor
exports.manageInstructors = async (req, res) => {
  try {
    const { offeringId } = req.params;
    const { action, facultyUserId } = req.body; // action: 'add' | 'remove' | 'set_primary'

    if (!['add', 'remove', 'set_primary'].includes(action)) {
      return res.status(400).json({ error: 'action must be "add", "remove", or "set_primary"' });
    }

    const offering = await CourseOffering.findById(offeringId);
    if (!offering) return res.status(404).json({ error: 'Course offering not found' });

    const facultyUser = await User.findOne({ userId: facultyUserId, role: 'faculty' });
    if (!facultyUser) return res.status(404).json({ error: `Faculty ID "${facultyUserId}" not found` });

    let update;

    if (action === 'set_primary') {
      // Change the primary instructor; keep them in instructors[] too
      update = {
        faculty: facultyUser._id,
        $addToSet: { instructors: facultyUser._id }
      };
    } else {
      // Cannot remove the current primary from instructors[]
      if (action === 'remove' && offering.faculty?.toString() === facultyUser._id.toString()) {
        return res.status(400).json({ error: 'Cannot remove the primary instructor. Use "set_primary" to assign a new primary first.' });
      }
      update = action === 'add'
        ? { $addToSet: { instructors: facultyUser._id } }
        : { $pull: { instructors: facultyUser._id } };
    }

    const updated = await CourseOffering.findByIdAndUpdate(offeringId, update, { new: true })
      .populate('faculty', 'name userId')
      .populate('instructors', 'name userId')
      .populate({ path: 'course', select: 'code name' });

    res.json(updated);
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
    // Get student's department and program for elective filtering
    let studentDeptId = null;
    let studentProgramId = null;

    let studentDeptStr = '';
    if (req.user?.role === 'student') {
      const studentUserForDept = await User.findById(req.user.userId);
      studentDeptStr = (studentUserForDept?.department || '').toLowerCase().trim();
      const profile = await StudentProfile.findOne({ user: req.user.userId });
      if (profile?.program) studentProgramId = profile.program.toString();

      if (studentDeptStr) {
        const dept = await Department.findOne({
          $or: [
            { code: { $regex: new RegExp('^' + studentDeptStr + '$', 'i') } },
            { name: { $regex: new RegExp(studentDeptStr, 'i') } }
          ]
        });
        if (dept) studentDeptId = dept._id.toString();
      }
    }

    const offerings = await CourseOffering.find({ isOpen: true })
      .populate({
        path: 'course',
        match: { isRetired: false },
        populate: [
          { path: 'department', select: 'name code' },
          { path: 'prerequisites', select: 'code name' },
          { path: 'allowedDepartments', select: 'name code' },
          { path: 'allowedPrograms', select: 'name' }
        ]
      })
      .populate('faculty', 'name')
      .populate('instructors', 'name userId');

    let active = offerings.filter(o => o.course);

    // Filter by eligibility for students
    if (req.user?.role === 'student') {

      active = active.filter(o => {
        const course = o.course;
        if (!course) return false;

        // open_elective: everyone can see
        if (course.type === 'open_elective') return true;

        const allowedDepts = course.allowedDepartments || [];
        const allowedProgs = course.allowedPrograms || [];

        // No restrictions → show to everyone
        if (allowedDepts.length === 0 && allowedProgs.length === 0) return true;

        // Department match: by ObjectId OR by code/name string comparison
        const deptMatch = allowedDepts.length === 0 || allowedDepts.some(d => {
          const id = d._id?.toString() || d.toString();
          if (studentDeptId && id === studentDeptId) return true;
          // fallback: compare student's dept string with dept code/name
          const code = (d.code || '').toLowerCase();
          const name = (d.name || '').toLowerCase();
          return studentDeptStr && (code === studentDeptStr || name.includes(studentDeptStr) || studentDeptStr.includes(code));
        });

        // Program match: by ObjectId
        const progMatch = allowedProgs.length === 0 || (studentProgramId && allowedProgs.some(p => {
          const id = p._id?.toString() || p.toString();
          return id === studentProgramId;
        }));

        // Only dept restriction → dept must match
        if (allowedDepts.length > 0 && allowedProgs.length === 0) return deptMatch;
        // Only prog restriction → prog must match
        if (allowedProgs.length > 0 && allowedDepts.length === 0) return progMatch;
        // Both restrictions → either must match
        return deptMatch || progMatch;
      });

      // Remove already enrolled
      const existing = await Enrollment.find({ student: req.user.userId });
      const enrolledIds = new Set(existing.map(e => e.courseOffering.toString()));
      active = active.filter(o => !enrolledIds.has(o._id.toString()));
    }

    res.json(active);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
