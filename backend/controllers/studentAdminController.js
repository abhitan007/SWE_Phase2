const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const { validatePassword } = require('../utils/passwordPolicy');

exports.getAllStudents = async (req, res) => {
  try {
    const students = await StudentProfile.find()
      .populate('user', 'name email userId department')
      .populate('program', 'name');
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createStudent = async (req, res) => {
  let user = null;
  try {
    const { userId, name, email, department, password, rollNumber, program, batch, currentSemester } = req.body;
    const check = validatePassword(password, userId);
    if (!check.ok) return res.status(400).json({ error: check.error });
    user = await User.create({ userId, name, email, department, password, role: 'student' });
    const profile = await StudentProfile.create({
      user: user._id,
      rollNumber: rollNumber || userId,
      program: program || undefined,
      batch,
      currentSemester: currentSemester || 1
    });
    res.status(201).json({ user: { _id: user._id, userId, name, email }, profile });
  } catch (err) {
    if (user) await User.findByIdAndDelete(user._id).catch(() => {});
    if (err.code === 11000) return res.status(409).json({ error: 'User ID, email, or roll number already exists' });
    res.status(500).json({ error: err.message || 'Server error' });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const profile = await StudentProfile.findById(req.params.id).populate('user');
    if (!profile) return res.status(404).json({ error: 'Student not found' });

    const { name, email, department, rollNumber, program, batch, currentSemester } = req.body;
    await User.findByIdAndUpdate(profile.user._id, { name, email, department }, { runValidators: true });
    await StudentProfile.findByIdAndUpdate(req.params.id, { rollNumber, program, batch, currentSemester }, { new: true, runValidators: true });

    res.json({ message: 'Student updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateStudentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const profile = await StudentProfile.findByIdAndUpdate(
      req.params.id,
      { academicStatus: status },
      { new: true, runValidators: true }
    );
    if (!profile) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: `Student status updated to ${status}`, profile });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.bulkImportStudents = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'CSV file is required' });

    const fs = require('fs').promises;
    const fsSync = require('fs');
    const { parse } = require('csv-parse/sync');

    const csvContent = await fs.readFile(req.file.path, 'utf8');
    const records = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true });

    const results = { success: 0, failed: 0, errors: [] };

    for (const row of records) {
      let user = null;
      try {
        const password = row.password || 'changeme123';
        // Note: bulk-import passwords are intentionally permissive — the user
        // will be required to change on first login (handled at auth time).
        user = await User.create({
          userId: row.userId,
          name: row.name,
          email: row.email,
          department: row.department,
          password,
          role: 'student'
        });
        await StudentProfile.create({
          user: user._id,
          rollNumber: row.rollNumber,
          program: row.program || undefined,
          batch: row.batch,
          currentSemester: parseInt(row.currentSemester) || 1
        });
        results.success++;
      } catch (err) {
        // Roll back the User if profile creation failed, so we don't leave orphans.
        if (user) await User.findByIdAndDelete(user._id).catch(() => {});
        results.failed++;
        results.errors.push({ row: row.userId || row.email, error: err.message });
      }
    }

    // Cleanup uploaded file
    fsSync.unlink(req.file.path, () => {});
    res.json({ message: `Import complete: ${results.success} succeeded, ${results.failed} failed`, ...results });
  } catch (err) {
    res.status(500).json({ error: 'Bulk import failed: ' + err.message });
  }
};
