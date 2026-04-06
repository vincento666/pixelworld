// Soul & Memory Types — 对齐荣格原型 + PRD v0.4

import type { Card } from './card';

export type JungArchetype =
  | 'Innocent'    // 天真者
  | 'Orphan'      // 孤儿
  | 'Hero'        // 英雄
  | 'Caregiver'   // 照顾者
  | 'Explorer'    // 探险家
  | 'Rebel'       // 反抗者
  | 'Lover'       // 爱者
  | 'Creator'     // 创造者
  | 'Jester'      // 小丑
  | 'Sage'        // 智者
  | 'Magician'    // 魔术师
  | 'Ruler';      // 统治者

export type PersonaStyle = 'formal' | 'casual' | 'warm' | 'cold' | 'humorous';
export type CombatTactics = 'aggressive' | 'defensive' | 'balanced';

// 核心身份
export interface SoulCore {
  name: string;
  archetype: JungArchetype;
  values: string[];       // 核心价值观 3~5条
  fears: string[];        // 核心恐惧 2~3条
}

// 人格面具
export interface SoulPersona {
  style: PersonaStyle;
  speechPatterns: string[];
}

// 阴影（边界）
export interface SoulShadow {
  boundaries: string[];   // 绝对不做的事
  blindSpots: string[];  // 不自知的弱点
}

// 战斗风格（由记忆蒸馏）
export interface SoulCombatStyle {
  preferredElements: string[];
  tactics: CombatTactics;
  cardPreferences: string[];
}

// 完整 Soul 结构
export interface Soul {
  core: SoulCore;
  persona: SoulPersona;
  shadow: SoulShadow;
  combatStyle: SoulCombatStyle;
  soulImpressions: string[]; // 灵魂印记（跨周目永久）
}

// 存档格式
export interface GameSave {
  version: string;
  ngCount: number;           // 周目数
  currentZone: number;      // 当前区域 1~3
  currentArea: number;       // 当前小关
  player: PlayerState;
  permanentUnlocks: PermanentUnlocks;
  archive: SoulArchiveEntry[];
}

export interface PlayerState {
  hp: number;
  maxHp: number;
  ap: number;
  maxAp: number;
  position: number;         // 九宫格位置 0~8
  soul: Soul;
  handCards: Card[];
  soulValue: number;       // 魂值
}

export interface PermanentUnlocks {
  unlockedCards: string[];  // 已解锁卡库 ID
  maxCardSlots: number;     // 最大卡槽数
  permanentBuffs: string[]; // 永久增益
}

export interface SoulArchiveEntry {
  ng: number;
  summary: string;
  timestamp: number;
  soulSnapshot: Soul;
}

// 荣格原型 → 战斗风格预设映射
export const ARCHETYPE_COMBAT_MAP: Record<JungArchetype, Partial<SoulCombatStyle>> = {
  Hero:        { tactics: 'aggressive', preferredElements: ['physical', 'fire'] },
  Caregiver:   { tactics: 'defensive', preferredElements: ['water', 'wind'] },
  Explorer:    { tactics: 'balanced',  preferredElements: ['wind', 'thunder'] },
  Rebel:       { tactics: 'aggressive', preferredElements: ['fire', 'thunder'] },
  Lover:       { tactics: 'balanced',  preferredElements: ['water', 'fire'] },
  Creator:     { tactics: 'balanced',  preferredElements: ['thunder', 'ice'] },
  Jester:      { tactics: 'aggressive', preferredElements: ['wind', 'physical'] },
  Sage:        { tactics: 'balanced',  preferredElements: ['ice', 'thunder'] },
  Magician:    { tactics: 'balanced',  preferredElements: ['thunder', 'fire'] },
  Ruler:       { tactics: 'defensive', preferredElements: ['physical', 'water'] },
  Innocent:    { tactics: 'defensive', preferredElements: ['wind', 'water'] },
  Orphan:      { tactics: 'balanced',  preferredElements: ['physical', 'ice'] },
};
