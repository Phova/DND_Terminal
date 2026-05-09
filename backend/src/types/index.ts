// ================================================================
// Dragontail Terminal — Core Type Definitions (DND 5e)
// ================================================================

// ---- Six Ability Scores ----
export interface Abilities {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export type AbilityKey = keyof Abilities;

// ---- DND Skills (18) ----
export enum Skill {
  ACROBATICS = 'acrobatics',
  ANIMAL_HANDLING = 'animal_handling',
  ARCANA = 'arcana',
  ATHLETICS = 'athletics',
  DECEPTION = 'deception',
  HISTORY = 'history',
  INSIGHT = 'insight',
  INTIMIDATION = 'intimidation',
  INVESTIGATION = 'investigation',
  MEDICINE = 'medicine',
  NATURE = 'nature',
  PERCEPTION = 'perception',
  PERFORMANCE = 'performance',
  PERSUASION = 'persuasion',
  RELIGION = 'religion',
  SLEIGHT_OF_HAND = 'sleight_of_hand',
  STEALTH = 'stealth',
  SURVIVAL = 'survival',
}

export const SKILL_ABILITY_MAP: Record<Skill, AbilityKey> = {
  [Skill.ACROBATICS]: 'dex',
  [Skill.ANIMAL_HANDLING]: 'wis',
  [Skill.ARCANA]: 'int',
  [Skill.ATHLETICS]: 'str',
  [Skill.DECEPTION]: 'cha',
  [Skill.HISTORY]: 'int',
  [Skill.INSIGHT]: 'wis',
  [Skill.INTIMIDATION]: 'cha',
  [Skill.INVESTIGATION]: 'int',
  [Skill.MEDICINE]: 'wis',
  [Skill.NATURE]: 'int',
  [Skill.PERCEPTION]: 'wis',
  [Skill.PERFORMANCE]: 'cha',
  [Skill.PERSUASION]: 'cha',
  [Skill.RELIGION]: 'int',
  [Skill.SLEIGHT_OF_HAND]: 'dex',
  [Skill.STEALTH]: 'dex',
  [Skill.SURVIVAL]: 'wis',
};

// ---- Conditions (15 core) ----
export enum Condition {
  BLINDED = 'blinded',
  CHARMED = 'charmed',
  DEAFENED = 'deafened',
  EXHAUSTION = 'exhaustion',
  FRIGHTENED = 'frightened',
  GRAPPLED = 'grappled',
  INCAPACITATED = 'incapacitated',
  INVISIBLE = 'invisible',
  PARALYZED = 'paralyzed',
  PETRIFIED = 'petrified',
  POISONED = 'poisoned',
  PRONE = 'prone',
  RESTRAINED = 'restrained',
  STUNNED = 'stunned',
  UNCONSCIOUS = 'unconscious',
}

// ---- Spell Slot Tracking ----
export interface SpellSlots {
  [level: number]: { max: number; used: number };
}

// ---- Equipment Slot ----
export interface EquipmentItem {
  name: string;
  quantity: number;
  weight?: number;
  description?: string;
  attuned?: boolean;
}

// ---- Character (extended from Phosphorite base) ----
export interface Character {
  id?: number;
  username: string;
  password: string;

  // Basic identity
  first_name: string;
  last_name: string;
  title: string;            // e.g. "Wizard", "Ranger"

  // DND core stats
  race: string;
  class: string;
  level: number;
  subclass?: string;
  background?: string;
  alignment?: string;       // e.g. "CG", "LN"

  // Abilities
  abilities: Abilities;
  hp_max: number;
  hp_current: number;
  temp_hp: number;
  ac: number;
  initiative_bonus: number;
  speed: number;
  size: string;             // "Tiny" | "Small" | "Medium" | "Large" | etc.
  darkvision: number;
  passive_perception: number;

  // Proficiencies
  skill_proficiencies: Skill[];
  saving_throw_proficiencies: AbilityKey[];
  armor_proficiencies: string[];
  weapon_proficiencies: string[];
  tool_proficiencies: string[];
  languages: string[];

  // Spellcasting
  spell_ability?: AbilityKey;
  spell_slots?: SpellSlots;
  known_spells?: string[];  // spell source IDs

  // Equipment
  equipment: EquipmentItem[];
  attunement_slots: number;

  // Features & traits
  features: string[];
  traits: string[];
  feats: string[];

  // Combat state
  death_saves: { successes: number; failures: number };
  exhaustion_level: number;
  conditions: Condition[];

  // Narrative (from Phosphorite)
  background_story?: string;
  personality?: string;
  fear?: string;
  secret?: string;
  motivation?: string;
  agenda?: string;

  // Session state
  current_app_id?: string | null;
  current_section?: string | null;
  last_activity_at?: string | null;

  // Visual
  visual_effects?: string[];

  // Timestamps
  created_at?: string;
  updated_at?: string;
}

export interface CharacterPublic extends Omit<Character, 'password'> {
  id: number;
}

// ---- Party ----
export interface Party {
  id: string;
  name: string;
  member_ids: number[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// ---- Monster (from bestiary) ----
export interface Monster {
  id: string;
  source_id?: string;
  name: string;
  size: string;
  type: string;
  alignment: string;
  ac: number;
  hp_max: number;
  hp_formula: string;
  speed: Record<string, number>;
  abilities: Abilities;
  saving_throws: Partial<Abilities>;
  skills: Partial<Record<Skill, number>>;
  damage_vulnerabilities: string[];
  damage_resistances: string[];
  damage_immunities: string[];
  condition_immunities: string[];
  senses: string;
  languages: string;
  cr: number;
  xp: number;
  traits: any[];
  actions: any[];
  legendary_actions?: any[];
  lair_actions?: any[];
  source_book: string;
  page: number;
}

// ---- Encounter ----
export type CombatantType = 'pc' | 'monster';

export interface Combatant {
  type: CombatantType;
  ref_id: string | number;
  name: string;
  hp_current: number;
  hp_max: number;
  ac: number;
  initiative: number;
  conditions: Condition[];
  is_active: boolean;
}

export interface Encounter {
  id: string;
  name: string;
  combatants: Combatant[];
  round: number;
  turn_index: number;
  status: 'prep' | 'active' | 'ended';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// ---- Spell ----
export interface Spell {
  id: string;
  source_id?: string;
  name: string;
  level: number;
  school: string;
  casting_time: string;
  range: string;
  components: string;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description: string;
  higher_level?: string;
  classes: string[];
  source_book: string;
}

// ---- Item ----
export interface Item {
  id: string;
  source_id?: string;
  name: string;
  type: string;
  rarity: string;
  attunement: boolean;
  description: string;
  properties?: Record<string, any>;
  source_book: string;
}

// ---- App Categories ----
export enum AppCategory {
  SCROLL = 'Scroll',
  OMEN = 'Omen',
  CHRONICLE = 'Chronicle',
  BESTIARY = 'Bestiary',
  BATTLEMAP = 'BattleMap',
  SCRYING_POOL = 'ScryingPool',
  ORACLE = 'Oracle',
}

// ---- App ----
export interface App {
  id: string;
  name: string;
  category: AppCategory;
  allowed_users: string[];
  order_index: number;
  data?: any;
  created_at?: string;
  updated_at?: string;
}

// ---- Message ----
export interface Message {
  id: string;
  sender: string;
  recipients: string[];
  subject: string;
  body: string;
  sent_at: string;
  read_status: Record<string, boolean>;
  created_at?: string;
  updated_at?: string;
}

// ---- Game Time (Fantasy Calendar) ----
export interface GameTime {
  era: number;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export interface GameTimeState extends GameTime {
  is_paused: boolean;
  real_time_ref: number;
}

// ---- Dice Roll ----
export interface DiceRollRequest {
  expression: string;       // e.g. "2d6+3", "adv d20", "4d6k3"
  character_id?: number;    // if skill roll, look up modifiers
  skill?: Skill;            // auto-add proficiency + ability mod
  label?: string;           // display label
  private?: boolean;        // GM-only visibility
}

export interface DiceRollResult {
  expression: string;
  label?: string;
  rolls: number[];          // individual die results
  modifier: number;
  total: number;
  advantage?: boolean;
  disadvantage?: boolean;
  timestamp: number;
  character_id?: number;
  skill?: Skill;
  private?: boolean;
}

// ---- Socket Events ----
export enum SocketEvent {
  // Character events
  CHARACTER_CREATED = 'character:created',
  CHARACTER_UPDATED = 'character:updated',
  CHARACTER_DELETED = 'character:deleted',
  CHARACTER_APP_CHANGED = 'character:app_changed',
  CHARACTER_ACTIVITY_UPDATED = 'character:activity_updated',
  CHARACTER_HP_CHANGED = 'character:hp_changed',
  CHARACTER_CONDITION_CHANGED = 'character:condition_changed',
  CHARACTER_ABILITY_CHANGED = 'character:ability_changed',
  CHARACTER_SPELL_SLOT_CHANGED = 'character:spell_slot_changed',
  CHARACTER_DEATH_SAVE_ROLLED = 'character:death_save_rolled',
  VISUAL_EFFECTS_CHANGED = 'visual_effects:changed',

  // Player session events
  PLAYER_ACTIVITY_REPORT = 'player:activity_report',
  PLAYER_SESSION_BIND = 'player:session_bind',
  PLAYER_SESSION_UNBIND = 'player:session_unbind',
  PLAYER_SESSION_CONFLICT = 'player:session_conflict',

  // App events
  APP_CREATED = 'app:created',
  APP_UPDATED = 'app:updated',
  APP_DELETED = 'app:deleted',

  // Game time events
  GAME_TIME_UPDATED = 'game_time:updated',
  GAME_TIME_PAUSED = 'game_time:paused',
  GAME_TIME_RESUMED = 'game_time:resumed',

  // Message events
  MESSAGE_CREATED = 'message:created',
  MESSAGE_UPDATED = 'message:updated',
  MESSAGE_DELETED = 'message:deleted',

  // Dice events
  DICE_ROLLED = 'dice:rolled',
  DICE_ROLLED_PRIVATE = 'dice:rolled_private',

  // Encounter events
  ENCOUNTER_STARTED = 'encounter:started',
  ENCOUNTER_TURN_ADVANCED = 'encounter:turn_advanced',
  ENCOUNTER_COMBATANT_UPDATED = 'encounter:combatant_updated',
  ENCOUNTER_ENDED = 'encounter:ended',

  // Settings events
  SETTING_UPDATED = 'setting:updated',

  // Client events
  CLIENT_CONNECTED = 'client:connected',
  CLIENT_DISCONNECTED = 'client:disconnected',

  // State sync
  SYNC_REQUEST = 'sync:request',
  SYNC_RESPONSE = 'sync:response',
}

export interface SocketEventPayload {
  event: SocketEvent;
  data: any;
  timestamp: number;
}
