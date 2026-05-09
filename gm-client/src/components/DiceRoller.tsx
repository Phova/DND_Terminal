import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface Character {
  id: number;
  abilities: Record<string, number>;
  skill_proficiencies: string[];
  level: number;
}

interface Props {
  socket: Socket | null;
  character: Character | null;
}

const DICE = [4, 6, 8, 10, 12, 20, 100];

export default function DiceRoller({ socket, character: c }: Props) {
  const [results, setResults] = useState<any[]>([]);
  const [expression, setExpression] = useState('d20');

  useEffect(() => {
    if (!socket) return;
    const handler = (data: any) => {
      setResults(prev => [data, ...prev].slice(0, 20));
    };
    socket.on('dice:rolled', handler);
    socket.on('dice:rolled_private', handler);
    return () => {
      socket.off('dice:rolled', handler);
      socket.off('dice:rolled_private', handler);
    };
  }, [socket]);

  const roll = async (expr: string) => {
    const body: any = { expression: expr };
    if (c) { body.character_id = c.id; }
    const res = await fetch('/api/dice/roll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    // Broadcast via socket
    if (socket) { socket.emit('dice:rolled', data); }
  };

  const rollCustom = () => {
    if (expression.trim()) roll(expression.trim());
  };

  return (
    <div className="dice-roller">
      <h3>🎲 骰子投掷</h3>
      <div className="dice-buttons">
        {DICE.map(sides => (
          <button key={sides} className="dice-btn" onClick={() => roll(`d${sides}`)}>
            d{sides}
          </button>
        ))}
        <button className="dice-btn" onClick={() => roll('adv d20')}>优势</button>
        <button className="dice-btn" onClick={() => roll('dis d20')}>劣势</button>
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
        <input
          value={expression}
          onChange={e => setExpression(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && rollCustom()}
          placeholder="2d6+3..."
          style={{ flex: 1 }}
        />
        <button className="btn" onClick={rollCustom}>投掷</button>
      </div>

      {results.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {results.slice(0, 8).map((r, i) => (
            <div key={i} className="dice-result" style={{ marginTop: i > 0 ? 4 : 0 }}>
              <span style={{ color: 'var(--ink-faint)' }}>
                {r.label || r.expression}
                {r.advantage ? ' [优势]' : ''}{r.disadvantage ? ' [劣势]' : ''}
              </span>
              <span style={{ marginLeft: 12, fontFamily: 'var(--font-mono)' }}>
                骰值: [{r.rolls?.join(', ')}] + {r.modifier}
              </span>
              <span className="dice-total" style={{ marginLeft: 12 }}>
                = {r.total}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
