import { Router, Request, Response } from 'express';
import { getDatabase, saveDatabase } from '../db/database';
import calendarService from '../services/calendarService';
import { emitSocketEvent } from '../services/socketService';
import { SocketEvent } from '../types';
import { v4 as uuid } from 'uuid';

const router = Router();

// Get all messages (GM view)
router.get('/', (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const result = db.exec('SELECT * FROM messages ORDER BY created_at DESC');
    if (!result[0]) return res.json([]);
    const messages = result[0].values.map((vals: any[]) => {
      const raw: any = {};
      result[0].columns.forEach((c: string, i: number) => { raw[c] = vals[i]; });
      raw.recipients = JSON.parse(raw.recipients || '[]');
      raw.read_status = JSON.parse(raw.read_status || '{}');
      return raw;
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get inbox for a user
router.get('/inbox/:username', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const result = db.exec('SELECT * FROM messages ORDER BY created_at DESC');
    if (!result[0]) return res.json([]);
    const inbox = result[0].values
      .map((vals: any[]) => {
        const raw: any = {};
        result[0].columns.forEach((c: string, i: number) => { raw[c] = vals[i]; });
        return raw;
      })
      .filter((m: any) => {
        const recipients = JSON.parse(m.recipients || '[]');
        return recipients.includes(req.params.username) || m.sender === req.params.username;
      })
      .map((m: any) => ({
        ...m,
        recipients: JSON.parse(m.recipients || '[]'),
        read_status: JSON.parse(m.read_status || '{}'),
      }));
    res.json(inbox);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inbox' });
  }
});

// Get sent for a user
router.get('/sent/:username', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const result = db.exec('SELECT * FROM messages WHERE sender = ? ORDER BY created_at DESC', [req.params.username]);
    if (!result[0]) return res.json([]);
    const sent = result[0].values.map((vals: any[]) => {
      const raw: any = {};
      result[0].columns.forEach((c: string, i: number) => { raw[c] = vals[i]; });
      raw.recipients = JSON.parse(raw.recipients || '[]');
      raw.read_status = JSON.parse(raw.read_status || '{}');
      return raw;
    });
    res.json(sent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sent messages' });
  }
});

// Create message
router.post('/', (req: Request, res: Response) => {
  try {
    const { sender, recipients, subject, body } = req.body;
    if (!sender || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Sender and at least one recipient required' });
    }
    if (!subject || subject.length > 48) {
      return res.status(400).json({ error: 'Subject required, max 48 chars' });
    }

    const db = getDatabase();
    const now = new Date().toISOString();
    const id = uuid();
    const readStatus: Record<string, boolean> = {};
    recipients.forEach((r: string) => { readStatus[r] = false; });

    const sentAt = JSON.stringify(calendarService.getCurrentGameTime());

    db.run(`INSERT INTO messages (id, sender, recipients, subject, body, sent_at, read_status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, sender, JSON.stringify(recipients), subject, body || '', sentAt, JSON.stringify(readStatus), now, now]);
    saveDatabase();

    const msg = { id, sender, recipients, subject, body: body || '', sent_at: sentAt, read_status: readStatus };
    emitSocketEvent(SocketEvent.MESSAGE_CREATED, msg);
    res.status(201).json(msg);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create message' });
  }
});

// Mark read
router.patch('/:id/read', (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });

    const db = getDatabase();
    const result = db.exec('SELECT read_status FROM messages WHERE id = ?', [req.params.id]);
    if (!result[0] || result[0].values.length === 0) return res.status(404).json({ error: 'Not found' });

    const readStatus = JSON.parse(result[0].values[0][0] || '{}');
    readStatus[username] = true;

    db.run('UPDATE messages SET read_status = ?, updated_at = ? WHERE id = ?',
      [JSON.stringify(readStatus), new Date().toISOString(), req.params.id]);
    saveDatabase();

    emitSocketEvent(SocketEvent.MESSAGE_READ_STATUS_CHANGED, { messageId: req.params.id, username, is_read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update read status' });
  }
});

// Delete
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    db.run('DELETE FROM messages WHERE id = ?', [req.params.id]);
    saveDatabase();
    emitSocketEvent(SocketEvent.MESSAGE_DELETED, { id: req.params.id });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;
