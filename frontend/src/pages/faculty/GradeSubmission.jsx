import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { getRoster, submitGrades, getMyCourseOfferings } from '../../services/apiService';

const GRADE_POINTS = { AA: 10, AB: 9, BB: 8, BC: 7, CC: 6, CD: 5, DD: 4, fail: 0 };
const GRADE_OPTIONS = Object.keys(GRADE_POINTS);

export default function GradeSubmission() {
  const [offerings, setOfferings] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [roster, setRoster] = useState([]);
  const [grades, setGrades] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getMyCourseOfferings().then(r => setOfferings(r.data)).catch(() => {});
    const preSelected = sessionStorage.getItem('selectedOfferingId');
    if (preSelected) {
      setCourseId(preSelected);
      sessionStorage.removeItem('selectedOfferingId');
    }
  }, []);

  useEffect(() => {
    if (!courseId) { setRoster([]); setGrades({}); return; }
    getRoster(courseId).then(r => {
      setRoster(r.data);
      const g = {};
      r.data.forEach(e => { g[e._id] = e.grade || ''; });
      setGrades(g);
    }).catch(() => {});
  }, [courseId]);

  const handleGradeChange = (enrollmentId, grade) => {
    setGrades(prev => ({ ...prev, [enrollmentId]: grade }));
  };

  const handleSubmit = async () => {
    const gradeList = Object.entries(grades)
      .filter(([_, grade]) => grade)
      .map(([enrollmentId, grade]) => ({ enrollmentId, grade, gradePoints: GRADE_POINTS[grade] ?? 0 }));
    if (gradeList.length === 0) return alert('Select at least one grade');
    setSubmitting(true);
    try {
      await submitGrades(courseId, gradeList);
      alert(`Grades submitted for ${gradeList.length} student(s)!`);
    } catch { alert('Failed to submit grades'); }
    setSubmitting(false);
  };

  const selectedOffering = offerings.find(o => o._id === courseId);
  const gradedCount = Object.values(grades).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#2c3e50]">Grade Submission</h1>

      {/* Course Selector */}
      <Card>
        <label className="block text-sm font-medium text-gray-500 mb-2">Select Course</label>
        {offerings.length > 0 ? (
          <div className="space-y-2">
            {offerings.map(o => (
              <button key={o._id} onClick={() => setCourseId(o._id)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition ${courseId === o._id ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold' : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-indigo-300'}`}>
                <span className="font-semibold">{o.course?.code}</span> — {o.course?.name}
                <span className="ml-2 text-xs text-gray-400">{o.semester} {o.year}</span>
              </button>
            ))}
          </div>
        ) : (
          <input value={courseId} onChange={e => setCourseId(e.target.value)}
            placeholder="Paste Course Offering ID"
            className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm" />
        )}
      </Card>

      {courseId && roster.length === 0 && (
        <Card><p className="text-gray-500 text-sm">No students enrolled.</p></Card>
      )}

      {roster.length > 0 && (
        <Card>
          {selectedOffering && (
            <p className="text-xs text-gray-400 mb-4">
              {selectedOffering.course?.code} — {selectedOffering.course?.name} · {selectedOffering.semester} {selectedOffering.year}
            </p>
          )}
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-4 text-xs font-semibold text-gray-500 uppercase px-1 pb-1 border-b border-gray-100">
              <span>Student</span>
              <span>Roll No.</span>
              <span>Grade</span>
            </div>
            {roster.map(e => (
              <div key={e._id} className="grid grid-cols-3 gap-4 items-center bg-gray-50 p-3 rounded-xl">
                <span className="text-sm text-gray-900 font-medium">{e.student?.name}</span>
                <span className="text-sm text-gray-500">{e.student?.userId}</span>
                <select
                  value={grades[e._id] || ''}
                  onChange={ev => handleGradeChange(e._id, ev.target.value)}
                  className={`border rounded-lg px-2 py-1.5 text-sm bg-white transition ${grades[e._id] ? 'border-indigo-300 text-gray-900' : 'border-gray-200 text-gray-400'}`}
                >
                  <option value="">— Select —</option>
                  {GRADE_OPTIONS.map(g => (
                    <option key={g} value={g}>{g} ({GRADE_POINTS[g]})</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Grade scale: AA=10 · AB=9 · BB=8 · BC=7 · CC=6 · CD=5 · DD=4 · fail=0
              {gradedCount > 0 && <span className="ml-3 text-indigo-600 font-semibold">{gradedCount}/{roster.length} graded</span>}
            </p>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Grades'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
