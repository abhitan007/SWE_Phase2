import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { getAllNoDues, clearNoDuesItem, initializeNoDues, getAllStudents } from '../../services/apiService';

export default function NoDuesManagement() {
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState({ amount: '', remark: '' });
  const [filter, setFilter] = useState('all');

  const fetchData = async () => {
    try {
      const [noDuesRes, studentsRes] = await Promise.all([getAllNoDues(), getAllStudents()]);
      setRecords(noDuesRes.data);
      setStudents(studentsRes.data);
    } catch {}
  };

  useEffect(() => { fetchData(); }, []);

  const handleClearClick = (studentMongoId, item) => {
    setSelectedItem({ studentMongoId, item });
    setForm({ amount: '', remark: '' });
    setIsModalOpen(true);
  };

  const handleConfirmClear = async () => {
    try {
      await clearNoDuesItem(selectedItem.studentMongoId, selectedItem.item._id, {
        amount: form.amount ? form.amount : undefined,
        remark: form.remark || undefined
      });
      fetchData();
      setIsModalOpen(false);
    } catch {
      alert('Failed to clear dues');
    }
  };

  const handleInitialize = async (studentMongoId) => {
    try {
      await initializeNoDues(studentMongoId);
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to initialize');
    }
  };

  const initializedIds = new Set(records.map(r => r.student?._id?.toString()));
  const uninitializedStudents = students.filter(s => !initializedIds.has(s._id?.toString()));

  const filteredRecords = filter === 'cleared'
    ? records.filter(r => r.isFullyCleared)
    : filter === 'pending'
      ? records.filter(r => !r.isFullyCleared)
      : records;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#2c3e50]">No Dues Clearance</h1>
        <p className="text-gray-500 text-sm mt-1">Manage and clear student dues across departments</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Records', value: records.length, key: 'all' },
          { label: 'Fully Cleared', value: records.filter(r => r.isFullyCleared).length, key: 'cleared' },
          { label: 'Pending', value: records.filter(r => !r.isFullyCleared).length, key: 'pending' },
        ].map(stat => (
          <button key={stat.key} onClick={() => setFilter(stat.key)}
            className={`p-4 rounded-2xl border text-left transition-all ${filter === stat.key ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-indigo-300'}`}>
            <p className="text-2xl font-black text-gray-900">{stat.value}</p>
            <p className="text-xs font-semibold text-gray-500 mt-1">{stat.label}</p>
          </button>
        ))}
      </div>

      {uninitializedStudents.length > 0 && (
        <Card>
          <h3 className="font-bold text-gray-900 mb-3">Students Without Clearance Record ({uninitializedStudents.length})</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {uninitializedStudents.map(s => (
              <div key={s._id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.userId} · {s.email}</p>
                </div>
                <Button onClick={() => handleInitialize(s._id)}>Initialize</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {filteredRecords.map(record => {
          const clearedCount = record.items.filter(i => i.status === 'Cleared').length;
          const totalCount = record.items.length;
          const pct = totalCount === 0 ? 0 : (clearedCount / totalCount) * 100;

          return (
            <Card key={record._id}>
              <div className="flex justify-between items-center cursor-pointer"
                onClick={() => setExpandedId(expandedId === record._id ? null : record._id)}>
                <div>
                  <p className="font-bold text-gray-900">{record.student?.name}</p>
                  <p className="text-xs text-gray-500">{record.student?.userId} · {record.student?.email}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="w-32 bg-gray-200 rounded-full h-1.5">
                      <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{clearedCount}/{totalCount} cleared</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${record.isFullyCleared ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {record.isFullyCleared ? 'Fully Cleared' : 'Pending'}
                  </span>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === record._id ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {expandedId === record._id && (
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {record.items.map(item => (
                    <div key={item._id} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-gray-800 text-sm">{item.department}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.status === 'Cleared' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                          {item.status}
                        </span>
                      </div>
                      {item.status === 'Cleared' ? (
                        <div className="text-xs text-gray-500 space-y-0.5">
                          <p>Cleared: {new Date(item.clearedAt).toLocaleDateString()}</p>
                          {item.amount && <p>Amount: ₹{item.amount}</p>}
                          {item.remark && <p>Note: {item.remark}</p>}
                        </div>
                      ) : (
                        <button
                          onClick={e => { e.stopPropagation(); handleClearClick(record.student._id, item); }}
                          className="mt-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                          Mark as Cleared
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
        {filteredRecords.length === 0 && (
          <Card><p className="text-gray-500 text-sm text-center py-6">No records found.</p></Card>
        )}
      </div>

      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 p-6 rounded-2xl w-full max-w-sm shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Clear Dues</h2>
            <p className="text-sm text-gray-500 mb-4">Department: <span className="font-bold text-gray-800">{selectedItem.item.department}</span></p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Amount (optional)</label>
                <input value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500" placeholder="e.g. ₹500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Remark (optional)</label>
                <input value={form.remark} onChange={e => setForm({ ...form, remark: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500" placeholder="e.g. Paid at counter" />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleConfirmClear}>Confirm Clear</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
