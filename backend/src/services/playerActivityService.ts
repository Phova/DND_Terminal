import CharacterRepository from '../repositories/CharacterRepository';
import { Character } from '../types';

interface PlayerActivityUpdate {
  characterId: number;
  current_app_id?: string | null;
  section?: string | null;
  last_activity_at?: string | null;
}

interface PlayerActivityResult {
  character: Character;
  appChanged: boolean;
}

export async function persistPlayerActivity(update: PlayerActivityUpdate): Promise<PlayerActivityResult> {
  const { characterId } = update;

  const existing = CharacterRepository.findById(characterId);
  if (!existing) throw new Error('Character not found');

  const updates: Partial<Character> = {};
  let appChanged = false;

  if ('current_app_id' in update) {
    const sanitized = update.current_app_id ? String(update.current_app_id) : null;
    updates.current_app_id = sanitized;
    appChanged = existing.current_app_id !== sanitized;
  }
  if ('section' in update) {
    updates.current_section = update.section || null;
  }
  updates.last_activity_at = update.last_activity_at || new Date().toISOString();

  const character = await CharacterRepository.update(characterId, updates);
  if (!character) throw new Error('Character not found after update');

  return { character, appChanged };
}
