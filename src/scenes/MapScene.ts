import Phaser from 'phaser';
import { MAP_REGISTRY, TILE, type MapDefinition, type Treasure } from '../game/map-registry';
import { sceneEvents } from '../game/events';
import { showTreasureUI } from '../game/treasure-system';
import { pickRandomEvent, showEventOverlay } from '../game/event-overlay';
import { buildMapSprites } from '../game/sprites';
import { BlobTerrain } from '../game/sprite-anim/blobTerrain';
import { SpriteAnimator } from '../game/sprite-anim/SpriteAnimator';

const TILE_SIZE = 56;
const MAP_OFFSET_X = 32;
const MAP_OFFSET_Y = 68;
const PLAYER_SPEED = 170;

interface EnemyActor {
  id: string;
  sprite: Phaser.Physics.Arcade.Image;
  label: Phaser.GameObjects.Text;
}

interface TreasureActor {
  treasure: Treasure;
  sprite: Phaser.Physics.Arcade.Image;
}

interface PortalActor {
  sprite: Phaser.Physics.Arcade.Image;
  targetMap: string;
  targetGX?: number;
  targetGY?: number;
}

interface BuildingActor {
  sprite: Phaser.Physics.Arcade.Image;
}

export class MapScene extends Phaser.Scene {
  private mapDef!: MapDefinition;
  private player!: Phaser.Physics.Arcade.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };
  private wallGroup!: Phaser.Physics.Arcade.StaticGroup;
  private portalGroup!: Phaser.Physics.Arcade.StaticGroup;
  private enemies: EnemyActor[] = [];
  private treasureActors: TreasureActor[] = [];
  private portalActors: PortalActor[] = [];
  private buildingActors: BuildingActor[] = [];
  private battlePending = false;
  private pendingPortal: { targetMap: string; targetGX?: number; targetGY?: number } | null = null;
  private mapNameText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  // infiniteMap 集成
  private terrain!: BlobTerrain;
  private spriteAnimator!: SpriteAnimator;
  private playerVisual!: Phaser.GameObjects.Sprite;
  private currentFacing: 'up' | 'down' | 'left' | 'right' = 'down';

  constructor() {
    super({ key: 'MapScene' });
  }

  init() {
    this.mapDef = MAP_REGISTRY['grass'];
  }

  create() {
    // Camera must cover the full viewport to prevent black screen
    this.cameras.main.setViewport(0, 0, 960, 640);
    this.cameras.main.setBounds(0, 0, 960, 640);
    this.cameras.main.setBackgroundColor(
      '#' + this.mapDef.bgColor.toString(16).padStart(6, '0')
    );
    // Generate map object textures (portal, chest, building)
    buildMapSprites(this);

    // ── BlobTerrain: procedural infinite terrain (FBM noise) ──────────────
    this.terrain = new BlobTerrain();
    this.drawBlobTerrain();

    // ── SpriteAnimator: animated character sprites (TINA.png) ─────────────
    this.spriteAnimator = new SpriteAnimator(this);
    this.spriteAnimator.load().catch(() => {
      /* TINA.png not found — visual will use __WHITE */
    });

    this.wallGroup = this.physics.add.staticGroup();
    this.portalGroup = this.physics.add.staticGroup();
    this.enemies = [];
    this.treasureActors = [];
    this.portalActors = [];
    this.buildingActors = [];
    this.battlePending = false;

    this.drawTiles();
    this.createWalls();
    this.createPortals();
    this.createTreasures();
    this.createBuildings();
    this.createPlayer();
    this.createEnemies();
    this.createHud();
    this.createInput();
    this.createMapHint();

    this.physics.add.collider(this.player, this.wallGroup);
    this.enemies.forEach((ea) => {
      this.physics.add.overlap(this.player, ea.sprite, () => this.startBattle(ea.id));
    });

    sceneEvents.on('battleWon', this.handleBattleWon, this);
    sceneEvents.on('battleLost', this.handleBattleLost, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      sceneEvents.off('battleWon', this.handleBattleWon, this);
      sceneEvents.off('battleLost', this.handleBattleLost, this);
      this.playerVisual?.destroy();
      this.terrain?.clearCache();
    });
  }

  // ── Procedural terrain layer via FBM noise ─────────────────────────────
  private drawBlobTerrain() {
    const G = this.add.graphics();
    const startTX = Math.floor(MAP_OFFSET_X / 32);
    const startTY = Math.floor(MAP_OFFSET_Y / 32);
    const tileCols = Math.ceil((960 - MAP_OFFSET_X) / TILE_SIZE) + 1;
    const tileRows = Math.ceil((640 - MAP_OFFSET_Y) / TILE_SIZE) + 1;

    for (let row = 0; row < tileRows; row++) {
      for (let col = 0; col < tileCols; col++) {
        const tx = startTX + col;
        const ty = startTY + row;
        const tile = this.terrain.getTile(tx, ty);
        const wx = MAP_OFFSET_X + col * TILE_SIZE;
        const wy = MAP_OFFSET_Y + row * TILE_SIZE;

        if (tile.type === 0) { // WATER — subtle blue tint
          G.fillStyle(0x2266aa, 0.12);
          G.fillRect(wx, wy, TILE_SIZE, TILE_SIZE);
        } else if (tile.type === 2) { // MOUNTAIN — subtle brown tint
          G.fillStyle(0x5a4a3a, 0.08);
          G.fillRect(wx, wy, TILE_SIZE, TILE_SIZE);
        } else { // FLAT — elevation-based grey-green variation
          const g = Math.min(255, Math.floor(0x90 * tile.elevation + 0x60));
          G.fillStyle(((g << 16) | (g << 8) | g) >>> 0, 0.05);
          G.fillRect(wx, wy, TILE_SIZE, TILE_SIZE);
        }
      }
    }
  }

  private drawTiles() {
    const g = this.add.graphics();
    const { tiles, wallColor, bgColor } = this.mapDef;
    const rows = tiles.length;
    const cols = tiles[0].length;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const t = tiles[row][col];
        const x = MAP_OFFSET_X + col * TILE_SIZE;
        const y = MAP_OFFSET_Y + row * TILE_SIZE;

        if (t === TILE.WALL) {
          g.fillStyle(wallColor, 1);
          g.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          g.lineStyle(1, 0x333344, 0.5);
          g.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
        } else if (t === TILE.PATH) {
          g.fillStyle(0x7a5c3a, 1);
          g.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        } else {
          g.fillStyle(bgColor, 1);
          g.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          g.lineStyle(1, 0x2a4a2a, 0.3);
          g.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
        }
      }
    }
  }

  private createWalls() {
    const { tiles } = this.mapDef;
    const rows = tiles.length, cols = tiles[0].length;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (tiles[row][col] !== TILE.WALL) continue;
        const wall = this.wallGroup.create(
          MAP_OFFSET_X + col * TILE_SIZE + TILE_SIZE / 2,
          MAP_OFFSET_Y + row * TILE_SIZE + TILE_SIZE / 2,
          '__WHITE'
        );
        wall.setDisplaySize(TILE_SIZE, TILE_SIZE);
        wall.setAlpha(0.001);
        wall.refreshBody();
      }
    }
  }

  private createPortals() {
    for (const portal of this.mapDef.portals) {
      const sprite = this.physics.add.staticImage(
        MAP_OFFSET_X + portal.gx * TILE_SIZE + TILE_SIZE / 2,
        MAP_OFFSET_Y + portal.gy * TILE_SIZE + TILE_SIZE / 2,
        'sprite_portal'
      );
      sprite.setDisplaySize(TILE_SIZE, TILE_SIZE);
      sprite.refreshBody();
      this.portalActors.push({ sprite, targetMap: portal.targetMap, targetGX: portal.targetGX, targetGY: portal.targetGY });

      this.tweens.add({
        targets: sprite,
        alpha: { from: 0.7, to: 1.0 },
        scale: { from: 0.95, to: 1.05 },
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.add.text(sprite.x, sprite.y - 34, '▶ 传送', {
        fontFamily: 'Courier New', fontSize: '11px', color: '#9966ff',
        backgroundColor: '#00000088', padding: { x: 4, y: 2 },
      }).setOrigin(0.5);

      this.physics.add.overlap(this.player, sprite, () => {
        if (this.battlePending) return;
        this.transitionToPortal(portal);
      });
    }
  }

  private createTreasures() {
    for (const treasure of this.mapDef.treasures) {
      if (treasure.opened) continue;
      const sprite = this.physics.add.staticImage(
        MAP_OFFSET_X + treasure.gx * TILE_SIZE + TILE_SIZE / 2,
        MAP_OFFSET_Y + treasure.gy * TILE_SIZE + TILE_SIZE / 2,
        'sprite_chest'
      );
      sprite.setDisplaySize(TILE_SIZE, TILE_SIZE);
      sprite.refreshBody();
      this.treasureActors.push({ treasure, sprite });

      this.add.text(sprite.x, sprite.y - 34, '💰 宝箱', {
        fontFamily: 'Courier New', fontSize: '11px', color: '#ffcc33',
        backgroundColor: '#00000088', padding: { x: 4, y: 2 },
      }).setOrigin(0.5);

      this.physics.add.overlap(this.player, sprite, () => {
        if (this.battlePending) return;
        this.openTreasure(treasure, sprite);
      });
    }
  }

  private createBuildings() {
    const { tiles } = this.mapDef;
    for (let row = 0; row < tiles.length; row++) {
      for (let col = 0; col < tiles[0].length; col++) {
        if (tiles[row][col] !== TILE.BUILDING) continue;
        const x = MAP_OFFSET_X + col * TILE_SIZE + TILE_SIZE / 2;
        const y = MAP_OFFSET_Y + row * TILE_SIZE + TILE_SIZE / 2;
        const sprite = this.physics.add.staticImage(x, y, 'sprite_building');
        sprite.setDisplaySize(TILE_SIZE, TILE_SIZE);
        sprite.refreshBody();
        this.buildingActors.push({ sprite });

        this.add.text(x, y - 34, '🏠 酒馆', {
          fontFamily: 'Courier New', fontSize: '11px', color: '#aaffcc',
          backgroundColor: '#00000088', padding: { x: 4, y: 2 },
        }).setOrigin(0.5);

        this.physics.add.overlap(this.player, sprite, () => {
          if (this.battlePending) return;
          this.enterTavern();
        });
      }
    }
  }

  private createPlayer() {
    const startGX = 1, startGY = 1;
    const px = MAP_OFFSET_X + startGX * TILE_SIZE + TILE_SIZE / 2;
    const py = MAP_OFFSET_Y + startGY * TILE_SIZE + TILE_SIZE / 2;

    // Physics body — collision, movement, world bounds
    this.player = this.physics.add.image(px, py, '__WHITE');
    this.player.setTint(0xffffff);
    this.player.setAlpha(0.0); // invisible — rendered via playerVisual
    this.player.setCollideWorldBounds(true);
    this.player.setDrag(1200, 1200);
    this.player.setMaxVelocity(PLAYER_SPEED, PLAYER_SPEED);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(24, 24);

    // Animated visual sprite — overlaid on physics body position
    this.playerVisual = this.add.sprite(px, py, '__WHITE');
    this.playerVisual.setDisplaySize(26, 26);
    this.currentFacing = 'down';
  }

  private createEnemies() {
    const defeated = (this.registry.get('defeatedEnemies') as string[] | undefined) ?? [];
    for (const enemyDef of this.mapDef.enemies) {
      if (defeated.includes(enemyDef.gx + '_' + enemyDef.gy)) continue;

      const colorMap: Record<string, number> = {
        goblin_grunt:  0x6ea34c,
        goblin_archer: 0x8fbf5b,
        goblin_shaman: 0xaa66cc,
      };
      const color = colorMap[enemyDef.type] ?? 0x6ea34c;
      const nameMap: Record<string, string> = {
        goblin_grunt:  '哥布林战士',
        goblin_archer: '哥布林弓手',
        goblin_shaman: '哥布林萨满',
      };
      const name = nameMap[enemyDef.type] ?? enemyDef.type;
      const id = `${enemyDef.gx}_${enemyDef.gy}`;

      const sprite = this.physics.add.image(
        MAP_OFFSET_X + enemyDef.gx * TILE_SIZE + TILE_SIZE / 2,
        MAP_OFFSET_Y + enemyDef.gy * TILE_SIZE + TILE_SIZE / 2,
        '__WHITE'
      );
      sprite.setTint(color);
      sprite.setDisplaySize(26, 26);
      sprite.setImmovable(true);
      sprite.body.setAllowGravity(false);
      sprite.body.moves = false;

      const label = this.add.text(sprite.x, sprite.y - 28, name, {
        fontFamily: 'Courier New', fontSize: '12px', color: '#ffffff',
        backgroundColor: '#00000066', padding: { x: 4, y: 2 },
      }).setOrigin(0.5);

      this.enemies.push({ id, sprite, label });
    }
  }

  private createHud() {
    const mapNameColor = this.mapDef.id === 'grass' ? '#4ad66d' : this.mapDef.id === 'cave' ? '#88ccff' : '#ffaa66';
    this.mapNameText = this.add.text(480, 16, `📍 ${this.mapDef.name}`, {
      fontFamily: 'Georgia', fontSize: '20px', color: mapNameColor, fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.hintText = this.add.text(480, 44, 'WASD/方向键移动  ·  走近敌人触发战斗  ·  走近传送门/宝箱/酒馆触发事件', {
      fontFamily: 'Courier New', fontSize: '11px', color: '#556677',
    }).setOrigin(0.5, 0);

    const hp = this.registry.get('playerHP') ?? 80;
    const mp = this.registry.get('playerMP') ?? 30;
    const maxHp = 80, maxMp = 30;

    this.add.text(16, 16, `❤️ HP: ${hp}/${maxHp}`, {
      fontFamily: 'Courier New', fontSize: '13px', color: '#ff6666',
    });
    this.add.text(16, 34, `💧 MP: ${mp}/${maxMp}`, {
      fontFamily: 'Courier New', fontSize: '13px', color: '#66aaff',
    });
  }

  private createInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up:    this.input.keyboard!.addKey('W'),
      down:  this.input.keyboard!.addKey('S'),
      left:  this.input.keyboard!.addKey('A'),
      right: this.input.keyboard!.addKey('D'),
    };
  }

  private createMapHint() {
    const panel = this.add.graphics();
    panel.fillStyle(0x000000, 0.75);
    panel.fillRect(0, 580, 960, 60);
    this.add.text(480, 595, 'WASD / 方向键 移动    → 走向敌人自动进入战斗    → 传送门/宝箱/酒馆触发事件', {
      fontFamily: 'Courier New', fontSize: '15px', color: '#ffffff',
    }).setOrigin(0.5, 0.5);

    this.add.text(480, 50, '📍 ' + this.mapDef.name, {
      fontFamily: 'Georgia', fontSize: '22px', color: '#ffffff', fontStyle: 'bold',
      backgroundColor: '#00000088',
    }).setOrigin(0.5, 0);

    const alive = this.mapDef.enemies.length;
    this.add.text(480, 80, '⚔ ' + alive + ' 个敌人在此区域', {
      fontFamily: 'Courier New', fontSize: '14px', color: '#ffaa66',
    }).setOrigin(0.5, 0);
  }

  update() {
    if (!this.player) return;
    if (this.battlePending) {
      this.player.setVelocity(0, 0);
      return;
    }

    const left  = (this.cursors.left?.isDown  || this.wasd.left.isDown)  ? -1 : 0;
    const right = (this.cursors.right?.isDown || this.wasd.right.isDown) ?  1 : 0;
    const up    = (this.cursors.up?.isDown    || this.wasd.up.isDown)    ? -1 : 0;
    const down  = (this.cursors.down?.isDown  || this.wasd.down.isDown)  ?  1 : 0;
    const vx = (left + right) * PLAYER_SPEED;
    const vy = (up + down) * PLAYER_SPEED;
    this.player.setVelocity(vx, vy);
    const body = this.player.body as Phaser.Physics.Arcade.Body | null;
    if (body && (vx !== 0 || vy !== 0)) {
      body.velocity.normalize().scale(PLAYER_SPEED);
    }

    // ── Sync visual sprite + drive animation from WASD direction ──────────
    let facing: 'up' | 'down' | 'left' | 'right' = this.currentFacing;
    if (vx < 0) facing = 'left';
    else if (vx > 0) facing = 'right';
    else if (vy < 0) facing = 'up';
    else if (vy > 0) facing = 'down';
    this.currentFacing = facing;

    if (this.playerVisual) {
      // Follow physics body
      this.playerVisual.setPosition(this.player.x, this.player.y);
      const isMoving = vx !== 0 || vy !== 0;
      if (this.spriteAnimator) {
        if (isMoving) {
          this.spriteAnimator.playWalk(this.playerVisual, facing);
        } else {
          this.spriteAnimator.playIdle(this.playerVisual, facing);
        }
      }
    }
  }

  private startBattle(enemyId: string) {
    if (this.battlePending) return;
    this.battlePending = true;
    this.player.setVelocity(0, 0);

    const enemyDef = this.mapDef.enemies.find(e => `${e.gx}_${e.gy}` === enemyId);
    const nameMap: Record<string, string> = {
      goblin_grunt:  'Goblin Grunt',
      goblin_archer: 'Goblin Archer',
      goblin_shaman: 'Goblin Shaman',
    };
    sceneEvents.emit('battleStart', {
      enemy: enemyDef ? {
        id: enemyId,
        name: nameMap[enemyDef.type] ?? enemyDef.type,
        maxHP: enemyDef.type === 'goblin_shaman' ? 38 : enemyDef.type === 'goblin_grunt' ? 30 : 20,
        color: 0x6ea34c,
        attackElements: ['fire'] as const,
      } : { id: enemyId, name: 'Goblin', maxHP: 30, color: 0x6ea34c, attackElements: ['fire'] as const },
    } as any);
  }

  private handleBattleWon() {
    this.battlePending = false;
    const remaining = this.enemies.filter(e => this.enemies.includes(e) && e.sprite.active);
    if (remaining.length === 0) {
      this.showMapClearedBanner();
    }
  }

  private handleBattleLost() {
    this.battlePending = false;
    this.showGameOverOverlay();
  }

  private showMapClearedBanner() {
    const depth = 500;
    const bg = this.add.rectangle(480, 160, 460, 90, 0x000000, 0.7).setDepth(depth);
    const banner = this.add.rectangle(480, 160, 450, 80, 0x1a3a1a, 0.95)
      .setDepth(depth + 1).setStrokeStyle(2, 0x4ad66d);
    const text = this.add.text(480, 152, '✅ 本区敌人全灭！', {
      fontFamily: 'Georgia', fontSize: '20px', color: '#4ad66d', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(depth + 2);
    const sub = this.add.text(480, 178, '找到 ▶ 传送门 前往下一区域', {
      fontFamily: 'Courier New', fontSize: '14px', color: '#aaffaa',
    }).setOrigin(0.5).setDepth(depth + 2);
    this.tweens.add({ targets: banner, alpha: { from: 0.6, to: 1 }, duration: 600, yoyo: true, repeat: -1 });
  }

  private showGameOverOverlay() {
    const depth = 500;
    const bg = this.add.rectangle(480, 320, 960, 640, 0x000000, 0.72).setDepth(depth);
    const panel = this.add.rectangle(480, 320, 360, 220, 0x1a0808, 0.96)
      .setDepth(depth + 1).setStrokeStyle(3, 0xe06b6b);
    const title = this.add.text(480, 264, '💀 冒险结束', {
      fontFamily: 'Georgia', fontSize: '38px', color: '#ff8f8f', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(depth + 2);
    const sub = this.add.text(480, 310, '你倒在了冒险的路上...', {
      fontFamily: 'Courier New', fontSize: '15px', color: '#cc8888',
    }).setOrigin(0.5).setDepth(depth + 2);

    const btn = this.add.rectangle(480, 370, 180, 44, 0x8b2020, 1)
      .setDepth(depth + 2).setInteractive({ useHandCursor: true });
    const btnTxt = this.add.text(480, 370, '重新开始', {
      fontFamily: 'Courier New', fontSize: '20px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(depth + 3);
    btn.on('pointerdown', () => {
      this.scene.restart();
    });
    this.tweens.add({ targets: panel, x: '+4', duration: 60, yoyo: true, repeat: 4 });
  }

  private transitionToPortal(portal: { targetMap: string; targetGX?: number; targetGY?: number }) {
    if (this.battlePending) return;
    this.battlePending = true;

    const overlay = this.add.rectangle(480, 320, 960, 640, 0x000000, 0).setDepth(200);
    this.tweens.add({
      targets: overlay,
      fillAlpha: 0.85,
      duration: 400,
      onComplete: () => {
        this.battlePending = false;
        this.scene.start(portal.targetMap === 'cave' ? 'CaveScene' : 'MapScene', {
          spawnGX: portal.targetGX,
          spawnGY: portal.targetGY,
        });
      },
    });
  }

  private openTreasure(treasure: Treasure, sprite: Phaser.Physics.Arcade.Image) {
    treasure.opened = true;
    const idx = this.treasureActors.findIndex(t => t.treasure === treasure);
    if (idx >= 0) this.treasureActors.splice(idx, 1);

    this.tweens.add({
      targets: sprite,
      y: '-=16',
      alpha: 0,
      duration: 500,
      onComplete: () => sprite.destroy(),
    });

    const { applyReward } = require('../game/treasure-system');
    const hp = this.registry.get('playerHP') as number ?? 80;
    const mp = this.registry.get('playerMP') as number ?? 30;
    const result = applyReward(this, treasure.reward, hp, 80, mp, 30, this.registry);
    if (result.hpBarUpdate) this.registry.set('playerHP', result.hp);
    if (result.mpBarUpdate) this.registry.set('playerMP', result.mp);

    this.showFloatingText(sprite.x, sprite.y - 20, result.notes.join(' '), '#ffcc33');

    this.children.getAll().filter((o: any) => o.text?.startsWith?.('❤️') || o.text?.startsWith?.('💧'))
      .forEach((o: any) => o.destroy());
    const newHp = this.registry.get('playerHP') as number ?? 80;
    const newMp = this.registry.get('playerMP') as number ?? 30;
    this.add.text(16, 16, `❤️ HP: ${newHp}/80`, { fontFamily: 'Courier New', fontSize: '13px', color: '#ff6666' });
    this.add.text(16, 34, `💧 MP: ${newMp}/30`, { fontFamily: 'Courier New', fontSize: '13px', color: '#66aaff' });
  }

  private enterTavern() {
    if (this.battlePending) return;
    this.battlePending = true;
    const event = pickRandomEvent();
    showEventOverlay(this, event, 300);
    this.time.delayedCall(800, () => {
      this.battlePending = false;
    });
  }

  private showFloatingText(x: number, y: number, text: string, color: string) {
    const t = this.add.text(x, y, text, {
      fontFamily: 'Courier New', fontSize: '14px', color,
      backgroundColor: '#000000aa', padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setDepth(400);
    this.tweens.add({
      targets: t,
      y: y - 50,
      alpha: 0,
      duration: 1800,
      onComplete: () => t.destroy(),
    });
  }
}
