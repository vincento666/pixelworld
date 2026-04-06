// Shared sprite texture keys for map objects
import Phaser from 'phaser';

/**
 * Generate reusable map object textures (portal, chest, building).
 * Must be called AFTER the scene's texture manager is ready.
 * Graphics objects are destroyed after texture generation (not added to display list).
 */
export function buildMapSprites(scene: Phaser.Scene): void {
  const W = 56, H = 56;

  // Portal tile — glowing purple ring
  const G1 = scene.add.graphics();
  G1.fillStyle(0x9966ff, 0.9);
  G1.fillCircle(28, 28, 20);
  G1.fillStyle(0xcc99ff, 0.7);
  G1.fillCircle(28, 28, 12);
  G1.fillStyle(0xffffff, 0.3);
  G1.fillCircle(28, 28, 6);
  G1.generateTexture('sprite_portal', W, H);
  G1.destroy();

  // Treasure chest — golden closed chest
  const G2 = scene.add.graphics();
  G2.fillStyle(0xb8860b, 1);
  G2.fillRect(8, 20, 40, 22);
  G2.fillStyle(0xffcc33, 1);
  G2.fillRect(8, 18, 40, 10);
  G2.fillStyle(0xffdd66, 1);
  G2.fillRect(8, 18, 40, 5);
  G2.fillStyle(0x996600, 1);
  G2.fillRect(24, 24, 8, 6);
  G2.generateTexture('sprite_chest', W, H);
  G2.destroy();

  // Tavern / building — cottage icon
  const G3 = scene.add.graphics();
  G3.fillStyle(0x8B6914, 1);
  G3.fillRect(8, 28, 40, 20);
  G3.fillStyle(0xcc8833, 1);
  G3.fillRect(4, 16, 48, 14);
  G3.fillStyle(0xff3333, 1);
  G3.fillRect(24, 32, 8, 12);
  G3.fillStyle(0x88ccff, 1);
  G3.fillRect(14, 34, 7, 8);
  G3.fillRect(35, 34, 7, 8);
  G3.generateTexture('sprite_building', W, H);
  G3.destroy();
}
