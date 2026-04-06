import Phaser from 'phaser';
import type { Element } from '../types/element';

export type BattleTurn = 'player' | 'enemy';
export type BattleCardType = 'attack' | 'heal' | 'defend';

export interface BattleCard {
  id: string;
  name: string;
  type: BattleCardType;
  element: Element | null;
  damage?: number;
  heal?: number;
  mpCost: number;
  accentColor: number;
}

export interface MapEnemyDefinition {
  id: string;
  name: string;
  maxHP: number;
  mapX: number;
  mapY: number;
  color: number;
  attackElements: Element[];
}

export interface BattleEnemyState extends MapEnemyDefinition {
  hp: number;
}

export interface TurnReactionInfo {
  key: string;
  label: string;
  multiplier: number;
  visualElement: Element;
}

export const PLAYER_MAX_HP = 80;
export const PLAYER_MAX_MP = 30;
export const MP_REGEN_PER_ROUND = 5;
export const PLAYER_HEAL_AMOUNT = 30;

export const CARD_POOL: BattleCard[] = [
  { id: 'strike', name: 'Strike', type: 'attack', element: 'physical', damage: 18, mpCost: 0, accentColor: 0xcfcfcf },
  { id: 'fireball', name: 'Fireball', type: 'attack', element: 'fire', damage: 24, mpCost: 6, accentColor: 0xff6b3d },
  { id: 'ice-spike', name: 'Ice Spike', type: 'attack', element: 'ice', damage: 20, mpCost: 5, accentColor: 0x8fdcff },
  { id: 'thunder', name: 'Thunder', type: 'attack', element: 'thunder', damage: 28, mpCost: 8, accentColor: 0xffde59 },
  { id: 'wind-slash', name: 'Wind Slash', type: 'attack', element: 'wind', damage: 16, mpCost: 4, accentColor: 0x71e6a3 },
  { id: 'heal', name: 'Heal', type: 'heal', element: null, heal: PLAYER_HEAL_AMOUNT, mpCost: 7, accentColor: 0x5de390 },
  { id: 'defend', name: 'Defend', type: 'defend', element: null, mpCost: 3, accentColor: 0x73a8ff },
];

const WEIGHTED_CARD_IDS = [
  'strike',
  'strike',
  'strike',
  'fireball',
  'ice-spike',
  'thunder',
  'wind-slash',
  'heal',
  'defend',
];

export const MAP_ENEMIES: MapEnemyDefinition[] = [
  {
    id: 'goblin-grunt',
    name: 'Goblin Grunt',
    maxHP: 30,
    mapX: 8,
    mapY: 4,
    color: 0x6ea34c,
    attackElements: ['fire'],
  },
  {
    id: 'goblin-archer',
    name: 'Goblin Archer',
    maxHP: 20,
    mapX: 10,
    mapY: 7,
    color: 0x8fbf5b,
    attackElements: ['ice'],
  },
  {
    id: 'goblin-shaman',
    name: 'Goblin Shaman',
    maxHP: 38,
    mapX: 5,
    mapY: 8,
    color: 0x8a6ad7,
    attackElements: ['thunder', 'water'],
  },
];

const REACTION_TABLE: Record<string, TurnReactionInfo> = {
  'fire>thunder': {
    key: 'fire>thunder',
    label: 'VAPORIZE +50%',
    multiplier: 1.5,
    visualElement: 'thunder',
  },
  'ice>fire': {
    key: 'ice>fire',
    label: 'MELT +25%',
    multiplier: 1.25,
    visualElement: 'fire',
  },
  'thunder>water': {
    key: 'thunder>water',
    label: 'CHAIN +40%',
    multiplier: 1.4,
    visualElement: 'water',
  },
  'wind>ice': {
    key: 'wind>ice',
    label: 'FREEZE +25%',
    multiplier: 1.25,
    visualElement: 'ice',
  },
  'water>thunder': {
    key: 'water>thunder',
    label: 'SHOCK +40%',
    multiplier: 1.4,
    visualElement: 'thunder',
  },
};

export function createInitialHand(rng: Phaser.Math.RandomDataGenerator = new Phaser.Math.RandomDataGenerator()): BattleCard[] {
  return Array.from({ length: 5 }, () => drawCard(rng));
}

export function drawCard(rng: Phaser.Math.RandomDataGenerator = new Phaser.Math.RandomDataGenerator()): BattleCard {
  const id = WEIGHTED_CARD_IDS[rng.between(0, WEIGHTED_CARD_IDS.length - 1)];
  const card = CARD_POOL.find((entry) => entry.id === id);
  if (!card) {
    return CARD_POOL[0];
  }
  return { ...card };
}

export function createBattleEnemyState(enemy: MapEnemyDefinition): BattleEnemyState {
  return {
    ...enemy,
    hp: enemy.maxHP,
  };
}

export function getTurnReaction(
  previousPlayerElement: Element | null,
  enemyElement: Element | null
): TurnReactionInfo | null {
  if (!previousPlayerElement || !enemyElement) {
    return null;
  }

  return REACTION_TABLE[`${previousPlayerElement}>${enemyElement}`] ?? null;
}
