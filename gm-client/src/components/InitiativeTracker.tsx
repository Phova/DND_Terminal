import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface Combatant {
  type: 'pc' | 'monster';
  ref_id: string | number;
  name: string;
  hp_current: number;
  hp_max: number;
  ac: number;
  initiative: number;
  conditions: string[];
  is_active: boolean;
}

interface Encounter {
  id: string;
  name: string;
  combatants: Combatant[];
  round: number;
  turn_index: number;
  status: 'prep' | 'active' | 'ended';
}

interface Character {
  id: number;
  first_name: string;
  last_name: string;
  hp_current: number;
  hp_max: number;
  ac: number;
  initiative_bonus: number;
}

interface Props {
  socket: Socket | null;
  characters: Character[];
}

export default function InitiativeTracker({ socket, characters }: Props) {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [activeEncounterId, setActiveEncounterId] = useState<string | null>(null);
  const [newEncounterName, setNewEncounterName] = useState('');
  const [selectedPcs, setSelectedPcs] = useState<number[]>([]);
  const [selectedMonsterId, setSelectedMonsterId] = useState('');
  const [monsterQty, setMonsterQty] = useState(1);

  const fetchEncounters = async () => {
    const res = await fetch('/api/encounters');
    const data = await res.json();
    setEncounters(data);
  };

  useEffect(() => { fetchEncounters(); }, []);

  useEffect(() => {
    if (!socket) return;
    const h: Record<string, (...args: any[]) => void> = {
      'encounter:started': () => fetchEncounters(),
      'encounter:turn_advanced': () => fetchEncounters(),
      'encounter:ended': () => fetchEncounters(),
      'encounter:combatant_updated': () => fetchEncounters(),
    };
    for (const [e, fn] of Object.entries(h)) socket.on(e, fn);
    return () => { for (const e of Object.keys(h)) socket.off(e); };
  }, [socket]);

  const activeEncounter = encounters.find(e => e.id === activeEncounterId);

  const createEncounter = async () => {
    const name = newEncounterName || '新的遭遇';
    const pcs = characters.filter(c => selectedPcs.includes(c.id)).map(c => ({
      type: 'pc' as const,
      ref_id: c.id,
      name: `${c.first_name} ${c.last_name}`,
      hp_current: c.hp_current,
      hp_max: c.hp_max,
      ac: c.ac,
      initiative: 0,
      conditions: [] as string[],
      is_active: false,
    }));
    const combatants = [...pcs];

    if (selectedMonsterId) {
      try {
        const mr = await fetch(`/api/monsters/${selectedMonsterId}`);
        const monster = await mr.json();
        for (let i = 0; i < monsterQty; i++) {
          combatants.push({
            type: 'monster',
            ref_id: `${selectedMonsterId}-${i}`,
            name: monsterQty > 1 ? `${monster.name} ${i + 1}` : monster.name,
            hp_current: monster.hp_max,
            hp_max: monster.hp_max,
            ac: monster.ac,
            initiative: 0,
            conditions: [],
            is_active: false,
          });
        }
      } catch (e) { console.error('Failed to fetch monster', e); }
    }

    const res = await fetch('/api/encounters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, combatants }),
    });
    const data = await res.json();
    setActiveEncounterId(data.id);
    fetchEncounters();
  };

  const startCombat = async (id: string) => {
    await fetch(`/api/encounters/${id}/start`, { method: 'POST' });
    fetchEncounters();
  };

  const nextTurn = async (id: string) => {
    await fetch(`/api/encounters/${id}/next-turn`, { method: 'POST' });
    fetchEncounters();
  };

  const endCombat = async (id: string) => {
    await fetch(`/api/encounters/${id}/end`, { method: 'POST' });
    setActiveEncounterId(null);
    fetchEncounters();
  };

  return (
    <div>
      {/* Create new encounter */}
      <div style={{ background: 'var(--parchment-light)', border: '1px solid var(--parchment-dark)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 12 }}>⚔️ 构建遭遇</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input value={newEncounterName} onChange={e => setNewEncounterName(e.target.value)} placeholder="遭遇名称" style={{ flex: 1 }} />
          <button className="btn" onClick={createEncounter}>创建</button>
        </div>

        {/* Select PCs */}
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--ink-light)' }}>选择参战角色：</span>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
            {characters.map(c => (
              <button
                key={c.id}
                className={`dice-btn ${selectedPcs.includes(c.id) ? '' : ''}`}
                style={{
                  background: selectedPcs.includes(c.id) ? 'var(--crimson)' : undefined,
                  color: selectedPcs.includes(c.id) ? 'white' : undefined,
                  fontSize: 11,
                }}
                onClick={() => setSelectedPcs(prev => prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id])}
              >
                {c.first_name}
              </button>
            ))}
          </div>
        </div>

        {/* Add monster */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={selectedMonsterId} onChange={e => setSelectedMonsterId(e.target.value)} placeholder="怪物 ID (如 monster-goblin)" style={{ flex: 1 }} />
          <input type="number" value={monsterQty} onChange={e => setMonsterQty(Number(e.target.value))} min={1} max={20} style={{ width: 60 }} />
          <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>×</span>
        </div>
      </div>

      {/* Active Encounter */}
      {activeEncounter && activeEncounter.status === 'active' && (
        <div style={{ background: 'var(--parchment-light)', border: '2px solid var(--crimson)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--crimson)' }}>
              ⚔️ {activeEncounter.name} — 第 {activeEncounter.round} 轮
            </h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={() => nextTurn(activeEncounter.id)}>下一回合 →</button>
              <button className="btn btn-danger" onClick={() => endCombat(activeEncounter.id)}>结束战斗</button>
            </div>
          </div>

          {/* Combatant list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {activeEncounter.combatants
              .sort((a, b) => b.initiative - a.initiative)
              .map((c, i) => {
                const isActive = i === activeEncounter.turn_index;
                const hpPercent = c.hp_max > 0 ? (c.hp_current / c.hp_max) * 100 : 0;
                return (
                  <div
                    key={c.ref_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 12px',
                      background: isActive ? 'rgba(139,0,0,0.1)' : 'transparent',
                      border: isActive ? '1px solid var(--crimson)' : '1px solid transparent',
                      borderRadius: 6,
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{isActive ? '▶' : '　'}</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, minWidth: 120 }}>
                      {c.type === 'pc' ? '🧑' : '👹'} {c.name}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-faint)' }}>
                      先攻 {c.initiative}
                    </span>
                    <div className="hp-bar" style={{ flex: 1, height: 8 }}>
                      <div
                        className={`hp-bar-fill ${hpPercent > 50 ? 'healthy' : hpPercent > 25 ? 'wounded' : 'critical'}`}
                        style={{ width: `${Math.max(0, hpPercent)}%` }}
                      />
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      {c.hp_current}/{c.hp_max}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)' }}>
                      AC {c.ac}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Encounter history */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, marginBottom: 8, color: 'var(--ink-light)' }}>遭遇记录</h3>
        {encounters.filter(e => e.status === 'prep' || e.status === 'ended').map(e => (
          <div key={e.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--parchment-dark)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13 }}>
              {e.status === 'prep' ? '📋' : '✅'} {e.name}
              <span style={{ color: 'var(--ink-faint)', marginLeft: 8 }}>
                {e.combatants.length} combatants
              </span>
            </span>
            {e.status === 'prep' && (
              <button className="btn" style={{ fontSize: 11 }} onClick={() => startCombat(e.id)}>
                投先攻
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
