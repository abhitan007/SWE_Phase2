import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { getHMCMembers, addHMCMember, updateHMCMember, removeHMCMember } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';

export default function HMCMembers() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ user: '', role: 'HMC Member', hostel: '', termEnd: '' });
  const [error, setError] = useState('');

  // Check if current user is Warden
  const [isWarden, setIsWarden] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = () => {
    getHMCMembers().then(r => {
      setMembers(r.data);
      const me = r.data.find(m => m.user?.userId === user.userId);
      if (me && me.role === 'Warden') setIsWarden(true);
    }).catch(() => {});
  };

  const handleSave = async () => {
    try {
      setError('');
      if (editingId) {
        // Backend only allows role + isActive on update
        await updateHMCMember(editingId, { role: form.role });
      } else {
        await addHMCMember(form);
      }
      fetchMembers();
      setIsModalOpen(false);
      setEditingId(null);
      setForm({ user: '', role: 'HMC Member', hostel: '', termEnd: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save member');
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ user: '', role: 'HMC Member', hostel: '', termEnd: '' });
    setError('');
    setIsModalOpen(true);
  };

  const openEdit = (member) => {
    setEditingId(member._id);
    setForm({
      user: member.user?.userId || '',
      role: member.role,
      hostel: member.hostel || '',
      termEnd: member.termEnd ? member.termEnd.slice(0, 10) : ''
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleRemove = async (id) => {
    if (confirm('Are you sure you want to remove this HMC member?')) {
      try {
        await removeHMCMember(id);
        fetchMembers();
      } catch {
        alert('Failed to remove member');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#2c3e50]">HMC Members</h1>
          <p className="text-gray-500 text-sm mt-1">Manage hostel committee members</p>
        </div>
        {isWarden && <Button onClick={openAdd}>+ Add Member</Button>}
      </div>

      {!isWarden && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl text-sm">
          You are viewing the committee list. Only Wardens can add or remove members.
        </div>
      )}

      <Card className="p-0 overflow-hidden">
        <Table
          headers={['Name', 'User ID', 'Role', 'Hostel', 'Term Ends', 'Actions']}
          data={members}
          renderRow={(member) => (
            <>
              <td className="px-6 py-4 font-bold text-gray-900">{member.user?.name}</td>
              <td className="px-6 py-4 text-gray-500">{member.user?.userId}</td>
              <td className="px-6 py-4">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  member.role === 'Warden' ? 'bg-indigo-50 text-indigo-600' :
                  member.role === 'HMC Secretary' ? 'bg-purple-50 text-purple-600' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {member.role}
                </span>
              </td>
              <td className="px-6 py-4 font-medium text-gray-700">{member.hostel || '-'}</td>
              <td className="px-6 py-4 text-gray-500 text-sm">
                {member.termEnd ? new Date(member.termEnd).toLocaleDateString() : 'Indefinite'}
              </td>
              <td className="px-6 py-4 text-right">
                {isWarden && member.user?.userId !== user.userId && (
                  <div className="flex justify-end gap-3">
                    <button onClick={() => openEdit(member)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Edit</button>
                    <button onClick={() => handleRemove(member._id)} className="text-rose-600 hover:text-rose-800 text-sm font-medium">Remove</button>
                  </div>
                )}
              </td>
            </>
          )}
        />
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 p-6 rounded-2xl w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{editingId ? 'Edit HMC Member' : 'Add HMC Member'}</h2>
            
            {error && <div className="mb-4 bg-rose-50 text-rose-600 px-3 py-2 rounded-lg text-sm">{error}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">User ID</label>
                <input type="text" value={form.user} onChange={e => setForm({...form, user: e.target.value})} disabled={!!editingId} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500" placeholder="e.g. S001, F001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500">
                  <option>Warden</option>
                  <option>Assistant Warden</option>
                  <option>HMC Secretary</option>
                  <option>HMC Member</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Hostel</label>
                <input type="text" value={form.hostel} onChange={e => setForm({...form, hostel: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500" placeholder="e.g. Lohit" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Term End Date</label>
                <input type="date" value={form.termEnd} onChange={e => setForm({...form, termEnd: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500" />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => { setIsModalOpen(false); setEditingId(null); }}>Cancel</Button>
              <Button onClick={handleSave} disabled={!form.user}>{editingId ? 'Save Changes' : 'Add Member'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
