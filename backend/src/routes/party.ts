import { Router, Request, Response } from 'express';
import { getDatabase, saveDatabase } from '../db/database';
import { v4 as uuid } from 'uuid';

const router = Router();

// List all parties
router.get('/', (_req: Request, res: Response) => {
  const db = getDatabase();
  const result = db.exec('SELECT * FROM parties');
  if (!result[0]) return res.json([]);
  const parties = result[0].values.map((vals: any[]) => {
    const raw: any = {};
    result[0].columns.forEach((c: string, i: number) => { raw[c] = vals[i]; });
    raw.member_ids = JSON.parse(raw.member_ids || '[]');
    return raw;
  });
  res.json(parties);
});

// Create
router.post('/', (req: Request, res: Response) => {
  const db = getDatabase();
  const now = new Date().toISOString();
  const id = uuid();
  db.run('INSERT INTO parties (id, name, member_ids, notes, created_at, updated_at) VALUES (?,?,?,?,?,?)',
    [id, req.body.name || '冒险小队', JSON.stringify(req.body.member_ids || []), req.body.notes || '', now, now]);
  saveDatabase();
  res.status(201).json({ id, name: req.body.name, member_ids: req.body.member_ids || [] });
});

// Get one
router.get('/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const result = db.exec('SELECT * FROM parties WHERE id = ?', [req.params.id]);
  if (!result[0] || result[0].values.length === 0) return res.status(404).json({ error: 'Not found' });
  const raw: any = {};
  result[0].columns.forEach((c: string, i: number) => { raw[c] = result[0].values[0][i]; });
  raw.member_ids = JSON.parse(raw.member_ids || '[]');
  res.json(raw);
});

export default router;
