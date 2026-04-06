// Element System Types

export type Element = 'fire' | 'ice' | 'thunder' | 'water' | 'wind' | 'physical';

export type ReactionType = 'melt' | 'vaporize' | 'conductive' | 'strong_conductive' | 'spread' | 'shatter';

export type SecondaryReactionKey = 'frozen+physical' | 'electrocuted+physical' | 'ignited+water' | 'wet+thunder';

export type ElementalState = 'none' | 'ignited' | 'frozen' | 'electrocuted' | 'wet';

export interface SecondaryReaction {
  name: string;
  damage: number;
  effect: string;
}

export const REACTION_TABLE: Partial<Record<Element, Partial<Record<Element, ReactionType>>>> = {
  fire:    { ice: 'melt', thunder: 'vaporize', water: 'vaporize', wind: 'spread' },
  ice:     { fire: 'melt', thunder: 'conductive', water: 'melt', wind: 'spread' },
  thunder: { fire: 'vaporize', ice: 'conductive', water: 'strong_conductive', wind: 'spread' },
  water:   { fire: 'vaporize', ice: 'melt', thunder: 'strong_conductive', wind: 'spread' },
  wind:    { fire: 'spread', ice: 'spread', thunder: 'spread', water: 'spread' },
  physical:{ fire: 'melt', ice: 'shatter', thunder: 'conductive', water: 'strong_conductive' },
};

export const SECONDARY_REACTIONS: Record<SecondaryReactionKey, SecondaryReaction> = {
  'frozen+physical':      { name: 'shatter',          damage: 15, effect: '破冰附加物理伤害' },
  'electrocuted+physical': { name: 'conductive_break', damage: 12, effect: '导体断裂，感电期间物理伤害+15%' },
  'ignited+water':         { name: 'vaporize_ex',     damage: 20, effect: '沸腾，额外火属性范围伤害' },
  'wet+thunder':          { name: 'chain_lightning', damage: 18, effect: '强导，导电链，附近水体传递电流' },
};

export const REACTION_DAMAGE_MULTIPLIER: Record<ReactionType, number> = {
  melt: 1.5, vaporize: 1.8, conductive: 1.3, strong_conductive: 2.0, spread: 1.2, shatter: 1.4,
};

export const ELEMENT_COLORS: Record<Element, number> = {
  fire: 0xff4400, ice: 0x88ddff, thunder: 0xffdd00,
  water: 0x4488ff, wind: 0xaaffaa, physical: 0xcccccc,
};
