import { useState } from 'react';

interface LogEntry {
  id: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'lore';
  author: string;
  text: string;
}

interface Props {
  data?: { entries: LogEntry[] };
  onSave: (data: { entries: LogEntry[] }) => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  info: '#4caf50', warning: '#ffaa00', error: '#ff3333', lore: '#7b2fbe',
};

export default function ChronicleEditor({ data, onSave }: Props) {
  const [entries, setEntries] = useState<LogEntry[]>(data?.entries || []);
  const [newText, setNewText] = useState('');
  const [newSeverity, setNewSeverity] = useState<'info' | 'warning' | 'error' | 'lore'>('info');
  const [newAuthor, setNewAuthor] = useState('DM');

  const addEntry = () => {
    if (!newText.trim()) return;
    const entry: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      severity: newSeverity,
      author: newAuthor,
      text: newText.slice(0, 256),
    };
    const updated = [...entries, entry];
    setEntries(updated);
    setNewText('');
    onSave({ entries: updated });
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input value={newAuthor} onChange={e => setNewAuthor(e.target.value)} placeholder="作者" style={{ width: 80 }} />
        <select value={newSeverity} onChange={e => setNewSeverity(e.target.value as any)}>
          <option value="info">信息</option>
          <option value="warning">警告</option>
          <option value="error">危机</option>
          <option value="lore">传说</option>
        </select>
        <input value={newText} onChange={e => setNewText(e.target.value)} placeholder="条目内容 (最多256字)..." maxLength={256} style={{ flex: 1 }} />
        <button className="btn" onClick={addEntry}>添加</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {entries.slice().reverse().map(entry => (
          <div key={entry.id} style={{
            background: 'var(--parchment-light)', border: '1px solid var(--parchment-dark)',
            borderLeft: `3px solid ${SEVERITY_COLORS[entry.severity]}`,
            borderRadius: 4, padding: '8px 12px',
          }}>
            <div style={{ fontSize: 11, color: 'var(--ink-faint)', display: 'flex', gap: 8 }}>
              <span>{entry.author}</span>
              <span>{new Date(entry.timestamp).toLocaleString('zh-CN')}</span>
              <span style={{ color: SEVERITY_COLORS[entry.severity] }}>{entry.severity}</span>
            </div>
            <div style={{ fontSize: 13, marginTop: 4 }}>{entry.text}</div>
          </div>
        ))}
        {entries.length === 0 && <p className="dm-hint" style={{ padding: 20 }}>暂无编年史条目</p>}
      </div>
    </div>
  );
}
