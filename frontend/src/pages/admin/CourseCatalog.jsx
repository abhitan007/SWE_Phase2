import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import api from '../../services/authService';
import { createCourseOffering } from '../../services/apiService';

const SEMESTERS = ['Spring', 'Summer', 'Fall', 'Winter'];
const CURRENT_YEAR = new Date().getFullYear();

export default function CourseCatalog() {
  const [courses, setCourses] = useState([]);
  const [courseModal, setCourseModal] = useState(false);
  const [offerModal, setOfferModal] = useState(null); // holds the course object when open
  const [courseForm, setCourseForm] = useState({ code: '', name: '', credits: 3, description: '' });
  const [offerForm, setOfferForm] = useState({ facultyUserId: '', semester: 'Spring', year: CURRENT_YEAR, capacity: 60 });
  const [offerMsg, setOfferMsg] = useState('');
  const [offerLoading, setOfferLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);
  const fetchData = () => api.get('/courses').then(r => setCourses(r.data)).catch(() => {});

  const handleCreateCourse = async () => {
    if (!courseForm.code || !courseForm.name) return alert('Code and Name are required');
    try {
      await api.post('/courses', courseForm);
      fetchData();
      setCourseModal(false);
      setCourseForm({ code: '', name: '', credits: 3, description: '' });
    } catch (err) { alert(err.response?.data?.error || 'Failed to create course'); }
  };

  const openOfferModal = (course) => {
    setOfferModal(course);
    setOfferForm({ facultyUserId: '', semester: 'Spring', year: CURRENT_YEAR, capacity: 60 });
    setOfferMsg('');
  };

  const handleCreateOffering = async () => {
    if (!offerForm.facultyUserId.trim()) { setOfferMsg('Faculty ID is required'); return; }
    setOfferLoading(true);
    setOfferMsg('');
    try {
      await createCourseOffering(offerModal._id, {
        facultyUserId: offerForm.facultyUserId.trim(),
        semester: offerForm.semester,
        year: parseInt(offerForm.year),
        capacity: parseInt(offerForm.capacity) || 60
      });
      setOfferModal(null);
      alert(`Course offering created! Students can now register for ${offerModal.code}.`);
    } catch (err) {
      setOfferMsg(err.response?.data?.error || 'Failed to create offering');
    }
    setOfferLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#2c3e50]">Course Catalog</h1>
          <p className="text-gray-500 text-sm mt-1">Manage the master course catalog and create offerings.</p>
        </div>
        <Button onClick={() => setCourseModal(true)}>+ Add Course</Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <Table
          headers={['Code', 'Name', 'Credits', 'Department', 'Action']}
          data={courses}
          renderRow={(c) => (
            <>
              <td className="px-6 py-4 font-medium text-gray-900">{c.code}</td>
              <td className="px-6 py-4">{c.name}</td>
              <td className="px-6 py-4">{c.credits}</td>
              <td className="px-6 py-4">{c.department?.code || c.department?.name || '--'}</td>
              <td className="px-6 py-4">
                <button
                  onClick={() => openOfferModal(c)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-lg px-3 py-1 hover:bg-indigo-50 transition"
                >
                  Offer Course
                </button>
              </td>
            </>
          )}
        />
        {courses.length === 0 && <p className="text-center text-gray-400 text-sm py-10">No courses yet. Add one to get started.</p>}
      </Card>

      {/* Add Course Modal */}
      {courseModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 p-6 rounded-2xl w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Course</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Course Code *</label>
                <input value={courseForm.code} onChange={e => setCourseForm({...courseForm, code: e.target.value})} placeholder="e.g. CS101" className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Course Name *</label>
                <input value={courseForm.name} onChange={e => setCourseForm({...courseForm, name: e.target.value})} placeholder="e.g. Introduction to Computer Science" className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Credits</label>
                <input type="number" min={1} max={10} value={courseForm.credits} onChange={e => setCourseForm({...courseForm, credits: +e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <textarea value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} placeholder="Course description (optional)" className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm h-20 resize-none" />
              </div>
            </div>
            <div className="mt-5 flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setCourseModal(false)}>Cancel</Button>
              <Button onClick={handleCreateCourse}>Create Course</Button>
            </div>
          </div>
        </div>
      )}

      {/* Offer Course Modal */}
      {offerModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 p-6 rounded-2xl w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Offer Course</h2>
            <p className="text-sm text-gray-500 mb-4">
              <span className="font-semibold text-indigo-600">{offerModal.code}</span> — {offerModal.name}
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Faculty ID *</label>
                <input
                  value={offerForm.facultyUserId}
                  onChange={e => setOfferForm({...offerForm, facultyUserId: e.target.value})}
                  placeholder="Faculty login ID (e.g. pkdas)"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">Must match an existing faculty account. Department will be validated.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Semester</label>
                  <select
                    value={offerForm.semester}
                    onChange={e => setOfferForm({...offerForm, semester: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm bg-white"
                  >
                    {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Year</label>
                  <input
                    type="number"
                    value={offerForm.year}
                    onChange={e => setOfferForm({...offerForm, year: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Seat Capacity</label>
                <input
                  type="number"
                  min={1}
                  value={offerForm.capacity}
                  onChange={e => setOfferForm({...offerForm, capacity: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm"
                />
              </div>
            </div>
            {offerMsg && <p className="text-red-500 text-xs mt-3">{offerMsg}</p>}
            <div className="mt-5 flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setOfferModal(null)}>Cancel</Button>
              <Button onClick={handleCreateOffering} disabled={offerLoading}>
                {offerLoading ? 'Creating...' : 'Create Offering'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
