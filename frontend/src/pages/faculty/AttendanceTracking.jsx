import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { getAttendanceSessions, markAttendance, getRoster, getMyCourseOfferings } from '../../services/apiService';
import XLSX from 'xlsx-js-style';

export default function AttendanceTracking() {
  const [offerings, setOfferings] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [sessions, setSessions] = useState([]);
  const [roster, setRoster] = useState([]);
  const [date, setDate] = useState('');
  const [marking, setMarking] = useState(false);
  const [perStudent, setPerStudent] = useState({});
  const [expandedSession, setExpandedSession] = useState(null);

  useEffect(() => {
    getMyCourseOfferings().then(r => setOfferings(r.data)).catch(() => {});
    // Pre-select offering if navigated from FacultyDashboard
    const preSelected = sessionStorage.getItem('selectedOfferingId');
    if (preSelected) {
      setCourseId(preSelected);
      sessionStorage.removeItem('selectedOfferingId');
    }
  }, []);

  useEffect(() => {
    if (!courseId) { setSessions([]); setRoster([]); return; }
    fetchData();
  }, [courseId]);

  const fetchData = () => {
    getAttendanceSessions(courseId).then(r => setSessions(r.data)).catch(() => {});
    getRoster(courseId).then(r => {
      setRoster(r.data);
      const init = {};
      r.data.forEach(e => { init[e.student?._id || e.student] = 'present'; });
      setPerStudent(init);
    }).catch(() => {});
  };

  const handleMarkAll = async (status) => {
    if (!courseId || !date) return alert('Select a course and date first');
    const updated = {};
    roster.forEach(e => { updated[e.student?._id || e.student] = status; });
    setPerStudent(updated);
  };

  const handleSubmit = async () => {
    if (!courseId || !date) return alert('Select a course and date first');
    setMarking(true);
    const records = roster.map(e => ({
      student: e.student?._id || e.student,
      status: perStudent[e.student?._id || e.student] || 'absent'
    }));
    try {
      await markAttendance(courseId, { date, records });
      fetchData();
      alert('Attendance saved!');
    } catch { alert('Failed to save attendance'); }
    setMarking(false);
  };

  const handleExportXLSX = () => {
    if (!sessions.length) return alert('No attendance sessions to export');
    const offering = offerings.find(o => o._id === courseId);

    // Sort sessions by date ascending
    const sortedSessions = [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Format date as DD/MM/YYYY
    const fmtDate = (d) => {
      const dt = new Date(d);
      return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
    };

    // Collect unique students preserving insertion order
    const studentMap = new Map();
    sortedSessions.forEach(s => {
      (s.records || []).forEach(r => {
        const sid = r.student?._id || r.student;
        if (sid && !studentMap.has(sid)) {
          studentMap.set(sid, { name: r.student?.name || 'Unknown', userId: r.student?.userId || '' });
        }
      });
    });

    // sessionIndex -> studentId -> 'P' | 'A'
    const sessionLookup = sortedSessions.map(s => {
      const map = new Map();
      (s.records || []).forEach(r => {
        const sid = r.student?._id || r.student;
        map.set(sid, r.status === 'present' ? 'P' : 'A');
      });
      return map;
    });

    const totalSessions = sortedSessions.length;
    const sessionPresentCounts = new Array(totalSessions).fill(0);

    // ── Styles ────────────────────────────────────────────────
    const headerStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '2C3E50' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: { bottom: { style: 'thin', color: { rgb: '999999' } } },
    };
    const summaryLabelStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '2980B9' } },
      alignment: { horizontal: 'left' },
    };
    const summaryValStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '2980B9' } },
      alignment: { horizontal: 'center' },
    };
    const presentStyle = {
      font: { bold: true, color: { rgb: '155724' } },
      fill: { fgColor: { rgb: '90EE90' } },
      alignment: { horizontal: 'center' },
    };
    const absentStyle = {
      font: { bold: true, color: { rgb: '7B0000' } },
      fill: { fgColor: { rgb: 'FFB3B3' } },
      alignment: { horizontal: 'center' },
    };
    const rollStyle = { alignment: { horizontal: 'left' } };
    const pctStyle = { alignment: { horizontal: 'center' } };

    // ── Build AOA (array of arrays) ───────────────────────────
    const headerRow = [
      { v: 'Roll No', s: headerStyle },
      { v: 'Name', s: headerStyle },
      ...sortedSessions.map(s => ({ v: fmtDate(s.date), s: headerStyle })),
      { v: 'Total Class', s: headerStyle },
      { v: 'Present', s: headerStyle },
      { v: 'Present(%)', s: headerStyle },
    ];

    const studentRows = [];
    studentMap.forEach((info, sid) => {
      const statuses = sortedSessions.map((_, si) => sessionLookup[si].get(sid) || 'A');
      const presentCount = statuses.filter(s => s === 'P').length;
      statuses.forEach((s, si) => { if (s === 'P') sessionPresentCounts[si]++; });
      const pct = totalSessions > 0 ? `${((presentCount / totalSessions) * 100).toFixed(2)}%` : '0.00%';
      studentRows.push([
        { v: info.userId, s: rollStyle },
        { v: info.name },
        ...statuses.map(s => ({ v: s, s: s === 'P' ? presentStyle : absentStyle })),
        { v: totalSessions, s: pctStyle },
        { v: presentCount, s: pctStyle },
        { v: pct, s: pctStyle },
      ]);
    });

    // Summary row 1 – Total Student Present per session
    const presentSumRow = [
      { v: 'Total Student Present', s: summaryLabelStyle },
      { v: '', s: summaryValStyle },
      ...sessionPresentCounts.map(c => ({ v: c, s: summaryValStyle })),
      { v: '', s: summaryValStyle },
      { v: '', s: summaryValStyle },
      { v: '', s: summaryValStyle },
    ];

    // Summary row 2 – Present % per session
    const pctSumRow = [
      { v: 'Present %', s: summaryLabelStyle },
      { v: '', s: summaryValStyle },
      ...sessionPresentCounts.map(c => {
        const total = studentMap.size;
        return { v: total > 0 ? `${((c / total) * 100).toFixed(2)}%` : '0.00%', s: summaryValStyle };
      }),
      { v: '', s: summaryValStyle },
      { v: '', s: summaryValStyle },
      { v: '', s: summaryValStyle },
    ];

    const aoa = [headerRow, ...studentRows, presentSumRow, pctSumRow];

    // ── Build worksheet ───────────────────────────────────────
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Column widths: Roll No, Name, [date cols], Total Class, Present, Present(%)
    ws['!cols'] = [
      { wch: 16 },
      { wch: 26 },
      ...sortedSessions.map(() => ({ wch: 13 })),
      { wch: 12 },
      { wch: 10 },
      { wch: 12 },
    ];

    // Row height for header
    ws['!rows'] = [{ hpt: 30 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

    const fileName = `attendance_${(offering?.course?.code || courseId).replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const selectedOffering = offerings.find(o => o._id === courseId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#2c3e50]">Attendance Tracking</h1>

      {/* Course Selector */}
      <Card>
        <label className="block text-sm font-medium text-gray-500 mb-2">Select Course</label>
        {offerings.length > 0 ? (
          <div className="space-y-2">
            {offerings.map(o => (
              <button key={o._id} onClick={() => setCourseId(o._id)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition ${courseId === o._id ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold' : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-indigo-300'}`}>
                <span className="font-semibold">{o.course?.code}</span> — {o.course?.name}
                <span className="ml-2 text-xs text-gray-400">{o.semester} {o.year}</span>
              </button>
            ))}
          </div>
        ) : (
          <input value={courseId} onChange={e => setCourseId(e.target.value)}
            placeholder="Paste Course Offering ID"
            className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm" />
        )}
      </Card>

      {courseId && (
        <>
          {/* Mark Attendance */}
          <Card>
            <h3 className="font-bold text-gray-900 mb-3">
              Mark Attendance
              {selectedOffering && <span className="ml-2 text-sm font-normal text-gray-500">— {selectedOffering.course?.code}</span>}
            </h3>
            <div className="flex items-end gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleMarkAll('present')}
                  className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 border border-emerald-200 transition">
                  All Present
                </button>
                <button onClick={() => handleMarkAll('absent')}
                  className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 border border-rose-200 transition">
                  All Absent
                </button>
              </div>
            </div>

            {roster.length === 0 ? (
              <p className="text-gray-500 text-sm">No students enrolled.</p>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {roster.map(e => {
                    const sid = e.student?._id || e.student;
                    const status = perStudent[sid] || 'present';
                    return (
                      <div key={e._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div>
                          <span className="text-sm font-medium text-gray-900">{e.student?.name || 'Student'}</span>
                          <span className="text-xs text-gray-400 ml-2">{e.student?.userId}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setPerStudent(prev => ({ ...prev, [sid]: 'present' }))}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${status === 'present' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-emerald-50 hover:text-emerald-700'}`}
                          >P</button>
                          <button
                            onClick={() => setPerStudent(prev => ({ ...prev, [sid]: 'absent' }))}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${status === 'absent' ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-rose-50 hover:text-rose-700'}`}
                          >A</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Button onClick={handleSubmit} disabled={marking}>
                  {marking ? 'Saving...' : `Save Attendance (${roster.length} students)`}
                </Button>
              </>
            )}
          </Card>

          {/* Session History */}
          <Card>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-900">Session History ({sessions.length})</h3>
              {sessions.length > 0 && (
                <button
                  onClick={handleExportXLSX}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 border border-emerald-200 transition"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                  Export Excel
                </button>
              )}
            </div>
            {sessions.length === 0 ? (
              <p className="text-gray-500 text-sm">No sessions recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {sessions.map((s, i) => {
                  const present = s.records?.filter(r => r.status === 'present').length || 0;
                  const total = s.records?.length || 0;
                  const isExpanded = expandedSession === i;
                  return (
                    <div key={i} className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                      <button
                        onClick={() => setExpandedSession(isExpanded ? null : i)}
                        className="w-full p-3 flex justify-between items-center hover:bg-gray-100 transition text-left"
                      >
                        <span className="text-sm font-medium text-gray-900">{new Date(s.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-emerald-600 font-semibold">{present}P</span>
                          <span className="text-rose-500 font-semibold">{total - present}A</span>
                          <span className="text-gray-400">{total} total</span>
                          <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </button>
                      {isExpanded && s.records?.length > 0 && (
                        <div className="border-t border-gray-200 px-3 pb-3 pt-2 grid grid-cols-2 gap-1">
                          {s.records.map((r, ri) => (
                            <div key={ri} className="flex items-center gap-2 text-xs py-1">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${r.status === 'present' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              <span className="text-gray-700">{r.student?.name || 'Student'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
