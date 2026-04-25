import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { createComplaint, getMyComplaints } from '../../services/apiService';

const STATUS_STYLES = {
  'Open':        'bg-amber-50 text-amber-600',
  'In Progress': 'bg-blue-50 text-blue-600',
  'Resolved':    'bg-emerald-50 text-emerald-600',
};

export default function Complaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ category: 'Maintenance', description: '', hostel: '', room: '', attachment: null });

  useEffect(() => {
    getMyComplaints().then(r => setComplaints(r.data)).catch(() => {});
  }, []);

  const openModal = () => {
    setForm({
      category: 'Maintenance',
      description: '',
      hostel: user?.hostel || '',
      room: user?.room || '',
      attachment: null,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.description) return alert('Please describe the issue.');
    if (!form.hostel) return alert('Please enter your hostel name.');
    try {
      const fd = new FormData();
      fd.append('category', form.category);
      fd.append('description', form.description);
      fd.append('hostel', form.hostel);
      fd.append('room', form.room);
      if (form.attachment) fd.append('attachment', form.attachment);
      await createComplaint(fd);
      const res = await getMyComplaints();
      setComplaints(res.data);
      setIsModalOpen(false);
    } catch {
      alert('Failed to file complaint');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#2c3e50]">Hostel Complaints</h1>
          <p className="text-gray-500 text-sm mt-1">File and track maintenance and welfare issues.</p>
        </div>
        <Button onClick={openModal}>+ File Complaint</Button>
      </div>

      {complaints.length === 0 && <Card><p className="text-gray-500 text-sm">No complaints filed.</p></Card>}

      <div className="grid grid-cols-1 gap-4">
        {complaints.map((comp) => (
          <Card key={comp._id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-bold text-gray-900">{comp.category}</h3>
                  {(comp.hostel || comp.room) && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
                      {comp.hostel}{comp.room ? ` / ${comp.room}` : ''}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{comp.description}</p>
                <span className="text-xs text-gray-400 mt-2 block">Filed on: {new Date(comp.createdAt).toLocaleDateString()}</span>
              </div>
              <span className={`ml-4 flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold ${STATUS_STYLES[comp.status] || 'bg-gray-100 text-gray-500'}`}>
                {comp.status}
              </span>
            </div>
            {comp.attachment && (
              <div className="mt-3">
                <img src={comp.attachment} alt="attachment" className="max-h-40 rounded-xl border border-gray-200 object-cover" />
              </div>
            )}
          </Card>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 p-6 rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">File a Complaint</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500">
                  <option>Maintenance</option>
                  <option>Electrical</option>
                  <option>Network</option>
                  <option>Cleanliness</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500 h-24 resize-none"
                  placeholder="Describe the issue..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Hostel <span className="text-rose-500">*</span></label>
                  <input value={form.hostel} onChange={e => setForm({ ...form, hostel: e.target.value })}
                    placeholder="e.g. Brahmaputra"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Room No.</label>
                  <input value={form.room} onChange={e => setForm({ ...form, room: e.target.value })}
                    placeholder="e.g. A-104"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              {!(user?.hostel) && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                  Tip: Save your hostel details in Profile to auto-fill this next time.
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Photo Attachment (Optional)</label>
                <input type="file" accept="image/*"
                  onChange={e => setForm({ ...form, attachment: e.target.files?.[0] || null })}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer" />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>Submit</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
