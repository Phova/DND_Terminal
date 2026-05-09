// @ts-ignore - sql.js doesn't have official types
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { getDataDir, getDatabasePath } from '../config/runtime';

type SqlJsDatabase = any;

let db: SqlJsDatabase | null = null;
const dbPath = getDatabasePath();

// ---- Fantasy theme defaults ----
const defaultPlayerTheme = {
  presetId: 'parchment',
  palette: {
    foreground: '#3b2b1a',
    background: '#f4e4c1',
    alert: '#8b0000',
    gradient: {
      type: 'radial',
      angle: 135,
      start: '#e8d5a3',
      end: '#d4c4a0',
      radius: 68,
      intensity: 0.6,
      enabled: true,
    },
    glow: {
      foreground: 0.3,
      background: 0.15,
      alert: 0.4,
    },
    media: {
      hueShift: 30,
      saturation: 1.0,
      brightness: 0.9,
      contrast: 1.0,
    },
  },
  typography: {
    fontFamily: '"MedievalSharp", "Cinzel", Georgia, serif',
    fontScale: 1,
    lineHeightScale: 1,
    letterSpacingScale: 1,
  },
  effects: {
    scanlines: false,
    staticNoise: false,
    vignette: true,
    chromaticAberration: false,
    parchment: true,
    candleFlicker: true,
    arcaneRunes: false,
    dragonFire: false,
  },
};

const defaultPlayerThemeValue = JSON.stringify(defaultPlayerTheme);

// ---- SRD Spells (a handful to seed) ----
const SRD_SPELLS = [
  { id: 'spell-magic-missile', name: '魔法飞弹', level: 1, school: '塑能', classes: '["法师","术士"]', source_book: 'PHB' },
  { id: 'spell-fireball', name: '火球术', level: 3, school: '塑能', classes: '["法师","术士"]', source_book: 'PHB' },
  { id: 'spell-cure-wounds', name: '疗伤术', level: 1, school: '防护', classes: '["诗人","牧师","德鲁伊","圣武士","游侠"]', source_book: 'PHB' },
  { id: 'spell-mage-armor', name: '法师护甲', level: 1, school: '防护', classes: '["法师","术士"]', source_book: 'PHB' },
  { id: 'spell-shield', name: '护盾术', level: 1, school: '防护', classes: '["法师","术士"]', source_book: 'PHB' },
  { id: 'spell-bless', name: '祝福术', level: 1, school: '附魔', classes: '["牧师","圣武士"]', source_book: 'PHB' },
  { id: 'spell-healing-word', name: '治愈真言', level: 1, school: '防护', classes: '["诗人","牧师","德鲁伊"]', source_book: 'PHB' },
  { id: 'spell-darkness', name: '黑暗术', level: 2, school: '塑能', classes: '["法师","术士","邪术师"]', source_book: 'PHB' },
  { id: 'spell-invisibility', name: '隐形术', level: 2, school: '幻术', classes: '["诗人","法师","术士","邪术师"]', source_book: 'PHB' },
  { id: 'spell-lightning-bolt', name: '闪电束', level: 3, school: '塑能', classes: '["法师","术士"]', source_book: 'PHB' },
];

// ---- SRD Monsters (seed) ----
const SRD_MONSTERS = [
  { id: 'monster-goblin', name: '地精', type: '类人生物', size: '小型', ac: 15, hp_max: 7, cr: 0.25, xp: 50, source_book: 'MM' },
  { id: 'monster-skeleton', name: '骷髅', type: '不死生物', size: '中型', ac: 13, hp_max: 13, cr: 0.25, xp: 50, source_book: 'MM' },
  { id: 'monster-zombie', name: '僵尸', type: '不死生物', size: '中型', ac: 8, hp_max: 22, cr: 0.25, xp: 50, source_book: 'MM' },
  { id: 'monster-ogre', name: '食人魔', type: '巨人', size: '大型', ac: 11, hp_max: 59, cr: 2, xp: 450, source_book: 'MM' },
  { id: 'monster-troll', name: '巨魔', type: '巨人', size: '大型', ac: 15, hp_max: 84, cr: 5, xp: 1800, source_book: 'MM' },
  { id: 'monster-dragon-red-young', name: '青年红龙', type: '龙类', size: '大型', ac: 18, hp_max: 178, cr: 10, xp: 5900, source_book: 'MM' },
];

// Initialize sql.js and load/create database
export async function initDatabase() {
  const SQL = await initSqlJs();

  const dataDir = getDataDir();
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
    console.log('Database loaded from file');
  } else {
    db = new SQL.Database();
    console.log('New database created');
  }

  db.run('PRAGMA foreign_keys = ON');

  // ---- Create tables ----

  // Characters table (DND extended)
  db.run(`
    CREATE TABLE IF NOT EXISTS characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      title TEXT NOT NULL,
      race TEXT NOT NULL DEFAULT '人类',
      class TEXT NOT NULL DEFAULT '战士',
      level INTEGER NOT NULL DEFAULT 1,
      subclass TEXT,
      background TEXT,
      alignment TEXT DEFAULT 'N',
      abilities TEXT NOT NULL DEFAULT '{"str":10,"dex":10,"con":10,"int":10,"wis":10,"cha":10}',
      hp_max INTEGER NOT NULL DEFAULT 10,
      hp_current INTEGER NOT NULL DEFAULT 10,
      temp_hp INTEGER NOT NULL DEFAULT 0,
      ac INTEGER NOT NULL DEFAULT 10,
      initiative_bonus INTEGER NOT NULL DEFAULT 0,
      speed INTEGER NOT NULL DEFAULT 30,
      size TEXT NOT NULL DEFAULT '中型',
      darkvision INTEGER NOT NULL DEFAULT 0,
      passive_perception INTEGER NOT NULL DEFAULT 10,
      skill_proficiencies TEXT NOT NULL DEFAULT '[]',
      saving_throw_proficiencies TEXT NOT NULL DEFAULT '[]',
      armor_proficiencies TEXT NOT NULL DEFAULT '[]',
      weapon_proficiencies TEXT NOT NULL DEFAULT '[]',
      tool_proficiencies TEXT NOT NULL DEFAULT '[]',
      languages TEXT NOT NULL DEFAULT '["通用语"]',
      spell_ability TEXT,
      spell_slots TEXT DEFAULT '{}',
      known_spells TEXT DEFAULT '[]',
      equipment TEXT NOT NULL DEFAULT '[]',
      attunement_slots INTEGER NOT NULL DEFAULT 3,
      features TEXT NOT NULL DEFAULT '[]',
      traits TEXT NOT NULL DEFAULT '[]',
      feats TEXT NOT NULL DEFAULT '[]',
      death_saves TEXT NOT NULL DEFAULT '{"successes":0,"failures":0}',
      exhaustion_level INTEGER NOT NULL DEFAULT 0,
      conditions TEXT NOT NULL DEFAULT '[]',
      background_story TEXT DEFAULT '',
      personality TEXT DEFAULT '',
      fear TEXT DEFAULT '',
      secret TEXT DEFAULT '',
      motivation TEXT DEFAULT '',
      agenda TEXT DEFAULT '',
      current_app_id TEXT,
      current_section TEXT,
      last_activity_at TEXT,
      visual_effects TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Party table
  db.run(`
    CREATE TABLE IF NOT EXISTS parties (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      member_ids TEXT NOT NULL DEFAULT '[]',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Monsters table
  db.run(`
    CREATE TABLE IF NOT EXISTS monsters (
      id TEXT PRIMARY KEY,
      source_id TEXT,
      name TEXT NOT NULL,
      size TEXT NOT NULL DEFAULT '中型',
      type TEXT NOT NULL,
      alignment TEXT DEFAULT '无阵营',
      ac INTEGER NOT NULL DEFAULT 10,
      hp_max INTEGER NOT NULL DEFAULT 1,
      hp_formula TEXT,
      speed TEXT DEFAULT '{"walk":30}',
      abilities TEXT NOT NULL DEFAULT '{"str":10,"dex":10,"con":10,"int":10,"wis":10,"cha":10}',
      saving_throws TEXT DEFAULT '{}',
      skills TEXT DEFAULT '{}',
      damage_vulnerabilities TEXT DEFAULT '[]',
      damage_resistances TEXT DEFAULT '[]',
      damage_immunities TEXT DEFAULT '[]',
      condition_immunities TEXT DEFAULT '[]',
      senses TEXT DEFAULT '被动察觉 10',
      languages TEXT DEFAULT '',
      cr REAL NOT NULL DEFAULT 0,
      xp INTEGER NOT NULL DEFAULT 0,
      traits TEXT DEFAULT '[]',
      actions TEXT DEFAULT '[]',
      legendary_actions TEXT DEFAULT '[]',
      lair_actions TEXT DEFAULT '[]',
      source_book TEXT NOT NULL DEFAULT 'MM',
      page INTEGER DEFAULT 0
    )
  `);

  // Spells table
  db.run(`
    CREATE TABLE IF NOT EXISTS spells (
      id TEXT PRIMARY KEY,
      source_id TEXT,
      name TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 0,
      school TEXT NOT NULL,
      casting_time TEXT DEFAULT '1 动作',
      range TEXT DEFAULT '自身',
      components TEXT DEFAULT 'V,S',
      duration TEXT DEFAULT '立即',
      concentration INTEGER NOT NULL DEFAULT 0,
      ritual INTEGER NOT NULL DEFAULT 0,
      description TEXT DEFAULT '',
      higher_level TEXT DEFAULT '',
      classes TEXT NOT NULL DEFAULT '[]',
      source_book TEXT NOT NULL DEFAULT 'PHB'
    )
  `);

  // Items table
  db.run(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      source_id TEXT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      rarity TEXT DEFAULT '普通',
      attunement INTEGER NOT NULL DEFAULT 0,
      description TEXT DEFAULT '',
      properties TEXT DEFAULT '{}',
      source_book TEXT NOT NULL DEFAULT 'PHB'
    )
  `);

  // Apps table
  db.run(`
    CREATE TABLE IF NOT EXISTS apps (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      allowed_users TEXT NOT NULL DEFAULT '[]',
      data TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Messages table
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      sender TEXT NOT NULL,
      recipients TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      sent_at TEXT NOT NULL,
      read_status TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Encounters table
  db.run(`
    CREATE TABLE IF NOT EXISTS encounters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      combatants TEXT NOT NULL DEFAULT '[]',
      round INTEGER NOT NULL DEFAULT 0,
      turn_index INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'prep',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Settings table
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // ---- Seed default data ----

  const settingsCount = db.exec('SELECT COUNT(*) as count FROM settings');
  const count = settingsCount[0]?.values[0]?.[0] || 0;
  if (count === 0) {
    const now = new Date().toISOString();
    db.run(`INSERT INTO settings (key, value) VALUES
      ('headerText', 'DRAGONTAIL'),
      ('loginText', '越过龙脊山脉，踏入未知领域...'),
      ('playerTheme', ?),
      ('calendarName', '被遗忘国度'),
      ('yearName', '巨龙纪元')
    `, [defaultPlayerThemeValue]);

    // Seed a demo character
    db.run(`INSERT INTO characters
      (username, password, first_name, last_name, title, race, class, level,
       abilities, hp_max, hp_current, ac, initiative_bonus, speed, darkvision, passive_perception,
       skill_proficiencies, saving_throw_proficiencies, languages, spell_ability, spell_slots, known_spells,
       background_story, personality, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?,
       ?, ?, ?, ?, ?, ?, ?, ?,
       ?, ?, ?, ?, ?, ?,
       ?, ?, ?, ?)`,
      [
        'gandalf', 'greyhame', '甘道夫', '灰袍', '大法师',
        '人类', '法师', 5,
        JSON.stringify({ str: 10, dex: 14, con: 12, int: 18, wis: 13, cha: 8 }),
        32, 32, 15, 2, 30, 0, 13,
        JSON.stringify(['arcana', 'history', 'investigation', 'insight']),
        JSON.stringify(['int', 'wis']),
        JSON.stringify(['通用语', '精灵语', '龙语']),
        'int',
        JSON.stringify({ 1: { max: 4, used: 0 }, 2: { max: 3, used: 0 }, 3: { max: 2, used: 0 } }),
        JSON.stringify(['spell-magic-missile', 'spell-mage-armor', 'spell-shield', 'spell-fireball']),
        '一位来自遥远西方的伊斯塔力，被派遣到中土对抗黑暗。',
        '睿智、耐心，但在面对愚行时偶尔暴躁。',
        now, now,
      ]
    );

    // Seed a demo party
    db.run(`INSERT INTO parties (id, name, member_ids, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)`,
      ['party-fellowship', '远征队', JSON.stringify([1]), now, now]
    );

    // Seed SRD spells
    for (const spell of SRD_SPELLS) {
      db.run(`INSERT OR IGNORE INTO spells (id, name, level, school, classes, source_book) VALUES (?, ?, ?, ?, ?, ?)`,
        [spell.id, spell.name, spell.level, spell.school, spell.classes, spell.source_book]);
    }

    // Seed SRD monsters
    for (const m of SRD_MONSTERS) {
      db.run(`INSERT OR IGNORE INTO monsters (id, name, type, size, ac, hp_max, cr, xp, source_book) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [m.id, m.name, m.type, m.size, m.ac, m.hp_max, m.cr, m.xp, m.source_book]);
    }

    console.log('Default data seeded');
  }

  saveDatabase();
  console.log('Database initialized successfully');
}

export function saveDatabase() {
  if (!db) throw new Error('Database not initialized');
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

export function getDatabase(): SqlJsDatabase {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

export default { initDatabase, saveDatabase, getDatabase };
