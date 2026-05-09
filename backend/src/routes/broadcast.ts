import { Router, Request, Response } from 'express';
import { getDatabase, saveDatabase } from '../db/database';
import { emitSocketEvent } from '../services/socketService';
import { SocketEvent } from '../types';
import { v4 as uuid } from 'uuid';

const router = Router();

// Send broadcast to players
router.post('/', (req: Request, res: Response) => {
  try {
    const { type, recipients, content, mimeType, duration } = req.body;

    if (!type || !content || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'type, content, and recipients required' });
    }

    const broadcast = {
      id: uuid(),
      type,          // 'text' | 'image'
      recipients,
      content,       // text or base64 image
      mimeType: mimeType || null,
      duration: duration || 10,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to all connected clients — player clients filter by recipients
    emitSocketEvent(SocketEvent.BROADCAST_SENT, broadcast);

    res.status(201).json({ success: true, broadcast });
  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

// Get broadcast history (GM)
router.get('/', (_req: Request, res: Response) => {
  // Broadcasts are ephemeral, no persistent storage currently
  res.json([]);
});

export default router;
