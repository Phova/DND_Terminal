import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import LoginScreen from './components/LoginScreen';
import TerminalShell from './components/TerminalShell';
import CharacterPortal from './components/CharacterPortal';
import SpellSlotView from './components/SpellSlotView';
import EquipmentPanel from './components/EquipmentPanel';
import BroadcastDisplay from './components/BroadcastDisplay';

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
  spell_slots: Record<number, { max: number; used: number }>;
  known_spells: string[];
  conditions: string[];
  equipment: Array<{ name: string; quantity: number }>;
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
  const [activeTab, setActiveTab] = useState('sheet');

  useEffect(() => {
    const s = io('/', { transports: ['websocket', 'polling'] });
    s.on('connect', () => console.log('Socket:', s.id));
    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  useEffect(() => {
    if (!socket || !character) return;
    socket.on('character:updated', (data: any) => {
      if (data?.id === character.id) setCharacter(prev => prev ? { ...prev, ...data } : prev);
    });
    socket.on('character:hp_changed', (data: any) => {
      if (data?.characterId === character.id) setCharacter(prev => prev ? { ...prev, hp_current: data.hp_current } : prev);
    });
    return () => {
      socket.off('character:updated');
      socket.off('character:hp_changed');
    };
  }, [socket, character]);

  const handleLogin = async () => {
    setError('');
    try {
      const res = await fetch('/api/characters/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setCharacter(data);
        setLoggedIn(true);
        socket?.emit('player:session_bind', { characterId: data.id });
      } else {
        setError('身份验证失败。请检查你的名字和暗号。');
      }
    } catch { setError('无法连接到冒险者大厅。'); }
  };

  if (!loggedIn) {
    return <LoginScreen
      username={username} password={password}
      onUsernameChange={setUsername} onPasswordChange={setPassword}
      onLogin={handleLogin} error={error}
    />;
  }

  if (!character) return null;
  const c = character;

  return (
    <>
      <TerminalShell
        characterName={`${c.first_name} ${c.last_name}`}
        race={c.race} class_={c.class} level={c.level}
        hpCurrent={c.hp_current} hpMax={c.hp_max} ac={c.ac}
        initiativeBonus={c.initiative_bonus} speed={c.speed}
        passivePerception={c.passive_perception} conditions={c.conditions}
        activeTab={activeTab} onTabChange={setActiveTab}
      >
        {activeTab === 'sheet' && (
          <CharacterPortal
            abilities={c.abilities} race={c.race} class_={c.class}
            level={c.level} title={c.title} languages={c.languages}
            darkvision={c.darkvision} backgroundStory={c.background_story}
          />
        )}
        {activeTab === 'spells' && (
          <SpellSlotView spellSlots={c.spell_slots} knownSpells={c.known_spells} />
        )}
        {activeTab === 'equipment' && (
          <EquipmentPanel equipment={c.equipment} />
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
      </TerminalShell>
      <BroadcastDisplay socket={socket} currentUsername={c.username} />
    </>
  );
}
