import { Router, Request, Response } from 'express';
import { getDatabase, saveDatabase } from '../db/database';
import { SocketEvent } from '../types';
import { emitSocketEvent } from '../services/socketService';

const router = Router();

// Get all settings
router.get('/', (_req: Request, res: Response) => {
  const db = getDatabase();
  const result = db.exec('SELECT key, value FROM settings');
  if (!result[0]) return res.json({});
  const settings: Record<string, string> = {};
  for (const row of result[0].values) {
    settings[row[0] as string] = row[1] as string;
  }
  res.json(settings);
});

// Get one setting
router.get('/:key', (req: Request, res: Response) => {
  const db = getDatabase();
  const result = db.exec('SELECT value FROM settings WHERE key = ?', [req.params.key]);
  if (!result[0] || result[0].values.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ key: req.params.key, value: result[0].values[0][0] });
});

// Set a setting
router.put('/:key', (req: Request, res: Response) => {
  const db = getDatabase();
  const { value } = req.body;
  if (value === undefined) return res.status(400).json({ error: 'Value required' });

  const existing = db.exec('SELECT value FROM settings WHERE key = ?', [req.params.key]);
  if (existing[0] && existing[0].values.length > 0) {
    db.run('UPDATE settings SET value = ? WHERE key = ?', [value, req.params.key]);
  } else {
    db.run('INSERT INTO settings (key, value) VALUES (?, ?)', [req.params.key, value]);
  }
  saveDatabase();

  emitSocketEvent(SocketEvent.SETTING_UPDATED, { key: req.params.key, value });
  res.json({ key: req.params.key, value });
});

export default router;
