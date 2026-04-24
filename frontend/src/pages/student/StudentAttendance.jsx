import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import { getMyAttendance } from '../../services/apiService';

export default function StudentAttendance() {
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    getMyAttendance().then(r => setAttendance(r.data)).catch(() => {});
  }, []);

  // Group by semester+year for display
  const bySemester = {};
  for (const record of attendance) {
    const co = record.courseOffering;
    const key = `${co?.semester || ''} ${co?.year || ''}`.trim() || 'Current Semester';
    if (!bySemester[key]) bySemester[key] = [];
    bySemester[key].push(record);
  }
  const semesterGroups = Object.entries(bySemester);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#2c3e50]">Attendance</h1>
        <p className="text-gray-500 text-sm mt-1">Your attendance record across enrolled courses.</p>
      </div>

      {attendance.length === 0 && (
        <Card><p className="text-gray-500 text-sm">No attendance data available yet.</p></Card>
      )}

      {semesterGroups.map(([semLabel, records]) => (
        <div key={semLabel}>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{semLabel}</h2>
          <div className="space-y-3">
            {records.map((record) => {
              const co = record.courseOffering;
              const courseName = co?.course?.name || 'Unknown Course';
              const courseCode = co?.course?.code || '';
              const pct = record.percentage ?? 0;
              const barColor = pct >= 75 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-rose-500';

              return (
                <Card key={co?._id || courseName}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">
                        {courseCode && <span className="text-indigo-700 mr-1">{courseCode}</span>}
                        {courseName}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {record.attended} of {record.total} classes attended
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <span className={`text-2xl font-black ${pct >= 75 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-500' : 'text-rose-600'}`}>
                        {pct}%
                      </span>
                      {pct < 75 && (
                        <p className="text-xs text-rose-500 font-semibold mt-0.5">
                          {pct < 60 ? 'Critical' : 'Low'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {pct < 75 && (
                    <p className="text-xs text-amber-600 mt-2 bg-amber-50 px-3 py-1.5 rounded-lg">
                      Need {Math.max(0, Math.ceil((0.75 * record.total - record.attended) / 0.25))} more classes to reach 75%
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
