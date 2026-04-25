const NoDues = require('../models/NoDues');
const User = require('../models/User');

const DEFAULT_DEPARTMENTS = [
  'Central Library', 'Hostel Office', 'Sports Complex',
  'Department Lab', 'Finance Section'
];

exports.getMyNoDues = async (req, res) => {
  try {
    const noDues = await NoDues.findOne({ student: req.user.userId });
    res.json(noDues || null);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch no-dues status' });
  }
};

exports.initializeForStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await User.findOne({ _id: studentId, role: 'student' }).select('_id');
    if (!student) return res.status(404).json({ error: 'Student not found' });
    const existing = await NoDues.findOne({ student: studentId });
    if (existing) return res.status(409).json({ error: 'No dues record already exists for this student' });
    const noDues = await NoDues.create({
      student: studentId,
      items: DEFAULT_DEPARTMENTS.map(dept => ({ department: dept, status: 'Pending' }))
    });
    res.status(201).json(noDues);
  } catch (err) {
    console.error('noDues.initialize:', err);
    res.status(500).json({ error: 'Failed to initialize no-dues record' });
  }
};

exports.clearItem = async (req, res) => {
  try {
    const noDues = await NoDues.findOne({ student: req.params.studentId });
    if (!noDues) return res.status(404).json({ error: 'No dues record not found' });

    const item = noDues.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ error: 'Department item not found' });

    if (item.status === 'Cleared') {
      return res.status(409).json({ error: 'This department is already cleared' });
    }

    item.status = 'Cleared';
    item.clearedAt = new Date();
    if (req.body.amount) item.amount = req.body.amount;
    if (req.body.remark) item.remark = req.body.remark;
    noDues.isFullyCleared = noDues.items.every(i => i.status === 'Cleared');
    await noDues.save();
    res.json(noDues);
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear item' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const records = await NoDues.find().populate('student', 'name userId email');
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch no-dues records' });
  }
};
