interface Character {
  id: number;
  first_name: string;
  last_name: string;
  title: string;
  race: string;
  class: string;
  level: number;
  hp_current: number;
  hp_max: number;
  conditions: string[];
}

interface Props {
  characters: Character[];
  onSelect: (id: number) => void;
  selectedId: number | null;
}

export default function PartyBar({ characters, onSelect, selectedId }: Props) {
  return (
    <div className="party-bar">
      <h3>⚔️ 冒险队伍</h3>
      {characters.length === 0 && (
        <p style={{ fontSize: 12, color: 'var(--ink-faint)' }}>尚未创建角色</p>
      )}
      {characters.map(c => {
        const hpPercent = c.hp_max > 0 ? (c.hp_current / c.hp_max) * 100 : 0;
        const hpClass = hpPercent > 50 ? 'healthy' : hpPercent > 25 ? 'wounded' : 'critical';
        return (
          <div key={c.id} className={`party-member ${c.id === selectedId ? 'selected' : ''}`} onClick={() => onSelect(c.id)}>
            <div className="party-member-name">{c.first_name} {c.last_name}</div>
            <div className="party-member-meta">
              {c.race} {c.class} Lv.{c.level} — {c.title}
            </div>
            <div className="party-member-hp">
              <div className="hp-bar">
                <div className={`hp-bar-fill ${hpClass}`} style={{ width: `${Math.max(0, hpPercent)}%` }} />
              </div>
              <div className="party-member-hp-text">{c.hp_current}/{c.hp_max} HP</div>
            </div>
            {c.conditions.length > 0 && (
              <div style={{ fontSize: 10, color: 'var(--danger)', marginTop: 2 }}>
                {c.conditions.join(', ')}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
