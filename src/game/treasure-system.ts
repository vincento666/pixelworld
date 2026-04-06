// Treasure System — chest open, reward grant, UI feedback
import type { Treasure, TreasureReward } from './map-registry';
import type Phaser from 'phaser';

export interface RewardResult {
  label: string;
  color: string;
}

export function getRewardLabel(reward: TreasureReward): string {
  switch (reward.type) {
    case 'hp_restore': return `❤️ 回复 ${reward.value} HP`;
    case 'mp_restore': return `💧 回复 ${reward.value} MP`;
    case 'atk_buff':   return `⚔️  攻击力 +${reward.value}%（${reward.battles}场战斗）`;
    case 'def_buff':   return `🛡️  防御力 +${reward.value}%（${reward.battles}场战斗）`;
  }
}

export function applyReward(
  scene: Phaser.Scene,
  reward: TreasureReward,
  playerHP: number, playerMaxHP: number,
  playerMP: number, playerMaxMP: number,
  registry: Phaser.Data.DataManager
): { hp: number; mp: number; hpBarUpdate: boolean; mpBarUpdate: boolean; notes: string[] } {

  let hp = playerHP, mp = playerMP;
  let hpUpdate = false, mpUpdate = false;
  const notes: string[] = [];

  switch (reward.type) {
    case 'hp_restore': {
      const recovered = Math.min(reward.value, playerMaxHP - playerHP);
      hp = playerHP + recovered;
      hpUpdate = true;
      notes.push(`❤️ 回复 ${recovered} HP`);
      break;
    }
    case 'mp_restore': {
      const recovered = Math.min(reward.value, playerMaxMP - playerMP);
      mp = playerMP + recovered;
      mpUpdate = true;
      notes.push(`💧 回复 ${recovered} MP`);
      break;
    }
    case 'atk_buff': {
      const atk = (registry.get('atkBuff') as number) ?? 0;
      registry.set('atkBuff', atk + reward.value);
      const total = atk + reward.value;
      notes.push(`⚔️  攻击力 +${reward.value}% (共 +${total}%)`);
      break;
    }
    case 'def_buff': {
      const def = (registry.get('defBuff') as number) ?? 0;
      registry.set('defBuff', def + reward.value);
      const total = def + reward.value;
      notes.push(`🛡️  防御力 +${reward.value}% (共 +${total}%)`);
      break;
    }
  }

  return { hp, mp, hpBarUpdate: hpUpdate, mpBarUpdate: mpUpdate, notes };
}

export function showTreasureUI(scene: Phaser.Scene, x: number, y: number, onClose: () => void): void {
  const depth = 300;

  // Darken background
  const bg = scene.add.rectangle(480, 320, 960, 640, 0x000000, 0.55).setDepth(depth).setInteractive();

  const panel = scene.add.rectangle(480, 300, 340, 180, 0x1a1020, 0.98)
    .setDepth(depth + 1).setStrokeStyle(2, 0xffcc33);

  const title = scene.add.text(480, 255, '✨ 发现宝箱！', {
    fontFamily: 'Georgia', fontSize: '24px', color: '#ffcc33', fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(depth + 2);

  const chest = scene.add.rectangle(480, 315, 60, 40, 0xffcc33)
    .setDepth(depth + 2).setStrokeStyle(2, 0x996600);
  const chestTop = scene.add.rectangle(480, 302, 64, 16, 0xffe066)
    .setDepth(depth + 2);

  const button = scene.add.rectangle(480, 375, 160, 40, 0x3366ff, 1)
    .setDepth(depth + 2).setInteractive({ useHandCursor: true })
    .on('pointerdown', () => {
      container.destroy();
      onClose();
    });
  const buttonText = scene.add.text(480, 375, '开启', {
    fontFamily: 'Courier New', fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(depth + 3);

  // Animate chest bounce
  scene.tweens.add({
    targets: [chest, chestTop],
    y: '-=8',
    duration: 300,
    yoyo: true,
    repeat: 2,
    ease: 'Sine.easeInOut',
  });

  const container = scene.add.container(0, 0, [bg, panel, title, chest, chestTop, button, buttonText]);
}
