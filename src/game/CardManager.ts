import type { Card, CardType } from '../types/card';
import { INITIAL_CARD_POOL } from '../types/card';

export interface BattleContext {
  playerHP: { current: number; max: number };
  enemyHP: { current: number; max: number }[];
  playerAP: number;
  logs: string[];
}

export function drawInitialHand(pool: Card[] = INITIAL_CARD_POOL): Card[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

export function canPlayCard(card: Card, ap: number): boolean {
  return ap >= card.cost;
}

export function applyCardEffect(card: Card, ctx: BattleContext): void {
  if (card.type === 'attack' && card.damage !== undefined) {
    // Find lowest HP enemy
    let targetIdx = 0;
    let minHP = ctx.enemyHP[0]?.current ?? 0;
    for (let i = 1; i < ctx.enemyHP.length; i++) {
      if (ctx.enemyHP[i].current < minHP) {
        minHP = ctx.enemyHP[i].current;
        targetIdx = i;
      }
    }
    if (ctx.enemyHP[targetIdx]) {
      ctx.enemyHP[targetIdx].current = Math.max(0, ctx.enemyHP[targetIdx].current - card.damage);
      ctx.logs.push(`对敌人${targetIdx + 1}造成${card.damage}伤害`);
    }
    ctx.playerAP -= card.cost;
  } else if (card.type === 'skill' && card.heal !== undefined) {
    ctx.playerHP.current = Math.min(ctx.playerHP.max, ctx.playerHP.current + card.heal);
    ctx.logs.push(`恢复${card.heal}HP`);
    ctx.playerAP -= card.cost;
  } else if (card.type === 'buff' && card.buff) {
    ctx.playerAP -= card.cost;
    ctx.logs.push(`获得${card.buff.attr}+${card.buff.value}，持续${card.buff.turns}回合`);
  }
}

export function getCardsByType(cards: Card[], type: CardType): Card[] {
  return cards.filter((c) => c.type === type);
}

export const TEST_HAND: Card[] = [
  INITIAL_CARD_POOL[0],
  INITIAL_CARD_POOL[1],
  INITIAL_CARD_POOL[4],
];
