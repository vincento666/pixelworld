import type { Element, ElementalState, ReactionType } from '../types/element';
import {
  REACTION_TABLE,
  REACTION_DAMAGE_MULTIPLIER,
} from '../types/element';

export interface TurnReactionInfo {
  reaction: ReactionType;
  multiplier: number;
  label: string;
  visualElement: Element;
}

/**
 * 元素反应触发表（格式：敌人元素 > 玩家元素）
 * 当敌人先手使用某元素，下回合玩家反制时触发对应反应
 *
 * 对应 SPEC：
 *   FIRE 敌人 + THUNDER 玩家 → VAPORIZE  +50%
 *   ICE   敌人 + FIRE   玩家 → MELT      +25%
 *   THUNDER 敌人 + WATER 玩家 → CHAIN    +40%
 *   WIND   敌人 + ICE   玩家 → FREEZE   +25%  (代码用 shatter 类型)
 *   WATER  敌人 + THUNDER玩家 → SHOCK    +40%  (代码用 conductive 类型)
 */
const TURN_CHAIN_REACTIONS: Record<string, TurnReactionInfo> = {
  'fire>thunder': {
    reaction: 'vaporize',
    multiplier: 1.5,
    label: '🔥 蒸发 VAPORIZE +50%',
    visualElement: 'fire',
  },
  'ice>fire': {
    reaction: 'melt',
    multiplier: 1.25,
    label: '🔥 融化 MELT +25%',
    visualElement: 'ice',
  },
  'thunder>water': {
    reaction: 'strong_conductive',
    multiplier: 1.4,
    label: '⚡ 链式反应 CHAIN +40%',
    visualElement: 'thunder',
  },
  // WIND敌人+ICE玩家 → FREEZE +25% (FREEZE 用 shatter 类型，冻结效果)
  'wind>ice': {
    reaction: 'shatter',
    multiplier: 1.25,
    label: '❄️ 冻结 FREEZE +25%',
    visualElement: 'wind',
  },
  // WATER敌人+THUNDER玩家 → SHOCK +40% (SHOCK 用 conductive 类型)
  'water>thunder': {
    reaction: 'conductive',
    multiplier: 1.4,
    label: '⚡ 感电 SHOCK +40%',
    visualElement: 'thunder',
  },
};

export function getTurnReactionBonus(
  prev: Element | null | undefined,
  current: Element | null | undefined
): TurnReactionInfo | null {
  if (!prev || !current) return null;
  const key = `${prev}>${current}`;
  return TURN_CHAIN_REACTIONS[key] ?? null;
}

export function calculateElementalDamage(
  attacker: { element?: Element; atk: number },
  defender: { element?: Element; def: number; state: ElementalState },
  action: { element?: Element },
  affinity: { advantaged: Element[]; disadvantaged: Element[] }
): number {
  // 1. 基础伤害
  let damage = attacker.atk * (1 - defender.def / 100);

  // 2. 元素反应
  if (action.element && defender.element) {
    const firstReaction = REACTION_TABLE[defender.element]?.[action.element];
    if (firstReaction) {
      damage *= REACTION_DAMAGE_MULTIPLIER[firstReaction];
    }
  }

  // 3. 元素克制
  if (action.element) {
    if (affinity.disadvantaged.includes(action.element)) {
      damage *= 0.7;
    } else if (affinity.advantaged.includes(action.element)) {
      damage *= 1.5;
    }
  }

  return Math.floor(damage);
}

/**
 * 从 REACTION_TABLE 查找反应描述（用于战斗日志/飘字）
 * 格式：a = 攻击方元素，b = 防守方元素
 */
export function getReactionText(a: Element | null, b: Element | null): string {
  if (!a || !b) return '';
  const reaction = REACTION_TABLE[a]?.[b];
  if (!reaction) return '';
  const map: Record<ReactionType, string> = {
    melt:              '融化 MELT +25%',
    vaporize:          '蒸发 VAPORIZE +50%',
    conductive:         '感电 SHOCK +40%',
    strong_conductive:  '链式 CHAIN +40%',
    spread:             '扩散 SPREAD +20%',
    shatter:           '冻结 FREEZE +25%',
  };
  return map[reaction] ?? '';
}

export function applySecondaryReaction(
  state: ElementalState,
  element: Element
): { newState: ElementalState; extraDamage: number; text: string } | null {
  if (state === 'frozen' && element === 'physical') {
    return { newState: 'none', extraDamage: 15, text: '碎冰！附加15物理伤害' };
  }
  if (state === 'electrocuted' && element === 'physical') {
    return { newState: 'none', extraDamage: 12, text: '导体断裂！附加12物理伤害' };
  }
  if (state === 'ignited' && element === 'water') {
    return { newState: 'none', extraDamage: 20, text: '沸腾！额外20火元素范围伤害' };
  }
  if (state === 'wet' && element === 'thunder') {
    return { newState: 'electrocuted', extraDamage: 18, text: '强导！闪电链18伤害' };
  }
  return null;
}
