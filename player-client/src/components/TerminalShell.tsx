interface Props {
  characterName: string;
  race: string;
  class_: string;
  level: number;
  hpCurrent: number;
  hpMax: number;
  ac: number;
  initiativeBonus: number;
  speed: number;
  passivePerception: number;
  conditions: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

function formatMod(n: number) { return n >= 0 ? `+${n}` : `${n}`; }

const TABS = [
  { key: 'sheet', label: '📜 角色' },
  { key: 'spells', label: '✨ 法术' },
  { key: 'equipment', label: '🎒 装备' },
  { key: 'log', label: '📖 日志' },
];

export default function TerminalShell({
  characterName, race, class_, level, hpCurrent, hpMax, ac,
  initiativeBonus, speed, passivePerception, conditions,
  activeTab, onTabChange, children,
}: Props) {
  const hpPercent = hpMax > 0 ? (hpCurrent / hpMax) * 100 : 0;

  return (
    <div className="terminal-screen">
      <header className="terminal-header">
        <div className="terminal-brand">⚔ DRAGONTAIL</div>
        <div className="terminal-char">{characterName} — {race} {class_} Lv.{level}</div>
      </header>

      <div className="terminal-stats">
        <span className="tstat">❤️ {hpCurrent}/{hpMax}</span>
        <span className="tstat">🛡️ {ac}</span>
        <span className="tstat">⚡ {formatMod(initiativeBonus)}</span>
        <span className="tstat">👁️ {passivePerception}</span>
        <span className="tstat">🏃 {speed}ft</span>
        {conditions.length > 0 && (
          <span className="tstat" style={{ color: '#ff4444' }}>⚠️ {conditions.join(', ')}</span>
        )}
      </div>

      <div className="terminal-hp-bar">
        <div className={`terminal-hp-fill ${hpPercent > 50 ? 'healthy' : hpPercent > 25 ? 'wounded' : 'critical'}`}
          style={{ width: `${Math.max(0, hpPercent)}%` }} />
      </div>

      <nav className="terminal-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`terminal-tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => onTabChange(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="terminal-content">{children}</main>

      <footer className="terminal-footer">
        <span>⚜ {characterName} ⚜</span>
      </footer>
    </div>
  );
}
