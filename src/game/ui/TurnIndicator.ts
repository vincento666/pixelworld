import Phaser from 'phaser';
import type { BattleTurn } from '../battle-data';

interface TurnIndicatorConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
}

export class TurnIndicator {
  private background: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;
  private x: number;
  private y: number;

  constructor(config: TurnIndicatorConfig) {
    this.x = config.x;
    this.y = config.y;
    this.background = config.scene.add.graphics().setDepth(30);
    this.text = config.scene.add.text(this.x, this.y, '', {
      fontFamily: 'Courier New',
      fontSize: '18px',
      color: '#f8f8f8',
      fontStyle: 'bold',
    }).setDepth(31).setOrigin(0.5);
  }

  setTurn(turn: BattleTurn) {
    const color = turn === 'player' ? 0x3d7fff : 0xc85656;
    const label = turn === 'player' ? 'Your Turn' : 'Enemy Turn';

    this.background.clear();
    this.background.fillStyle(0x08111d, 0.92);
    this.background.fillRoundedRect(this.x - 88, this.y - 18, 176, 36, 18);
    this.background.lineStyle(2, color, 1);
    this.background.strokeRoundedRect(this.x - 88, this.y - 18, 176, 36, 18);
    this.text.setText(label);
  }

  destroy() {
    this.background.destroy();
    this.text.destroy();
  }
}
