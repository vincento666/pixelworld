import Phaser from 'phaser';

interface MPBarConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class MPBar {
  private scene: Phaser.Scene;
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private graphics: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;

  constructor(config: MPBarConfig) {
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

    this.graphics.clear();
    this.graphics.fillStyle(0x18212d, 1);
    this.graphics.fillRoundedRect(this.x, this.y, this.width, this.height, 6);
    this.graphics.fillStyle(0x5a9cff, 1);
    this.graphics.fillRoundedRect(this.x + 2, this.y + 2, (this.width - 4) * ratio, this.height - 4, 5);
    this.graphics.lineStyle(1, 0xf0f0f0, 0.2);
    this.graphics.strokeRoundedRect(this.x, this.y, this.width, this.height, 6);
    this.text.setText(`MP ${current}/${max}`);
  }

  destroy() {
    this.graphics.destroy();
    this.text.destroy();
  }
}

