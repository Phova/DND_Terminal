import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';

interface Broadcast {
  id: string;
  type: 'text' | 'image';
  recipients: string[];
  content: string;
  mimeType?: string;
  duration: number;
  timestamp: string;
}

interface Props {
  socket: Socket | null;
  currentUsername: string | null;
}

export default function BroadcastDisplay({ socket, currentUsername }: Props) {
  const [broadcast, setBroadcast] = useState<Broadcast | null>(null);

  useEffect(() => {
    if (!socket) return;
    const handler = (data: any) => {
      const b = data as Broadcast;
      if (!b.recipients || b.recipients.length === 0) return;
      // Show if recipient list includes current user, or if sent to "all"
      if (currentUsername && !b.recipients.includes(currentUsername)) return;
      setBroadcast(b);
      if (b.duration > 0) {
        setTimeout(() => setBroadcast(null), b.duration * 1000);
      }
    };
    socket.on('broadcast:sent', handler);
    return () => { socket.off('broadcast:sent', handler); };
  }, [socket, currentUsername]);

  if (!broadcast) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.92)',
    }} onClick={() => setBroadcast(null)}>
      <div style={{
        maxWidth: 700, padding: 40,
        textAlign: 'center',
        fontFamily: 'var(--font-display)',
        color: 'var(--gold-glow)',
      }}>
        {broadcast.type === 'text' ? (
          <div style={{
            fontSize: 28,
            lineHeight: 1.6,
            textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
          }}>
            {broadcast.content}
          </div>
        ) : (
          <img
            src={broadcast.content}
            alt="Broadcast"
            style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8 }}
          />
        )}
        <p style={{ marginTop: 24, fontSize: 12, color: 'var(--ink-faint)' }}>
          点击任意处关闭
        </p>
      </div>
    </div>
  );
}
