import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface Message {
  id: string;
  sender: string;
  recipients: string[];
  subject: string;
  body: string;
  sent_at: string;
  read_status: Record<string, boolean>;
  created_at: string;
}

interface Character {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

interface Props {
  socket: Socket | null;
  characters: Character[];
}

export default function MessageHub({ socket, characters }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sender, setSender] = useState('');
  const [recipientInput, setRecipientInput] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/messages');
      const data = await res.json();
      setMessages(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchMessages(); }, []);

  useEffect(() => {
    if (!socket) return;
    const h = (e: string) => (() => { fetchMessages(); });
    socket.on('message:created', h('created'));
    socket.on('message:deleted', h('deleted'));
    return () => {
      socket.off('message:created');
      socket.off('message:deleted');
    };
  }, [socket]);

  const sendMessage = async () => {
    if (!sender || !recipientInput.trim() || !subject.trim()) return;
    setSending(true);
    const recipients = recipientInput.split(',').map(r => r.trim()).filter(Boolean);
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender, recipients, subject, body }),
      });
      setSubject(''); setBody(''); setRecipientInput('');
      fetchMessages();
    } catch (e) { console.error(e); }
    setSending(false);
  };

  const deleteMessage = async (id: string) => {
    await fetch(`/api/messages/${id}`, { method: 'DELETE' });
    fetchMessages();
  };

  const usernames = characters.map(c => c.username);
  const formatTime = (sentAt: string) => {
    try { const t = JSON.parse(sentAt); return `E${t.era}Y${t.year} M${t.month}D${t.day}`; }
    catch { return sentAt?.slice(0, 10) || '?'; }
  };

  return (
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      {/* Compose */}
      <div style={{ width: 340, flexShrink: 0 }}>
        <div style={{ background: 'var(--parchment-light)', border: '1px solid var(--parchment-dark)', borderRadius: 8, padding: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 12 }}>🕊️ 传讯石</h3>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>发送者</span>
            <select value={sender} onChange={e => setSender(e.target.value)} style={{ width: '100%', marginTop: 2 }}>
              <option value="">选择角色</option>
              {usernames.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>收信人 (逗号分隔)</span>
            <input value={recipientInput} onChange={e => setRecipientInput(e.target.value)} placeholder="gandalf, aragorn" style={{ width: '100%', marginTop: 2 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="主题 (最多48字)" maxLength={48} style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="正文..." rows={4} style={{ width: '100%', resize: 'vertical' }} />
          </div>
          <button className="btn" onClick={sendMessage} disabled={sending} style={{ width: '100%' }}>
            {sending ? '发送中...' : '放飞信鸦 🦅'}
          </button>
        </div>
      </div>

      {/* Inbox */}
      <div style={{ flex: 1 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, marginBottom: 8, color: 'var(--ink-light)' }}>
          收件箱 ({messages.length})
        </h3>
        {messages.length === 0 && <p className="dm-hint" style={{ padding: 20 }}>暂无传讯。</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {messages.map(m => (
            <div key={m.id} style={{ background: 'var(--parchment-light)', border: '1px solid var(--parchment-dark)', borderRadius: 6, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <strong style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>{m.subject}</strong>
                  {m.read_status && Object.values(m.read_status).every(v => v) && (
                    <span style={{ fontSize: 10, color: 'var(--forest)' }}>✓ 已读</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}>
                  {m.sender} → {m.recipients?.join(', ')} · {formatTime(m.sent_at)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-light)', marginTop: 4 }}>{m.body.slice(0, 120)}</div>
              </div>
              <button className="btn btn-danger" style={{ fontSize: 10, padding: '2px 8px' }} onClick={() => deleteMessage(m.id)}>删除</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
