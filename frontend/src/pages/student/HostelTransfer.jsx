import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { createTransferRequest, getMyTransfers } from '../../services/apiService';

const STATUS_STYLES = {
  Pending:  'bg-amber-50 text-amber-600',
  Approved: 'bg-emerald-50 text-emerald-600',
  Rejected: 'bg-rose-50 text-rose-600',
};

export default function HostelTransfer() {
  const [transfers, setTransfers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ currentHostel: '', currentRoom: '', preferredHostel: '', preferredRoom: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchTransfers = () => getMyTransfers().then(r => setTransfers(r.data)).catch(() => {});

  useEffect(() => { fetchTransfers(); }, []);

  const handleSubmit = async () => {
    if (!form.currentHostel || !form.currentRoom || !form.preferredHostel || !form.reason) {
      return alert('Please fill in all required fields.');
    }
    if (form.currentHostel === form.preferredHostel && form.currentRoom === (form.preferredRoom || '')) {
      return alert('Preferred hostel/room must differ from current.');
    }
    setSubmitting(true);
    try {
      await createTransferRequest(form);
      setForm({ currentHostel: '', currentRoom: '', preferredHostel: '', preferredRoom: '', reason: '' });
      setShowForm(false);
      fetchTransfers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit transfer request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#2c3e50]">Hostel Transfer</h1>
          <p className="text-gray-500 text-sm mt-1">Request a transfer to a different hostel or room.</p>
        </div>
        <Button onClick={() => setShowForm(v => !v)}>+ New Request</Button>
      </div>

      {showForm && (
        <Card>
          <h3 className="font-bold text-gray-900 mb-4">Transfer Request</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Current Hostel <span className="text-rose-500">*</span></label>
              <input value={form.currentHostel} onChange={e => setForm({ ...form, currentHostel: e.target.value })}
                placeholder="e.g. Brahmaputra Hostel"
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Current Room</label>
              <input value={form.currentRoom} onChange={e => setForm({ ...form, currentRoom: e.target.value })}
                placeholder="e.g. A-104"
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Preferred Hostel <span className="text-rose-500">*</span></label>
              <input value={form.preferredHostel} onChange={e => setForm({ ...form, preferredHostel: e.target.value })}
                placeholder="e.g. Dihing Hostel"
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Preferred Room</label>
              <input value={form.preferredRoom} onChange={e => setForm({ ...form, preferredRoom: e.target.value })}
                placeholder="e.g. B-210 (optional)"
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-500 mb-1">Reason <span className="text-rose-500">*</span></label>
            <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
              rows={3} placeholder="Explain why you need a transfer..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500 resize-none" />
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={handleSubmit} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Request'}</Button>
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
        </Card>
      )}

      <Card>
        <h3 className="font-bold text-gray-900 mb-4">My Transfer Requests</h3>
        {transfers.length === 0 ? (
          <p className="text-gray-500 text-sm">No transfer requests submitted yet.</p>
        ) : (
          <div className="space-y-3">
            {transfers.map(req => (
              <div key={req._id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {req.currentHostel}{req.currentRoom ? ` (${req.currentRoom})` : ''} → {req.preferredHostel}{req.preferredRoom ? ` (${req.preferredRoom})` : ''}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{req.reason}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(req.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_STYLES[req.status] || 'bg-gray-100 text-gray-500'}`}>
                    {req.status}
                  </span>
                </div>
                {req.reviewRemarks && (
                  <p className="text-xs text-indigo-600 bg-indigo-50 rounded-lg px-3 py-2">
                    Admin remarks: {req.reviewRemarks}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
