/**
 * One-time migration: assign department to existing courses based on their code prefix.
 * Run: node fixCourseDepartments.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');
const Department = require('./models/Department');

// Map: course-code prefix → department code
const PREFIX_TO_DEPT = {
  CS: 'CSE',
  EE: 'EEE',
  ME: 'ME',
  CE: 'CE',
  CH: 'ChE',
  BT: 'BT',
  MA: 'MA',
  PH: 'PH',
  CY: 'CY',
  HS: 'HSS',
  DS: 'DSAI',
  DE: 'Des',
};

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const departments = await Department.find({});
  const deptByCode = {};
  for (const d of departments) deptByCode[d.code] = d._id;

  const courses = await Course.find({});
  let updated = 0;

  for (const course of courses) {
    // Find matching prefix (longest match first)
    const match = Object.keys(PREFIX_TO_DEPT)
      .sort((a, b) => b.length - a.length)
      .find(prefix => course.code.toUpperCase().startsWith(prefix));

    if (!match) {
      console.log(`  ⚠️  No prefix match for ${course.code}, skipping`);
      continue;
    }

    const deptCode = PREFIX_TO_DEPT[match];
    const deptId = deptByCode[deptCode];
    if (!deptId) {
      console.log(`  ⚠️  Dept "${deptCode}" not found in DB for ${course.code}`);
      continue;
    }

    await Course.findByIdAndUpdate(course._id, { department: deptId });
    console.log(`  ✅  ${course.code} → ${deptCode}`);
    updated++;
  }

  console.log(`\nDone. Updated ${updated} / ${courses.length} courses.`);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
