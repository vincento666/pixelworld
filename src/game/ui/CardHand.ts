import Phaser from 'phaser';
import type { BattleCard } from '../battle-data';

interface CardHandConfig {
  scene: Phaser.Scene;
  y: number;
}

interface CardSlot {
  background: Phaser.GameObjects.Graphics;
  text: Phaser.GameObjects.Text;
}

export class CardHand {
  private scene: Phaser.Scene;
  private slots: CardSlot[] = [];
  private y: number;

  constructor(config: CardHandConfig) {
    this.scene = config.scene;
    this.y = config.y;

    for (let i = 0; i < 5; i += 1) {
      const background = this.scene.add.graphics().setDepth(20);
      const text = this.scene.add.text(0, 0, '', {
        fontFamily: 'Courier New',
        fontSize: '14px',
        color: '#ffffff',
        align: 'left',
        wordWrap: { width: 132 },
      }).setDepth(21);
      this.slots.push({ background, text });
    }
  }

  render(cards: BattleCard[], selectedIndex: number, currentMP: number) {
    this.slots.forEach((slot, index) => {
      const card = cards[index];
      const x = 34 + index * 182;

      slot.background.clear();
      if (!card) {
        slot.text.setText('');
        return;
      }

      const isSelected = index === selectedIndex;
      const affordable = currentMP >= card.mpCost;
      const fill = affordable ? 0x0f1724 : 0x242424;
      const border = isSelected ? 0xffe08a : card.accentColor;

      slot.background.fillStyle(fill, 0.96);
      slot.background.fillRoundedRect(x, this.y, 160, 120, 10);
      slot.background.fillStyle(card.accentColor, isSelected ? 0.95 : 0.72);
      slot.background.fillRoundedRect(x, this.y, 160, 18, { tl: 10, tr: 10, bl: 0, br: 0 });
      slot.background.lineStyle(isSelected ? 3 : 2, border, affordable ? 1 : 0.35);
      slot.background.strokeRoundedRect(x, this.y, 160, 120, 10);

      const lines = [
        `${index + 1}. ${card.name}`,
        card.element ? card.element.toUpperCase() : 'UTILITY',
        card.damage ? `DMG ${card.damage}` : card.heal ? `HEAL ${card.heal}` : 'BLOCK 50%',
        `MP ${card.mpCost}`,
      ];

      slot.text.setPosition(x + 12, this.y + 26);
      slot.text.setColor(affordable ? '#f6f1dd' : '#909090');
      slot.text.setText(lines.join('\n'));
    });
  }

  destroy() {
    this.slots.forEach((slot) => {
      slot.background.destroy();
      slot.text.destroy();
    });
  }
}

