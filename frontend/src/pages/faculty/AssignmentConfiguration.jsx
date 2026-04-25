import { useState, useEffect, useRef } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import {
  createAssignment, getAssignments, updateAssignment,
  deleteAssignment, publishAssignment, getMyCourseOfferings,
  downloadAssignmentAttachment
} from '../../services/apiService';

function toLocalDatetime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const EMPTY_FORM = { title: '', description: '', deadline: '', maxScore: 100 };
const EMPTY_FILE = null;

export default function AssignmentConfiguration() {
  const [offerings, setOfferings] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [assignments, setAssignments] = useState([]);

  // create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [createFile, setCreateFile] = useState(EMPTY_FILE);
  const [creating, setCreating] = useState(false);

  // edit modal
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editFile, setEditFile] = useState(EMPTY_FILE);
  const [saving, setSaving] = useState(false);

  // deadline popover
  const [deadlineTarget, setDeadlineTarget] = useState(null);
  const [newDeadline, setNewDeadline] = useState('');
  const [updatingDeadline, setUpdatingDeadline] = useState(false);

  // delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // copy feedback
  const [copied, setCopied] = useState(null);

  // overflow menu
  const [menuOpen, setMenuOpen] = useState(null);
  const menuRef = useRef(null);

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
    if (!courseId) { setAssignments([]); return; }
    fetchAssignments();
  }, [courseId]);

  // close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchAssignments = () => {
    if (!courseId) return;
    getAssignments(courseId).then(r => setAssignments(r.data)).catch(() => setAssignments([]));
  };

  const copyId = (id) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(id); setTimeout(() => setCopied(null), 2000);
    });
  };

  // ── Create ──
  const handleCreate = async () => {
    if (!courseId) return alert('Select a course first');
    if (!createForm.title || !createForm.deadline) return alert('Title and deadline are required');
    setCreating(true);
    try {
      await createAssignment(courseId, createForm, createFile);
      fetchAssignments();
      setCreateOpen(false);
      setCreateForm(EMPTY_FORM);
      setCreateFile(EMPTY_FILE);
    } catch (err) { alert(err.response?.data?.error || 'Failed to create'); }
    setCreating(false);
  };

  // ── Edit ──
  const openEdit = (a) => {
    setEditTarget(a);
    setEditForm({ title: a.title, description: a.description || '', deadline: toLocalDatetime(a.deadline), maxScore: a.maxScore });
    setEditFile(EMPTY_FILE);
    setMenuOpen(null);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      await updateAssignment(editTarget._id, editForm, editFile);
      fetchAssignments();
      setEditTarget(null);
      setEditFile(EMPTY_FILE);
    } catch (err) { alert(err.response?.data?.error || 'Failed to save'); }
    setSaving(false);
  };

  // ── Update deadline only ──
  const openDeadline = (a) => {
    setDeadlineTarget(a);
    setNewDeadline(toLocalDatetime(a.deadline));
    setMenuOpen(null);
  };

  const handleUpdateDeadline = async () => {
    if (!newDeadline) return;
    setUpdatingDeadline(true);
    try {
      await updateAssignment(deadlineTarget._id, { deadline: newDeadline });
      fetchAssignments();
      setDeadlineTarget(null);
    } catch (err) { alert(err.response?.data?.error || 'Failed to update deadline'); }
    setUpdatingDeadline(false);
  };

  // ── Delete ──
  const confirmDelete = (a) => { setDeleteTarget(a); setMenuOpen(null); };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAssignment(deleteTarget._id);
      fetchAssignments();
      setDeleteTarget(null);
    } catch (err) { alert(err.response?.data?.error || 'Failed to delete'); }
    setDeleting(false);
  };

  // ── Publish ──
  const handlePublish = async (a) => {
    setMenuOpen(null);
    try { await publishAssignment(a._id); fetchAssignments(); }
    catch { alert('Failed to publish'); }
  };

  const handleDownloadAttachment = async (a) => {
    try {
      const res = await downloadAssignmentAttachment(a._id);
      const url = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = a.attachmentFileName || 'attachment';
      link.click();
      URL.revokeObjectURL(url);
    } catch { alert('Failed to download attachment'); }
  };

  const isPastDue = (d) => new Date(d) < new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#2c3e50]">Assignments</h1>
          <p className="text-gray-500 text-sm mt-1">Create and manage course assignments.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>+ New Assignment</Button>
      </div>

      {/* Course selector */}
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
            <input value={courseId} onChange={e => setCourseId(e.target.value)}
              placeholder="Or paste a Course Offering ID directly"
              className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm mt-1" />
          </div>
        ) : (
          <input value={courseId} onChange={e => setCourseId(e.target.value)}
            placeholder="Paste Course Offering ID"
            className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm" />
        )}
      </Card>

      {courseId && assignments.length === 0 && (
        <Card><p className="text-gray-500 text-sm">No assignments yet. Create one above.</p></Card>
      )}

      {/* Assignment cards */}
      {assignments.map(a => (
        <Card key={a._id}>
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-gray-900 text-base">{a.title}</h3>
                <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${a.isPublished ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {a.isPublished ? 'Published' : 'Draft'}
                </span>
                {isPastDue(a.deadline) && (
                  <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-500">Closed</span>
                )}
              </div>

              {a.description && <p className="text-sm text-gray-500 mt-1">{a.description}</p>}

              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                <span>
                  <span className="font-medium">Due:</span>{' '}
                  <span className={isPastDue(a.deadline) ? 'text-rose-500 font-semibold' : 'text-gray-700'}>
                    {new Date(a.deadline).toLocaleString()}
                  </span>
                </span>
                <span><span className="font-medium">Max:</span> {a.maxScore} pts</span>
              </div>

              {/* Assignment ID */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-400">ID:</span>
                <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded select-all">{a._id}</span>
                <button onClick={() => copyId(a._id)} className="text-xs text-indigo-600 hover:underline font-semibold">
                  {copied === a._id ? '✓ Copied' : 'Copy'}
                </button>
              </div>

              {/* Attachment */}
              {a.attachmentFileName && (
                <div className="flex items-center gap-2 mt-1.5">
                  <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  <span className="text-xs text-gray-500 truncate max-w-xs">{a.attachmentFileName}</span>
                  <button onClick={() => handleDownloadAttachment(a)} className="text-xs text-indigo-600 hover:underline font-semibold flex-shrink-0">Download</button>
                </div>
              )}
            </div>

            {/* ⋯ Menu */}
            <div className="relative flex-shrink-0" ref={menuOpen === a._id ? menuRef : null}>
              <button
                onClick={() => setMenuOpen(menuOpen === a._id ? null : a._id)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition"
                title="More options"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </button>

              {menuOpen === a._id && (
                <div className="absolute right-0 top-9 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                  {!a.isPublished && (
                    <button onClick={() => handlePublish(a)}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Publish
                    </button>
                  )}
                  <button onClick={() => openEdit(a)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Edit
                  </button>
                  <button onClick={() => openDeadline(a)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Update Deadline
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button onClick={() => confirmDelete(a)}
                    className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}

      {/* ── Create Modal ── */}
      {createOpen && (
        <Modal title="New Assignment" onClose={() => { setCreateOpen(false); setCreateFile(EMPTY_FILE); }}>
          <FormFields form={createForm} onChange={setCreateForm} />
          <FileAttachPicker file={createFile} onChange={setCreateFile} />
          <ModalActions>
            <Button variant="secondary" onClick={() => { setCreateOpen(false); setCreateFile(EMPTY_FILE); }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating}>{creating ? 'Creating...' : 'Create'}</Button>
          </ModalActions>
        </Modal>
      )}

      {/* ── Edit Modal ── */}
      {editTarget && (
        <Modal title={`Edit — ${editTarget.title}`} onClose={() => { setEditTarget(null); setEditFile(EMPTY_FILE); }}>
          <FormFields form={editForm} onChange={setEditForm} />
          <FileAttachPicker file={editFile} onChange={setEditFile} existingName={editTarget.attachmentFileName} />
          <ModalActions>
            <Button variant="secondary" onClick={() => { setEditTarget(null); setEditFile(EMPTY_FILE); }}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          </ModalActions>
        </Modal>
      )}

      {/* ── Update Deadline Modal ── */}
      {deadlineTarget && (
        <Modal title={`Update Deadline — ${deadlineTarget.title}`} onClose={() => setDeadlineTarget(null)}>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Current: <span className="font-medium text-gray-800">{new Date(deadlineTarget.deadline).toLocaleString()}</span>
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">New Deadline</label>
              <input type="datetime-local" value={newDeadline}
                onChange={e => setNewDeadline(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm" />
            </div>
          </div>
          <ModalActions>
            <Button variant="secondary" onClick={() => setDeadlineTarget(null)}>Cancel</Button>
            <Button onClick={handleUpdateDeadline} disabled={updatingDeadline}>
              {updatingDeadline ? 'Updating...' : 'Update Deadline'}
            </Button>
          </ModalActions>
        </Modal>
      )}

      {/* ── Delete Confirm ── */}
      {deleteTarget && (
        <Modal title="Delete Assignment?" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <span className="font-semibold text-gray-900">"{deleteTarget.title}"</span>?
            This will also remove all student submissions. This action cannot be undone.
          </p>
          <ModalActions>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <button onClick={handleDelete} disabled={deleting}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold disabled:opacity-50 transition cursor-pointer">
              {deleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
          </ModalActions>
        </Modal>
      )}
    </div>
  );
}

// ── Shared sub-components ──

function FormFields({ form, onChange }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Title *</label>
        <input value={form.title} onChange={e => onChange({...form, title: e.target.value})}
          placeholder="e.g. Lab 3 – Sorting Algorithms"
          className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
        <textarea value={form.description} onChange={e => onChange({...form, description: e.target.value})}
          placeholder="Instructions, requirements, submission format..."
          className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm h-24 resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Deadline *</label>
          <input type="datetime-local" value={form.deadline}
            onChange={e => onChange({...form, deadline: e.target.value})}
            className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Max Score</label>
          <input type="number" value={form.maxScore}
            onChange={e => onChange({...form, maxScore: +e.target.value})}
            className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm" />
        </div>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-200 p-6 rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ children }) {
  return <div className="mt-5 flex justify-end gap-3">{children}</div>;
}

function FileAttachPicker({ file, onChange, existingName }) {
  return (
    <div className="mt-3">
      <label className="block text-xs font-semibold text-gray-600 mb-1">Attachment (optional)</label>
      {existingName && !file && (
        <p className="text-xs text-gray-400 mb-1">Current: <span className="font-mono text-gray-600">{existingName}</span></p>
      )}
      <label className="flex items-center gap-2 cursor-pointer px-4 py-2 border-2 border-dashed border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition text-sm text-gray-500 hover:text-indigo-600">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
        {file ? <span className="font-medium text-indigo-600 truncate">{file.name}</span> : <span>Attach a file — any type accepted</span>}
        <input type="file" accept="*" className="hidden" onChange={e => onChange(e.target.files[0] || null)} />
      </label>
      {file && (
        <button type="button" onClick={() => onChange(null)} className="text-xs text-gray-400 hover:text-rose-500 mt-1">Remove</button>
      )}
    </div>
  );
}
