const Enrollment = require('../models/Enrollment');
const CourseOffering = require('../models/CourseOffering');

exports.getAllEnrollments = async (req, res) => {
  try {
    const { semester, studentId } = req.query;
    const filter = {};
    if (semester) filter.semester = semester;
    if (studentId) filter.student = studentId;

    const enrollments = await Enrollment.find(filter)
      .populate('student', 'name userId email')
      .populate({ path: 'courseOffering', populate: { path: 'course', select: 'code name credits' } })
      .sort({ createdAt: -1 });

    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getEnrollmentReport = async (req, res) => {
  try {
    const { semester } = req.query;
    const match = semester ? { semester } : {};

    const report = await Enrollment.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$courseOffering',
          totalEnrolled: { $sum: 1 },
          dropped: { $sum: { $cond: [{ $eq: ['$status', 'dropped'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'courseofferings',
          localField: '_id',
          foreignField: '_id',
          as: 'offering'
        }
      },
      { $unwind: '$offering' }
    ]);

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.manualEnroll = async (req, res) => {
  try {
    const { studentId, courseOfferingId, semester, year } = req.body;

    const offering = await CourseOffering.findById(courseOfferingId);
    if (!offering) return res.status(404).json({ error: 'Course offering not found' });

    const enrollment = await Enrollment.create({
      student: studentId,
      courseOffering: courseOfferingId,
      semester,
      year
    });

    await CourseOffering.findByIdAndUpdate(courseOfferingId, { $inc: { enrolled: 1 } });

    res.status(201).json({ message: 'Student manually enrolled', enrollment });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Student already enrolled in this offering' });
    res.status(500).json({ error: 'Server error' });
  }
};

exports.removeEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndDelete(req.params.id);
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

    // Only decrement when the enrollment was still occupying a seat. Dropped
    // enrollments already gave the seat back at drop time.
    if (enrollment.status === 'enrolled') {
      await CourseOffering.findByIdAndUpdate(enrollment.courseOffering, { $inc: { enrolled: -1 } });
    }

    res.json({ message: 'Enrollment removed' });
  } catch (err) {
    console.error('removeEnrollment:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Returns all course offerings (for admin instructor management)
exports.getOfferings = async (req, res) => {
  try {
    const offerings = await CourseOffering.find()
      .populate({ path: 'course', select: 'code name credits type' })
      .populate('faculty', 'name userId')
      .populate('instructors', 'name userId')
      .sort({ year: -1, createdAt: -1 });
    res.json(offerings);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
