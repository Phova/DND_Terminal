import { useState, useEffect } from 'react';

interface Monster {
  id: string;
  name: string;
  type: string;
  size: string;
  cr: number;
  xp: number;
  ac: number;
  hp_max: number;
  source_book: string;
}

export default function MonsterPanel() {
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [search, setSearch] = useState('');
  const [crMin, setCrMin] = useState('');
  const [crMax, setCrMax] = useState('');

  const fetchMonsters = async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (crMin) params.set('cr_min', crMin);
    if (crMax) params.set('cr_max', crMax);
    params.set('limit', '50');
    const res = await fetch(`/api/monsters?${params}`);
    const data = await res.json();
    setMonsters(data);
  };

  useEffect(() => {
    fetchMonsters();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索怪物..." style={{ flex: 1 }} />
        <input value={crMin} onChange={e => setCrMin(e.target.value)} placeholder="CR 最低" style={{ width: 80 }} />
        <input value={crMax} onChange={e => setCrMax(e.target.value)} placeholder="CR 最高" style={{ width: 80 }} />
        <button className="btn" onClick={fetchMonsters}>搜索</button>
      </div>

      <div className="monster-panel">
        {monsters.map(m => (
          <div key={m.id} className="monster-card">
            <h4>{m.name}</h4>
            <div className="monster-meta">
              {m.size} {m.type} — CR {m.cr} ({m.xp} XP)
            </div>
            <div className="monster-meta" style={{ marginTop: 4 }}>
              AC: {m.ac} | HP: {m.hp_max} | {m.source_book}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
