import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import CharacterSheet from './components/CharacterSheet';
import DiceRoller from './components/DiceRoller';
import MonsterPanel from './components/MonsterPanel';
import SpellBook from './components/SpellBook';
import PartyBar from './components/PartyBar';
import InitiativeTracker from './components/InitiativeTracker';
import MessageHub from './components/MessageHub';
import BroadcastView from './components/BroadcastView';
import GameClock from './components/GameClock';

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
  skill_proficiencies: string[];
  spell_slots: Record<number, { max: number; used: number }>;
  known_spells: string[];
  conditions: string[];
  background_story?: string;
  personality?: string;
}

type DMView = 'party' | 'characters' | 'monsters' | 'spells' | 'encounters' | 'messages' | 'broadcast' | 'apps';

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharId, setSelectedCharId] = useState<number | null>(null);
  const [view, setView] = useState<DMView>('party');

  useEffect(() => {
    const s = io('/', { transports: ['websocket', 'polling'] });
    s.on('connect', () => console.log('Socket connected:', s.id));
    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  const fetchCharacters = useCallback(async () => {
    try {
      const res = await fetch('/api/characters');
      const data = await res.json();
      setCharacters(data);
    } catch (e) { console.error('Failed to fetch characters', e); }
  }, []);

  useEffect(() => { fetchCharacters(); }, [fetchCharacters]);

  useEffect(() => {
    if (!socket) return;
    const handlers: Record<string, (...args: any[]) => void> = {
      'character:created': () => fetchCharacters(),
      'character:updated': () => fetchCharacters(),
      'character:deleted': () => fetchCharacters(),
      'character:hp_changed': (data: any) => {
        setCharacters(prev => prev.map(c =>
          c.id === data.characterId ? { ...c, hp_current: data.hp_current } : c
        ));
      },
    };
    for (const [event, handler] of Object.entries(handlers)) socket.on(event, handler);
    return () => { for (const event of Object.keys(handlers)) socket.off(event); };
  }, [socket, fetchCharacters]);

  const selected = characters.find(c => c.id === selectedCharId) || null;

  return (
    <div className="dm-screen">
      <header className="dm-header">
        <div className="dm-brand">
          <h1 className="dm-title">Dragontail</h1>
          <span className="dm-subtitle">地下城主帷幕</span>
        </div>
        <GameClock />
        <nav className="dm-nav">
          {(['party', 'characters', 'monsters', 'spells', 'encounters', 'messages', 'broadcast', 'apps'] as DMView[]).map(v => (
            <button
              key={v}
              className={`dm-nav-btn ${view === v ? 'active' : ''}`}
              onClick={() => setView(v)}
            >
              {{
                party: '队伍', characters: '角色卡', monsters: '怪物',
                spells: '法术', encounters: '遭遇', messages: '传讯', broadcast: '广播', apps: '卷轴'
              }[v]}
            </button>
          ))}
        </nav>
      </header>

      <div className="dm-main">
        <aside className="dm-sidebar">
          <PartyBar characters={characters} onSelect={setSelectedCharId} selectedId={selectedCharId} />
        </aside>

        <main className="dm-content">
          {view === 'party' && (
            <div className="dm-welcome">
              <h2>欢迎，地下城主</h2>
              <p>选择一个角色卡或开始构建遭遇。</p>
              <DiceRoller socket={socket} character={selected} />
            </div>
          )}
          {view === 'characters' && (
            selected ? <CharacterSheet character={selected} onRefresh={fetchCharacters} socket={socket} />
            : <p className="dm-hint">从左侧队伍栏选择一个角色</p>
          )}
          {view === 'monsters' && <MonsterPanel />}
          {view === 'spells' && <SpellBook />}
          {view === 'encounters' && (
            <InitiativeTracker socket={socket} characters={characters} />
          )}
          {view === 'messages' && (
            <MessageHub socket={socket} characters={characters} />
          )}
          {view === 'broadcast' && (
            <BroadcastView socket={socket} characters={characters} />
          )}
          {view === 'apps' && (
            <div className="dm-placeholder">📜 卷轴管理 — 即将到来</div>
          )}
        </main>
      </div>
    </div>
  );
}
