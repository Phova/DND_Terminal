import { Router, Request, Response } from 'express';
import { getDatabase } from '../db/database';

const router = Router();

// List/search spells
router.get('/', (req: Request, res: Response) => {
  const db = getDatabase();
  const { search, level, school, class: className, limit } = req.query;
  let sql = 'SELECT * FROM spells WHERE 1=1';
  const params: any[] = [];

  if (search) { sql += ' AND name LIKE ?'; params.push(`%${search}%`); }
  if (level !== undefined) { sql += ' AND level = ?'; params.push(Number(level)); }
  if (school) { sql += ' AND school = ?'; params.push(school); }
  if (className) { sql += ' AND classes LIKE ?'; params.push(`%${className}%`); }
  sql += ' ORDER BY level ASC, name ASC';
  if (limit) { sql += ' LIMIT ?'; params.push(Number(limit)); }

  const result = db.exec(sql, params);
  if (!result[0]) return res.json([]);

  const spells = result[0].values.map((vals: any[]) => {
    const raw: any = {};
    result[0].columns.forEach((c: string, i: number) => { raw[c] = vals[i]; });
    raw.classes = JSON.parse(raw.classes || '[]');
    raw.concentration = !!raw.concentration;
    raw.ritual = !!raw.ritual;
    return raw;
  });
  res.json(spells);
});

// Get one
router.get('/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const result = db.exec('SELECT * FROM spells WHERE id = ?', [req.params.id]);
  if (!result[0] || result[0].values.length === 0) return res.status(404).json({ error: 'Not found' });
  const raw: any = {};
  result[0].columns.forEach((c: string, i: number) => { raw[c] = result[0].values[0][i]; });
  raw.classes = JSON.parse(raw.classes || '[]');
  raw.concentration = !!raw.concentration;
  raw.ritual = !!raw.ritual;
  res.json(raw);
});

export default router;
