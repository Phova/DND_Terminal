import { useState } from 'react';
import { Socket } from 'socket.io-client';

interface Character {
  username: string;
  first_name: string;
}

interface Props {
  socket: Socket | null;
  characters: Character[];
}

export default function BroadcastView({ socket, characters }: Props) {
  const [type, setType] = useState<'text' | 'image'>('text');
  const [content, setContent] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [duration, setDuration] = useState(10);
  const [sending, setSending] = useState(false);

  const usernames = characters.map(c => c.username);

  const toggleRecipient = (u: string) => {
    setSelectedRecipients(prev => prev.includes(u) ? prev.filter(x => x !== u) : [...prev, u]);
  };

  const send = async () => {
    if (!content.trim() || selectedRecipients.length === 0) return;
    setSending(true);
    try {
      await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, recipients: selectedRecipients, content, duration }),
      });
      setContent('');
    } catch (e) { console.error(e); }
    setSending(false);
  };

  return (
    <div>
      <div style={{ background: 'var(--parchment-light)', border: '1px solid var(--parchment-dark)', borderRadius: 8, padding: 16, maxWidth: 600 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 12 }}>📢 广播 (全屏警报)</h3>

        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>广播类型</span>
          <select value={type} onChange={e => setType(e.target.value as 'text' | 'image')} style={{ width: '100%', marginTop: 2 }}>
            <option value="text">文字信息</option>
            <option value="image">图像</option>
          </select>
        </div>

        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>收信玩家</span>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
            {usernames.map(u => (
              <button
                key={u}
                onClick={() => toggleRecipient(u)}
                style={{
                  padding: '4px 10px', fontSize: 11, border: '1px solid var(--parchment-dark)', borderRadius: 4,
                  background: selectedRecipients.includes(u) ? 'var(--crimson)' : 'var(--parchment-bg)',
                  color: selectedRecipients.includes(u) ? 'white' : 'var(--ink)',
                  cursor: 'pointer',
                }}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>显示时长 (秒)</span>
          <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} min={3} max={60} style={{ width: '100%', marginTop: 2 }} />
        </div>

        <div style={{ marginBottom: 8 }}>
          {type === 'text' ? (
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="广播内容...（如：龙吼震天！）" rows={3} style={{ width: '100%' }} />
          ) : (
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Base64 图像数据..." rows={3} style={{ width: '100%' }} />
          )}
        </div>

        <button className="btn" onClick={send} disabled={sending} style={{ width: '100%' }}>
          {sending ? '发送中...' : '🔔 推送广播'}
        </button>
      </div>
    </div>
  );
}
