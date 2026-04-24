import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import { getInbox, getSentMessages, sendMessage, markMessageRead } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';

export default function MessagingInbox() {
  const { user } = useAuth();
  const [tab, setTab] = useState('inbox');
  const [inbox, setInbox] = useState([]);
  const [sent, setSent] = useState([]);
  const [isComposing, setIsComposing] = useState(false);
  const [form, setForm] = useState({ recipient: '', subject: '', body: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    getInbox().then(r => setInbox(r.data)).catch(() => {});
    getSentMessages().then(r => setSent(r.data)).catch(() => {});
  };

  const handleSend = async () => {
    try {
      await sendMessage(form);
      fetchData();
      setIsComposing(false);
      setForm({ recipient: '', subject: '', body: '' });
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to send message';
      alert(msg);
    }
  };

  const handleMarkRead = async (id) => {
    await markMessageRead(id);
    fetchData();
  };

  const messages = tab === 'inbox' ? inbox : sent;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#2c3e50]">Messages</h1>
          <p className="text-gray-500 text-sm mt-1">Academic messaging between peers and faculty.</p>
        </div>
        <Button onClick={() => setIsComposing(true)}>+ Compose</Button>
      </div>

      <div className="flex space-x-2">
        <button onClick={() => setTab('inbox')} className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${tab === 'inbox' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
          Inbox ({inbox.filter(m => !m.isRead).length})
        </button>
        <button onClick={() => setTab('sent')} className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${tab === 'sent' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
          Sent
        </button>
      </div>

      {messages.length === 0 && <Card><p className="text-gray-500 text-sm">No messages.</p></Card>}

      <div className="space-y-3">
        {messages.map(msg => (
          <Card key={msg._id} className={`cursor-pointer ${!msg.isRead && tab === 'inbox' ? 'border-l-4 border-l-indigo-500' : ''}`}
                onClick={() => tab === 'inbox' && !msg.isRead && handleMarkRead(msg._id)}>
            <div className="flex justify-between items-start">
              <div>
                <h4 className={`text-sm ${!msg.isRead && tab === 'inbox' ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{msg.subject}</h4>
                <p className="text-xs text-gray-500 mt-1">
                  {tab === 'inbox' ? `From: ${msg.sender?.name || 'Unknown'}` : `To: ${msg.recipient?.name || 'Unknown'}`}
                </p>
                <p className="text-sm text-gray-600 mt-2">{msg.body?.slice(0, 100)}</p>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap ml-4">{new Date(msg.createdAt).toLocaleDateString()}</span>
            </div>
          </Card>
        ))}
      </div>

      {isComposing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 p-6 rounded-2xl w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">New Message</h2>
            <div className="space-y-4">
              <input value={form.recipient} onChange={e => setForm({...form, recipient: e.target.value})} placeholder="Recipient User ID (e.g. 230101120)" className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500" />
              <input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="Subject" className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500" />
              <textarea value={form.body} onChange={e => setForm({...form, body: e.target.value})} placeholder="Write your message..." className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500 h-28 resize-none"></textarea>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setIsComposing(false)}>Cancel</Button>
              <Button onClick={handleSend}>Send</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
