import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { getAllTranscriptRequests, updateTranscriptRequestStatus } from '../../services/apiService';

const STATUS_STYLES = {
  pending:   'bg-amber-50 text-amber-600',
  approved:  'bg-blue-50 text-blue-600',
  completed: 'bg-emerald-50 text-emerald-600',
  rejected:  'bg-rose-50 text-rose-600',
};

export default function DocumentManagement() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ action: 'approve', remarks: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = () => {
    getAllTranscriptRequests().then(r => setRequests(r.data)).catch(() => {});
  };

  const openModal = (req) => {
    setSelected(req);
    setForm({ action: req.status === 'approved' ? 'complete' : 'approve', remarks: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await updateTranscriptRequestStatus(selected._id, form.action, form.remarks);
      fetchRequests();
      setIsModalOpen(false);
    } catch {
      alert('Failed to update request');
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#2c3e50]">Document Requests</h1>
        <p className="text-gray-500 text-sm mt-1">Review and process student transcript and document requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['pending', 'approved', 'completed', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${filter === s ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-gray-200 bg-white hover:border-indigo-300'}`}
          >
            <p className="text-2xl font-black text-gray-900">{requests.filter(r => r.status === s).length}</p>
            <p className={`text-xs font-semibold capitalize mt-1 ${STATUS_STYLES[s]?.split(' ')[1]}`}>{s}</p>
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {['pending', 'approved', 'completed', 'rejected', 'all'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors capitalize ${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <Card className="p-0 overflow-hidden">
        <Table
          headers={['Student', 'Purpose', 'Destination', 'Copies', 'Submitted', 'Status', 'Actions']}
          data={filtered}
          renderRow={(req) => (
            <>
              <td className="px-6 py-4">
                <p className="font-bold text-gray-900">{req.studentId?.name || 'Unknown'}</p>
                <p className="text-xs text-gray-500">{req.studentId?.userId} · {req.studentId?.department}</p>
              </td>
              <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate" title={req.purpose}>{req.purpose}</td>
              <td className="px-6 py-4 text-sm font-medium text-gray-800">{req.destination}</td>
              <td className="px-6 py-4 text-center text-sm text-gray-700">{req.numCopies}</td>
              <td className="px-6 py-4 text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</td>
              <td className="px-6 py-4">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${STATUS_STYLES[req.status] || 'bg-gray-100 text-gray-600'}`}>
                  {req.status}
                </span>
                {req.remarks && <p className="text-[10px] text-gray-400 mt-1 max-w-[120px] truncate" title={req.remarks}>{req.remarks}</p>}
              </td>
              <td className="px-6 py-4 text-right">
                {(req.status === 'pending' || req.status === 'approved') && (
                  <Button onClick={() => openModal(req)}>
                    {req.status === 'pending' ? 'Review' : 'Mark Complete'}
                  </Button>
                )}
              </td>
            </>
          )}
        />
      </Card>

      {/* Review Modal */}
      {isModalOpen && selected && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 p-6 rounded-2xl w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Review Request</h2>

            <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm space-y-1.5">
              <p><span className="text-gray-500">Student:</span> <span className="font-semibold">{selected.studentId?.name} ({selected.studentId?.userId})</span></p>
              <p><span className="text-gray-500">Purpose:</span> {selected.purpose}</p>
              <p><span className="text-gray-500">To:</span> {selected.destination}</p>
              <p><span className="text-gray-500">Copies:</span> {selected.numCopies}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Action</label>
                <div className="flex gap-3 flex-wrap">
                  {selected.status === 'pending' && (
                    <>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="action" value="approve" checked={form.action === 'approve'} onChange={e => setForm({...form, action: e.target.value})} />
                        <span className="text-sm font-medium text-blue-600">Approve</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="action" value="reject" checked={form.action === 'reject'} onChange={e => setForm({...form, action: e.target.value})} />
                        <span className="text-sm font-medium text-rose-600">Reject</span>
                      </label>
                    </>
                  )}
                  {selected.status === 'approved' && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="action" value="complete" checked={form.action === 'complete'} onChange={e => setForm({...form, action: e.target.value})} />
                      <span className="text-sm font-medium text-emerald-600">Mark as Completed</span>
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  {form.action === 'complete' ? 'Pickup Instructions' : 'Remarks (Optional)'}
                </label>
                <input
                  type="text"
                  value={form.remarks}
                  onChange={e => setForm({...form, remarks: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                  placeholder={form.action === 'complete' ? 'e.g. Collect from Academic Section, Room 101 (Mon–Fri, 10am–4pm)' : 'e.g. Missing signature'}
                />
                {form.action === 'complete' && (
                  <p className="text-xs text-gray-400 mt-1">This message will be shown to the student on their portal.</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
