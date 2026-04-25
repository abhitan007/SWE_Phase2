import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { getAnnouncements, createAnnouncement, deleteAnnouncement, getMyCourseOfferings } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';

export default function AnnouncementsFeed() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [offerings, setOfferings] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const defaultScope = user?.role === 'admin' ? 'system' : 'course';
  const [form, setForm] = useState({ title: '', content: '', scope: defaultScope, courseOffering: '', priority: 'normal' });

  useEffect(() => {
    fetchData();
    if (user?.role === 'faculty') {
      getMyCourseOfferings().then(r => setOfferings(r.data)).catch(() => {});
    }
  }, [user?.role]);

  const fetchData = () => {
    getAnnouncements().then(r => setAnnouncements(r.data)).catch(() => {});
  };

  const openCreate = () => {
    setForm({
      title: '', content: '',
      scope: user?.role === 'admin' ? 'system' : 'course',
      courseOffering: '',
      priority: 'normal'
    });
    setIsModalOpen(true);
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) return alert('Title and content are required');
    if (form.scope === 'course' && !form.courseOffering) return alert('Please select a course');
    try {
      await createAnnouncement(form);
      fetchData();
      setIsModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create announcement');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    await deleteAnnouncement(id);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#2c3e50]">Announcements</h1>
          <p className="text-gray-500 text-sm mt-1">System and course announcements.</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'faculty') && (
          <Button onClick={openCreate}>+ New Announcement</Button>
        )}
      </div>

      {announcements.length === 0 && <Card><p className="text-gray-500 text-sm">No announcements yet.</p></Card>}

      <div className="space-y-4">
        {announcements.map(a => (
          <Card key={a._id} className="border-l-4 border-l-indigo-500">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-gray-900">{a.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{a.content}</p>
                <p className="text-xs text-gray-400 mt-2">By {a.author?.name || 'System'} · {new Date(a.createdAt).toLocaleDateString()}</p>
              </div>
              {(user?.role === 'admin' || a.author?._id === user?._id) && (
                <button onClick={() => handleDelete(a._id)} className="text-rose-600 hover:text-rose-500 text-sm font-medium cursor-pointer">Delete</button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 p-6 rounded-2xl w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">New Announcement</h2>
            <div className="space-y-4">
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Title" className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500" />
              <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="Content..." className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500 h-24 resize-none"></textarea>

              {user?.role === 'admin' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Scope</label>
                  <select value={form.scope} onChange={e => setForm({...form, scope: e.target.value, courseOffering: ''})} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500">
                    <option value="system">System-wide</option>
                    <option value="course">Specific course</option>
                  </select>
                </div>
              )}

              {form.scope === 'course' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Course</label>
                  <select value={form.courseOffering} onChange={e => setForm({...form, courseOffering: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500">
                    <option value="">— Select a course —</option>
                    {offerings.map(o => (
                      <option key={o._id} value={o._id}>{o.course?.code} — {o.course?.name} · {o.semester} {o.year}</option>
                    ))}
                  </select>
                  {user?.role === 'faculty' && offerings.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">You have no assigned course offerings.</p>
                  )}
                </div>
              )}

              <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500">
                <option value="low">Low Priority</option>
                <option value="normal">Normal</option>
                <option value="high">High Priority</option>
              </select>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Publish</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
