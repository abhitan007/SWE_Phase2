const Asset = require('../models/Asset');

exports.create = async (req, res) => {
  try {
    const asset = await Asset.create({ ...req.body, addedBy: req.user.userId });
    res.status(201).json(asset);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create asset' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.hostel) filter['location.hostel'] = req.query.hostel;
    if (req.query.condition) filter.condition = req.query.condition;
    const assets = await Asset.find(filter).sort({ createdAt: -1 });
    res.json(assets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
};

exports.update = async (req, res) => {
  try {
    const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    res.json(asset);
  } catch (err) {
    console.error('asset.update:', err);
    res.status(500).json({ error: 'Failed to update asset' });
  }
};

exports.logMaintenance = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    const { description, performedBy, cost, newCondition } = req.body;
    const entry = { date: new Date() };
    if (description) entry.description = description;
    if (performedBy) entry.performedBy = performedBy;
    if (cost !== undefined && cost !== '') {
      const c = Number(cost);
      if (Number.isNaN(c)) return res.status(400).json({ error: 'cost must be a number' });
      entry.cost = c;
    }
    asset.maintenanceLog.push(entry);
    asset.lastMaintenanceDate = entry.date;
    if (newCondition) asset.condition = newCondition;
    await asset.save();
    res.json(asset);
  } catch (err) {
    console.error('asset.logMaintenance:', err);
    res.status(500).json({ error: 'Failed to log maintenance' });
  }
};

exports.remove = async (req, res) => {
  try {
    await Asset.findByIdAndDelete(req.params.id);
    res.json({ message: 'Asset removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove asset' });
  }
};
