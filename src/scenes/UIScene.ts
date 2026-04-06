import Phaser from 'phaser';

interface DamageEvent { value: number; x: number; y: number; }
interface HealEvent   { value: number; x: number; y: number; }
interface ElementReactEvent { element: string; x: number; y: number; }

export class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UIScene' }); }

  create() {
    // Battle start toast
    this.game.events.on('battleStart', () => {
      const toast = this.add.text(480, 260, '⚔ 战斗开始！', {
        fontFamily: 'Courier New', fontSize: '32px', color: '#ff6b6b',
        backgroundColor: '#1a0a0a', padding: { x: 24, y: 12 },
        stroke: '#5a0000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(200);
      this.tweens.add({ targets: toast, alpha: 0, y: 220, duration: 2000, onComplete: () => toast.destroy() });
    });

    // Damage numbers
    this.game.events.on('damage', (data: DamageEvent) => {
      const txt = this.add.text(data.x, data.y - 20, `-${data.value}`, {
        fontFamily: 'Courier New', fontSize: '28px', color: '#ff4444',
        fontStyle: 'bold', stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(300);
      this.tweens.add({
        targets: txt, y: data.y - 80, alpha: 0, duration: 1100,
        ease: 'Cubic.easeOut', onComplete: () => txt.destroy(),
      });
    });

    // Heal numbers
    this.game.events.on('heal', (data: HealEvent) => {
      const txt = this.add.text(data.x, data.y - 20, `+${data.value} HP`, {
        fontFamily: 'Courier New', fontSize: '24px', color: '#44ff88',
        fontStyle: 'bold', stroke: '#003300', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(300);
      this.tweens.add({
        targets: txt, y: data.y - 70, alpha: 0, duration: 1200,
        ease: 'Cubic.easeOut', onComplete: () => txt.destroy(),
      });
    });

    // Element reaction particles
    this.game.events.on('elementReact', (data: ElementReactEvent) => {
      this.spawnElementParticles(data.element as string, data.x, data.y);
    });

    // Victory
    this.game.events.on('victory', () => {
      const banner = this.add.text(480, 160, '★ 胜利！★', {
        fontFamily: 'Georgia', fontSize: '48px', color: '#ffd700',
        fontStyle: 'bold', stroke: '#5a3a00', strokeThickness: 5,
      }).setOrigin(0.5).setDepth(200);
      this.tweens.add({ targets: banner, scaleX: 1.15, scaleY: 1.15, duration: 300, yoyo: true, repeat: 2,
        onComplete: () => banner.destroy() });
      const soul = this.add.text(480, 210, '灵魂印记 +1', {
        fontFamily: 'Courier New', fontSize: '18px', color: '#c0a0ff',
      }).setOrigin(0.5).setDepth(200);
      this.tweens.add({ targets: soul, alpha: 0, y: 190, duration: 2500, delay: 600,
        onComplete: () => soul.destroy() });
    });
  }

  private spawnElementParticles(element: string, x: number, y: number) {
    switch (element) {
      case 'fire':    this.spawnFireParticles(x, y);   break;
      case 'thunder': this.spawnThunderParticles(x, y); break;
      case 'ice':     this.spawnIceParticles(x, y);    break;
      case 'wind':    this.spawnWindParticles(x, y);   break;
      case 'water':   this.spawnWaterParticles(x, y); break;
      default:        this.spawnGenericParticles(x, y, 0xffdd44); break;
    }
  }

  private spawnFireParticles(x: number, y: number) {
    const container = this.add.container(x, y).setDepth(250);
    for (let i = 0; i < 12; i++) {
      const r = this.add.graphics();
      const radius = Phaser.Math.Between(4, 10);
      r.fillStyle(0xff4400, Phaser.Math.FloatBetween(0.6, 1));
      r.fillCircle(0, 0, radius);
      container.add(r);
      const angle = (i / 12) * Math.PI * 2;
      const dist = Phaser.Math.Between(30, 70);
      this.tweens.add({
        targets: r,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist - 20,
        alpha: 0,
        duration: Phaser.Math.Between(600, 900),
        ease: 'Cubic.easeOut',
        onComplete: () => { r.destroy(); },
      });
    }
    this.tweens.add({ targets: container, alpha: 0, duration: 1000, delay: 200,
      onComplete: () => container.destroy() });
  }

  private spawnThunderParticles(x: number, y: number) {
    const container = this.add.container(x, y).setDepth(250);
    for (let i = 0; i < 8; i++) {
      const g = this.add.graphics();
      g.lineStyle(Phaser.Math.Between(1, 3), 0xffdd00, Phaser.Math.FloatBetween(0.7, 1));
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const len = Phaser.Math.Between(20, 50);
      const px = Math.cos(angle) * len;
      const py = Math.sin(angle) * len;
      const mx = (Math.random() - 0.5) * 20;
      const my = (Math.random() - 0.5) * 20;
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(px * 0.5 + mx, py * 0.5 + my);
      g.lineTo(px, py);
      g.strokePath();
      container.add(g);
      this.tweens.add({
        targets: g,
        alpha: 0,
        duration: Phaser.Math.Between(300, 600),
        delay: i * 40,
        onComplete: () => { g.destroy(); },
      });
    }
    this.tweens.add({ targets: container, alpha: 0, duration: 700,
      onComplete: () => container.destroy() });
  }

  private spawnIceParticles(x: number, y: number) {
    const container = this.add.container(x, y).setDepth(250);
    for (let i = 0; i < 10; i++) {
      const g = this.add.graphics();
      const size = Phaser.Math.Between(4, 10);
      g.fillStyle(0x88ddff, Phaser.Math.FloatBetween(0.5, 0.9));
      // Draw diamond shape
      g.beginPath();
      g.moveTo(0, -size);
      g.lineTo(size, 0);
      g.lineTo(0, size);
      g.lineTo(-size, 0);
      g.closePath();
      g.fillPath();
      container.add(g);
      const tx = (Math.random() - 0.5) * 80;
      const ty = (Math.random() - 0.5) * 80;
      this.tweens.add({
        targets: g,
        x: tx, y: ty,
        alpha: 0,
        angle: Phaser.Math.Between(-180, 180),
        duration: Phaser.Math.Between(600, 1000),
        ease: 'Cubic.easeOut',
        onComplete: () => { g.destroy(); },
      });
    }
    this.tweens.add({ targets: container, alpha: 0, duration: 1200,
      onComplete: () => container.destroy() });
  }

  private spawnWindParticles(x: number, y: number) {
    const container = this.add.container(x, y).setDepth(250);
    for (let i = 0; i < 8; i++) {
      const g = this.add.graphics();
      g.lineStyle(2, 0x44ff88, Phaser.Math.FloatBetween(0.4, 0.8));
      const len = Phaser.Math.Between(15, 35);
      const angle = (i / 8) * Math.PI * 2;
      const px = Math.cos(angle) * len;
      const py = Math.sin(angle) * len;
      g.lineBetween(0, 0, px, py);
      container.add(g);
      const dist = Phaser.Math.Between(40, 80);
      this.tweens.add({
        targets: g,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        alpha: 0,
        duration: Phaser.Math.Between(500, 800),
        delay: i * 50,
        onComplete: () => { g.destroy(); },
      });
    }
    this.tweens.add({ targets: container, alpha: 0, duration: 900,
      onComplete: () => container.destroy() });
  }

  private spawnWaterParticles(x: number, y: number) {
    const container = this.add.container(x, y).setDepth(250);
    for (let i = 0; i < 10; i++) {
      const g = this.add.graphics();
      g.fillStyle(0x4488ff, Phaser.Math.FloatBetween(0.5, 0.9));
      g.fillCircle(0, 0, Phaser.Math.Between(3, 8));
      container.add(g);
      const angle = (i / 10) * Math.PI * 2;
      const dist = Phaser.Math.Between(30, 60);
      this.tweens.add({
        targets: g,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist + 20,
        alpha: 0,
        duration: Phaser.Math.Between(600, 1000),
        delay: i * 60,
        ease: 'Cubic.easeIn',
        onComplete: () => { g.destroy(); },
      });
    }
    this.tweens.add({ targets: container, alpha: 0, duration: 1200,
      onComplete: () => container.destroy() });
  }

  private spawnGenericParticles(x: number, y: number, color: number) {
    const container = this.add.container(x, y).setDepth(250);
    for (let i = 0; i < 8; i++) {
      const g = this.add.graphics();
      g.fillStyle(color, 0.8);
      g.fillCircle(0, 0, 5);
      container.add(g);
      const angle = (i / 8) * Math.PI * 2;
      const dist = Phaser.Math.Between(30, 60);
      this.tweens.add({
        targets: g,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        alpha: 0,
        duration: 600,
        onComplete: () => { g.destroy(); },
      });
    }
    this.tweens.add({ targets: container, alpha: 0, duration: 700,
      onComplete: () => container.destroy() });
  }
}
