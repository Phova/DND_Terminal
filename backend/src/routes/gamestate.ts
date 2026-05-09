import { Router, Request, Response } from 'express';
import { getDatabase } from '../db/database';
import calendarService from '../services/calendarService';

const router = Router();

// Export full game state
router.get('/export', (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const characters = db.exec('SELECT * FROM characters');
    const parties = db.exec('SELECT * FROM parties');
    const monsters = db.exec('SELECT * FROM monsters');
    const spells = db.exec('SELECT * FROM spells');
    const encounters = db.exec('SELECT * FROM encounters');
    const apps = db.exec('SELECT * FROM apps');
    const messages = db.exec('SELECT * FROM messages');
    const settings = db.exec('SELECT key, value FROM settings');

    const toRows = (result: any) => {
      if (!result[0]) return [];
      return result[0].values.map((vals: any[]) => {
        const row: any = {};
        result[0].columns.forEach((c: string, i: number) => { row[c] = vals[i]; });
        return row;
      });
    };

    const gamestate = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      gameTime: calendarService.getState(),
      characters: toRows(characters),
      parties: toRows(parties),
      monsters: toRows(monsters),
      spells: toRows(spells),
      encounters: toRows(encounters),
      apps: toRows(apps),
      messages: toRows(messages),
      settings: toRows(settings),
    };

    res.json(gamestate);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// Summary
router.get('/summary', (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const count = (table: string) => {
      const r = db.exec(`SELECT COUNT(*) as c FROM ${table}`);
      return r[0]?.values[0]?.[0] || 0;
    };
    res.json({
      version: '1.0',
      generatedAt: new Date().toISOString(),
      counts: {
        characters: count('characters'),
        monsters: count('monsters'),
        spells: count('spells'),
        encounters: count('encounters'),
        apps: count('apps'),
        messages: count('messages'),
      },
      gameTime: calendarService.getState(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Summary failed' });
  }
});

// Import (basic — overwrites tables)
router.post('/import', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const { characters, monsters, spells, apps, settings } = req.body;

    const results: Record<string, number> = {};

    if (Array.isArray(characters)) {
      db.run('DELETE FROM characters');
      for (const c of characters) {
        const keys = Object.keys(c).filter(k => k !== 'id');
        db.run(`INSERT OR REPLACE INTO characters (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`,
          keys.map(k => c[k]));
      }
      results.characters = characters.length;
    }

    if (Array.isArray(monsters)) {
      for (const m of monsters) {
        const keys = Object.keys(m).filter(k => k !== 'id');
        db.run(`INSERT OR REPLACE INTO monsters (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`,
          keys.map(k => m[k]));
      }
      results.monsters = monsters.length;
    }

    if (Array.isArray(spells)) {
      for (const s of spells) {
        const keys = Object.keys(s).filter(k => k !== 'id');
        db.run(`INSERT OR REPLACE INTO spells (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`,
          keys.map(k => s[k]));
      }
      results.spells = spells.length;
    }

    if (Array.isArray(apps)) {
      db.run('DELETE FROM apps');
      for (const a of apps) {
        const keys = Object.keys(a).filter(k => k !== 'id');
        db.run(`INSERT INTO apps (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`,
          keys.map(k => a[k]));
      }
      results.apps = apps.length;
    }

    if (Array.isArray(settings)) {
      for (const s of settings) {
        db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [s.key, s.value]);
      }
      results.settings = settings.length;
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Import failed' });
  }
});

export default router;
