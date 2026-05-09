import { Router, Request, Response } from 'express';
import { getDatabase, saveDatabase } from '../db/database';
import { SocketEvent, AppCategory } from '../types';
import { emitSocketEvent } from '../services/socketService';
import { v4 as uuid } from 'uuid';

const router = Router();

// List all apps
router.get('/', (req: Request, res: Response) => {
  const db = getDatabase();
  const category = req.query.category as string | undefined;
  let sql = 'SELECT * FROM apps';
  const params: any[] = [];
  if (category) { sql += ' WHERE category = ?'; params.push(category); }
  sql += ' ORDER BY order_index ASC';

  const result = db.exec(sql, params);
  if (!result[0]) return res.json([]);
  const apps = result[0].values.map((vals: any[]) => {
    const raw: any = {};
    result[0].columns.forEach((c: string, i: number) => { raw[c] = vals[i]; });
    raw.allowed_users = JSON.parse(raw.allowed_users || '[]');
    raw.data = raw.data ? JSON.parse(raw.data) : null;
    return raw;
  });
  res.json(apps);
});

// Create
router.post('/', (req: Request, res: Response) => {
  const db = getDatabase();
  const now = new Date().toISOString();
  const { name, category, allowed_users, data } = req.body;

  if (!name || !category) return res.status(400).json({ error: 'Name and category required' });
  if (!Object.values(AppCategory).includes(category)) return res.status(400).json({ error: 'Invalid category' });

  // Get next order_index
  const countResult = db.exec(`SELECT COUNT(*) as c FROM apps WHERE category = ?`, [category]);
  const nextIndex = (countResult[0]?.values[0]?.[0] || 0);

  const id = uuid();
  db.run(`INSERT INTO apps (id, name, category, allowed_users, data, order_index, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`,
    [id, name, category, JSON.stringify(allowed_users || []), data ? JSON.stringify(data) : null, nextIndex, now, now]);
  saveDatabase();

  const app = { id, name, category, allowed_users: allowed_users || [], data: data || null, order_index: nextIndex };
  emitSocketEvent(SocketEvent.APP_CREATED, app);
  res.status(201).json(app);
});

// Get one
router.get('/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const result = db.exec('SELECT * FROM apps WHERE id = ?', [req.params.id]);
  if (!result[0] || result[0].values.length === 0) return res.status(404).json({ error: 'Not found' });
  const raw: any = {};
  result[0].columns.forEach((c: string, i: number) => { raw[c] = result[0].values[0][i]; });
  raw.allowed_users = JSON.parse(raw.allowed_users || '[]');
  raw.data = raw.data ? JSON.parse(raw.data) : null;
  res.json(raw);
});

// Update
router.patch('/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const existingResult = db.exec('SELECT * FROM apps WHERE id = ?', [req.params.id]);
  if (!existingResult[0] || existingResult[0].values.length === 0) return res.status(404).json({ error: 'Not found' });

  const updates = req.body;
  const setClauses: string[] = [];
  const params: any[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (key === 'id' || key === 'created_at') continue;
    const dbValue = (key === 'allowed_users' || key === 'data') ? JSON.stringify(value) : value;
    setClauses.push(`${key} = ?`);
    params.push(dbValue);
  }
  setClauses.push('updated_at = ?');
  params.push(new Date().toISOString());
  params.push(req.params.id);

  if (setClauses.length > 1) {
    db.run(`UPDATE apps SET ${setClauses.join(', ')} WHERE id = ?`, params);
    saveDatabase();
  }

  const result = db.exec('SELECT * FROM apps WHERE id = ?', [req.params.id]);
  const raw: any = {};
  result[0].columns.forEach((c: string, i: number) => { raw[c] = result[0].values[0][i]; });
  raw.allowed_users = JSON.parse(raw.allowed_users || '[]');
  raw.data = raw.data ? JSON.parse(raw.data) : null;
  emitSocketEvent(SocketEvent.APP_UPDATED, raw);
  res.json(raw);
});

// Delete
router.delete('/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  db.run('DELETE FROM apps WHERE id = ?', [req.params.id]);
  saveDatabase();
  emitSocketEvent(SocketEvent.APP_DELETED, { id: req.params.id });
  res.status(204).send();
});

export default router;
