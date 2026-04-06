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

const TURN_CHAIN_REACTIONS: Record<string, TurnReactionInfo> = {
  'fire>thunder': {
    reaction: 'vaporize',
    multiplier: 1.5,
    label: 'VAPORIZE! +50%',
    visualElement: 'fire',
  },
  'ice>fire': {
    reaction: 'melt',
    multiplier: 1.25,
    label: 'MELT! +25%',
    visualElement: 'ice',
  },
  'thunder>water': {
    reaction: 'strong_conductive',
    multiplier: 1.4,
    label: 'CHAIN REACTION! +40%',
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

export function getReactionText(a: Element | null, b: Element | null): string {
  if (!a || !b) return '';
  const reaction = REACTION_TABLE[a]?.[b];
  if (!reaction) return '';
  const map: Record<ReactionType, string> = {
    melt: '融化',
    vaporize: '蒸发',
    conductive: '导电',
    strong_conductive: '强导',
    spread: '扩散',
    shatter: '碎冰',
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
