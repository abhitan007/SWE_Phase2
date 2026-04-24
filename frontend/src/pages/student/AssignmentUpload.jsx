import { useState, useEffect, useRef } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { getMyAssignments, submitAssignment, getMySubmissions, downloadAssignmentAttachment } from '../../services/apiService';

export default function AssignmentUpload() {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [uploading, setUploading] = useState({});
  const fileRefs = useRef({});

  const loadData = () => {
    getMyAssignments().then(r => setAssignments(r.data)).catch(() => {});
    getMySubmissions().then(r => setSubmissions(r.data)).catch(() => {});
  };

  useEffect(() => { loadData(); }, []);

  const getSubmission = (assignmentId) =>
    submissions.find(s =>
      (s.assignment?._id ?? s.assignment)?.toString() === assignmentId?.toString()
    );

  const handleDownloadAttachment = async (assignment) => {
    try {
      const res = await downloadAssignmentAttachment(assignment._id);
      const url = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = assignment.attachmentFileName || 'attachment';
      link.click();
      URL.revokeObjectURL(url);
    } catch { alert('Failed to download attachment'); }
  };

  const handleFileSelect = (assignmentId, file) => {
    if (!file) return;
    setSelectedFiles(prev => ({ ...prev, [assignmentId]: file }));
  };

  const handleSubmit = async (assignmentId) => {
    const file = selectedFiles[assignmentId];
    if (!file) return alert('Please select a file first');
    setUploading(prev => ({ ...prev, [assignmentId]: true }));
    const formData = new FormData();
    formData.append('file', file);
    try {
      await submitAssignment(assignmentId, formData);
      setSelectedFiles(prev => { const n = {...prev}; delete n[assignmentId]; return n; });
      const res = await getMySubmissions();
      setSubmissions(res.data);
      alert('Submitted successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Submission failed — please try again');
    }
    setUploading(prev => ({ ...prev, [assignmentId]: false }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#2c3e50]">My Assignments</h1>
        <p className="text-gray-500 text-sm mt-1">View and submit your coursework. All file types accepted.</p>
      </div>

      {assignments.length === 0 && (
        <Card><p className="text-gray-500 text-sm">No published assignments yet.</p></Card>
      )}

      {assignments.map((assignment) => {
        const sub = getSubmission(assignment._id);
        const isPastDue = new Date(assignment.deadline) < new Date();
        const file = selectedFiles[assignment._id];
        const isUploading = uploading[assignment._id];

        return (
          <Card key={assignment._id}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h2 className="text-base font-bold text-gray-900">{assignment.title}</h2>
                {assignment.description && (
                  <p className="text-sm text-gray-500 mt-0.5">{assignment.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Course: <span className="text-gray-600">{assignment.courseOffering?.course?.code || '--'}</span>
                  &nbsp;|&nbsp;
                  Deadline: <span className={`font-medium ${isPastDue ? 'text-rose-600' : 'text-gray-600'}`}>{new Date(assignment.deadline).toLocaleString()}</span>
                  &nbsp;|&nbsp;
                  Max Score: <span className="text-gray-600">{assignment.maxScore}</span>
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex-shrink-0 ml-3 ${isPastDue ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {isPastDue ? 'Past Due' : 'Open'}
              </span>
            </div>

            {assignment.attachmentFileName && (
              <div className="flex items-center gap-2 mb-3 p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                <span className="text-xs text-indigo-700 flex-1 truncate">{assignment.attachmentFileName}</span>
                <button onClick={() => handleDownloadAttachment(assignment)} className="text-xs font-semibold text-indigo-600 hover:underline flex-shrink-0">Download</button>
              </div>
            )}

            {sub ? (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <p className="text-sm font-medium text-gray-900">Submitted: <span className="font-mono text-indigo-600">{sub.fileName}</span></p>
                <p className="text-xs text-gray-400">{new Date(sub.submittedAt).toLocaleString()}{sub.isLate ? ' · Late' : ''}</p>
                {sub.score != null && (
                  <p className="text-sm text-gray-700 mt-1">
                    Score: <strong className="text-gray-900">{sub.score}/{assignment.maxScore}</strong>
                    {sub.feedback && <span className="ml-3 text-gray-500">Feedback: {sub.feedback}</span>}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition text-sm text-gray-600 hover:text-indigo-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    {file ? (
                      <span className="font-medium text-indigo-600">{file.name}</span>
                    ) : (
                      <span>Choose file — any type accepted (.py, .js, .zip, .pdf...)</span>
                    )}
                    <input
                      type="file"
                      accept="*"
                      className="hidden"
                      ref={el => fileRefs.current[assignment._id] = el}
                      onChange={e => handleFileSelect(assignment._id, e.target.files[0])}
                    />
                  </label>

                  {file && (
                    <Button
                      onClick={() => handleSubmit(assignment._id)}
                      disabled={isUploading}
                    >
                      {isUploading ? 'Uploading...' : 'Submit'}
                    </Button>
                  )}

                  {file && !isUploading && (
                    <button
                      onClick={() => {
                        setSelectedFiles(prev => { const n = {...prev}; delete n[assignment._id]; return n; });
                        if (fileRefs.current[assignment._id]) fileRefs.current[assignment._id].value = '';
                      }}
                      className="text-xs text-gray-400 hover:text-rose-500"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {isUploading && (
                  <div className="flex items-center gap-2 text-xs text-indigo-600">
                    <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    Uploading {file?.name}...
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
