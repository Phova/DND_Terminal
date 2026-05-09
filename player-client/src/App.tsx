import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface Character {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  title: string;
  race: string;
  class: string;
  level: number;
  abilities: Record<string, number>;
  hp_current: number;
  hp_max: number;
  ac: number;
  initiative_bonus: number;
  speed: number;
  darkvision: number;
  passive_perception: number;
  skill_proficiencies: string[];
  saving_throw_proficiencies: string[];
  spell_slots: Record<number, { max: number; used: number }>;
  known_spells: string[];
  conditions: string[];
  equipment: any[];
  background_story?: string;
  personality?: string;
  languages: string[];
  features: string[];
  traits: string[];
}

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [character, setCharacter] = useState<Character | null>(null);
  const [username, setUsername] = useState('gandalf');
  const [password, setPassword] = useState('greyhame');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'sheet' | 'spells' | 'equipment' | 'log'>('sheet');

  // Connect to Socket.IO
  useEffect(() => {
    const s = io('/', { transports: ['websocket', 'polling'] });
    s.on('connect', () => console.log('Socket connected:', s.id));
    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket || !character) return;
    const handlers: Record<string, (...args: any[]) => void> = {
      'character:updated': (data: any) => {
        if (data && data.id === character.id) {
          setCharacter(prev => prev ? { ...prev, ...data } : prev);
        }
      },
      'character:hp_changed': (data: any) => {
        if (data && data.characterId === character.id) {
          setCharacter(prev => prev ? { ...prev, hp_current: data.hp_current } : prev);
        }
      },
    };
    for (const [event, handler] of Object.entries(handlers)) {
      socket.on(event, handler);
    }
    return () => {
      for (const event of Object.keys(handlers)) {
        socket.off(event);
      }
    };
  }, [socket, character]);

  const handleLogin = async () => {
    setError('');
    try {
      const res = await fetch('/api/characters/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setCharacter(data);
        setLoggedIn(true);
        if (socket) {
          socket.emit('player:session_bind', { characterId: data.id });
        }
      } else {
        setError('身份验证失败。请检查你的名字和暗号。');
      }
    } catch {
      setError('无法连接到冒险者大厅。');
    }
  };

  const abilityMod = (score: number) => Math.floor((score - 10) / 2);
  const formatMod = (n: number) => n >= 0 ? `+${n}` : `${n}`;

  // ---- Login Screen ----
  if (!loggedIn) {
    return (
      <div className="terminal-screen">
        <div className="login-container">
          <div className="login-runes">✦ ✦ ✦</div>
          <h1 className="login-title">DRAGONTAIL</h1>
          <p className="login-subtitle">越过龙脊山脉，踏入未知领域...</p>
          <div className="login-form">
            <input
              className="login-input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="冒险者之名"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              autoFocus
            />
            <input
              className="login-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="暗号"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
            <button className="login-btn" onClick={handleLogin}>
              踏入冒险
            </button>
            {error && <p className="login-error">{error}</p>}
          </div>
          <div className="login-runes">✧ ✧ ✧</div>
        </div>
      </div>
    );
  }

  // ---- Terminal Screen ----
  if (!character) return null;
  const c = character;
  const hpPercent = c.hp_max > 0 ? (c.hp_current / c.hp_max) * 100 : 0;

  return (
    <div className="terminal-screen">
      {/* Top Bar */}
      <header className="terminal-header">
        <div className="terminal-brand">⚔ DRAGONTAIL</div>
        <div className="terminal-char">
          {c.first_name} {c.last_name} — {c.race} {c.class} Lv.{c.level}
        </div>
      </header>

      {/* Stats Bar */}
      <div className="terminal-stats">
        <span className="tstat">❤️ {c.hp_current}/{c.hp_max}</span>
        <span className="tstat">🛡️ {c.ac}</span>
        <span className="tstat">⚡ {formatMod(c.initiative_bonus)}</span>
        <span className="tstat">👁️ {c.passive_perception}</span>
        <span className="tstat">🏃 {c.speed}ft</span>
        {c.conditions.length > 0 && (
          <span className="tstat" style={{ color: '#ff4444' }}>⚠️ {c.conditions.join(', ')}</span>
        )}
      </div>

      {/* HP Bar */}
      <div className="terminal-hp-bar">
        <div className={`terminal-hp-fill ${hpPercent > 50 ? 'healthy' : hpPercent > 25 ? 'wounded' : 'critical'}`}
          style={{ width: `${Math.max(0, hpPercent)}%` }} />
      </div>

      {/* Tabs */}
      <nav className="terminal-tabs">
        {(['sheet', 'spells', 'equipment', 'log'] as const).map(t => (
          <button key={t} className={`terminal-tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {{ sheet: '📜 角色', spells: '✨ 法术', equipment: '🎒 装备', log: '📖 日志' }[t]}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <main className="terminal-content">
        {activeTab === 'sheet' && (
          <div className="player-sheet">
            <div className="player-abilities">
              {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map(key => (
                <div className="player-ability" key={key}>
                  <span className="player-ability-label">
                    {{ str: '力量', dex: '敏捷', con: '体质', int: '智力', wis: '感知', cha: '魅力' }[key]}
                  </span>
                  <span className="player-ability-score">{c.abilities[key] ?? 10}</span>
                  <span className="player-ability-mod">{formatMod(abilityMod(c.abilities[key] ?? 10))}</span>
                </div>
              ))}
            </div>
            <div className="player-info">
              <p><strong>种族：</strong>{c.race}</p>
              <p><strong>职业：</strong>{c.class} Lv.{c.level}</p>
              <p><strong>头衔：</strong>{c.title}</p>
              <p><strong>语言：</strong>{c.languages?.join(', ')}</p>
              {c.darkvision > 0 && <p><strong>黑暗视觉：</strong>{c.darkvision}ft</p>}
            </div>
            {c.background_story && (
              <div className="player-story">
                <h4>背景故事</h4>
                <p>{c.background_story}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'spells' && (
          <div className="player-spells">
            {c.spell_slots && Object.keys(c.spell_slots).length > 0 ? (
              <div>
                <div className="player-spell-slots">
                  {Object.entries(c.spell_slots).map(([level, slots]) => (
                    <span key={level} className="player-slot">
                      {level}环: {'●'.repeat(Math.max(0, slots.max - slots.used))}{'○'.repeat(slots.used)}
                    </span>
                  ))}
                </div>
                <h4 style={{ marginTop: 16, fontFamily: 'var(--font-display)' }}>已知法术</h4>
                <ul className="player-spell-list">
                  {c.known_spells?.map(s => <li key={s}>{s}</li>)}
                </ul>
              </div>
            ) : (
              <p className="dm-hint">你的角色尚未掌握法术。</p>
            )}
          </div>
        )}

        {activeTab === 'equipment' && (
          <div className="player-equipment">
            <h4>装备与物品</h4>
            {c.equipment && c.equipment.length > 0 ? (
              <ul className="player-item-list">
                {c.equipment.map((item: any, i: number) => (
                  <li key={i}>{item.name} {item.quantity > 1 ? `×${item.quantity}` : ''}</li>
                ))}
              </ul>
            ) : (
              <p className="dm-hint">行囊空空如也。</p>
            )}
          </div>
        )}

        {activeTab === 'log' && (
          <div className="player-log">
            <h4>冒险日志</h4>
            <p className="dm-hint">深渊在凝视着你。</p>
            <p style={{ color: 'var(--ink-light)', fontSize: 13, marginTop: 16 }}>
              {c.personality || '你的故事尚未书写...'}
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="terminal-footer">
        <span>⚜ {c.title} ⚜</span>
      </footer>
    </div>
  );
}
