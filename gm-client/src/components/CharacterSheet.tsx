import { Socket } from 'socket.io-client';

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

interface Props {
  character: Character;
  onRefresh: () => void;
  socket: Socket | null;
}

const ABILITY_LABELS: Record<string, string> = {
  str: '力量', dex: '敏捷', con: '体质', int: '智力', wis: '感知', cha: '魅力',
};

const SKILL_NAMES: Record<string, string> = {
  acrobatics: '特技', animal_handling: '驯兽', arcana: '奥秘', athletics: '运动',
  deception: '欺瞒', history: '历史', insight: '洞悉', intimidation: '威吓',
  investigation: '调查', medicine: '医药', nature: '自然', perception: '察觉',
  performance: '表演', persuasion: '游说', religion: '宗教', sleight_of_hand: '巧手',
  stealth: '隐匿', survival: '生存',
};

const SKILL_ABILITY: Record<string, string> = {
  acrobatics: 'dex', animal_handling: 'wis', arcana: 'int', athletics: 'str',
  deception: 'cha', history: 'int', insight: 'wis', intimidation: 'cha',
  investigation: 'int', medicine: 'wis', nature: 'int', perception: 'wis',
  performance: 'cha', persuasion: 'cha', religion: 'int', sleight_of_hand: 'dex',
  stealth: 'dex', survival: 'wis',
};

function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

function formatMod(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

async function rollSkill(characterId: number, skill: string, socket: Socket | null): Promise<void> {
  const res = await fetch('/api/dice/roll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      expression: 'd20',
      character_id: characterId,
      skill,
      label: `${SKILL_NAMES[skill] || skill}检定`,
    }),
  });
  const data = await res.json();
  if (socket) {
    socket.emit('dice:rolled', data);
  }
}

export default function CharacterSheet({ character: c, onRefresh, socket }: Props) {
  const hpPercent = c.hp_max > 0 ? (c.hp_current / c.hp_max) * 100 : 0;
  const hpClass = hpPercent > 50 ? 'healthy' : hpPercent > 25 ? 'wounded' : 'critical';

  const handleHpChange = async (delta: number) => {
    const payload = delta < 0 ? { damage: -delta } : { healing: delta };
    await fetch(`/api/characters/${c.id}/hp`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    onRefresh();
  };

  return (
    <div className="char-sheet">
      {/* Header */}
      <div className="char-sheet-header">
        <div>
          <h2 className="char-sheet-name">{c.first_name} {c.last_name}</h2>
          <span className="char-sheet-meta">
            {c.race} {c.class} Lv.{c.level} — {c.title}
          </span>
        </div>
        <div>
          <button className="btn" onClick={() => handleHpChange(1)}>+1 HP</button>
          <button className="btn btn-danger" onClick={() => handleHpChange(-1)} style={{ marginLeft: 4 }}>-1 HP</button>
        </div>
      </div>

      {/* Abilities */}
      <div className="char-abilities">
        {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map(key => (
          <div className="ability-box" key={key}>
            <div className="ability-label">{ABILITY_LABELS[key] || key}</div>
            <div className="ability-score">{c.abilities[key] ?? 10}</div>
            <div className="ability-mod">{formatMod(abilityMod(c.abilities[key] ?? 10))}</div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="char-stats">
        <span className="stat-pill">HP ▸ <strong>{c.hp_current}/{c.hp_max}</strong></span>
        <span className="stat-pill">AC ▸ <strong>{c.ac}</strong></span>
        <span className="stat-pill">先攻 ▸ <strong>{formatMod(c.initiative_bonus)}</strong></span>
        <span className="stat-pill">速度 ▸ <strong>{c.speed}ft</strong></span>
        <span className="stat-pill">察觉 ▸ <strong>{c.passive_perception}</strong></span>
        {c.darkvision > 0 && <span className="stat-pill">黑暗视觉 ▸ <strong>{c.darkvision}ft</strong></span>}
      </div>

      {/* HP Bar */}
      <div className="hp-bar" style={{ height: 10, marginBottom: 12 }}>
        <div className={`hp-bar-fill ${hpClass}`} style={{ width: `${Math.max(0, hpPercent)}%` }} />
      </div>

      {/* Skills */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, marginBottom: 8 }}>技能</h3>
        <div className="char-skills">
          {Object.entries(SKILL_NAMES).map(([key, name]) => {
            const isProf = c.skill_proficiencies?.includes(key);
            const ability = SKILL_ABILITY[key] || 'int';
            const score = c.abilities[ability] ?? 10;
            const mod = abilityMod(score) + (isProf ? Math.floor((c.level - 1) / 4) + 2 : 0);
            return (
              <div key={key} className={`skill-row ${isProf ? 'proficient' : ''}`} onClick={() => rollSkill(c.id, key, socket)} style={{ cursor: 'pointer' }} title="点击进行技能检定">
                <span>{isProf ? '● ' : '○ '}{name}</span>
                <span className="skill-mod">{formatMod(mod)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spell Slots */}
      {c.spell_slots && Object.keys(c.spell_slots).length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, marginBottom: 4 }}>法术位</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {Object.entries(c.spell_slots).map(([level, slots]) => (
              <span key={level} className="stat-pill">
                Lv{level} ▸ <strong>{slots.max - slots.used}/{slots.max}</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Conditions */}
      {c.conditions && c.conditions.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <span style={{ color: 'var(--danger)', fontFamily: 'var(--font-display)' }}>
            状态: {c.conditions.join(', ')}
          </span>
        </div>
      )}

      {/* Background */}
      {c.background_story && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, marginBottom: 4 }}>背景故事</h3>
          <p style={{ fontSize: 13, color: 'var(--ink-light)', lineHeight: 1.6 }}>{c.background_story}</p>
        </div>
      )}
    </div>
  );
}
