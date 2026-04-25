const Resource = require('../models/Resource');
const Enrollment = require('../models/Enrollment');
const CourseOffering = require('../models/CourseOffering');
const { toDataUrl, sendDataUrl } = require('../utils/fileHelper');

async function canTeach(offeringId, user) {
  if (user.role === 'admin') return true;
  const offering = await CourseOffering.findById(offeringId).select('faculty instructors');
  if (!offering) return false;
  return offering.faculty?.toString() === user.userId
    || (offering.instructors || []).some(i => i.toString() === user.userId);
}

exports.upload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File is required' });
    if (!await canTeach(req.params.courseOfferingId, req.user)) {
      return res.status(403).json({ error: 'Not authorized for this course' });
    }
    const resource = await Resource.create({
      title: req.body.title || req.file.originalname,
      description: req.body.description,
      courseOffering: req.params.courseOfferingId,
      uploadedBy: req.user.userId,
      fileData: toDataUrl(req.file),
      fileName: req.file.originalname,
      fileSize: req.file.size,
      category: req.body.category || 'other'
    });
    const out = resource.toObject();
    delete out.fileData;
    res.status(201).json(out);
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload resource' });
  }
};

exports.getByCourse = async (req, res) => {
  try {
    if (req.user.role === 'student') {
      const enr = await Enrollment.findOne({
        student: req.user.userId,
        courseOffering: req.params.courseOfferingId,
        status: { $in: ['enrolled', 'completed'] }
      });
      if (!enr) return res.status(403).json({ error: 'Not enrolled in this course' });
    } else if (!await canTeach(req.params.courseOfferingId, req.user)) {
      return res.status(403).json({ error: 'Not authorized for this course' });
    }
    const resources = await Resource.find({ courseOffering: req.params.courseOfferingId })
      .select('-fileData')
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(resources);
  } catch (err) {
    console.error('resource.getByCourse:', err);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
};

exports.download = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource?.fileData) return res.status(404).json({ error: 'Resource not found' });
    sendDataUrl(res, resource.fileData, resource.fileName);
  } catch (err) {
    res.status(500).json({ error: 'Failed to download resource' });
  }
};

exports.deleteOne = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ error: 'Resource not found' });
    if (req.user.role !== 'admin' && resource.uploadedBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this resource' });
    }
    await resource.deleteOne();
    res.json({ message: 'Resource deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete resource' });
  }
};
