/**
 * @fileoverview Blob Terrain — procedural infinite terrain generator.
 * Ported from FrameRonin / infiniteMap (TypeScript).
 *
 * Uses Perlin/FBM noise to generate terrain height + biome + tile type.
 * Tile types: WATER / FLAT / MOUNTAIN → determines walkability and appearance.
 *
 * Compatible with the MAP_REGISTRY tile system in PixelWorld.
 */

// ---------------------------------------------------------------------------
// Constants (same as FrameRonin)
// ---------------------------------------------------------------------------
export const BLOB_TILE_SIZE = 32;     // world units per tile
export const WATER_LEVEL  = 0.40;    // noise < this → water
export const MOUNTAIN_LEVEL = 0.62;  // noise > this → mountain

// Perlin noise permutation table (fixed, no seed needed for deterministic output)
const P: number[] = [
  151,160,137, 91, 90, 15,131, 13,201, 95, 96, 53,194,233,  7,225,
  140, 36,103, 30, 69,142,  8, 99, 37,240, 21, 10, 23,190,  6,148,
  247,120,234, 75,  0, 26,197, 62, 94,252,219,203,117, 35, 11, 32,
   57,177, 33, 88,237,149, 56, 87,174, 20,125,136,171,168, 68,175,
   74,165, 71,134,139, 48, 27,166, 77,146,158,231, 83,111,229,122,
   60,211,133,230,220,105, 92, 41, 55, 46,245, 40,244,102,143, 54,
   65, 25, 63,161,  1,216, 80, 73,209, 76,132,187,208, 89, 18,169,
  200,196,135,130,116,188,159, 86,164,100,109,198,173,186,  3, 64,
   52,217,226,250,124,123,  5,202, 38,147,118,126,255, 82, 85,212,
  207,206, 59,227, 47, 16, 58, 17,182,189, 28, 42,223,183,170,213,
  119,248,152,  2, 44,154,163, 70,221,153,101,155,167, 43,172,  9,
  129, 22, 39,253, 19, 98,108,110, 79,113,224,232,178,185,112,104,
  218,246, 97,228,251, 34,242,193,238,210,144, 12,191,179,162,241,
   81, 51,145,235,249, 14,239,107, 49,192,214, 31,181,199,106,157,
  184, 84,204,176,115,121, 50, 45,127,  4,150,154,  0, 78,241,  0,
  111,221, 31,183,  0, 69, 76,242,212,194,  0, 75, 15,164, 91,214,
];

const perm = [...P, ...P]; // doubled for overflow-safe lookup

// ---------------------------------------------------------------------------
// Noise
// ---------------------------------------------------------------------------
function fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(a: number, b: number, t: number) { return a + t * (b - a); }
function grad(hash: number, x: number, y: number): number {
  const h = hash & 3;
  const u = h < 2 ? x : -x;
  const v = h === 0 || h === 3 ? y : -y;
  return u + v;
}

function noise2d(x: number, y: number): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  x -= Math.floor(x);
  y -= Math.floor(y);
  const u = fade(x), v = fade(y);
  const A = perm[X] + Y, B = perm[X + 1] + Y;
  return lerp(
    lerp(grad(perm[A],     x,     y), grad(perm[B],     x - 1, y),     u),
    lerp(grad(perm[A + 1], x,     y - 1), grad(perm[B + 1], x - 1, y - 1), u),
    v
  );
}

/** Fractional Brownian Motion — layered noise for natural terrain */
function fbm(x: number, y: number, octaves = 6): number {
  let value = 0, amplitude = 0.5, frequency = 1, max = 0;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise2d(x * frequency, y * frequency);
    max   += amplitude;
    amplitude *= 0.5;
    frequency *= 2.1;
  }
  return value / max; // → [-1, 1]
}

// ---------------------------------------------------------------------------
// Terrain types
// ---------------------------------------------------------------------------
export enum TileType { WATER = 0, FLAT = 1, MOUNTAIN = 2 }

export interface TileInfo {
  type: TileType;
  walkable: boolean;
  displayChar: string;   // for debug text
  height: number;         // 0–1 for rendering
}

function getTileInfo(elevation: number): TileInfo {
  if (elevation < WATER_LEVEL)   return { type: TileType.WATER,     walkable: false, displayChar: '~', height: 0.1 };
  if (elevation > MOUNTAIN_LEVEL) return { type: TileType.MOUNTAIN,  walkable: false, displayChar: '▲', height: 0.9 };
  return                               { type: TileType.FLAT,       walkable: true,  displayChar: '·', height: 0.5 };
}

// ---------------------------------------------------------------------------
// BlobTerrain — infinite world tile cache (LRU, same as FrameRonin)
// ---------------------------------------------------------------------------
export interface TerrainTile {
  type: TileType;
  elevation: number;
  walkable: boolean;
}

export class BlobTerrain {
  private cache = new Map<string, TerrainTile>();
  private readonly cacheLimit = 128;

  /**
   * Get terrain info for world coordinate (tx, ty).
   * Uses elevation FBM for terrain type, walkable is derived.
   */
  getTile(tx: number, ty: number): TerrainTile {
    const key = `${tx},${ty}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const scale = 0.048;
    const e = fbm(tx * scale, ty * scale);
    // Normalize noise → [0, 1]
    const elevation = (e + 1) * 0.5;
    const info = getTileInfo(elevation);
    const tile: TerrainTile = { type: info.type, elevation, walkable: info.walkable };

    if (this.cache.size >= this.cacheLimit) {
      const firstKey = this.cache.keys().next().value!;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, tile);
    return tile;
  }

  /** True if tile is water or mountain */
  isBlocked(tx: number, ty: number): boolean {
    return !this.getTile(tx, ty).walkable;
  }

  /** Generate a visual map string for debugging */
  renderMap(cx: number, cy: number, radius = 15): string {
    const rows: string[] = [];
    for (let dy = -radius; dy <= radius; dy++) {
      let row = '';
      for (let dx = -radius; dx <= radius; dx++) {
        const t = this.getTile(cx + dx, cy + dy);
        row += t.type === TileType.WATER   ? '~~'
             : t.type === TileType.MOUNTAIN ? '^^'
             : t.type === TileType.FLAT     ? '··'
             : '??';
      }
      rows.push(row);
    }
    return rows.join('\n');
  }

  clearCache() { this.cache.clear(); }
}
