import { Router, Request, Response } from 'express';
import { getDatabase } from '../db/database';

const router = Router();

// List/search monsters
router.get('/', (req: Request, res: Response) => {
  const db = getDatabase();
  const { search, type, cr_min, cr_max, limit } = req.query;

  let sql = 'SELECT * FROM monsters WHERE 1=1';
  const params: any[] = [];

  if (search) { sql += ' AND name LIKE ?'; params.push(`%${search}%`); }
  if (type) { sql += ' AND type = ?'; params.push(type); }
  if (cr_min) { sql += ' AND cr >= ?'; params.push(Number(cr_min)); }
  if (cr_max) { sql += ' AND cr <= ?'; params.push(Number(cr_max)); }
  sql += ' ORDER BY cr ASC';
  if (limit) { sql += ' LIMIT ?'; params.push(Number(limit)); }

  const result = db.exec(sql, params);
  if (!result[0]) return res.json([]);

  const monsters = result[0].values.map((vals: any[]) => {
    const raw: any = {};
    result[0].columns.forEach((c: string, i: number) => { raw[c] = vals[i]; });
    raw.abilities = JSON.parse(raw.abilities || '{}');
    raw.speed = JSON.parse(raw.speed || '{}');
    raw.traits = JSON.parse(raw.traits || '[]');
    raw.actions = JSON.parse(raw.actions || '[]');
    raw.legendary_actions = JSON.parse(raw.legendary_actions || '[]');
    raw.lair_actions = JSON.parse(raw.lair_actions || '[]');
    return raw;
  });
  res.json(monsters);
});

// Get one
router.get('/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const result = db.exec('SELECT * FROM monsters WHERE id = ?', [req.params.id]);
  if (!result[0] || result[0].values.length === 0) return res.status(404).json({ error: 'Not found' });
  const raw: any = {};
  result[0].columns.forEach((c: string, i: number) => { raw[c] = result[0].values[0][i]; });
  raw.abilities = JSON.parse(raw.abilities || '{}');
  raw.speed = JSON.parse(raw.speed || '{}');
  raw.traits = JSON.parse(raw.traits || '[]');
  raw.actions = JSON.parse(raw.actions || '[]');
  raw.legendary_actions = JSON.parse(raw.legendary_actions || '[]');
  raw.lair_actions = JSON.parse(raw.lair_actions || '[]');
  res.json(raw);
});

export default router;
