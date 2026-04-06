import type { JungArchetype, Soul, SoulCombatStyle, PlayerState, SoulArchiveEntry } from '../types/soul';
import { ARCHETYPE_COMBAT_MAP } from '../types/soul';
import type { Card } from '../types/card';

export function createDefaultSoul(archetype: JungArchetype): Soul {
  const combatOverride = ARCHETYPE_COMBAT_MAP[archetype] ?? {};

  const combatStyle: SoulCombatStyle = {
    preferredElements: combatOverride.preferredElements ?? ['physical'],
    tactics: combatOverride.tactics ?? 'balanced',
    cardPreferences: [],
  };

  return {
    core: {
      name: archetype,
      archetype,
      values: [],
      fears: [],
    },
    persona: {
      style: 'casual',
      speechPatterns: [],
    },
    shadow: {
      boundaries: [],
      blindSpots: [],
    },
    combatStyle,
    soulImpressions: [],
  };
}

export function loadSoul(): Soul | null {
  try {
    const raw = localStorage.getItem('pw_soul_v1');
    if (!raw) return null;
    return JSON.parse(raw) as Soul;
  } catch {
    return null;
  }
}

export function saveSoul(soul: Soul): void {
  localStorage.setItem('pw_soul_v1', JSON.stringify(soul));
}

export function loadPlayerState(): PlayerState | null {
  try {
    const raw = localStorage.getItem('pw_player_save');
    if (!raw) return null;
    return JSON.parse(raw) as PlayerState;
  } catch {
    return null;
  }
}

export function savePlayerState(state: PlayerState): void {
  localStorage.setItem('pw_player_save', JSON.stringify(state));
}

export function archiveCurrentLife(soul: Soul, summary: string, ng: number): void {
  try {
    const raw = localStorage.getItem('pw_archive_v1');
    const archive: SoulArchiveEntry[] = raw ? JSON.parse(raw) : [];
    archive.push({
      ng,
      summary,
      timestamp: Date.now(),
      soulSnapshot: soul,
    });
    localStorage.setItem('pw_archive_v1', JSON.stringify(archive));
  } catch {
    // ignore
  }
}
