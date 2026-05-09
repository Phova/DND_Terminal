import { Router, Request, Response } from 'express';
import { DiceRollRequest, DiceRollResult, SKILL_ABILITY_MAP, Skill, SocketEvent } from '../types';
import { emitSocketEvent } from '../services/socketService';
import { getDatabase } from '../db/database';

const router = Router();

function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

function proficiencyBonus(level: number): number {
  return Math.floor((level - 1) / 4) + 2;
}

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

function parseExpression(expr: string): { count: number; sides: number; modifier: number; advantage?: boolean; disadvantage?: boolean } {
  let advantage: boolean | undefined;
  let disadvantage: boolean | undefined;
  let clean = expr.toLowerCase().trim();

  if (clean.startsWith('adv ')) { advantage = true; clean = clean.slice(4); }
  else if (clean.startsWith('dis ')) { disadvantage = true; clean = clean.slice(4); }

  // Match patterns like "2d6+3", "d20", "4d6k3"
  const keepHighMatch = clean.match(/^(\d+)d(\d+)k(\d+)$/);
  if (keepHighMatch) {
    return { count: Number(keepHighMatch[1]), sides: Number(keepHighMatch[2]), modifier: 0, advantage, disadvantage };
  }

  const match = clean.match(/^(\d+)?d(\d+)([+-]\d+)?$/);
  if (match) {
    return {
      count: Number(match[1] || 1),
      sides: Number(match[2]),
      modifier: match[3] ? Number(match[3]) : 0,
      advantage,
      disadvantage,
    };
  }

  // Fallback: treat as d20
  return { count: 1, sides: 20, modifier: 0, advantage, disadvantage };
}

// Roll dice
router.post('/roll', (req: Request, res: Response) => {
  try {
    const { expression, character_id, skill, label, private: isPrivate } = req.body as DiceRollRequest;

    if (!expression) {
      return res.status(400).json({ error: 'Expression required' });
    }

    let parsed = parseExpression(expression);
    let totalModifier = parsed.modifier;
    const rolls: number[] = [];

    // Handle advantage/disadvantage for d20
    if ((parsed.advantage || parsed.disadvantage) && parsed.sides === 20) {
      const r1 = rollDie(20);
      const r2 = rollDie(20);
      rolls.push(r1, r2);
      if (parsed.advantage) {
        totalModifier += Math.max(r1, r2);
      } else {
        totalModifier += Math.min(r1, r2);
      }
    } else {
      for (let i = 0; i < parsed.count; i++) {
        rolls.push(rollDie(parsed.sides));
      }
      totalModifier += rolls.reduce((a, b) => a + b, 0);
    }

    // If character_id + skill, add ability mod + proficiency
    if (character_id && skill) {
      try {
        const db = getDatabase();
        const result = db.exec('SELECT abilities, skill_proficiencies, level FROM characters WHERE id = ?', [character_id]);
        if (result[0] && result[0].values.length > 0) {
          const raw: any = {};
          result[0].columns.forEach((c: string, i: number) => { raw[c] = result[0].values[0][i]; });
          const abilities = JSON.parse(raw.abilities || '{}');
          const skillProfs: Skill[] = JSON.parse(raw.skill_proficiencies || '[]');
          const level = raw.level || 1;

          const abilityKey = SKILL_ABILITY_MAP[skill as Skill];
          if (abilityKey && abilities[abilityKey] !== undefined) {
            totalModifier += abilityMod(abilities[abilityKey]);
          }
          if (skillProfs.includes(skill as Skill)) {
            totalModifier += proficiencyBonus(level);
          }
        }
      } catch (e) {
        // Character lookup failed, continue without modifiers
      }
    }

    const result: DiceRollResult = {
      expression,
      label,
      rolls,
      modifier: parsed.modifier,
      total: totalModifier,
      advantage: parsed.advantage,
      disadvantage: parsed.disadvantage,
      timestamp: Date.now(),
      character_id,
      skill,
      private: isPrivate,
    };

    if (isPrivate) {
      emitSocketEvent(SocketEvent.DICE_ROLLED_PRIVATE, result);
    } else {
      emitSocketEvent(SocketEvent.DICE_ROLLED, result);
    }

    res.json(result);
  } catch (error) {
    console.error('Dice roll error:', error);
    res.status(500).json({ error: 'Dice roll failed' });
  }
});

export default router;
