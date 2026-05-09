import { Router, Request, Response } from 'express';
import { getDatabase, saveDatabase } from '../db/database';
import { SocketEvent, Combatant } from '../types';
import { emitSocketEvent } from '../services/socketService';
import { v4 as uuid } from 'uuid';

const router = Router();

// List encounters
router.get('/', (_req: Request, res: Response) => {
  const db = getDatabase();
  const result = db.exec('SELECT * FROM encounters ORDER BY created_at DESC');
  if (!result[0]) return res.json([]);
  const encounters = result[0].values.map((vals: any[]) => {
    const raw: any = {};
    result[0].columns.forEach((c: string, i: number) => { raw[c] = vals[i]; });
    raw.combatants = JSON.parse(raw.combatants || '[]');
    return raw;
  });
  res.json(encounters);
});

// Create
router.post('/', (req: Request, res: Response) => {
  const db = getDatabase();
  const now = new Date().toISOString();
  const id = uuid();
  db.run('INSERT INTO encounters (id, name, combatants, round, turn_index, status, notes, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)',
    [id, req.body.name || '遭遇', JSON.stringify(req.body.combatants || []), 0, 0, 'prep', req.body.notes || '', now, now]);
  saveDatabase();
  res.status(201).json({ id, name: req.body.name, status: 'prep' });
});

// Start combat — roll initiative
router.post('/:id/start', (req: Request, res: Response) => {
  const db = getDatabase();
  const result = db.exec('SELECT * FROM encounters WHERE id = ?', [req.params.id]);
  if (!result[0] || result[0].values.length === 0) return res.status(404).json({ error: 'Not found' });

  const raw: any = {};
  result[0].columns.forEach((c: string, i: number) => { raw[c] = result[0].values[0][i]; });
  let combatants: Combatant[] = JSON.parse(raw.combatants || '[]');

  // Roll initiative for each combatant
  combatants = combatants.map((c: Combatant) => ({
    ...c,
    initiative: Math.floor(Math.random() * 20) + 1 + (c.initiative || 0),
  }));
  // Sort by initiative descending
  combatants.sort((a, b) => b.initiative - a.initiative);

  db.run('UPDATE encounters SET combatants = ?, round = 1, turn_index = 0, status = ?, updated_at = ? WHERE id = ?',
    [JSON.stringify(combatants), 'active', new Date().toISOString(), req.params.id]);
  saveDatabase();

  const encounter = { ...raw, combatants, round: 1, turn_index: 0, status: 'active' };
  emitSocketEvent(SocketEvent.ENCOUNTER_STARTED, encounter);
  emitSocketEvent(SocketEvent.ENCOUNTER_TURN_ADVANCED, {
    encounterId: req.params.id,
    round: 1,
    turn_index: 0,
    activeCombatant: combatants[0],
  });
  res.json(encounter);
});

// Next turn
router.post('/:id/next-turn', (req: Request, res: Response) => {
  const db = getDatabase();
  const result = db.exec('SELECT * FROM encounters WHERE id = ?', [req.params.id]);
  if (!result[0] || result[0].values.length === 0) return res.status(404).json({ error: 'Not found' });
  const raw: any = {};
  result[0].columns.forEach((c: string, i: number) => { raw[c] = result[0].values[0][i]; });
  const combatants: Combatant[] = JSON.parse(raw.combatants || '[]');
  let round = raw.round;
  let turnIndex = raw.turn_index + 1;

  if (turnIndex >= combatants.length) {
    turnIndex = 0;
    round++;
  }

  db.run('UPDATE encounters SET round = ?, turn_index = ?, updated_at = ? WHERE id = ?',
    [round, turnIndex, new Date().toISOString(), req.params.id]);
  saveDatabase();

  emitSocketEvent(SocketEvent.ENCOUNTER_TURN_ADVANCED, {
    encounterId: req.params.id,
    round,
    turn_index: turnIndex,
    activeCombatant: combatants[turnIndex],
  });
  res.json({ round, turn_index: turnIndex, activeCombatant: combatants[turnIndex] });
});

// End encounter
router.post('/:id/end', (req: Request, res: Response) => {
  const db = getDatabase();
  db.run('UPDATE encounters SET status = ?, updated_at = ? WHERE id = ?', ['ended', new Date().toISOString(), req.params.id]);
  saveDatabase();
  emitSocketEvent(SocketEvent.ENCOUNTER_ENDED, { encounterId: req.params.id });
  res.json({ status: 'ended' });
});

export default router;
