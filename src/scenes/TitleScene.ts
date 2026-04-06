import Phaser from 'phaser';

interface HeroCard {
  cx: number;
  label: Phaser.GameObjects.Text;
  bg: Phaser.GameObjects.Graphics;
}

export class TitleScene extends Phaser.Scene {
  private selectedIdx: number = -1;
  private heroNames: string[] = ['Swordsman', 'Archer', 'Mage', 'Cleric'];
  private startBtn!: Phaser.GameObjects.Text;
  private heroCards: HeroCard[] = [];

  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    const bg = this.add.graphics();
    bg.fillStyle(0x08080f, 1);
    bg.fillRect(0, 0, 960, 640);

    // Stars
    for (let i = 0; i < 80; i++) {
      const sx = Phaser.Math.Between(0, 960);
      const sy = Phaser.Math.Between(0, 400);
      const r = Phaser.Math.FloatBetween(0.5, 2);
      const a = Phaser.Math.FloatBetween(0.2, 0.8);
      bg.fillStyle(0xffffff, a);
      bg.fillCircle(sx, sy, r);
    }

    // Ground
    for (let i = 0; i < 30; i++) {
      bg.fillStyle(0x0a1428, (i / 30) * 0.8);
      bg.fillRect(0, 400 + i * 8, 960, 8);
    }

    // Title
    this.add.text(480, 80, 'PIXEL WORLD', {
      fontFamily: 'Georgia', fontSize: '60px', color: '#e8d4b8',
      fontStyle: 'bold', stroke: '#5a3a1a', strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(480, 138, '-- Octopath Style RPG --', {
      fontFamily: 'Courier New', fontSize: '16px', color: '#8a7a6a',
    }).setOrigin(0.5);

    this.add.text(480, 190, 'Choose Your Hero', {
      fontFamily: 'Courier New', fontSize: '18px', color: '#c0a080',
    }).setOrigin(0.5);

    // Hero cards
    const cardW = 160, cardH = 200, gap = 30;
    const totalW = 4 * cardW + 3 * gap;
    const startX = (960 - totalW) / 2;
    const classColors = [0x2255bb, 0x228844, 0x8833cc, 0xccaa22];

    for (let i = 0; i < 4; i++) {
      const cx = startX + i * (cardW + gap) + cardW / 2;
      const cy = 320;
      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x1a1a2e, 0.9);
      cardBg.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 6);
      cardBg.lineStyle(1, 0x334455, 0.6);
      cardBg.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 6);

      // Class color preview
      const preview = this.add.graphics();
      preview.fillStyle(classColors[i], 0.8);
      preview.fillRoundedRect(cx - 60, cy - 70, 120, 110, 4);
      preview.fillStyle(0xe8c49a, 1);
      preview.fillRect(cx - 20, cy - 50, 40, 60);
      preview.fillStyle(classColors[i], 1);
      preview.fillRect(cx - 22, cy - 75, 44, 30);

      const label = this.add.text(cx, cy + 82, this.heroNames[i], {
        fontFamily: 'Courier New', fontSize: '15px', color: '#c0a080',
      }).setOrigin(0.5);

      const hitArea = this.add.rectangle(cx, cy, cardW, cardH)
        .setInteractive({ useHandCursor: true });
      hitArea.on('pointerover', () => {
        if (this.selectedIdx === i) return;
        cardBg.clear();
        cardBg.fillStyle(0x2a2a4e, 0.95);
        cardBg.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 6);
        cardBg.lineStyle(2, 0x6688aa, 0.8);
        cardBg.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 6);
      });
      hitArea.on('pointerout', () => {
        if (this.selectedIdx === i) return;
        cardBg.clear();
        cardBg.fillStyle(0x1a1a2e, 0.9);
        cardBg.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 6);
        cardBg.lineStyle(1, 0x334455, 0.6);
        cardBg.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 6);
      });
      hitArea.on('pointerdown', () => this.selectHero(i));

      this.heroCards.push({ cx, label, bg: cardBg });
    }

    this.startBtn = this.add.text(480, 560, '[ Select a hero ]', {
      fontFamily: 'Courier New', fontSize: '22px', color: '#444444',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.startBtn.on('pointerdown', () => {
      if (this.selectedIdx < 0) return;
      this.cameras.main.fade(500, 0, 0, 0);
      this.time.delayedCall(500, () => this.scene.start('MapScene'));
    });

    this.add.text(480, 600, 'WASD / Arrows: Move  |  ENTER: Battle  |  A: Attack  S: Skip', {
      fontFamily: 'Courier New', fontSize: '11px', color: '#555555',
    }).setOrigin(0.5);
  }

  private selectHero(idx: number) {
    if (this.selectedIdx >= 0) {
      const prev = this.heroCards[this.selectedIdx];
      prev.bg.clear();
      const cardW = 160, cardH = 200, cy = 320;
      prev.bg.fillStyle(0x1a1a2e, 0.9);
      prev.bg.fillRoundedRect(prev.cx - cardW / 2, cy - cardH / 2, cardW, cardH, 6);
      prev.bg.lineStyle(1, 0x334455, 0.6);
      prev.bg.strokeRoundedRect(prev.cx - cardW / 2, cy - cardH / 2, cardW, cardH, 6);
    }

    this.selectedIdx = idx;
    const card = this.heroCards[idx];
    const cardW = 160, cardH = 200, cy = 320;
    card.bg.clear();
    card.bg.fillStyle(0x2a3a5e, 0.95);
    card.bg.fillRoundedRect(card.cx - cardW / 2, cy - cardH / 2, cardW, cardH, 6);
    card.bg.lineStyle(2, 0xffd700, 0.9);
    card.bg.strokeRoundedRect(card.cx - cardW / 2, cy - cardH / 2, cardW, cardH, 6);

    this.startBtn.setText('[ Begin Adventure ]');
    this.startBtn.setColor('#ffd700');
  }
}
