import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import api from '../../services/authService';

export default function StudentDirectory() {
  const [students, setStudents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ userId: '', name: '', email: '', password: 'Welcome@123', department: '', rollNumber: '', batch: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchData(); }, []);
  const fetchData = () => api.get('/admin/students').then(r => setStudents(r.data)).catch(() => {});

  const handleCreate = async () => {
    if (!form.userId || !form.name || !form.email) { setMsg('User ID, Name and Email are required'); return; }
    try {
      await api.post('/admin/students', form);
      fetchData();
      setIsModalOpen(false);
      setForm({ userId: '', name: '', email: '', password: 'Welcome@123', department: '', rollNumber: '', batch: '' });
      setMsg('');
    } catch (err) { setMsg(err.response?.data?.error || 'Failed to create student'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#2c3e50]">Student Directory</h1>
          <p className="text-gray-500 text-sm mt-1">Manage student accounts and bulk imports.</p>
        </div>
        <div className="flex space-x-3">
          <input type="file" accept=".csv" onChange={async (e) => {
            if (!e.target.files[0]) return;
            const formData = new FormData();
            formData.append('file', e.target.files[0]);
            try {
              const res = await api.post('/admin/students/bulk-import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
              alert(res.data.message);
              fetchData();
            } catch { alert('Import failed'); }
          }} className="hidden" id="csv-upload" />
          <Button variant="secondary" onClick={() => document.getElementById('csv-upload').click()}>Upload CSV</Button>
          <Button onClick={() => setIsModalOpen(true)}>+ Add Student</Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <Table
          headers={['Roll No', 'Name', 'Department', 'Batch', 'Status']}
          data={students}
          renderRow={(student) => (
            <>
              <td className="px-6 py-4 font-medium text-gray-900">{student.rollNumber || student.user?.userId}</td>
              <td className="px-6 py-4">{student.user?.name || student.name}</td>
              <td className="px-6 py-4">{student.user?.department || '--'}</td>
              <td className="px-6 py-4">{student.batch || '--'}</td>
              <td className="px-6 py-4">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${student.academicStatus === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                  {student.academicStatus || 'Active'}
                </span>
              </td>
            </>
          )}
        />
        {students.length === 0 && <p className="text-center text-gray-400 text-sm py-10">No students found. Add one to get started.</p>}
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 p-6 rounded-2xl w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-[#2c3e50] mb-4">Add New Student</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">User ID / Roll Number *</label>
                <input value={form.userId} onChange={e => setForm({...form, userId: e.target.value, rollNumber: e.target.value})} placeholder="e.g. 230101114" className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. John Doe" className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
                <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="e.g. john@iitg.ac.in" className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Department</label>
                  <input value={form.department} onChange={e => setForm({...form, department: e.target.value})} placeholder="e.g. CSE" className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Batch</label>
                  <input value={form.batch} onChange={e => setForm({...form, batch: e.target.value})} placeholder="e.g. 2023" className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Default Password</label>
                <input value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm bg-amber-50" />
                <p className="text-[10px] text-amber-600 mt-1">Student must change this password on first login via the Change Password page.</p>
              </div>
            </div>
            {msg && <p className="text-red-500 text-xs mt-2">{msg}</p>}
            <div className="mt-5 flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => { setIsModalOpen(false); setMsg(''); }}>Cancel</Button>
              <Button onClick={handleCreate}>Create Student</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
