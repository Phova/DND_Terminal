import { useState, useEffect } from 'react';

interface Monster {
  id: string;
  name: string;
  type: string;
  size: string;
  ac: number;
  hp_max: number;
  cr: number;
  xp: number;
  source_book: string;
  abilities?: Record<string, number>;
  speed?: Record<string, number>;
  senses?: string;
  languages?: string;
  traits?: any[];
  actions?: any[];
}

interface Props {
  data?: { selectedMonsterId?: string };
  onSave: (data: { selectedMonsterId?: string }) => void;
}

export default function BestiaryViewer({ data, onSave }: Props) {
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Monster | null>(null);

  const fetchMonsters = async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('limit', '20');
    const res = await fetch(`/api/monsters?${params}`);
    setMonsters(await res.json());
  };

  useEffect(() => { fetchMonsters(); }, []);

  const selectMonster = async (id: string) => {
    const res = await fetch(`/api/monsters/${id}`);
    setSelected(await res.json());
    onSave({ selectedMonsterId: id });
  };

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <div style={{ width: 300, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索..." style={{ flex: 1 }} />
          <button className="btn" onClick={fetchMonsters}>搜索</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {monsters.map(m => (
            <div key={m.id} onClick={() => selectMonster(m.id)} style={{
              padding: '8px 12px', cursor: 'pointer', borderRadius: 4,
              background: selected?.id === m.id ? 'rgba(139,0,0,0.1)' : 'var(--parchment-light)',
              border: selected?.id === m.id ? '1px solid var(--crimson)' : '1px solid var(--parchment-dark)',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>{m.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>CR {m.cr} | {m.type}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }}>
        {selected ? (
          <div style={{ background: 'var(--parchment-light)', border: '1px solid var(--parchment-dark)', borderRadius: 8, padding: 16 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--crimson)' }}>{selected.name}</h3>
            <p style={{ color: 'var(--ink-faint)', fontSize: 13 }}>{selected.size} {selected.type} — CR {selected.cr} ({selected.xp} XP)</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
              <span className="stat-pill">AC: {selected.ac}</span>
              <span className="stat-pill">HP: {selected.hp_max}</span>
              <span className="stat-pill">{selected.source_book}</span>
            </div>
            {selected.abilities && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                {Object.entries(selected.abilities).map(([k, v]) => (
                  <span key={k} style={{ fontSize: 12, color: 'var(--ink-light)' }}>{k.toUpperCase()}: {v} ({Math.floor((v - 10) / 2) >= 0 ? '+' : ''}{Math.floor((v - 10) / 2)})</span>
                ))}
              </div>
            )}
            {selected.traits && selected.traits.length > 0 && (
              <div style={{ marginTop: 12 }}><strong style={{ fontSize: 12 }}>特性:</strong>
                {selected.traits.map((t: any, i: number) => <div key={i} style={{ fontSize: 12, color: 'var(--ink-light)' }}>• {t.name || JSON.stringify(t)}</div>)}
              </div>
            )}
          </div>
        ) : (
          <div className="dm-placeholder">🐉 选择一个怪物查看详情</div>
        )}
      </div>
    </div>
  );
}
