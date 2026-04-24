import { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import { useAuth } from '../context/AuthContext';
import { getMyCourseOfferings } from '../services/apiService';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [offerings, setOfferings] = useState([]);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    getMyCourseOfferings().then(r => setOfferings(r.data)).catch(() => {});
  }, []);

  const copyId = (id) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#2c3e50]">Welcome, {user?.name || 'Faculty'}</h1>
        <p className="text-gray-500 text-sm mt-1">Your assigned courses and management tools.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col justify-center items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
          <h2 className="text-3xl font-black text-gray-900">{offerings.length}</h2>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Courses</span>
        </Card>
        <Card className="flex flex-col justify-center items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </div>
          <h2 className="text-3xl font-black text-gray-900">{user?.department || '--'}</h2>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</span>
        </Card>
      </div>

      <Card>
        <h3 className="font-bold text-gray-900 mb-1">My Course Offerings</h3>
        <p className="text-xs text-gray-400 mb-4">Copy the Offering ID to use in Attendance, Assignments, Grading and Submissions pages.</p>

        {offerings.length === 0 ? (
          <p className="text-gray-500 text-sm">No courses assigned yet. Contact admin to get assigned to a course offering.</p>
        ) : (
          <div className="space-y-3">
            {offerings.map(o => (
              <div key={o._id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{o.course?.code}</span>
                    <span className="text-gray-400 text-sm">—</span>
                    <span className="text-sm text-gray-700">{o.course?.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{o.semester} {o.year}</span>
                    <span>·</span>
                    <span>{o.credits || o.course?.credits} credits</span>
                    <span>·</span>
                    <span>{o.enrolled || 0}/{o.capacity} enrolled</span>
                    <span>·</span>
                    <span className={o.isOpen ? 'text-emerald-600 font-semibold' : 'text-rose-500 font-semibold'}>
                      {o.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded">{o._id}</span>
                    <button
                      onClick={() => copyId(o._id)}
                      className="text-xs text-indigo-600 hover:underline font-semibold"
                    >
                      {copied === o._id ? 'Copied!' : 'Copy ID'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="font-bold text-gray-900 mb-3">Quick Guide</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-xl">
            <span className="text-indigo-600 font-bold">1.</span>
            <p>Copy the <span className="font-semibold">Offering ID</span> from your course above.</p>
          </div>
          <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-xl">
            <span className="text-indigo-600 font-bold">2.</span>
            <p>Go to <span className="font-semibold">Attendance</span> or <span className="font-semibold">Assignments</span> in the sidebar and paste the ID to load your course data.</p>
          </div>
          <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-xl">
            <span className="text-indigo-600 font-bold">3.</span>
            <p>Use <span className="font-semibold">Grading</span> to submit final grades after the semester.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
