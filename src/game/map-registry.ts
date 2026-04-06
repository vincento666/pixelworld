// Map Registry — data-driven multi-map system
// Tile types: 0=grass 1=wall 2=path 3=portal 4=water 5=chest 6=building

export const TILE = {
  GRASS:    0,
  WALL:     1,
  PATH:     2,
  PORTAL:   3,
  WATER:    4,
  CHEST:    5,
  BUILDING: 6,
} as const;

export type TileType = typeof TILE[keyof typeof TILE];

export interface EnemySpawn {
  gx: number; gy: number;
  type: 'goblin_grunt' | 'goblin_archer' | 'goblin_shaman';
}

export interface Portal {
  gx: number; gy: number;
  targetMap: string;
  targetGX?: number;
  targetGY?: number;
}

export interface Treasure {
  gx: number; gy: number;
  reward: TreasureReward;
  opened?: boolean;
}

export type TreasureReward =
  | { type: 'hp_restore'; value: number }
  | { type: 'mp_restore'; value: number }
  | { type: 'atk_buff';    value: number; battles: number }
  | { type: 'def_buff';   value: number; battles: number };

export interface MapDefinition {
  id: string;
  name: string;
  /** Grid[row][col] — row=y, col=x */
  tiles: number[][];
  enemies: EnemySpawn[];
  portals: Portal[];
  treasures: Treasure[];
  bgColor: number;
  wallColor: number;
  portalColor: number;
  chestColor: number;
}

const GRASS_TILES = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,3,0,0,0,0,0,0,0,5,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,1,1,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,1,1,0,0,0,6,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,5,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,3,0,0,0,0,5,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const CAVE_TILES = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
  [1,0,0,0,1,0,0,0,0,0,1,0,0,3,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,0,1,1,1,0,0,0,1,1,1,0,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,5,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,0,1,1,0,0,0,0,0,1,1,0,1,1],
  [1,3,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const DUNGEON_TILES = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,1,0,0,0,0,0,1],
  [1,0,0,0,0,0,1,0,1,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,5,0,1],
  [1,0,0,1,1,1,1,0,1,1,1,1,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,5,0,0,0,1,0,1,0,0,0,5,0,1],
  [1,0,0,0,0,0,1,0,1,0,0,0,0,0,1],
  [1,0,0,0,0,0,1,0,1,0,0,0,0,3,1],
  [1,0,0,0,0,0,1,0,1,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

export const MAP_REGISTRY: Record<string, MapDefinition> = {
  grass: {
    id: 'grass',
    name: '绿野森林',
    tiles: GRASS_TILES,
    enemies: [
      { gx: 4, gy: 3, type: 'goblin_grunt' },
      { gx: 10, gy: 5, type: 'goblin_archer' },
      { gx: 5, gy: 9, type: 'goblin_shaman' },
    ],
    portals: [
      { gx: 3, gy: 2, targetMap: 'cave',    targetGX: 13, targetGY: 2 },
      { gx: 7, gy: 9, targetMap: 'dungeon', targetGX: 13, targetGY: 9 },
    ],
    treasures: [
      { gx: 11, gy: 2, reward: { type: 'hp_restore', value: 25 } },
      { gx: 2,  gy: 8, reward: { type: 'mp_restore', value: 15 } },
      { gx: 12, gy: 9, reward: { type: 'atk_buff',   value: 10, battles: 3 } },
    ],
    bgColor: 0x1a3a1a,
    wallColor: 0x4a3728,
    portalColor: 0x9966ff,
    chestColor: 0xffcc33,
  },
  cave: {
    id: 'cave',
    name: '暗夜洞穴',
    tiles: CAVE_TILES,
    enemies: [
      { gx: 7, gy: 3, type: 'goblin_archer' },
      { gx: 3, gy: 7, type: 'goblin_shaman' },
      { gx: 10, gy: 7, type: 'goblin_grunt' },
    ],
    portals: [
      { gx: 2, gy: 9, targetMap: 'grass', targetGX: 2, targetGY: 2 },
    ],
    treasures: [
      { gx: 7, gy: 6, reward: { type: 'hp_restore', value: 30 } },
      { gx: 3, gy: 3, reward: { type: 'def_buff',   value: 10, battles: 3 } },
    ],
    bgColor: 0x0d0d1a,
    wallColor: 0x3a3a4a,
    portalColor: 0x66ffcc,
    chestColor: 0xffcc33,
  },
  dungeon: {
    id: 'dungeon',
    name: '远古地牢',
    tiles: DUNGEON_TILES,
    enemies: [
      { gx: 3, gy: 3, type: 'goblin_shaman' },
      { gx: 12, gy: 3, type: 'goblin_archer' },
      { gx: 12, gy: 7, type: 'goblin_grunt' },
    ],
    portals: [
      { gx: 13, gy: 9, targetMap: 'grass', targetGX: 9, targetGY: 9 },
    ],
    treasures: [
      { gx: 12, gy: 3, reward: { type: 'hp_restore', value: 40 } },
      { gx: 2, gy: 7, reward: { type: 'mp_restore', value: 25 } },
      { gx: 12, gy: 7, reward: { type: 'atk_buff',   value: 15, battles: 5 } },
    ],
    bgColor: 0x1a0d0d,
    wallColor: 0x4a2828,
    portalColor: 0xffaa44,
    chestColor: 0xffcc33,
  },
};
