// Shared sprite texture keys for map objects
import Phaser from 'phaser';

export function buildMapSprites(scene: Phaser.Scene): void {
  const G = scene.add.graphics();

  // Portal tile — glowing purple ring
  G.clear();
  G.fillStyle(0x9966ff, 0.9);
  G.fillCircle(28, 28, 20);
  G.fillStyle(0xcc99ff, 0.7);
  G.fillCircle(28, 28, 12);
  G.fillStyle(0xffffff, 0.3);
  G.fillCircle(28, 28, 6);
  G.generateTexture('sprite_portal', 56, 56);
  G.clear();

  // Treasure chest — golden closed chest
  G.fillStyle(0xb8860b, 1);
  G.fillRect(8, 20, 40, 22);
  G.fillStyle(0xffcc33, 1);
  G.fillRect(8, 18, 40, 10);
  G.fillStyle(0xffdd66, 1);
  G.fillRect(8, 18, 40, 5);
  G.fillStyle(0x996600, 1);
  G.fillRect(24, 24, 8, 6); // lock
  G.generateTexture('sprite_chest', 56, 56);
  G.clear();

  // Tavern / building — cottage icon
  G.fillStyle(0x8B6914, 1);
  G.fillRect(8, 28, 40, 20); // walls
  G.fillStyle(0xcc8833, 1);
  G.fillRect(4, 16, 48, 14); // roof
  G.fillStyle(0xff3333, 1);
  G.fillRect(24, 32, 8, 12); // door
  G.fillStyle(0x88ccff, 1);
  G.fillRect(14, 34, 7, 8); // window
  G.fillStyle(0x88ccff, 1);
  G.fillRect(35, 34, 7, 8); // window
  G.generateTexture('sprite_building', 56, 56);

  G.destroy();
}
