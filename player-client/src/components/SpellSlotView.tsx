interface Props {
  spellSlots: Record<number, { max: number; used: number }>;
  knownSpells: string[];
}

export default function SpellSlotView({ spellSlots, knownSpells }: Props) {
  return (
    <div className="player-spells">
      {spellSlots && Object.keys(spellSlots).length > 0 ? (
        <div>
          <div className="player-spell-slots">
            {Object.entries(spellSlots).map(([level, slots]) => (
              <span key={level} className="player-slot">
                {level}环: {'●'.repeat(Math.max(0, slots.max - slots.used))}{'○'.repeat(slots.used)}
              </span>
            ))}
          </div>
          <h4 style={{ marginTop: 16, fontFamily: 'var(--font-display)' }}>已知法术</h4>
          <ul className="player-spell-list">
            {knownSpells?.map(s => <li key={s}>{s}</li>)}
          </ul>
        </div>
      ) : (
        <p className="dm-hint">你的角色尚未掌握法术。</p>
      )}
    </div>
  );
}
