import Phaser from 'phaser';
import type { MapEnemyDefinition } from './battle-data';

export interface BattleStartPayload {
  enemy: MapEnemyDefinition;
}

export interface BattleWonPayload {
  enemyId: string;
}

export const sceneEvents = new Phaser.Events.EventEmitter();

