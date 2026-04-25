import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { updateAvatar, updateProfile } from '../services/apiService';

const ROLE_LABEL = { admin: 'Administrator', faculty: 'Faculty', student: 'Student' };
const ROLE_COLOR = {
  admin: 'bg-violet-50 text-violet-700 border border-violet-200',
  faculty: 'bg-blue-50 text-blue-700 border border-blue-200',
  student: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

export default function ProfileSettings() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [editingHostel, setEditingHostel] = useState(false);
  const [hostelForm, setHostelForm] = useState({ hostel: '', room: '' });
  const [hostelSaving, setHostelSaving] = useState(false);
  const [hostelMsg, setHostelMsg] = useState('');

  if (!user) return null;

  const initials = (user.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return setAvatarError('Please select an image file (JPG, PNG, etc.)');
    if (file.size > 5 * 1024 * 1024) return setAvatarError('Image must be under 5 MB');
    setAvatarError('');
    setUploading(true);
    try {
      await updateAvatar(file);
      await refreshUser();
    } catch (err) {
      setAvatarError(err.response?.data?.error || 'Upload failed');
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openHostelEdit = () => {
    setHostelForm({ hostel: user.hostel || '', room: user.room || '' });
    setHostelMsg('');
    setEditingHostel(true);
  };

  const handleHostelSave = async () => {
    setHostelSaving(true);
    setHostelMsg('');
    try {
      await updateProfile({ hostel: hostelForm.hostel, room: hostelForm.room });
      await refreshUser();
      setEditingHostel(false);
      setHostelMsg('');
    } catch {
      setHostelMsg('Failed to save. Please try again.');
    } finally {
      setHostelSaving(false);
    }
  };

  const fields = [
    { label: 'Full Name', value: user.name },
    { label: 'User ID / Roll No.', value: user.userId },
    { label: 'Email', value: user.email },
    { label: 'Department', value: user.department || '—' },
    { label: 'Role', value: ROLE_LABEL[user.role] || user.role },
    { label: 'Account Created', value: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
  ];

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold text-[#2c3e50]">Profile & Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account information and preferences.</p>
      </div>

      {/* Avatar + identity */}
      <Card>
        <div className="flex items-center gap-6">
          <div className="relative flex-shrink-0">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold border-4 border-white shadow-md select-none">
                {initials}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Change profile photo"
              className="absolute bottom-0 right-0 w-7 h-7 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center hover:bg-indigo-50 hover:border-indigo-300 transition shadow cursor-pointer disabled:opacity-50"
            >
              {uploading ? (
                <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLOR[user.role] || 'bg-gray-100 text-gray-600'}`}>
                {ROLE_LABEL[user.role] || user.role}
              </span>
              {user.department && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                  {user.department}
                </span>
              )}
            </div>
            {avatarError && <p className="text-xs text-rose-500 mt-2">{avatarError}</p>}
            <p className="text-xs text-gray-400 mt-2">Click the camera icon to update your profile photo (JPG/PNG, max 5 MB)</p>
          </div>
        </div>
      </Card>

      {/* Account details */}
      <Card>
        <h3 className="font-bold text-gray-900 mb-1">Account Details</h3>
        <p className="text-xs text-gray-400 mb-4">Your profile information as registered in the system.</p>
        <div className="divide-y divide-gray-100">
          {fields.map(f => (
            <div key={f.label} className="py-3 flex justify-between items-center">
              <span className="text-sm text-gray-500">{f.label}</span>
              <span className="text-sm font-medium text-gray-900">{f.value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Hostel Info — students only */}
      {user.role === 'student' && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-gray-900">Hostel Information</h3>
              <p className="text-xs text-gray-400 mt-0.5">Used when filing complaints and hostel transfer requests.</p>
            </div>
            {!editingHostel && (
              <button onClick={openHostelEdit} className="text-sm text-indigo-600 font-semibold hover:underline">Edit</button>
            )}
          </div>

          {!editingHostel ? (
            <div className="divide-y divide-gray-100">
              <div className="py-3 flex justify-between items-center">
                <span className="text-sm text-gray-500">Hostel</span>
                <span className="text-sm font-medium text-gray-900">{user.hostel || <span className="text-gray-400 italic">Not set</span>}</span>
              </div>
              <div className="py-3 flex justify-between items-center">
                <span className="text-sm text-gray-500">Room Number</span>
                <span className="text-sm font-medium text-gray-900">{user.room || <span className="text-gray-400 italic">Not set</span>}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Hostel Name</label>
                <input
                  value={hostelForm.hostel}
                  onChange={e => setHostelForm({ ...hostelForm, hostel: e.target.value })}
                  placeholder="e.g. Brahmaputra Hostel"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Room Number</label>
                <input
                  value={hostelForm.room}
                  onChange={e => setHostelForm({ ...hostelForm, room: e.target.value })}
                  placeholder="e.g. A-104"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
              {hostelMsg && <p className="text-xs text-rose-500">{hostelMsg}</p>}
              <div className="flex gap-3 pt-1">
                <Button onClick={handleHostelSave} disabled={hostelSaving}>
                  {hostelSaving ? 'Saving...' : 'Save'}
                </Button>
                <button onClick={() => setEditingHostel(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Security */}
      <Card>
        <h3 className="font-bold text-gray-900 mb-4">Security & Access</h3>
        <div className="space-y-1 divide-y divide-gray-100">
          <div className="flex justify-between items-center py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Password</p>
              <p className="text-xs text-gray-400 mt-0.5">Update your login password</p>
            </div>
            <button
              onClick={() => navigate('/change-password')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition cursor-pointer"
            >
              Change Password
            </button>
          </div>
          <div className="flex justify-between items-center py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Active Session</p>
              <p className="text-xs text-gray-400 mt-0.5">You are currently logged in</p>
            </div>
            <button
              onClick={async () => { await logout(); navigate('/login'); }}
              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm font-semibold transition cursor-pointer border border-rose-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
