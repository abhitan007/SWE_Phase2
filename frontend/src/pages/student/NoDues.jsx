import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import { getMyNoDues } from '../../services/apiService';

export default function NoDues() {
  const [noDues, setNoDues] = useState(undefined);

  useEffect(() => {
    getMyNoDues().then(r => setNoDues(r.data)).catch(() => setNoDues(null));
  }, []);

  if (noDues === undefined) return <div className="text-gray-500">Loading...</div>;

  if (!noDues || noDues.items?.length === 0) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-[#2c3e50]">No Dues Clearance</h1>
          <p className="text-gray-500 text-sm mt-1">Track your clearance status for graduation.</p>
        </div>
        <Card>
          <div className="text-center py-10">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-700 font-semibold">No clearance record found</p>
            <p className="text-gray-500 text-sm mt-1">Your no dues clearance process has not been initiated yet. Please contact your hostel office.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#2c3e50]">No Dues Clearance</h1>
          <p className="text-gray-500 text-sm mt-1">Track your clearance status for graduation.</p>
        </div>
        <span className={`px-4 py-2 rounded-xl text-sm font-bold border ${noDues.isFullyCleared ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
          {noDues.isFullyCleared ? 'Eligible for Graduation' : 'Clearance Pending'}
        </span>
      </div>

      <div className="space-y-4">
        {noDues.items.map((dept) => (
          <Card key={dept._id} className="flex justify-between items-center p-5 border-l-4" style={{ borderLeftColor: dept.status === 'Cleared' ? '#10b981' : '#f59e0b' }}>
            <div className="flex items-center space-x-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${dept.status === 'Cleared' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                {dept.status === 'Cleared' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{dept.department}</h3>
                {dept.status === 'Cleared' ? (
                  <div>
                    <p className="text-xs text-emerald-600">Cleared on {new Date(dept.clearedAt).toLocaleDateString()}</p>
                    {dept.remark && <p className="text-xs text-gray-500 mt-0.5">Note: {dept.remark}</p>}
                  </div>
                ) : (
                  <p className="text-xs text-amber-600">
                    Awaiting Clearance{dept.amount ? ` — Amount Due: ₹${dept.amount}` : ''}{dept.remark ? ` — ${dept.remark}` : ''}
                  </p>
                )}
              </div>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold ${dept.status === 'Cleared' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              {dept.status}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}
