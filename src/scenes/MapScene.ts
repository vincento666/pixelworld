import Phaser from 'phaser';
import { MAP_ENEMIES, PLAYER_MAX_HP, PLAYER_MAX_MP, type MapEnemyDefinition } from '../game/battle-data';
import { sceneEvents } from '../game/events';

interface MapSceneData {
  resetProgress?: boolean;
}

interface EnemyActor {
  enemy: MapEnemyDefinition;
  sprite: Phaser.Physics.Arcade.Image;
  label: Phaser.GameObjects.Text;
}

const TILE_SIZE = 56;
const GRID_WIDTH = 16;
const GRID_HEIGHT = 10;
const MAP_OFFSET_X = 32;
const MAP_OFFSET_Y = 60;
const PLAYER_SIZE = 28;
const PLAYER_SPEED = 170;

const TILEMAP: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1],
  [1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export class MapScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };
  private wallBodies: Phaser.Physics.Arcade.StaticGroup | null = null;
  private enemies: EnemyActor[] = [];
  private battlePending = false;
  private hudText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MapScene' });
  }

  init(data: MapSceneData = {}) {
    if (data.resetProgress) {
      this.registry.remove('defeatedEnemies');
      this.registry.set('playerHP', PLAYER_MAX_HP);
      this.registry.set('playerMP', PLAYER_MAX_MP);
    }
  }

  create() {
    this.cameras.main.setBackgroundColor('#0d1624');
    this.drawGridMap();
    this.createWalls();
    this.createPlayer();
    this.createEnemies();
    this.createHud();
    this.createInput();
    this.syncDefeatedEnemies();

    this.physics.add.collider(this.player, this.wallBodies!);
    this.enemies.forEach((enemyActor) => {
      this.physics.add.overlap(this.player, enemyActor.sprite, () => this.startBattle(enemyActor.enemy));
    });

    sceneEvents.on('battleWon', this.handleBattleWon, this);
    this.events.on(Phaser.Scenes.Events.RESUME, this.handleResume, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      sceneEvents.off('battleWon', this.handleBattleWon, this);
      this.events.off(Phaser.Scenes.Events.RESUME, this.handleResume, this);
    });
  }

  update() {
    if (this.battlePending) {
      this.player.setVelocity(0, 0);
      return;
    }

    const horizontal = (this.cursors.left?.isDown || this.wasd.left.isDown ? -1 : 0)
      + (this.cursors.right?.isDown || this.wasd.right.isDown ? 1 : 0);
    const vertical = (this.cursors.up?.isDown || this.wasd.up.isDown ? -1 : 0)
      + (this.cursors.down?.isDown || this.wasd.down.isDown ? 1 : 0);

    this.player.setVelocity(horizontal * PLAYER_SPEED, vertical * PLAYER_SPEED);
    const body = this.player.body as Phaser.Physics.Arcade.Body | null;
    if (body && (horizontal !== 0 || vertical !== 0)) {
      body.velocity.normalize().scale(PLAYER_SPEED);
    }
  }

  private drawGridMap() {
    const graphics = this.add.graphics();
    for (let row = 0; row < GRID_HEIGHT; row += 1) {
      for (let col = 0; col < GRID_WIDTH; col += 1) {
        const x = MAP_OFFSET_X + col * TILE_SIZE;
        const y = MAP_OFFSET_Y + row * TILE_SIZE;
        const isWall = TILEMAP[row][col] === 1;
        graphics.fillStyle(isWall ? 0x6e7177 : 0x3d8f4f, 1);
        graphics.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        graphics.lineStyle(1, isWall ? 0x55585f : 0x2f6f3d, 0.45);
        graphics.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  private createWalls() {
    this.wallBodies = this.physics.add.staticGroup();
    for (let row = 0; row < GRID_HEIGHT; row += 1) {
      for (let col = 0; col < GRID_WIDTH; col += 1) {
        if (TILEMAP[row][col] !== 1) {
          continue;
        }

        const wall = this.wallBodies.create(
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

  private createPlayer() {
    this.player = this.physics.add.image(
      MAP_OFFSET_X + TILE_SIZE * 1.5,
      MAP_OFFSET_Y + TILE_SIZE * 1.5,
      '__WHITE'
    );
    this.player.setTint(0x53a7ff);
    this.player.setDisplaySize(PLAYER_SIZE, PLAYER_SIZE);
    this.player.setCollideWorldBounds(true);
    this.player.setDrag(1200, 1200);
    this.player.setMaxVelocity(PLAYER_SPEED, PLAYER_SPEED);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(PLAYER_SIZE, PLAYER_SIZE);
  }

  private createEnemies() {
    this.enemies = MAP_ENEMIES.map((enemy) => {
      const sprite = this.physics.add.image(
        MAP_OFFSET_X + enemy.mapX * TILE_SIZE + TILE_SIZE / 2,
        MAP_OFFSET_Y + enemy.mapY * TILE_SIZE + TILE_SIZE / 2,
        '__WHITE'
      );
      sprite.setImmovable(true);
      sprite.setTint(enemy.color);
      sprite.setDisplaySize(28, 28);
      sprite.body.setAllowGravity(false);
      sprite.body.moves = false;

      const label = this.add.text(sprite.x, sprite.y - 28, enemy.name, {
        fontFamily: 'Courier New',
        fontSize: '12px',
        color: '#f6f6f6',
        backgroundColor: '#00000055',
        padding: { x: 4, y: 2 },
      }).setOrigin(0.5);

      return { enemy, sprite, label };
    });
  }

  private createHud() {
    this.hudText = this.add.text(32, 20, 'PixelWorld Map  |  Move: WASD / Arrows  |  Touch an enemy to start battle', {
      fontFamily: 'Courier New',
      fontSize: '18px',
      color: '#e5f0ff',
    });
  }

  private createInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  private startBattle(enemy: MapEnemyDefinition) {
    if (this.battlePending) {
      return;
    }

    const defeated = new Set<string>((this.registry.get('defeatedEnemies') as string[] | undefined) ?? []);
    if (defeated.has(enemy.id)) {
      this.syncDefeatedEnemies();
      return;
    }

    this.battlePending = true;
    this.player.setVelocity(0, 0);
    sceneEvents.emit('battleStart', { enemy });
  }

  private syncDefeatedEnemies() {
    const defeated = new Set<string>((this.registry.get('defeatedEnemies') as string[] | undefined) ?? []);
    this.enemies.forEach((enemyActor) => {
      const visible = !defeated.has(enemyActor.enemy.id);
      enemyActor.sprite.setActive(visible).setVisible(visible);
      enemyActor.label.setVisible(visible);
      const body = enemyActor.sprite.body as Phaser.Physics.Arcade.Body;
      body.enable = visible;
    });
  }

  private handleBattleWon() {
    this.syncDefeatedEnemies();
  }

  private handleResume() {
    this.battlePending = false;
    this.syncDefeatedEnemies();
  }
}
