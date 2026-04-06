// Card System Types

import type { Element } from './element';

export type CardRarity = 'common' | 'rare' | 'legendary';
export type CardType = 'attack' | 'skill' | 'buff' | 'debuff' | 'reaction';

export interface Card {
  id: string;
  name: string;
  rarity: CardRarity;
  cost: number;      // AP 消耗
  type: CardType;
  element?: Element;
  effectDesc: string; // 描述文本
  damage?: number;
  heal?: number;
  buff?: BuffEffect;
}

export interface BuffEffect {
  attr: 'atk' | 'def' | 'spd' | 'crit';
  value: number;
  turns: number;
}

export const HOLD_LIMITS: Record<CardRarity, number> = {
  common: 6,
  rare: 4,
  legendary: 2,
};

// 初始卡库（MVP 版本 — 共12张）
export const INITIAL_CARD_POOL: Card[] = [
  // 普通卡 6张
  { id: 'atk_phys_1', name: '重击', rarity: 'common', cost: 2, type: 'attack', damage: 18, effectDesc: '消耗2AP，造成18物理伤害' },
  { id: 'atk_fire_1', name: '火球术', rarity: 'common', cost: 1, type: 'attack', element: 'fire', damage: 12, effectDesc: '消耗1AP，造成12火元素伤害' },
  { id: 'atk_ice_1',  name: '冰刺术', rarity: 'common', cost: 1, type: 'attack', element: 'ice',  damage: 12, effectDesc: '消耗1AP，造成12冰元素伤害' },
  { id: 'atk_thunder_1', name: '雷电术', rarity: 'common', cost: 1, type: 'attack', element: 'thunder', damage: 10, effectDesc: '消耗1AP，造成10雷元素伤害' },
  { id: 'heal_1',     name: '治疗术', rarity: 'common', cost: 1, type: 'skill', heal: 20, effectDesc: '消耗1AP，恢复20HP' },
  { id: 'buff_atk_1', name: '力量祝福', rarity: 'common', cost: 0, type: 'buff', buff: { attr: 'atk', value: 10, turns: 3 }, effectDesc: '消耗0AP，本回合攻击力+10' },
  // 稀有卡 4张
  { id: 'atk_fire_2', name: '烈焰冲击', rarity: 'rare', cost: 2, type: 'attack', element: 'fire', damage: 28, effectDesc: '消耗2AP，造成28火元素伤害' },
  { id: 'atk_thunder_2', name: '雷霆万钧', rarity: 'rare', cost: 2, type: 'attack', element: 'thunder', damage: 24, effectDesc: '消耗2AP，造成24雷元素伤害' },
  { id: 'atk_water_2', name: '洪水术', rarity: 'rare', cost: 2, type: 'attack', element: 'water', damage: 20, effectDesc: '消耗2AP，造成20水元素伤害' },
  { id: 'debuff_phys_2', name: '破甲', rarity: 'rare', cost: 1, type: 'debuff', damage: 8, effectDesc: '消耗1AP，造成8物理伤害并降低目标防御' },
  // 传说卡 2张
  { id: 'atk_fire_3', name: '陨星天火', rarity: 'legendary', cost: 3, type: 'attack', element: 'fire', damage: 50, effectDesc: '消耗3AP，造成50火元素伤害，附带灼烧' },
  { id: 'atk_thunder_3', name: '神罚之雷', rarity: 'legendary', cost: 3, type: 'attack', element: 'thunder', damage: 45, effectDesc: '消耗3AP，造成45雷元素伤害，必定暴击' },
];

// 抽卡逻辑：从卡库随机选3张，玩家选1张
export function drawInitialHand(): Card[] {
  const pool = INITIAL_CARD_POOL;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}
