import { useState, useEffect } from 'react';

interface Spell {
  id: string;
  name: string;
  level: number;
  school: string;
  casting_time: string;
  range: string;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description: string;
  classes: string[];
  source_book: string;
}

export default function SpellBook() {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [school, setSchool] = useState('');
  const [selected, setSelected] = useState<Spell | null>(null);

  const fetchSpells = async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (level) params.set('level', level);
    if (school) params.set('school', school);
    params.set('limit', '100');
    const res = await fetch(`/api/spells?${params}`);
    const data = await res.json();
    setSpells(data);
  };

  useEffect(() => { fetchSpells(); }, []);

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <div style={{ width: 360, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索法术..." style={{ flex: 1 }} />
          <select value={level} onChange={e => setLevel(e.target.value)}>
            <option value="">所有环阶</option>
            {[0,1,2,3,4,5,6,7,8,9].map(l => <option key={l} value={l}>{l === 0 ? '戏法' : `${l}环`}</option>)}
          </select>
          <button className="btn" onClick={fetchSpells}>搜索</button>
        </div>
        <div className="spell-list">
          {spells.map(s => (
            <div key={s.id} className="spell-card" onClick={() => setSelected(s)} style={{ cursor: 'pointer' }}>
              <h4>{s.name}</h4>
              <div className="spell-meta">
                {s.level === 0 ? '戏法' : `${s.level}环`} | {s.school} | {s.casting_time}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }}>
        {selected ? (
          <div className="char-sheet" style={{ maxWidth: '100%' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--arcane)' }}>{selected.name}</h2>
            <p style={{ color: 'var(--ink-light)', marginTop: 8 }}>
              {selected.level === 0 ? '戏法' : `${selected.level}环`} {selected.school}
              {selected.ritual ? ' (仪式)' : ''}{selected.concentration ? ' (专注)' : ''}
            </p>
            <div style={{ marginTop: 8, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span className="stat-pill">施法时间: {selected.casting_time}</span>
              <span className="stat-pill">距离: {selected.range}</span>
              <span className="stat-pill">持续时间: {selected.duration}</span>
            </div>
            <p style={{ marginTop: 12, color: 'var(--ink)', lineHeight: 1.7 }}>{selected.description}</p>
            <p style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-faint)' }}>
              职业: {selected.classes?.join(', ')} | {selected.source_book}
            </p>
          </div>
        ) : (
          <div className="dm-placeholder">📖 选择一个法术查看详情</div>
        )}
      </div>
    </div>
  );
}
