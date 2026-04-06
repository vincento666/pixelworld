import Phaser from 'phaser';

interface HPBarConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class HPBar {
  private scene: Phaser.Scene;
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private graphics: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;

  constructor(config: HPBarConfig) {
    this.scene = config.scene;
    this.x = config.x;
    this.y = config.y;
    this.width = config.width;
    this.height = config.height;
    this.graphics = this.scene.add.graphics();
    this.text = this.scene.add.text(this.x, this.y - 18, '', {
      fontFamily: 'Courier New',
      fontSize: '14px',
      color: '#f4f4f4',
    });
  }

  setValue(current: number, max: number) {
    const ratio = Phaser.Math.Clamp(current / max, 0, 1);
    const color = ratio > 0.5 ? 0x4ad66d : ratio > 0.25 ? 0xf5b642 : 0xf25f5c;

    this.graphics.clear();
    this.graphics.fillStyle(0x18212d, 1);
    this.graphics.fillRoundedRect(this.x, this.y, this.width, this.height, 6);
    this.graphics.fillStyle(color, 1);
    this.graphics.fillRoundedRect(this.x + 2, this.y + 2, (this.width - 4) * ratio, this.height - 4, 5);
    this.graphics.lineStyle(1, 0xf0f0f0, 0.2);
    this.graphics.strokeRoundedRect(this.x, this.y, this.width, this.height, 6);
    this.text.setText(`HP ${current}/${max}`);
  }

  destroy() {
    this.graphics.destroy();
    this.text.destroy();
  }
}

