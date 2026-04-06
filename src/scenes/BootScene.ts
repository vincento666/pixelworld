import Phaser from 'phaser';
import { sceneEvents, type BattleStartPayload } from '../game/events';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const barW = 300, barH = 20;
    const bx = (960 - barW) / 2, by = 340;
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRect(0, 0, 960, 640);
    bg.fillStyle(0x333355, 1);
    bg.fillRect(bx - 2, by - 2, barW + 4, barH + 4);
    bg.fillStyle(0x0a0a1a, 1);
    bg.fillRect(bx, by, barW, barH);
    const fill = this.add.graphics();
    const loadTxt = this.add.text(480, by + barH + 16, 'Loading...', {
      fontFamily: 'Courier New', fontSize: '14px', color: '#888888',
    }).setOrigin(0.5);
    this.load.on('progress', (p: number) => {
      fill.clear();
      fill.fillStyle(0x4488ff, 1);
      fill.fillRect(bx, by, barW * p, barH);
      loadTxt.setText(`Loading... ${Math.round(p * 100)}%`);
    });
    this.generateTextures();
  }

  create() {
    // Title screen is the entry point — handles hero selection then launches map
    this.scene.launch('TitleScene');
    this.scene.launch('UIScene');

    sceneEvents.on('battleStart', this.handleBattleStart, this);
    sceneEvents.on('battleWon',   this.handleBattleWon,   this);
    sceneEvents.on('battleLost',  this.handleBattleLost,  this);
  }

  private handleBattleStart(payload: BattleStartPayload) {
    if (this.scene.isActive('BattleScene')) return;
    if (this.scene.isActive('MapScene'))    this.scene.pause('MapScene');
    if (this.scene.isActive('CaveScene'))  this.scene.pause('CaveScene');
    this.scene.launch('BattleScene', { enemy: payload.enemy });
  }

  private handleBattleWon() {
    if (this.scene.isActive('BattleScene')) this.scene.stop('BattleScene');
    if (this.scene.isPaused('MapScene'))   this.scene.resume('MapScene');
    if (this.scene.isPaused('CaveScene'))  this.scene.resume('CaveScene');
  }

  private handleBattleLost() {
    if (this.scene.isActive('BattleScene')) this.scene.stop('BattleScene');
    if (this.scene.isPaused('MapScene'))   this.scene.resume('MapScene');
    if (this.scene.isPaused('CaveScene'))  this.scene.resume('CaveScene');
  }

  private hexToInt(hex: string): number {
    return parseInt(hex.replace('#', ''), 16);
  }

  private generateTextures() {
    this.createPlayerSprite('player_sprite', '#e8c49a');
    this.createGoblinSprite('enemy_goblin');
  }

  private createPlayerSprite(key: string, skin: string) {
    const G = this.add.graphics();
    const skinInt = this.hexToInt(skin);
    const hair = 0x3a2510, cloth = 0x2255bb, dark = 0x1a1a2e;
    G.fillStyle(hair, 1);   G.fillRect(10, 2, 12, 5);
    G.fillStyle(skinInt, 1); G.fillRect(10, 7, 12, 11);
    G.fillStyle(dark, 1);   G.fillRect(12, 10, 3, 3); G.fillRect(17, 10, 3, 3);
    G.fillStyle(cloth, 1);  G.fillRect(8, 18, 16, 9);
    G.fillStyle(skinInt, 1);G.fillRect(4, 19, 5, 4); G.fillRect(23, 19, 5, 4);
    G.fillStyle(0x334488, 1);G.fillRect(10, 27, 5, 5); G.fillRect(17, 27, 5, 5);
    G.fillStyle(dark, 1);   G.fillRect(9, 31, 6, 2); G.fillRect(17, 31, 6, 2);
    G.generateTexture(key, 32, 33);
    G.destroy();
  }

  private createGoblinSprite(key: string) {
    const G = this.add.graphics();
    const skin = 0x4a9a4a, dark = 0x2d5e2d, eye = 0xff0000, cloth = 0x8a5a2a;
    G.fillStyle(skin, 1);  G.fillTriangle(2,10,6,4,10,12); G.fillTriangle(30,10,26,4,22,12);
    G.fillStyle(skin, 1);  G.fillRect(8,8,16,13);
    G.fillStyle(eye, 1);   G.fillRect(10,11,5,5); G.fillRect(17,11,5,5);
    G.fillStyle(dark, 1);  G.fillRect(12,13,2,2); G.fillRect(19,13,2,2);
    G.fillStyle(dark, 1);  G.fillRect(12,18,8,3);
    G.fillStyle(cloth, 1); G.fillRect(7,21,18,8);
    G.fillStyle(skin, 1); G.fillRect(3,22,5,4); G.fillRect(24,22,5,4);
    G.fillStyle(dark, 1); G.fillRect(9,29,6,4); G.fillRect(17,29,6,4);
    G.generateTexture(key, 32, 33);
    G.destroy();
  }
}
