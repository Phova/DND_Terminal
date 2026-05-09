interface Props {
  abilities: Record<string, number>;
  race: string;
  class_: string;
  level: number;
  title: string;
  languages: string[];
  darkvision: number;
  backgroundStory?: string;
}

const ABILITY_LABELS: Record<string, string> = {
  str: '力量', dex: '敏捷', con: '体质', int: '智力', wis: '感知', cha: '魅力',
};

function abilityMod(score: number) { return Math.floor((score - 10) / 2); }
function formatMod(n: number) { return n >= 0 ? `+${n}` : `${n}`; }

export default function CharacterPortal({ abilities, race, class_, level, title, languages, darkvision, backgroundStory }: Props) {
  return (
    <div className="player-sheet">
      <div className="player-abilities">
        {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map(key => (
          <div className="player-ability" key={key}>
            <span className="player-ability-label">{ABILITY_LABELS[key]}</span>
            <span className="player-ability-score">{abilities[key] ?? 10}</span>
            <span className="player-ability-mod">{formatMod(abilityMod(abilities[key] ?? 10))}</span>
          </div>
        ))}
      </div>
      <div className="player-info">
        <p><strong>种族：</strong>{race}</p>
        <p><strong>职业：</strong>{class_} Lv.{level}</p>
        <p><strong>头衔：</strong>{title}</p>
        <p><strong>语言：</strong>{languages?.join(', ') || '通用语'}</p>
        {darkvision > 0 && <p><strong>黑暗视觉：</strong>{darkvision}ft</p>}
      </div>
      {backgroundStory && (
        <div className="player-story">
          <h4>背景故事</h4>
          <p>{backgroundStory}</p>
        </div>
      )}
    </div>
  );
}
