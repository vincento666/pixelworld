import Phaser from 'phaser';
import { MAP_REGISTRY, TILE, type Treasure } from '../game/map-registry';
import { sceneEvents } from '../game/events';
import { showEventOverlay, pickRandomEvent } from '../game/event-overlay';
import { buildMapSprites } from '../game/sprites';

const TILE_SIZE = 56;
const MAP_OFFSET_X = 32;
const MAP_OFFSET_Y = 68;
const PLAYER_SPEED = 170;

interface EnemyActor {
  id: string;
  sprite: Phaser.Physics.Arcade.Image;
  label: Phaser.GameObjects.Text;
}

export class CaveScene extends Phaser.Scene {
  private mapDef = MAP_REGISTRY['cave'];
  private player!: Phaser.Physics.Arcade.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };
  private wallGroup!: Phaser.Physics.Arcade.StaticGroup;
  private enemies: EnemyActor[] = [];
  private battlePending = false;
  private mapNameText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'CaveScene' });
  }

  init(data: { spawnGX?: number; spawnGY?: number }) {
    this._spawnGX = data.spawnGX ?? 1;
    this._spawnGY = data.spawnGY ?? 1;
  }

  private _spawnGX = 1;
  private _spawnGY = 1;

  create(data: { spawnGX?: number; spawnGY?: number } = {}) {
    buildMapSprites(this);
    this.cameras.main.setBackgroundColor('#0d0d1a');

    this.wallGroup = this.physics.add.staticGroup();
    this.enemies = [];
    this.battlePending = false;

    if (data.spawnGX != null) this._spawnGX = data.spawnGX;
    if (data.spawnGY != null) this._spawnGY = data.spawnGY;

    this.drawTiles();
    this.createWalls();
    this.createPortals();
    this.createTreasures();
    this.createBuildings();
    this.createPlayer();
    this.createEnemies();
    this.createHud();
    this.createInput();

    this.physics.add.collider(this.player, this.wallGroup);
    this.enemies.forEach((ea) => {
      this.physics.add.overlap(this.player, ea.sprite, () => this.startBattle(ea.id));
    });

    sceneEvents.on('battleWon', this.handleBattleWon, this);
    sceneEvents.on('battleLost', this.handleBattleLost, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      sceneEvents.off('battleWon', this.handleBattleWon, this);
      sceneEvents.off('battleLost', this.handleBattleLost, this);
    });
  }

  private drawTiles() {
    const g = this.add.graphics();
    const { tiles, wallColor } = this.mapDef;
    for (let row = 0; row < tiles.length; row++) {
      for (let col = 0; col < tiles[0].length; col++) {
        const t = tiles[row][col];
        const x = MAP_OFFSET_X + col * TILE_SIZE;
        const y = MAP_OFFSET_Y + row * TILE_SIZE;
        if (t === TILE.WALL) {
          g.fillStyle(wallColor, 1);
          g.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          g.lineStyle(1, 0x222233, 0.5);
          g.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
        } else if (t === TILE.PATH) {
          g.fillStyle(0x5a4a3a, 1);
          g.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        } else {
          g.fillStyle(0x0d0d1a, 1);
          g.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        }
      }
    }
  }

  private createWalls() {
    const { tiles } = this.mapDef;
    for (let row = 0; row < tiles.length; row++) {
      for (let col = 0; col < tiles[0].length; col++) {
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
        if (!this.battlePending) this.transitionTo(portal.targetMap, portal.targetGX, portal.targetGY);
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
    // No buildings in cave for now
  }

  private createPlayer() {
    this.player = this.physics.add.image(
      MAP_OFFSET_X + this._spawnGX * TILE_SIZE + TILE_SIZE / 2,
      MAP_OFFSET_Y + this._spawnGY * TILE_SIZE + TILE_SIZE / 2,
      '__WHITE'
    );
    this.player.setTint(0x53a7ff);
    this.player.setDisplaySize(26, 26);
    this.player.setCollideWorldBounds(true);
    this.player.setDrag(1200, 1200);
    this.player.setMaxVelocity(PLAYER_SPEED, PLAYER_SPEED);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(24, 24);
  }

  private createEnemies() {
    const defeated = (this.registry.get('defeatedEnemies') as string[] | undefined) ?? [];
    const colorMap: Record<string, number> = {
      goblin_grunt:  0x6ea34c,
      goblin_archer: 0x8fbf5b,
      goblin_shaman: 0xaa66cc,
    };
    const nameMap: Record<string, string> = {
      goblin_grunt:  '哥布林战士',
      goblin_archer: '哥布林弓手',
      goblin_shaman: '哥布林萨满',
    };
    const hpMap: Record<string, number> = {
      goblin_grunt: 30, goblin_archer: 20, goblin_shaman: 38,
    };

    for (const def of this.mapDef.enemies) {
      const id = `cave_${def.gx}_${def.gy}`;
      if (defeated.includes(id)) continue;

      const sprite = this.physics.add.image(
        MAP_OFFSET_X + def.gx * TILE_SIZE + TILE_SIZE / 2,
        MAP_OFFSET_Y + def.gy * TILE_SIZE + TILE_SIZE / 2,
        '__WHITE'
      );
      sprite.setTint(colorMap[def.type] ?? 0x6ea34c);
      sprite.setDisplaySize(26, 26);
      sprite.setImmovable(true);
      sprite.body.setAllowGravity(false);
      sprite.body.moves = false;

      const label = this.add.text(sprite.x, sprite.y - 28, nameMap[def.type] ?? def.type, {
        fontFamily: 'Courier New', fontSize: '12px', color: '#ffffff',
        backgroundColor: '#00000066', padding: { x: 4, y: 2 },
      }).setOrigin(0.5);

      this.enemies.push({ id, sprite, label });
    }
  }

  private createHud() {
    this.mapNameText = this.add.text(480, 16, `📍 ${this.mapDef.name}`, {
      fontFamily: 'Georgia', fontSize: '20px', color: '#88ccff', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.add.text(480, 44, 'WASD/方向键移动  ·  走近敌人触发战斗  ·  走近传送门返回', {
      fontFamily: 'Courier New', fontSize: '11px', color: '#556677',
    }).setOrigin(0.5, 0);

    const hp = this.registry.get('playerHP') ?? 80;
    const mp = this.registry.get('playerMP') ?? 30;
    this.add.text(16, 16, `❤️ HP: ${hp}/80`, { fontFamily: 'Courier New', fontSize: '13px', color: '#ff6666' });
    this.add.text(16, 34, `💧 MP: ${mp}/30`, { fontFamily: 'Courier New', fontSize: '13px', color: '#66aaff' });
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

  update() {
    if (this.battlePending) { this.player.setVelocity(0, 0); return; }
    const left  = (this.cursors.left?.isDown  || this.wasd.left.isDown)  ? -1 : 0;
    const right = (this.cursors.right?.isDown || this.wasd.right.isDown) ?  1 : 0;
    const up    = (this.cursors.up?.isDown    || this.wasd.up.isDown)    ? -1 : 0;
    const down  = (this.cursors.down?.isDown  || this.wasd.down.isDown)  ?  1 : 0;
    this.player.setVelocity((left + right) * PLAYER_SPEED, (up + down) * PLAYER_SPEED);
    const body = this.player.body as Phaser.Physics.Arcade.Body | null;
    if (body && (left + right !== 0 || up + down !== 0)) {
      body.velocity.normalize().scale(PLAYER_SPEED);
    }
  }

  private startBattle(enemyId: string) {
    if (this.battlePending) return;
    this.battlePending = true;
    this.player.setVelocity(0, 0);
    const def = this.mapDef.enemies.find(e => `cave_${e.gx}_${e.gy}` === enemyId);
    const nameMap: Record<string, string> = {
      goblin_grunt: 'Goblin Grunt', goblin_archer: 'Goblin Archer', goblin_shaman: 'Goblin Shaman',
    };
    const hpMap: Record<string, number> = {
      goblin_grunt: 30, goblin_archer: 20, goblin_shaman: 38,
    };
    sceneEvents.emit('battleStart', {
      enemy: {
        id: enemyId,
        name: nameMap[def?.type ?? 'goblin_grunt'] ?? 'Goblin',
        maxHP: hpMap[def?.type ?? 'goblin_grunt'] ?? 30,
        color: 0x6ea34c,
        attackElements: ['fire'] as const,
      },
    } as any);
  }

  private handleBattleWon() {
    this.battlePending = false;
    const remaining = this.enemies.filter(e => this.enemies.includes(e) && e.sprite.active);
    if (remaining.length === 0) this.showMapClearedBanner();
  }

  private handleBattleLost() {
    this.battlePending = false;
    this.showGameOverOverlay();
  }

  private showMapClearedBanner() {
    const d = 500;
    this.add.rectangle(480, 160, 460, 90, 0x000000, 0.7).setDepth(d);
    const panel = this.add.rectangle(480, 160, 450, 80, 0x0d0d1a, 0.95).setDepth(d+1).setStrokeStyle(2, 0x4ad66d);
    this.add.text(480, 152, "✅ 本区敌人全灭！", {fontFamily:'Georgia',fontSize:'20px',color:'#4ad66d',fontStyle:'bold'}).setOrigin(0.5).setDepth(d+2);
    this.add.text(480, 178, "找到 ▶ 传送门 前往下一区域", {fontFamily:'Courier New',fontSize:'14px',color:'#aaffaa'}).setOrigin(0.5).setDepth(d+2);
    this.tweens.add({targets:panel, alpha:{from:0.6,to:1}, duration:600, yoyo:true, repeat:-1});
  }

  private showGameOverOverlay() {
    const d = 500;
    this.add.rectangle(480, 320, 960, 640, 0x000000, 0.72).setDepth(d);
    const panel = this.add.rectangle(480, 320, 360, 220, 0x1a0808, 0.96).setDepth(d+1).setStrokeStyle(3, 0xe06b6b);
    this.add.text(480, 264, "💀 冒险结束", {fontFamily:'Georgia',fontSize:'38px',color:'#ff8f8f',fontStyle:'bold'}).setOrigin(0.5).setDepth(d+2);
    this.add.text(480, 310, "你倒在了冒险的路上...", {fontFamily:'Courier New',fontSize:'15px',color:'#cc8888'}).setOrigin(0.5).setDepth(d+2);
    const btn = this.add.rectangle(480, 370, 180, 44, 0x8b2020, 1).setDepth(d+2).setInteractive({useHandCursor:true});
    this.add.text(480, 370, "重新开始", {fontFamily:'Courier New',fontSize:'20px',color:'#ffffff',fontStyle:'bold'}).setOrigin(0.5).setDepth(d+3);
    btn.on('pointerdown', () => this.scene.restart());
    this.tweens.add({targets:panel, x:'+4', duration:60, yoyo:true, repeat:4});
  }

  private transitionTo(mapId: string, gx?: number, gy?: number) {
    if (this.battlePending) return;
    this.battlePending = true;
    const overlay = this.add.rectangle(480, 320, 960, 640, 0x000000, 0).setDepth(200);
    this.tweens.add({
      targets: overlay,
      fillAlpha: 0.85,
      duration: 400,
      onComplete: () => {
        this.battlePending = false;
        this.scene.start(mapId === 'grass' ? 'MapScene' : 'CaveScene', { spawnGX: gx, spawnGY: gy });
      },
    });
  }

  private openTreasure(treasure: Treasure, sprite: Phaser.Physics.Arcade.Image) {
    treasure.opened = true;
    this.tweens.add({ targets: sprite, y: '-=16', alpha: 0, duration: 500, onComplete: () => sprite.destroy() });

    const { applyReward } = require('../game/treasure-system');
    const hp = this.registry.get('playerHP') as number ?? 80;
    const mp = this.registry.get('playerMP') as number ?? 30;
    const result = applyReward(this, treasure.reward, hp, 80, mp, 30, this.registry);
    if (result.hpBarUpdate) this.registry.set('playerHP', result.hp);
    if (result.mpBarUpdate) this.registry.set('playerMP', result.mp);

    const t = this.add.text(sprite.x, sprite.y - 20, result.notes.join(' '), {
      fontFamily: 'Courier New', fontSize: '14px', color: '#ffcc33',
      backgroundColor: '#000000aa', padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setDepth(400);
    this.tweens.add({ targets: t, y: t.y - 50, alpha: 0, duration: 1800, onComplete: () => t.destroy() });
  }
}

