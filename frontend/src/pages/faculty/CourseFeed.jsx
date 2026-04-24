import { useState, useEffect, useRef } from 'react';
import { getMyCourseOfferings, getCoursePosts, createPost, deletePost, downloadPostAttachment, addReply, deleteReply } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

function RoleBadge({ role }) {
  const color = role === 'faculty' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600';
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase ${color}`}>{role}</span>;
}

function PostCard({ post, currentUserId, onDelete, onReply, onDeleteReply, onDownload }) {
  const [replyText, setReplyText] = useState('');
  const [showReply, setShowReply] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    await onReply(post._id, replyText.trim());
    setReplyText('');
    setShowReply(false);
    setSubmitting(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Post header */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
            {post.author?.name?.[0] || '?'}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-gray-900">{post.author?.name}</span>
              <RoleBadge role={post.author?.role} />
            </div>
            <p className="text-xs text-gray-400">{timeAgo(post.createdAt)}</p>
          </div>
        </div>
        {post.author?._id === currentUserId && (
          <button onClick={() => onDelete(post._id)} className="text-gray-300 hover:text-rose-500 transition text-lg leading-none">×</button>
        )}
      </div>

      {/* Body */}
      <div className="px-5 pb-3">
        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{post.body}</p>
      </div>

      {/* Attachment */}
      {post.attachment?.fileName && (
        <div className="mx-5 mb-3 flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5">
          <svg className="w-5 h-5 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          <span className="text-xs font-medium text-indigo-700 flex-1 truncate">{post.attachment.fileName}</span>
          <button onClick={() => onDownload(post._id, post.attachment.fileName)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-lg px-2.5 py-1 hover:bg-indigo-100 transition">
            Download
          </button>
        </div>
      )}

      {/* Replies */}
      {post.replies?.length > 0 && (
        <div className="border-t border-gray-100 px-5 py-3 space-y-3">
          {post.replies.map(r => (
            <div key={r._id} className="flex gap-2.5 items-start">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs flex-shrink-0">
                {r.author?.name?.[0] || '?'}
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-800">{r.author?.name}</span>
                    <RoleBadge role={r.author?.role} />
                    <span className="text-[10px] text-gray-400">{timeAgo(r.createdAt)}</span>
                  </div>
                  {r.author?._id === currentUserId && (
                    <button onClick={() => onDeleteReply(post._id, r._id)} className="text-gray-300 hover:text-rose-400 text-sm leading-none">×</button>
                  )}
                </div>
                <p className="text-xs text-gray-700 mt-0.5 whitespace-pre-wrap">{r.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply input */}
      <div className="border-t border-gray-100 px-5 py-3">
        {showReply ? (
          <div className="flex gap-2 items-end">
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Write a reply…"
              rows={2}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 resize-none focus:outline-none focus:border-indigo-400"
            />
            <div className="flex flex-col gap-1">
              <button onClick={handleReply} disabled={submitting || !replyText.trim()}
                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50 hover:bg-indigo-700 transition">
                Send
              </button>
              <button onClick={() => { setShowReply(false); setReplyText(''); }}
                className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowReply(true)}
            className="text-xs text-indigo-500 hover:text-indigo-700 font-medium flex items-center gap-1.5 transition">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Reply
          </button>
        )}
      </div>
    </div>
  );
}

export default function CourseFeed() {
  const { user } = useAuth();
  const [offerings, setOfferings] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [posts, setPosts] = useState([]);
  const [body, setBody] = useState('');
  const [file, setFile] = useState(null);
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    getMyCourseOfferings().then(r => setOfferings(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId) { setPosts([]); return; }
    setLoading(true);
    getCoursePosts(selectedId).then(r => setPosts(r.data || [])).catch(() => setPosts([])).finally(() => setLoading(false));
  }, [selectedId]);

  const handlePost = async () => {
    if (!body.trim() || !selectedId) return;
    setPosting(true);
    const fd = new FormData();
    fd.append('body', body.trim());
    if (file) fd.append('attachment', file);
    try {
      const res = await createPost(selectedId, fd);
      setPosts(prev => [res.data, ...prev]);
      setBody('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      console.error('Post error:', err.response?.data || err.message);
      alert(err.response?.data?.error || err.message || 'Failed to post');
    }
    setPosting(false);
  };

  const handleDelete = async (postId) => {
    if (!confirm('Delete this post?')) return;
    try {
      await deletePost(postId);
      setPosts(prev => prev.filter(p => p._id !== postId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete');
    }
  };

  const handleReply = async (postId, replyBody) => {
    try {
      const res = await addReply(postId, replyBody);
      setPosts(prev => prev.map(p => p._id === postId ? res.data : p));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reply');
    }
  };

  const handleDeleteReply = async (postId, replyId) => {
    try {
      await deleteReply(postId, replyId);
      setPosts(prev => prev.map(p => {
        if (p._id !== postId) return p;
        return { ...p, replies: p.replies.filter(r => r._id !== replyId) };
      }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete reply');
    }
  };

  const handleDownload = async (postId, fileName) => {
    try {
      const res = await downloadPostAttachment(postId);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download');
    }
  };

  const selected = offerings.find(o => o._id === selectedId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#2c3e50]">Course Feed</h1>
        <p className="text-gray-500 text-sm mt-1">Share posts, resources, and updates with your students.</p>
      </div>

      {/* Course selector */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Select Course</p>
        </div>
        <div className="divide-y divide-gray-100">
          {offerings.length === 0 && (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">No courses found.</p>
          )}
          {offerings.map(o => (
            <button key={o._id} onClick={() => setSelectedId(o._id)}
              className={`w-full text-left px-5 py-4 flex items-center justify-between hover:bg-indigo-50 transition ${selectedId === o._id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}>
              <span className="font-semibold text-sm text-gray-900">
                {o.course?.code} — {o.course?.name}
              </span>
              <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{o.semester} {o.year}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedId && (
        <>
          {/* Compose */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              New Post — {selected?.course?.code} {selected?.semester} {selected?.year}
            </p>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write an announcement, share notes, or post a resource…"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 resize-none focus:outline-none focus:border-indigo-400"
            />
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs font-medium text-indigo-600 cursor-pointer border border-indigo-200 rounded-lg px-3 py-2 hover:bg-indigo-50 transition">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  Attach File
                  <input type="file" className="hidden" ref={fileRef} onChange={e => setFile(e.target.files[0] || null)} />
                </label>
                {file && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-100 px-2.5 py-1.5 rounded-lg">
                    <span className="truncate max-w-32">{file.name}</span>
                    <button onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                      className="text-gray-400 hover:text-rose-500 ml-1">×</button>
                  </div>
                )}
              </div>
              <button
                onClick={handlePost}
                disabled={posting || !body.trim()}
                className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl disabled:opacity-50 hover:bg-indigo-700 transition"
              >
                {posting ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>

          {/* Feed */}
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-8">Loading feed…</p>
          ) : posts.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
              <p className="text-gray-400 text-sm">No posts yet. Be the first to post!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map(post => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUserId={user?._id}
                  onDelete={handleDelete}
                  onReply={handleReply}
                  onDeleteReply={handleDeleteReply}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
