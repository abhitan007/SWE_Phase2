import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import { createLeaveRequest, getMyLeaves, cancelLeave } from '../../services/apiService';

export default function LeaveApplication() {
  const [leaves, setLeaves] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ type: 'Medical', startDate: '', endDate: '', reason: '' });

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = () => {
    getMyLeaves().then(r => setLeaves(r.data)).catch(() => {});
  };

  const handleSubmit = async () => {
    if (!form.startDate || !form.endDate || !form.reason) {
      return alert('Please fill in all fields');
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      return alert('End date must be on or after start date');
    }
    try {
      await createLeaveRequest(form);
      fetchLeaves();
      setIsModalOpen(false);
      setForm({ type: 'Medical', startDate: '', endDate: '', reason: '' });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit leave request');
    }
  };

  const handleCancel = async (id) => {
    if (confirm('Are you sure you want to cancel this leave request?')) {
      try {
        await cancelLeave(id);
        fetchLeaves();
      } catch {
        alert('Failed to cancel leave request');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#2c3e50]">Leave Applications</h1>
          <p className="text-gray-500 text-sm mt-1">Apply for hostel leave or outstation travel.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>+ Apply for Leave</Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <Table
          headers={['Type', 'Reason', 'Start Date', 'End Date', 'Status', 'Actions']}
          data={leaves}
          renderRow={(leave) => (
            <>
              <td className="px-6 py-4 font-medium text-gray-900">{leave.type}</td>
              <td className="px-6 py-4 text-gray-500 text-sm max-w-xs truncate" title={leave.reason}>{leave.reason}</td>
              <td className="px-6 py-4">{new Date(leave.startDate).toLocaleDateString()}</td>
              <td className="px-6 py-4">{new Date(leave.endDate).toLocaleDateString()}</td>
              <td className="px-6 py-4">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${leave.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : leave.status === 'Rejected' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                  {leave.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                {leave.status === 'Pending' && (
                  <button onClick={() => handleCancel(leave._id)} className="text-rose-500 hover:text-rose-700 text-sm font-medium">Cancel</button>
                )}
              </td>
            </>
          )}
        />
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 p-6 rounded-2xl w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">New Leave Request</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Leave Type</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500">
                  <option>Medical</option>
                  <option>Personal</option>
                  <option>Academic</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">End Date</label>
                  <input type="date" min={form.startDate || undefined} value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Reason</label>
                <textarea value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500 h-24 resize-none" placeholder="Provide details..."></textarea>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>Submit Request</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
