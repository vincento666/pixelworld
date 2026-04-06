/**
 * @fileoverview SpriteAnimator — loads TINA.png + REGIONS atlas,
 * registers all 8-direction animations, and provides a character factory.
 *
 * Usage:
 *   import { SpriteAnimator } from '../sprite-anim/SpriteAnimator';
 *   const animator = new SpriteAnimator(scene);
 *   await animator.load();
 *   const sprite = animator.createCharacter('player', x, y);
 *   animator.playWalk(sprite, 'down');
 */

import Phaser from 'phaser';
import { SPRITE_TEXTURE_KEY, REGIONS, ANIMS, buildPhaserAtlasJSON } from './frame-registry';

export class SpriteAnimator {
  constructor(private scene: Phaser.Scene) {}

  /** Load the TINA sprite sheet and register all animations */
  async load(): Promise<void> {
    const textureManager = this.scene.textures;

    // If already loaded, skip
    if (textureManager.exists(SPRITE_TEXTURE_KEY)) {
      this.buildAnimations();
      return;
    }

    // Add the sprite sheet image
    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const src = img as any as HTMLCanvasElement;
        // Build an offscreen canvas from the loaded image
        const offscreen = document.createElement('canvas');
        offscreen.width  = img.width;
        offscreen.height = img.height;
        offscreen.getContext('2d')!.drawImage(img, 0, 0);
        // Use offscreen canvas as source
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        textureManager.addSpriteSheet(SPRITE_TEXTURE_KEY, offscreen as any, {
          frameWidth:  21,
          frameHeight: 42,
        });
        // Store atlas JSON for programmatic frame access
        const atlasJSON = buildPhaserAtlasJSON();
        (this.scene as any).cache.json.add(`${SPRITE_TEXTURE_KEY}.json`, atlasJSON);
        this.buildAnimations();
        resolve();
      };
      img.onerror = () => reject(new Error(`Failed to load sprites/TINA.png`));
      img.crossOrigin = 'anonymous';
      img.src = 'sprites/TINA.png';
    });
  }

  /** Register all anims from ANIMS */
  private buildAnimations(): void {
    const textureManager = this.scene.textures;

    for (const anim of ANIMS) {
      if (this.scene.anims.exists(anim.key)) continue;
      this.scene.anims.create({
        key:    anim.key,
        frames: anim.frames.map((f) => ({
          key: SPRITE_TEXTURE_KEY,
          frame: f,
        })),
        frameRate: anim.frameRate,
        repeat:     anim.repeat,
      });
    }
  }

  // -------------------------------------------------------------------------
  // Character factory
  // -------------------------------------------------------------------------

  /**
   * Create an animated character sprite at (x, y).
   * Scale is adjustable — default 2× for visibility with 56px tiles.
   */
  createCharacter(
    x: number,
    y: number,
    scale = 2.0,
  ): Phaser.GameObjects.Sprite {
    const sprite = this.scene.add.sprite(x, y, SPRITE_TEXTURE_KEY, 'idledown');
    sprite.setDisplaySize(
      (sprite.width  ?? 21) * scale,
      (sprite.height ?? 42) * scale,
    );
    return sprite;
  }

  /** Play the correct walk animation based on direction */
  playWalk(sprite: Phaser.GameObjects.Sprite, direction: 'up' | 'down' | 'left' | 'right'): void {
    const map: Record<string, string> = {
      up:    'walkup',
      down:  'walkdown',
      left:  'walkL',
      right: 'walkR',
    };
    const key = map[direction] ?? 'walkdown';
    if (sprite.anims.currentAnim?.key !== key) sprite.play(key);
  }

  /** Play idle animation */
  playIdle(sprite: Phaser.GameObjects.Sprite, direction: 'up' | 'down' | 'left' | 'right' = 'down'): void {
    const map: Record<string, string> = {
      up:    'idleup',
      down:  'idledown',
      left:  'idleL',
      right: 'idleL',
    };
    const key = map[direction] ?? 'idledown';
    if (sprite.anims.currentAnim?.key !== key) sprite.play(key);
  }

  /** Play run animation */
  playRun(sprite: Phaser.GameObjects.Sprite, direction: 'up' | 'down' | 'left' | 'right'): void {
    const map: Record<string, string> = {
      up:    'runup',
      down:  'rundown',
      left:  'runL',
      right: 'runup',
    };
    const key = map[direction] ?? 'rundown';
    if (sprite.anims.currentAnim?.key !== key) sprite.play(key);
  }

  /** Set sprite facing (mirror) */
  setFacing(sprite: Phaser.GameObjects.Sprite, direction: string): void {
    if (direction === 'left') sprite.setFlipX(true);
    else if (direction === 'right') sprite.setFlipX(false);
  }
}
