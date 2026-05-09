import { Router, Request, Response } from 'express';
import { getDatabase, saveDatabase } from '../db/database';
import { Character, SocketEvent } from '../types';
import { emitSocketEvent } from '../services/socketService';
import { v4 as uuid } from 'uuid';

const router = Router();

function rowToCharacter(row: any): Character {
  return {
    id: row.id,
    username: row.username,
    password: row.password,
    first_name: row.first_name,
    last_name: row.last_name,
    title: row.title,
    race: row.race,
    class: row.class,
    level: row.level,
    subclass: row.subclass || undefined,
    background: row.background || undefined,
    alignment: row.alignment || 'N',
    abilities: JSON.parse(row.abilities || '{}'),
    hp_max: row.hp_max,
    hp_current: row.hp_current,
    temp_hp: row.temp_hp,
    ac: row.ac,
    initiative_bonus: row.initiative_bonus,
    speed: row.speed,
    size: row.size,
    darkvision: row.darkvision,
    passive_perception: row.passive_perception,
    skill_proficiencies: JSON.parse(row.skill_proficiencies || '[]'),
    saving_throw_proficiencies: JSON.parse(row.saving_throw_proficiencies || '[]'),
    armor_proficiencies: JSON.parse(row.armor_proficiencies || '[]'),
    weapon_proficiencies: JSON.parse(row.weapon_proficiencies || '[]'),
    tool_proficiencies: JSON.parse(row.tool_proficiencies || '[]'),
    languages: JSON.parse(row.languages || '[]'),
    spell_ability: row.spell_ability || undefined,
    spell_slots: JSON.parse(row.spell_slots || '{}'),
    known_spells: JSON.parse(row.known_spells || '[]'),
    equipment: JSON.parse(row.equipment || '[]'),
    attunement_slots: row.attunement_slots,
    features: JSON.parse(row.features || '[]'),
    traits: JSON.parse(row.traits || '[]'),
    feats: JSON.parse(row.feats || '[]'),
    death_saves: JSON.parse(row.death_saves || '{"successes":0,"failures":0}'),
    exhaustion_level: row.exhaustion_level,
    conditions: JSON.parse(row.conditions || '[]'),
    background_story: row.background_story || undefined,
    personality: row.personality || undefined,
    fear: row.fear || undefined,
    secret: row.secret || undefined,
    motivation: row.motivation || undefined,
    agenda: row.agenda || undefined,
    current_app_id: row.current_app_id || null,
    current_section: row.current_section || null,
    last_activity_at: row.last_activity_at || null,
    visual_effects: JSON.parse(row.visual_effects || '[]'),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// Login
router.post('/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const db = getDatabase();
    const result = db.exec('SELECT * FROM characters WHERE username = ? AND password = ?', [username, password]);
    if (!result[0] || result[0].values.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    // Build character object from row
    const row = result[0];
    const cols = row.columns;
    const vals = row.values[0];
    const raw: any = {};
    cols.forEach((c: string, i: number) => { raw[c] = vals[i]; });
    const character = rowToCharacter(raw);
    const { password: _, ...characterPublic } = character;
    res.json(characterPublic);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get all characters
router.get('/', (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const result = db.exec('SELECT * FROM characters');
    if (!result[0]) return res.json([]);
    const rows = result[0].values.map((vals: any[]) => {
      const raw: any = {};
      result[0].columns.forEach((c: string, i: number) => { raw[c] = vals[i]; });
      return rowToCharacter(raw);
    });
    // Strip passwords
    const publicRows = rows.map((c: any) => { const { password, ...rest } = c; return rest; });
    res.json(publicRows);
  } catch (error) {
    console.error('Error fetching characters:', error);
    res.status(500).json({ error: 'Failed to fetch characters' });
  }
});

// Get one
router.get('/:id', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const result = db.exec('SELECT * FROM characters WHERE id = ?', [Number(req.params.id)]);
    if (!result[0] || result[0].values.length === 0) return res.status(404).json({ error: 'Not found' });
    const raw: any = {};
    result[0].columns.forEach((c: string, i: number) => { raw[c] = result[0].values[0][i]; });
    const c = rowToCharacter(raw);
    const { password, ...pub } = c;
    res.json(pub);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch character' });
  }
});

// Create
router.post('/', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const now = new Date().toISOString();
    const c = req.body;
    const defaults: any = {
      race: '人类', class: '战士', level: 1, abilities: '{"str":10,"dex":10,"con":10,"int":10,"wis":10,"cha":10}',
      hp_max: 10, hp_current: 10, ac: 10, speed: 30, size: '中型', alignment: 'N',
    };
    const id = uuid();
    db.run(`INSERT INTO characters (username, password, first_name, last_name, title, race, class, level,
      abilities, hp_max, hp_current, ac, speed, size, alignment, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [c.username, c.password || 'changeme', c.first_name || 'Hero', c.last_name || '', c.title || 'Adventurer',
       c.race || defaults.race, c.class || defaults.class, c.level || defaults.level,
       JSON.stringify(c.abilities || defaults.abilities),
       c.hp_max || defaults.hp_max, c.hp_current || c.hp_max || defaults.hp_current, c.ac || defaults.ac,
       c.speed || defaults.speed, c.size || defaults.size, c.alignment || defaults.alignment,
       now, now]);
    saveDatabase();

    // Get the created character
    const result = db.exec('SELECT * FROM characters WHERE username = ?', [c.username]);
    const raw: any = {};
    result[0].columns.forEach((col: string, i: number) => { raw[col] = result[0].values[0][i]; });
    const char = rowToCharacter(raw);
    emitSocketEvent(SocketEvent.CHARACTER_CREATED, char);
    const { password, ...pub } = char;
    res.status(201).json(pub);
  } catch (error: any) {
    if (error.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Username exists' });
    res.status(500).json({ error: 'Failed to create character' });
  }
});

// Update character
router.patch('/:id', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const id = Number(req.params.id);
    const existing = db.exec('SELECT * FROM characters WHERE id = ?', [id]);
    if (!existing[0] || existing[0].values.length === 0) return res.status(404).json({ error: 'Not found' });

    const updates = req.body;
    const jsonFields = ['abilities', 'skill_proficiencies', 'saving_throw_proficiencies', 'spell_slots',
      'known_spells', 'equipment', 'features', 'traits', 'feats', 'death_saves', 'conditions', 'visual_effects'];

    const setClauses: string[] = [];
    const params: any[] = [];
    for (const [key, value] of Object.entries(updates)) {
      if (key === 'id' || key === 'username' || key === 'created_at') continue;
      const dbValue = jsonFields.includes(key) ? JSON.stringify(value) : value;
      setClauses.push(`${key} = ?`);
      params.push(dbValue);
    }
    if (setClauses.length === 0) return res.json({ message: 'No updates' });

    setClauses.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    db.run(`UPDATE characters SET ${setClauses.join(', ')} WHERE id = ?`, params);
    saveDatabase();

    const result = db.exec('SELECT * FROM characters WHERE id = ?', [id]);
    const raw: any = {};
    result[0].columns.forEach((c: string, i: number) => { raw[c] = result[0].values[0][i]; });
    const char = rowToCharacter(raw);
    emitSocketEvent(SocketEvent.CHARACTER_UPDATED, char);
    const { password, ...pub } = char;
    res.json(pub);
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Failed to update character' });
  }
});

// HP change
router.patch('/:id/hp', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const id = Number(req.params.id);
    const { hp_current, temp_hp, damage, healing } = req.body;

    const result = db.exec('SELECT * FROM characters WHERE id = ?', [id]);
    if (!result[0] || result[0].values.length === 0) return res.status(404).json({ error: 'Not found' });
    const raw: any = {};
    result[0].columns.forEach((c: string, i: number) => { raw[c] = result[0].values[i]; });

    let hp = hp_current ?? raw.hp_current;
    const hpMax = raw.hp_max;

    if (typeof damage === 'number') {
      let remaining = damage;
      if (raw.temp_hp > 0) {
        const absorbed = Math.min(raw.temp_hp, remaining);
        remaining -= absorbed;
        db.run('UPDATE characters SET temp_hp = temp_hp - ? WHERE id = ?', [absorbed, id]);
      }
      hp = Math.max(0, hp - remaining);
    }
    if (typeof healing === 'number') {
      hp = Math.min(hpMax, hp + healing);
    }
    if (typeof hp_current === 'number') {
      hp = Math.max(0, Math.min(hpMax, hp_current));
    }

    db.run('UPDATE characters SET hp_current = ?, temp_hp = ?, updated_at = ? WHERE id = ?',
      [hp, temp_hp ?? raw.temp_hp, new Date().toISOString(), id]);
    saveDatabase();

    emitSocketEvent(SocketEvent.CHARACTER_HP_CHANGED, { characterId: id, hp_current: hp, hp_max: hpMax });
    res.json({ hp_current: hp, hp_max: hpMax });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update HP' });
  }
});

// Delete
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const id = Number(req.params.id);
    db.run('DELETE FROM characters WHERE id = ?', [id]);
    saveDatabase();
    emitSocketEvent(SocketEvent.CHARACTER_DELETED, { id });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete character' });
  }
});

export default router;
