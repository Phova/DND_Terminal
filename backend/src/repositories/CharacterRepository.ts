import { getDatabase, saveDatabase } from '../db/database';
import { Character } from '../types';

// Simple in-memory repository for character CRUD
class CharacterRepository {
  findAll(): Character[] {
    const db = getDatabase();
    const result = db.exec('SELECT * FROM characters');
    if (!result[0]) return [];
    return result[0].values.map((vals: any[]) => {
      const raw: any = {};
      result[0].columns.forEach((c: string, i: number) => { raw[c] = vals[i]; });
      return this.rowToCharacter(raw);
    });
  }

  findById(id: number): Character | undefined {
    const db = getDatabase();
    const result = db.exec('SELECT * FROM characters WHERE id = ?', [id]);
    if (!result[0] || result[0].values.length === 0) return undefined;
    const raw: any = {};
    result[0].columns.forEach((c: string, i: number) => { raw[c] = result[0].values[0][i]; });
    return this.rowToCharacter(raw);
  }

  async create(data: Partial<Character>): Promise<Character> {
    const db = getDatabase();
    const now = new Date().toISOString();
    const username = data.username || 'hero';
    const defaults: any = {
      race: '人类', class: '战士', level: 1,
      abilities: '{"str":10,"dex":10,"con":10,"int":10,"wis":10,"cha":10}',
      hp_max: 10, hp_current: 10, ac: 10, speed: 30, size: '中型', alignment: 'N',
    };
    db.run(`INSERT INTO characters (username, password, first_name, last_name, title, race, class, level,
      abilities, hp_max, hp_current, ac, speed, size, alignment, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [username, data.password || 'changeme', data.first_name || 'Hero', data.last_name || '',
       data.title || 'Adventurer', data.race || defaults.race, data.class || defaults.class,
       data.level || defaults.level, JSON.stringify(data.abilities || defaults.abilities),
       data.hp_max || defaults.hp_max, data.hp_current || data.hp_max || defaults.hp_current,
       data.ac || defaults.ac, data.speed || defaults.speed, data.size || defaults.size,
       data.alignment || defaults.alignment, now, now]);
    saveDatabase();
    const result = db.exec('SELECT * FROM characters WHERE username = ?', [username]);
    const raw: any = {};
    result[0].columns.forEach((c: string, i: number) => { raw[c] = result[0].values[0][i]; });
    return this.rowToCharacter(raw);
  }

  async update(id: number, updates: Partial<Character>): Promise<Character | null> {
    const db = getDatabase();
    const existing = db.exec('SELECT * FROM characters WHERE id = ?', [id]);
    if (!existing[0] || existing[0].values.length === 0) return null;

    const jsonFields = ['abilities', 'skill_proficiencies', 'saving_throw_proficiencies', 'spell_slots',
      'known_spells', 'equipment', 'features', 'traits', 'feats', 'death_saves', 'conditions', 'visual_effects'];
    const setClauses: string[] = [];
    const params: any[] = [];
    for (const [key, value] of Object.entries(updates)) {
      if (key === 'id' || key === 'username' || key === 'created_at') continue;
      params.push(jsonFields.includes(key) ? JSON.stringify(value) : value);
      setClauses.push(`${key} = ?`);
    }
    if (setClauses.length === 0) return this.findById(id)!;
    setClauses.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);
    db.run(`UPDATE characters SET ${setClauses.join(', ')} WHERE id = ?`, params);
    saveDatabase();
    return this.findById(id);
  }

  delete(id: number): boolean {
    const db = getDatabase();
    db.run('DELETE FROM characters WHERE id = ?', [id]);
    saveDatabase();
    return true;
  }

  private rowToCharacter(row: any): Character {
    return {
      id: row.id, username: row.username, password: row.password,
      first_name: row.first_name, last_name: row.last_name, title: row.title,
      race: row.race, class: row.class, level: row.level,
      subclass: row.subclass || undefined, background: row.background || undefined,
      alignment: row.alignment || 'N',
      abilities: JSON.parse(row.abilities || '{}'),
      hp_max: row.hp_max, hp_current: row.hp_current, temp_hp: row.temp_hp || 0,
      ac: row.ac, initiative_bonus: row.initiative_bonus || 0,
      speed: row.speed, size: row.size, darkvision: row.darkvision || 0,
      passive_perception: row.passive_perception || 10,
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
      attunement_slots: row.attunement_slots || 3,
      features: JSON.parse(row.features || '[]'),
      traits: JSON.parse(row.traits || '[]'),
      feats: JSON.parse(row.feats || '[]'),
      death_saves: JSON.parse(row.death_saves || '{"successes":0,"failures":0}'),
      exhaustion_level: row.exhaustion_level || 0,
      conditions: JSON.parse(row.conditions || '[]'),
      background_story: row.background_story || undefined,
      personality: row.personality || undefined,
      fear: row.fear || undefined, secret: row.secret || undefined,
      motivation: row.motivation || undefined, agenda: row.agenda || undefined,
      current_app_id: row.current_app_id || null,
      current_section: row.current_section || null,
      last_activity_at: row.last_activity_at || null,
      visual_effects: JSON.parse(row.visual_effects || '[]'),
      created_at: row.created_at, updated_at: row.updated_at,
    };
  }
}

export default new CharacterRepository();
