const Announcement = require('../models/Announcement');
const Enrollment = require('../models/Enrollment');
const CourseOffering = require('../models/CourseOffering');

exports.create = async (req, res) => {
  try {
    const { title, content, scope, courseOffering, priority } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'title and content are required' });
    }

    // Only admins may post system-wide announcements. Faculty must scope to a
    // course they teach. Anything else falls back to a course announcement.
    let finalScope = scope === 'system' ? 'system' : 'course';
    if (finalScope === 'system' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can post system-wide announcements' });
    }

    if (finalScope === 'course') {
      if (!courseOffering) {
        return res.status(400).json({ error: 'courseOffering is required for course-scoped announcements' });
      }
      if (req.user.role === 'faculty') {
        const offering = await CourseOffering.findById(courseOffering).select('faculty instructors');
        const isOwner = offering && (
          offering.faculty?.toString() === req.user.userId ||
          (offering.instructors || []).some(i => i.toString() === req.user.userId)
        );
        if (!isOwner) return res.status(403).json({ error: 'Not authorized for this course' });
      }
    }

    const announcement = await Announcement.create({
      title,
      content,
      scope: finalScope,
      courseOffering: finalScope === 'course' ? courseOffering : undefined,
      priority: ['low', 'normal', 'high'].includes(priority) ? priority : 'normal',
      author: req.user.userId
    });
    res.status(201).json(announcement);
  } catch (err) {
    console.error('announcement.create:', err);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { role, userId } = req.user;
    let filter = {};

    if (role === 'admin') {
      // Admin sees everything
    } else if (role === 'student') {
      const enrollments = await Enrollment.find({ student: userId, status: 'enrolled' });
      const courseOfferingIds = enrollments.map(e => e.courseOffering);
      filter = {
        $or: [
          { scope: 'system' },
          { scope: 'course', courseOffering: { $in: courseOfferingIds } }
        ]
      };
    } else if (role === 'faculty') {
      filter = {
        $or: [
          { scope: 'system' },
          { author: userId }
        ]
      };
    }

    const announcements = await Announcement.find(filter)
      .populate('author', 'name role')
      .sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
};

exports.deleteOne = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ error: 'Announcement not found' });
    if (req.user.role !== 'admin' && announcement.author.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this announcement' });
    }
    await announcement.deleteOne();
    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
};
