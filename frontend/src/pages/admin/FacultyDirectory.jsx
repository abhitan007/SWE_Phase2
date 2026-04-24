import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import api from '../../services/authService';

export default function FacultyDirectory() {
  const [faculty, setFaculty] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ userId: '', employeeId: '', name: '', email: '', password: 'Faculty@123', department: '', designation: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchData(); }, []);
  const fetchData = () => api.get('/admin/faculty').then(r => setFaculty(r.data)).catch(() => {});

  const handleCreate = async () => {
    if (!form.userId || !form.name || !form.email) { setMsg('User ID, Name and Email are required'); return; }
    try {
      await api.post('/admin/faculty', form);
      fetchData();
      setIsModalOpen(false);
      setForm({ userId: '', employeeId: '', name: '', email: '', password: 'Faculty@123', department: '', designation: '' });
      setMsg('');
    } catch (err) { setMsg(err.response?.data?.error || 'Failed to create faculty'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#2c3e50]">Faculty Directory</h1>
          <p className="text-gray-500 text-sm mt-1">Manage faculty accounts and course assignments.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>+ Add Faculty</Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <Table
          headers={['Faculty ID', 'Name', 'Department', 'Designation', 'Status']}
          data={faculty}
          renderRow={(f) => (
            <>
              <td className="px-6 py-4 font-medium text-gray-900">{f.user?.userId || f.employeeId}</td>
              <td className="px-6 py-4">{f.user?.name || f.name}</td>
              <td className="px-6 py-4">{f.user?.department || '--'}</td>
              <td className="px-6 py-4">{f.designation || '--'}</td>
              <td className="px-6 py-4">
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-600">Active</span>
              </td>
            </>
          )}
        />
        {faculty.length === 0 && <p className="text-center text-gray-400 text-sm py-10">No faculty found. Add one to get started.</p>}
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 p-6 rounded-2xl w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-[#2c3e50] mb-4">Add New Faculty</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Faculty ID *</label>
                <input value={form.userId} onChange={e => setForm({...form, userId: e.target.value, employeeId: e.target.value})} placeholder="e.g. prof_kumar" className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Dr. Amit Kumar" className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
                <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="e.g. amit@iitg.ac.in" className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Department</label>
                  <input value={form.department} onChange={e => setForm({...form, department: e.target.value})} placeholder="e.g. CSE" className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Designation</label>
                  <input value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} placeholder="e.g. Professor" className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Default Password</label>
                <input value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm bg-amber-50" />
                <p className="text-[10px] text-amber-600 mt-1">Faculty must change this password on first login via the Change Password page.</p>
              </div>
            </div>
            {msg && <p className="text-red-500 text-xs mt-2">{msg}</p>}
            <div className="mt-5 flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => { setIsModalOpen(false); setMsg(''); }}>Cancel</Button>
              <Button onClick={handleCreate}>Create Faculty</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
