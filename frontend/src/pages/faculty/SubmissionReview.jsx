import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { getSubmissions, gradeSubmission, getMyCourseOfferings, getAssignments } from '../../services/apiService';

export default function SubmissionReview() {
  const [offerings, setOfferings] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [assignmentId, setAssignmentId] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [gradeInputs, setGradeInputs] = useState({});
  const [grading, setGrading] = useState({});

  useEffect(() => {
    getMyCourseOfferings().then(r => setOfferings(r.data)).catch(() => {});
    const preSelected = sessionStorage.getItem('selectedOfferingId');
    if (preSelected) {
      setCourseId(preSelected);
      sessionStorage.removeItem('selectedOfferingId');
    }
  }, []);

  useEffect(() => {
    if (!courseId) { setAssignments([]); setAssignmentId(''); return; }
    getAssignments(courseId).then(r => setAssignments(r.data)).catch(() => setAssignments([]));
    setAssignmentId('');
  }, [courseId]);

  useEffect(() => {
    if (!assignmentId) { setSubmissions([]); return; }
    getSubmissions(assignmentId).then(r => {
      setSubmissions(r.data);
      const inputs = {};
      r.data.forEach(s => { inputs[s._id] = { score: '', feedback: '' }; });
      setGradeInputs(inputs);
    }).catch(() => setSubmissions([]));
  }, [assignmentId]);

  const handleGrade = async (submissionId) => {
    const { score, feedback } = gradeInputs[submissionId] || {};
    if (score === '' || score == null) return alert('Enter a score');
    setGrading(prev => ({ ...prev, [submissionId]: true }));
    try {
      await gradeSubmission(submissionId, { score: parseInt(score), feedback });
      const res = await getSubmissions(assignmentId);
      setSubmissions(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to grade');
    }
    setGrading(prev => ({ ...prev, [submissionId]: false }));
  };

  const setInput = (subId, field, value) => {
    setGradeInputs(prev => ({ ...prev, [subId]: { ...prev[subId], [field]: value } }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#2c3e50]">Submission Review</h1>

      {/* Step 1 — Select course */}
      <Card>
        <label className="block text-sm font-medium text-gray-500 mb-2">Step 1 — Select Course</label>
        {offerings.length > 0 ? (
          <div className="space-y-2">
            {offerings.map(o => (
              <button
                key={o._id}
                onClick={() => setCourseId(o._id)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition ${courseId === o._id ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold' : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-indigo-300'}`}
              >
                <span className="font-semibold">{o.course?.code}</span> — {o.course?.name}
                <span className="ml-2 text-xs text-gray-400">{o.semester} {o.year}</span>
              </button>
            ))}
          </div>
        ) : (
          <input
            value={courseId}
            onChange={e => setCourseId(e.target.value)}
            placeholder="Paste Course Offering ID"
            className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm"
          />
        )}
      </Card>

      {/* Step 2 — Select assignment */}
      {courseId && (
        <Card>
          <label className="block text-sm font-medium text-gray-500 mb-2">Step 2 — Select Assignment</label>
          {assignments.length === 0 ? (
            <p className="text-sm text-gray-400">No assignments for this course.</p>
          ) : (
            <div className="space-y-2">
              {assignments.map(a => (
                <button
                  key={a._id}
                  onClick={() => setAssignmentId(a._id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition ${assignmentId === a._id ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold' : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-indigo-300'}`}
                >
                  <span className="font-semibold">{a.title}</span>
                  <span className="ml-2 text-xs text-gray-400">Due: {new Date(a.deadline).toLocaleDateString()} · Max: {a.maxScore}</span>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Step 3 — Submissions */}
      {assignmentId && (
        <>
          <p className="text-sm text-gray-500">{submissions.length} submission{submissions.length !== 1 ? 's' : ''}</p>
          {submissions.length === 0 && <Card><p className="text-gray-500 text-sm">No submissions yet.</p></Card>}

          {submissions.map(sub => (
            <Card key={sub._id}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">{sub.student?.name || 'Student'}</h3>
                  <p className="text-sm text-gray-500">{sub.student?.userId}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    File: <span className="font-mono text-gray-600">{sub.fileName}</span>
                    &nbsp;·&nbsp;
                    {new Date(sub.submittedAt).toLocaleString()}
                    {sub.isLate && <span className="ml-2 text-rose-500 font-semibold">Late</span>}
                  </p>
                </div>
                {sub.score != null ? (
                  <span className="px-3 py-1 rounded-xl text-sm font-bold bg-emerald-50 text-emerald-700">
                    {sub.score} / {sub.maxScore ?? '—'}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-amber-50 text-amber-600">Pending</span>
                )}
              </div>

              {sub.score == null ? (
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                  <input
                    type="number"
                    placeholder="Score"
                    value={gradeInputs[sub._id]?.score ?? ''}
                    onChange={e => setInput(sub._id, 'score', e.target.value)}
                    className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Feedback (optional)"
                    value={gradeInputs[sub._id]?.feedback ?? ''}
                    onChange={e => setInput(sub._id, 'feedback', e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 text-sm"
                  />
                  <Button
                    onClick={() => handleGrade(sub._id)}
                    disabled={grading[sub._id]}
                  >
                    {grading[sub._id] ? 'Saving...' : 'Grade'}
                  </Button>
                </div>
              ) : (
                sub.feedback && (
                  <p className="text-sm text-gray-500 pt-2 border-t border-gray-100">Feedback: {sub.feedback}</p>
                )
              )}
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
