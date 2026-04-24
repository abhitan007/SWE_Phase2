const Resource = require('../models/Resource');
const { toDataUrl, sendDataUrl } = require('../utils/fileHelper');

exports.upload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File is required' });
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
    const resources = await Resource.find({ courseOffering: req.params.courseOfferingId })
      .select('-fileData')
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(resources);
  } catch (err) {
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
