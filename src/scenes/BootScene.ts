import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Progress bar
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
    const loadTxt = this.add.text(480, by + barH + 16, 'Loading assets...', {
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
    this.scene.start('TitleScene');
  }

  private hexToInt(hex: string): number {
    return parseInt(hex.replace('#', ''), 16);
  }

  private generateTextures() {
    // ---- Player sprite (32x32, 4-direction placeholder) ----
    // Simple humanoid, warm skin tone
    this.createPlayerSprite('player_sprite', '#e8c49a');

    // ---- Enemy: Goblin ----
    this.createGoblinSprite('enemy_goblin');
  }

  private createPlayerSprite(key: string, skin: string) {
    const G = this.add.graphics();
    const skinInt = this.hexToInt(skin);
    const hair = 0x3a2510;
    const cloth = 0x2255bb;
    const dark = 0x1a1a2e;

    // Hair
    G.fillStyle(hair, 1);
    G.fillRect(10, 2, 12, 5);
    // Head
    G.fillStyle(skinInt, 1);
    G.fillRect(10, 7, 12, 11);
    // Eyes
    G.fillStyle(dark, 1);
    G.fillRect(12, 10, 3, 3);
    G.fillRect(17, 10, 3, 3);
    // Body / tunic
    G.fillStyle(cloth, 1);
    G.fillRect(8, 18, 16, 9);
    // Arms
    G.fillStyle(skinInt, 1);
    G.fillRect(4, 19, 5, 4);
    G.fillRect(23, 19, 5, 4);
    // Legs
    G.fillStyle(0x334488, 1);
    G.fillRect(10, 27, 5, 5);
    G.fillRect(17, 27, 5, 5);
    // Feet
    G.fillStyle(dark, 1);
    G.fillRect(9, 31, 6, 2);
    G.fillRect(17, 31, 6, 2);

    G.generateTexture(key, 32, 33);
    G.destroy();
  }

  private createGoblinSprite(key: string) {
    const G = this.add.graphics();
    const skin = 0x4a9a4a;
    const dark = 0x2d5e2d;
    const eye = 0xff0000;
    const cloth = 0x8a5a2a;

    // Ears (pointy)
    G.fillStyle(skin, 1);
    G.fillTriangle(2, 10, 6, 4, 10, 12);
    G.fillTriangle(30, 10, 26, 4, 22, 12);
    // Head
    G.fillStyle(skin, 1);
    G.fillRect(8, 8, 16, 13);
    // Eyes (big red)
    G.fillStyle(eye, 1);
    G.fillRect(10, 11, 5, 5);
    G.fillRect(17, 11, 5, 5);
    // Pupils
    G.fillStyle(dark, 1);
    G.fillRect(12, 13, 2, 2);
    G.fillRect(19, 13, 2, 2);
    // Mouth
    G.fillStyle(dark, 1);
    G.fillRect(12, 18, 8, 3);
    // Body
    G.fillStyle(cloth, 1);
    G.fillRect(7, 21, 18, 8);
    // Arms
    G.fillStyle(skin, 1);
    G.fillRect(3, 22, 5, 4);
    G.fillRect(24, 22, 5, 4);
    // Legs
    G.fillStyle(dark, 1);
    G.fillRect(9, 29, 6, 4);
    G.fillRect(17, 29, 6, 4);

    G.generateTexture(key, 32, 33);
    G.destroy();
  }
}
