import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import { getAllComplaints, updateComplaintStatus } from '../../services/apiService';

export default function ComplaintsManagement() {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState('Open');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = () => {
    getAllComplaints().then(r => setComplaints(r.data)).catch(() => {});
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateComplaintStatus(id, status);
      fetchComplaints();
    } catch {
      alert('Failed to update complaint status');
    }
  };

  const filteredComplaints = complaints.filter(c => filter === 'All' || c.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#2c3e50]">Complaints Management</h1>
        <p className="text-gray-500 text-sm mt-1">Manage and resolve hostel maintenance issues</p>
      </div>

      <div className="flex gap-2">
        {['Open', 'In Progress', 'Resolved', 'All'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f}
          </button>
        ))}
      </div>

      {filteredComplaints.length === 0 && <Card><p className="text-gray-500 text-sm">No complaints found.</p></Card>}

      <div className="grid grid-cols-1 gap-4">
        {filteredComplaints.map((comp) => (
          <Card key={comp._id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 gap-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-1">
                <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">#{comp._id.substring(comp._id.length - 6).toUpperCase()}</span>
                <h3 className="font-bold text-gray-900">{comp.category}</h3>
                <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${comp.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600' : comp.status === 'In Progress' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                  {comp.status}
                </span>
              </div>
              {(comp.hostel || comp.room) && (
                <p className="text-xs text-indigo-700 bg-indigo-50 rounded-lg px-2 py-1 inline-block mt-1">
                  {comp.hostel}{comp.room ? ` / Room ${comp.room}` : ''}
                </p>
              )}
              <p className="text-sm text-gray-600 mt-2">{comp.description}</p>
              {comp.attachment && (
                <div className="mt-2">
                  <a href={comp.attachment} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded inline-block">View Attachment</a>
                </div>
              )}
              <div className="flex gap-4 mt-3">
                <span className="text-xs text-gray-500 font-medium">By: {comp.student?.name} ({comp.student?.userId})</span>
                <span className="text-xs text-gray-400">Filed: {new Date(comp.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-0 border-gray-100 flex gap-2">
              <select 
                value={comp.status} 
                onChange={(e) => handleStatusChange(comp._id, e.target.value)}
                className="w-full md:w-auto bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
