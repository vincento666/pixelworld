/**
 * @fileoverview Sprite animation registry — mirrors the FrameRonin / infiniteMap
 * sprite sheet layout. REGIONS + ANIMS are the canonical source of truth.
 *
 * Layout: TINA.png 252×252, frames are 21×42 or 28×42 px.
 * Organized in rows (animation banks) and columns (frames within an animation).
 *
 * Usage in Phaser 3:
 *   const frames = extractFrames(this.textures.get('TINA').getSourceImage());
 *   registry.frames  → SpriteFrames
 *   registry.anims   → this.anims.create({ key, frames, frameRate, repeat })
 */

// ---------------------------------------------------------------------------
// REGIONS — frame rectangles in the source PNG (x, y, w, h in pixels)
// ---------------------------------------------------------------------------
export const REGIONS: Record<string, { x: number; y: number; w: number; h: number }> = {
  // ── idle / standing (one frame each) ─────────────────────────────────
  idleL:     { x: 210, y: 126, w: 21, h: 42 },  // left / side
  idledown:  { x: 189, y: 126, w: 21, h: 42 },  // facing camera
  idleup:    { x: 231, y: 126, w: 21, h: 42 },  // back to camera

  // ── walk cycle — left / side (6 frames) ─────────────────────────────
  walkL_0:   { x:   0, y: 126, w: 28, h: 42 },
  walkL_1:   { x:  28, y: 126, w: 28, h: 42 },
  walkL_2:   { x:  56, y: 126, w: 28, h: 42 },
  walkL_3:   { x:  84, y: 126, w: 28, h: 42 },
  walkL_4:   { x: 112, y: 126, w: 28, h: 42 },
  walkL_5:   { x: 140, y: 126, w: 28, h: 42 },

  // ── walk — up (6 frames) ─────────────────────────────────────────────
  walkup_0:  { x:   0, y:   0, w: 21, h: 42 },
  walkup_1:  { x:  21, y:   0, w: 21, h: 42 },
  walkup_2:  { x:  42, y:   0, w: 21, h: 42 },
  walkup_3:  { x:  63, y:   0, w: 21, h: 42 },
  walkup_4:  { x:  84, y:   0, w: 21, h: 42 },
  walkup_5:  { x: 105, y:   0, w: 21, h: 42 },

  // ── walk — down / front (6 frames) ──────────────────────────────────
  walkdown_0: { x: 126, y:  0, w: 21, h: 42 },
  walkdown_1: { x: 147, y:  0, w: 21, h: 42 },
  walkdown_2: { x: 168, y:  0, w: 21, h: 42 },
  walkdown_3: { x: 189, y:  0, w: 21, h: 42 },
  walkdown_4: { x: 210, y:  0, w: 21, h: 42 },
  walkdown_5: { x: 231, y:  0, w: 21, h: 42 },

  // ── walk — right / side mirror of left ─────────────────────────────
  walkR_0:  { x:   0, y:  42, w: 21, h: 42 },
  walkR_1:  { x:  21, y:  42, w: 21, h: 42 },
  walkR_2:  { x:  42, y:  42, w: 21, h: 42 },
  walkR_3:  { x:  63, y:  42, w: 21, h: 42 },
  walkR_4:  { x:  84, y:  42, w: 21, h: 42 },
  walkR_5:  { x: 105, y:  42, w: 21, h: 42 },

  // ── run (3 directions, 6 frames each — speed ×2) ───────────────────
  runL_0:  { x:   0, y:  84, w: 21, h: 42 },
  runL_1:  { x:  21, y:  84, w: 21, h: 42 },
  runL_2:  { x:  42, y:  84, w: 21, h: 42 },
  runL_3:  { x:  63, y:  84, w: 21, h: 42 },
  runL_4:  { x:  84, y:  84, w: 21, h: 42 },
  runL_5:  { x: 105, y:  84, w: 21, h: 42 },

  rundown_0: { x: 126, y:  0, w: 21, h: 42 },  // same as walkdown
  rundown_1: { x: 147, y:  0, w: 21, h: 42 },
  rundown_2: { x: 168, y:  0, w: 21, h: 42 },
  rundown_3: { x: 189, y:  0, w: 21, h: 42 },
  rundown_4: { x: 210, y:  0, w: 21, h: 42 },
  rundown_5: { x: 231, y:  0, w: 21, h: 42 },

  runup_0:   { x: 126, y: 42, w: 21, h: 42 },
  runup_1:   { x: 147, y: 42, w: 21, h: 42 },
  runup_2:   { x: 168, y: 42, w: 21, h: 42 },
  runup_3:   { x: 189, y: 42, w: 21, h: 42 },
  runup_4:   { x: 210, y: 42, w: 21, h: 42 },
  runup_5:   { x: 231, y: 42, w: 21, h: 42 },
}

// ---------------------------------------------------------------------------
// ANIMS — Phaser 3 anims.create() compatible definitions
// frameKeys = REGIONS keys
// ---------------------------------------------------------------------------
export interface AnimDef {
  key: string;
  frames: string[];
  frameRate: number;
  repeat: number;  // -1 = loop forever
}

export const ANIMS: AnimDef[] = [
  // ── idle ──────────────────────────────────────────────────────────────
  { key: 'idleL',    frames: ['idleL'],          frameRate: 4,  repeat: -1 },
  { key: 'idledown',  frames: ['idledown'],        frameRate: 4,  repeat: -1 },
  { key: 'idleup',    frames: ['idleup'],         frameRate: 4,  repeat: -1 },

  // ── walk ────────────────────────────────────────────────────────────
  { key: 'walkL',     frames: ['walkL_0','walkL_1','walkL_2','walkL_3','walkL_4','walkL_5'],  frameRate: 8,  repeat: -1 },
  { key: 'walkdown',  frames: ['walkdown_0','walkdown_1','walkdown_2','walkdown_3','walkdown_4','walkdown_5'], frameRate: 8, repeat: -1 },
  { key: 'walkup',    frames: ['walkup_0','walkup_1','walkup_2','walkup_3','walkup_4','walkup_5'],  frameRate: 8,  repeat: -1 },
  { key: 'walkR',     frames: ['walkR_0','walkR_1','walkR_2','walkR_3','walkR_4','walkR_5'],  frameRate: 8,  repeat: -1 },

  // ── run ─────────────────────────────────────────────────────────────
  { key: 'runL',      frames: ['runL_0','runL_1','runL_2','runL_3','runL_4','runL_5'],   frameRate: 16, repeat: -1 },
  { key: 'rundown',   frames: ['rundown_0','rundown_1','rundown_2','rundown_3','rundown_4','rundown_5'],  frameRate: 16, repeat: -1 },
  { key: 'runup',     frames: ['runup_0','runup_1','runup_2','runup_3','runup_4','runup_5'],    frameRate: 16, repeat: -1 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Phaser 3 texture key for the TINA sprite sheet */
export const SPRITE_TEXTURE_KEY = 'TINA';

/** Phaser 3 atlas JSON compatible with Phaser's JSON Hash format */
export function buildPhaserAtlasJSON(): object {
  const frames: Record<string, object> = {};
  for (const [key, rect] of Object.entries(REGIONS)) {
    frames[key] = {
      frame: { x: rect.x, y: rect.y, w: rect.w, h: rect.h },
      sourceSize: { w: rect.w, h: rect.h },
      spriteSourceSize: { x: 0, y: 0, w: rect.w, h: rect.h },
    };
  }
  return { frames };
}
