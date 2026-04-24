import { useState, useEffect, useMemo, useRef } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import api from '../../services/authService';
import { createCourseOffering, getDepartments, getPrograms, manageInstructors } from '../../services/apiService';

// Searchable faculty picker — shows a filtered dropdown as you type
function FacultyPicker({ value, onChange, placeholder = 'Search by name or ID…' }) {
  const [query, setQuery] = useState('');
  const [facultyList, setFacultyList] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    api.get('/admin/faculty').then(r => setFacultyList(r.data || [])).catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = facultyList.find(f => f.user?.userId === value);

  const filtered = query.trim()
    ? facultyList.filter(f => {
        const q = query.toLowerCase();
        return f.user?.name?.toLowerCase().includes(q) || f.user?.userId?.toLowerCase().includes(q) || f.department?.code?.toLowerCase().includes(q);
      })
    : facultyList;

  const handleSelect = (f) => {
    onChange(f.user?.userId || '');
    setQuery('');
    setOpen(false);
  };

  const handleClear = () => { onChange(''); setQuery(''); };

  return (
    <div ref={ref} className="relative">
      {selected && !open ? (
        // Selected state — show chip
        <div className="flex items-center justify-between border border-indigo-300 bg-indigo-50 rounded-xl px-4 py-2.5">
          <div>
            <span className="text-sm font-semibold text-gray-900">{selected.user?.name}</span>
            <span className="ml-2 text-xs text-gray-500">{selected.user?.userId}</span>
            {selected.department?.code && (
              <span className="ml-2 text-xs text-indigo-600 font-medium">{selected.department.code}</span>
            )}
          </div>
          <button onClick={handleClear} className="text-gray-400 hover:text-rose-500 text-lg leading-none ml-3">×</button>
        </div>
      ) : (
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:border-indigo-400"
        />
      )}

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-400">No faculty found</p>
          ) : (
            filtered.map(f => (
              <button
                key={f._id}
                onMouseDown={() => handleSelect(f)}
                className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 flex items-center justify-between gap-4 border-b border-gray-100 last:border-0"
              >
                <div>
                  <span className="text-sm font-medium text-gray-900">{f.user?.name}</span>
                  <span className="ml-2 text-xs text-gray-400">{f.user?.userId}</span>
                </div>
                {f.department?.code && (
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full flex-shrink-0">
                    {f.department.code}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const SEMESTERS = ['Monsoon', 'Winter', 'Summer'];
const CURRENT_YEAR = new Date().getFullYear();

const TYPE_LABEL = { core: 'Core', departmental_elective: 'Dept. Elective', open_elective: 'Open Elective' };
const TYPE_COLOR = {
  core: 'bg-blue-100 text-blue-700',
  departmental_elective: 'bg-amber-100 text-amber-700',
  open_elective: 'bg-emerald-100 text-emerald-700',
};

// Fetches and displays all course offerings for instructor management
function OfferingsTable({ onManage }) {
  const [offerings, setOfferings] = useState([]);
  useEffect(() => {
    api.get('/admin/enrollments/offerings')
      .then(r => setOfferings(r.data || []))
      .catch(() => {});
  }, []);

  if (offerings.length === 0) {
    return (
      <Card>
        <p className="text-sm text-gray-500">No offerings yet. Create one using the "Offer" button above.</p>
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="divide-y divide-gray-100">
        {offerings.map(o => (
          <div key={o._id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-gray-900">
                  {o.course?.code} — {o.course?.name}
                </span>
                <span className="text-xs text-gray-400">{o.semester} {o.year}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${o.isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'}`}>
                  {o.isOpen ? 'Open' : 'Closed'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Primary: {o.faculty?.name || '—'} ({o.faculty?.userId || '—'})
                {o.instructors?.length > 1 && (
                  <span className="ml-2 text-indigo-500">
                    +{o.instructors.length - 1} co-instructor(s)
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => onManage(o)}
              className="ml-4 text-xs font-semibold text-purple-600 hover:text-purple-800 border border-purple-200 rounded-lg px-3 py-1.5 hover:bg-purple-50 transition whitespace-nowrap"
            >
              Manage Instructors
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function CourseCatalog() {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDept, setFilterDept] = useState('');

  // Modals
  const [courseModal, setCourseModal] = useState(false);
  const [offerModal, setOfferModal] = useState(null);
  const [instrModal, setInstrModal] = useState(null); // { offering }
  const [instrInput, setInstrInput] = useState('');
  const [instrMsg, setInstrMsg] = useState('');

  const [courseForm, setCourseForm] = useState({
    code: '', name: '', credits: 3, description: '',
    type: 'core', department: '', allowedDepartments: [], allowedPrograms: [],
  });
  const [editModal, setEditModal] = useState(null); // course being edited
  const [editForm, setEditForm] = useState({});
  const [offerForm, setOfferForm] = useState({ facultyUserId: '', semester: 'Spring', year: CURRENT_YEAR, capacity: 60 });
  const [offerMsg, setOfferMsg] = useState('');
  const [offerLoading, setOfferLoading] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = () => {
    api.get('/courses').then(r => setCourses(r.data)).catch(() => {});
    getDepartments().then(r => setDepartments(r.data)).catch(() => {});
    getPrograms().then(r => setPrograms(r.data)).catch(() => {});
  };

  // Client-side filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const q = search.toLowerCase();
      if (q && !c.code.toLowerCase().includes(q) && !c.name.toLowerCase().includes(q)) return false;
      if (filterType && c.type !== filterType) return false;
      if (filterDept) {
        const deptId = c.department?._id?.toString() || c.department?.toString() || '';
        const deptCode = (c.department?.code || '').toLowerCase();
        const fd = filterDept.toLowerCase();
        if (deptId !== filterDept && deptCode !== fd) return false;
      }
      return true;
    });
  }, [courses, search, filterType, filterDept]);

  const hasFilters = search || filterType || filterDept;

  const handleCreateCourse = async () => {
    if (!courseForm.code || !courseForm.name) return alert('Code and Name are required');
    try {
      const payload = { ...courseForm };
      if (!payload.department) delete payload.department;
      await api.post('/courses', payload);
      fetchAll();
      setCourseModal(false);
      setCourseForm({ code: '', name: '', credits: 3, description: '', type: 'core', department: '', allowedDepartments: [], allowedPrograms: [] });
    } catch (err) { alert(err.response?.data?.error || 'Failed to create course'); }
  };

  const openEditModal = (course) => {
    setEditForm({
      name: course.name,
      credits: course.credits,
      description: course.description || '',
      type: course.type,
      department: course.department?._id || '',
      allowedDepartments: (course.allowedDepartments || []).map(d => d._id || d),
      allowedPrograms: (course.allowedPrograms || []).map(p => p._id || p),
    });
    setEditModal(course);
  };

  const handleEditCourse = async () => {
    try {
      const payload = { ...editForm };
      if (!payload.department) delete payload.department;
      await api.put(`/courses/${editModal._id}`, payload);
      fetchAll();
      setEditModal(null);
    } catch (err) { alert(err.response?.data?.error || 'Failed to update course'); }
  };

  const toggleId = (arr, id) =>
    arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];

  const openOfferModal = (course) => {
    setOfferModal(course);
    setOfferForm({ facultyUserId: '', semester: 'Spring', year: CURRENT_YEAR, capacity: 60 });
    setOfferMsg('');
  };

  const handleCreateOffering = async () => {
    if (!offerForm.facultyUserId.trim()) { setOfferMsg('Faculty ID is required'); return; }
    setOfferLoading(true); setOfferMsg('');
    try {
      await createCourseOffering(offerModal._id, {
        facultyUserId: offerForm.facultyUserId.trim(),
        semester: offerForm.semester,
        year: parseInt(offerForm.year),
        capacity: parseInt(offerForm.capacity) || 60
      });
      setOfferModal(null);
      alert(`Offering created! Students can now register for ${offerModal.code}.`);
      fetchAll();
    } catch (err) { setOfferMsg(err.response?.data?.error || 'Failed to create offering'); }
    setOfferLoading(false);
  };

  const handleManageInstructor = async (action, overrideUserId) => {
    const userId = overrideUserId || instrInput.trim();
    if (!userId) return;
    setInstrMsg('');
    try {
      const updated = await manageInstructors(instrModal.offering._id, { action, facultyUserId: userId });
      setInstrModal(prev => ({ ...prev, offering: updated.data }));
      setInstrInput('');
      fetchAll();
    } catch (err) { setInstrMsg(err.response?.data?.error || 'Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#2c3e50]">Course Catalog</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage courses, offerings, types, and instructors.
            {hasFilters && <span className="ml-2 text-indigo-600 font-medium">Showing {filteredCourses.length} of {courses.length}</span>}
          </p>
        </div>
        <Button onClick={() => setCourseModal(true)}>+ Add Course</Button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Search Code / Name</label>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="e.g. CS301 or Operating..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-indigo-400" />
          </div>
          <div className="min-w-44">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Course Type</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:border-indigo-400">
              <option value="">All Types</option>
              <option value="core">Core</option>
              <option value="departmental_elective">Dept. Elective</option>
              <option value="open_elective">Open Elective</option>
            </select>
          </div>
          <div className="min-w-48">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Department</label>
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:border-indigo-400">
              <option value="">All Departments</option>
              {departments.map(d => <option key={d._id} value={d.code}>{d.code} — {d.name}</option>)}
            </select>
          </div>
          {hasFilters && (
            <button onClick={() => { setSearch(''); setFilterType(''); setFilterDept(''); }}
              className="px-4 py-2 text-xs font-semibold text-rose-600 hover:text-rose-800 border border-rose-200 rounded-xl hover:bg-rose-50 transition">
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <Table
          headers={['Code', 'Name', 'Credits', 'Type', 'Department', 'Actions']}
          data={filteredCourses}
          renderRow={(c) => (
            <>
              <td className="px-6 py-4 font-medium text-gray-900">{c.code}</td>
              <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{c.name}</td>
              <td className="px-6 py-4">{c.credits}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_COLOR[c.type] || 'bg-gray-100 text-gray-600'}`}>
                  {TYPE_LABEL[c.type] || c.type}
                </span>
              </td>
              <td className="px-6 py-4">{c.department?.code || '--'}</td>
              <td className="px-6 py-4 flex gap-2 flex-wrap">
                <button
                  onClick={() => openOfferModal(c)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-lg px-3 py-1 hover:bg-indigo-50 transition"
                >
                  Offer
                </button>
                <button
                  onClick={() => openEditModal(c)}
                  className="text-xs font-semibold text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1 hover:bg-gray-50 transition"
                >
                  Edit
                </button>
              </td>
            </>
          )}
        />
        {filteredCourses.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-10">
            {hasFilters ? 'No courses match the current filters.' : 'No courses yet.'}
          </p>
        )}
      </Card>

      {/* ── Offerings & Instructor Management ── */}
      <div>
        <h2 className="text-lg font-bold text-[#2c3e50] mb-3">Course Offerings — Instructor Management</h2>
        <p className="text-sm text-gray-500 mb-3">Add or remove co-instructors for any active offering.</p>
        <OfferingsTable onManage={(offering) => { setInstrModal({ offering }); setInstrInput(''); setInstrMsg(''); }} />
      </div>

      {/* ── Add Course Modal ── */}
      {courseModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 p-6 rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Course</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Course Code *</label>
                  <input value={courseForm.code} onChange={e => setCourseForm({ ...courseForm, code: e.target.value })}
                    placeholder="e.g. CS301" className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Credits</label>
                  <input type="number" min={1} max={10} value={courseForm.credits}
                    onChange={e => setCourseForm({ ...courseForm, credits: +e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Course Name *</label>
                <input value={courseForm.name} onChange={e => setCourseForm({ ...courseForm, name: e.target.value })}
                  placeholder="e.g. Introduction to Algorithms" className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm" />
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Department</label>
                <select value={courseForm.department} onChange={e => setCourseForm({ ...courseForm, department: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm bg-white">
                  <option value="">— Select Department —</option>
                  {departments.map(d => <option key={d._id} value={d._id}>{d.code} — {d.name}</option>)}
                </select>
              </div>

              {/* Course Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Course Type</label>
                <select value={courseForm.type} onChange={e => setCourseForm({ ...courseForm, type: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm bg-white">
                  <option value="core">Core (Compulsory)</option>
                  <option value="departmental_elective">Departmental Elective</option>
                  <option value="open_elective">Open Elective (All Departments)</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {courseForm.type === 'open_elective'
                    ? 'Open to all students across all departments and programs.'
                    : 'Restrict access by selecting allowed departments and/or programs below.'}
                </p>
              </div>

              {/* Allowed Departments (hidden for open_elective) */}
              {courseForm.type !== 'open_elective' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Allowed Departments <span className="text-gray-400 font-normal">(empty = all)</span>
                  </label>
                  <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1">
                    {departments.map(d => (
                      <label key={d._id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 rounded px-1">
                        <input type="checkbox"
                          checked={courseForm.allowedDepartments.includes(d._id)}
                          onChange={() => setCourseForm({ ...courseForm, allowedDepartments: toggleId(courseForm.allowedDepartments, d._id) })}
                          className="accent-indigo-600" />
                        <span className="font-medium text-indigo-700">{d.code}</span> — {d.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Allowed Programs (hidden for open_elective) */}
              {courseForm.type !== 'open_elective' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Allowed Programs <span className="text-gray-400 font-normal">(empty = all)</span>
                  </label>
                  <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1">
                    {programs.map(p => (
                      <label key={p._id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 rounded px-1">
                        <input type="checkbox"
                          checked={courseForm.allowedPrograms.includes(p._id)}
                          onChange={() => setCourseForm({ ...courseForm, allowedPrograms: toggleId(courseForm.allowedPrograms, p._id) })}
                          className="accent-indigo-600" />
                        {p.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <textarea value={courseForm.description}
                  onChange={e => setCourseForm({ ...courseForm, description: e.target.value })}
                  placeholder="Course description (optional)"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm h-20 resize-none" />
              </div>
            </div>
            <div className="mt-5 flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setCourseModal(false)}>Cancel</Button>
              <Button onClick={handleCreateCourse}>Create Course</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Offer Course Modal ── */}
      {offerModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 p-6 rounded-2xl w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Offer Course</h2>
            <p className="text-sm text-gray-500 mb-4">
              <span className="font-semibold text-indigo-600">{offerModal.code}</span> — {offerModal.name}
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Primary Faculty *</label>
                <FacultyPicker
                  value={offerForm.facultyUserId}
                  onChange={v => setOfferForm({ ...offerForm, facultyUserId: v })}
                  placeholder="Search faculty by name, ID, or department…"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Semester</label>
                  <select value={offerForm.semester} onChange={e => setOfferForm({ ...offerForm, semester: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm bg-white">
                    {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Year</label>
                  <input type="number" value={offerForm.year} onChange={e => setOfferForm({ ...offerForm, year: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Seat Capacity</label>
                <input type="number" min={1} value={offerForm.capacity}
                  onChange={e => setOfferForm({ ...offerForm, capacity: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm" />
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

      {/* ── Edit Course Modal ── */}
      {editModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 p-6 rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Edit Course</h2>
            <p className="text-sm text-indigo-600 font-semibold mb-4">{editModal.code}</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Course Name *</label>
                  <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Credits</label>
                  <input type="number" min={1} max={10} value={editForm.credits}
                    onChange={e => setEditForm({ ...editForm, credits: +e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm" />
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Department</label>
                <select value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm bg-white">
                  <option value="">— Select Department —</option>
                  {departments.map(d => <option key={d._id} value={d._id}>{d.code} — {d.name}</option>)}
                </select>
              </div>

              {/* Course Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Course Type</label>
                <select value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm bg-white">
                  <option value="core">Core (Compulsory)</option>
                  <option value="departmental_elective">Departmental Elective</option>
                  <option value="open_elective">Open Elective (All Departments)</option>
                </select>
              </div>

              {/* Allowed Departments */}
              {editForm.type !== 'open_elective' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Allowed Departments <span className="text-gray-400 font-normal">(empty = all)</span>
                  </label>
                  <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1">
                    {departments.map(d => (
                      <label key={d._id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 rounded px-1">
                        <input type="checkbox"
                          checked={editForm.allowedDepartments.includes(d._id)}
                          onChange={() => setEditForm({ ...editForm, allowedDepartments: toggleId(editForm.allowedDepartments, d._id) })}
                          className="accent-indigo-600" />
                        <span className="font-medium text-indigo-700">{d.code}</span> — {d.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Allowed Programs */}
              {editForm.type !== 'open_elective' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Allowed Programs <span className="text-gray-400 font-normal">(empty = all)</span>
                  </label>
                  <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1">
                    {programs.map(p => (
                      <label key={p._id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 rounded px-1">
                        <input type="checkbox"
                          checked={editForm.allowedPrograms.includes(p._id)}
                          onChange={() => setEditForm({ ...editForm, allowedPrograms: toggleId(editForm.allowedPrograms, p._id) })}
                          className="accent-indigo-600" />
                        {p.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <textarea value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm h-20 resize-none" />
              </div>
            </div>
            <div className="mt-5 flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setEditModal(null)}>Cancel</Button>
              <Button onClick={handleEditCourse}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Manage Instructors Modal ── */}
      {instrModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 p-6 rounded-2xl w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Manage Instructors</h2>
            <p className="text-sm text-gray-500 mb-4">{instrModal.offering.course?.code} — {instrModal.offering.course?.name}</p>

            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Current Instructors</p>
              <div className="space-y-1">
                {(instrModal.offering.instructors || []).map(i => {
                  const isPrimary = i._id?.toString() === instrModal.offering.faculty?._id?.toString();
                  return (
                    <div key={i._id || i} className={`flex items-center justify-between rounded-xl px-3 py-2 ${isPrimary ? 'bg-indigo-50 border border-indigo-100' : 'bg-gray-50'}`}>
                      <span className="text-sm text-gray-800">
                        {i.name || i} <span className="text-xs text-gray-400">({i.userId})</span>
                        {isPrimary && (
                          <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-semibold">Primary</span>
                        )}
                      </span>
                      {!isPrimary && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleManageInstructor('set_primary', i.userId)}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold border border-indigo-200 rounded-lg px-2 py-0.5 hover:bg-indigo-50 transition">
                            Set Primary
                          </button>
                          <button
                            onClick={() => handleManageInstructor('remove', i.userId)}
                            className="text-xs text-rose-500 hover:text-rose-700 font-semibold border border-rose-200 rounded-lg px-2 py-0.5 hover:bg-rose-50 transition">
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-600">Add Co-Instructor / Change Primary</label>
              <FacultyPicker
                value={instrInput}
                onChange={v => setInstrInput(v)}
                placeholder="Search faculty by name or ID…"
              />
              <div className="flex gap-2 pt-1">
                <Button onClick={() => handleManageInstructor('add')}>Add as Co-Instructor</Button>
                <button
                  onClick={() => handleManageInstructor('set_primary')}
                  className="px-3 py-2 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition">
                  Set as Primary
                </button>
              </div>
            </div>
            {instrMsg && <p className="text-red-500 text-xs mt-2">{instrMsg}</p>}

            <div className="mt-5 flex justify-end">
              <Button variant="secondary" onClick={() => setInstrModal(null)}>Done</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
