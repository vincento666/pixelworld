import Phaser from 'phaser';

interface EnemyData {
  gx: number;
  gy: number;
  sprite: Phaser.GameObjects.Sprite;
}

export class MapScene extends Phaser.Scene {
  private playerGX = 1;
  private playerGY = 1;
  private playerSprite!: Phaser.GameObjects.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private enemies: EnemyData[] = [];
  private battleTipText!: Phaser.GameObjects.Text;
  private enterKey!: Phaser.Input.Keyboard.Key;

  // 12x12 map: 0=grass, 1=wall
  private mapData: number[][] = [
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,1,1,0,0,0,0,0,1],
    [1,0,0,0,1,1,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,1,1,0,0,1],
    [1,0,0,0,0,0,0,1,1,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
  ];

  constructor() {
    super({ key: 'MapScene' });
  }

  init(data: { preserveDefeatedEnemies?: boolean } = {}) {
    if (!data.preserveDefeatedEnemies) {
      this.registry.remove('defeatedEnemies');
    }
  }

  create() {
    this.drawMap();
    this.spawnPlayer();
    this.spawnEnemies();
    this.removeDefeatedEnemies();
    this.buildBattleTip();
    this.setupInput();
  }

  private drawMap() {
    for (let gy = 0; gy < 12; gy++) {
      for (let gx = 0; gx < 12; gx++) {
        const { sx, sy } = this.worldToScreen(gx, gy);
        const tile = this.mapData[gy][gx];
        if (tile === 0) {
          // grass
          const g = this.add.graphics();
          g.fillStyle(0x3a6b35, 1);
          g.fillRect(sx - 32, sy - 16, 64, 32);
          g.lineStyle(1, 0x2d5a28, 0.5);
          g.strokeRect(sx - 32, sy - 16, 64, 32);
        } else {
          // wall - isometric cube
          const g = this.add.graphics();
          const top = sy - 16;
          const bottom = sy + 16;
          const left = sx - 32;
          const right = sx + 32;
          const mid = sx;
          // top face
          g.fillStyle(0x8a7a6a, 1);
          g.beginPath();
          g.moveTo(mid, top - 16);
          g.lineTo(right, top);
          g.lineTo(mid, top + 16);
          g.lineTo(left, top);
          g.closePath();
          g.fill();
          // left face
          g.fillStyle(0x5a4a3a, 1);
          g.beginPath();
          g.moveTo(left, top);
          g.lineTo(mid, top + 16);
          g.lineTo(mid, bottom + 16);
          g.lineTo(left, bottom);
          g.closePath();
          g.fill();
          // right face
          g.fillStyle(0x7a6a5a, 1);
          g.beginPath();
          g.moveTo(right, top);
          g.lineTo(mid, top + 16);
          g.lineTo(mid, bottom + 16);
          g.lineTo(right, bottom);
          g.closePath();
          g.fill();
        }
      }
    }
  }

  private worldToScreen(gx: number, gy: number) {
    const sx = (gx - gy) * 32 + 480;
    const sy = (gx + gy) * 16 + 60;
    return { sx, sy };
  }

  private spawnPlayer() {
    const { sx, sy } = this.worldToScreen(this.playerGX, this.playerGY);
    this.playerSprite = this.add.sprite(sx, sy - 16, 'player_sprite').setScale(2);
  }

  private spawnEnemies() {
    const positions = [
      { gx: 4, gy: 4 },
      { gx: 9, gy: 3 },
      { gx: 8, gy: 9 },
    ];
    positions.forEach((pos) => {
      const { sx, sy } = this.worldToScreen(pos.gx, pos.gy);
      const sprite = this.add.sprite(sx, sy - 16, 'enemy_goblin').setScale(2);
      this.enemies.push({ gx: pos.gx, gy: pos.gy, sprite });
    });
  }

  private removeDefeatedEnemies() {
    const defeatedEnemyKeys = new Set<string>(
      (this.registry.get('defeatedEnemies') as string[] | undefined) ?? []
    );
    if (defeatedEnemyKeys.size === 0) return;

    this.enemies = this.enemies.filter((enemy) => {
      const enemyKey = `${enemy.gx},${enemy.gy}`;
      if (!defeatedEnemyKeys.has(enemyKey)) return true;

      enemy.sprite.destroy();
      return false;
    });
  }

  private buildBattleTip() {
    this.battleTipText = this.add.text(480, 580, '', {
      fontFamily: 'Courier New',
      fontSize: '18px',
      color: '#ff6b6b',
      backgroundColor: '#1a0a0a',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setDepth(10);
    this.battleTipText.setVisible(false);
  }

  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
  }

  update() {
    this.handleMovement();
    this.checkBattleProximity();
    this.handleBattleTrigger();
  }

  private handleMovement() {
    if (!this.cursors || !this.wasd) return;
    const left  = Phaser.Input.Keyboard.JustDown(this.cursors.left!)  || Phaser.Input.Keyboard.JustDown(this.wasd.A);
    const right = Phaser.Input.Keyboard.JustDown(this.cursors.right!) || Phaser.Input.Keyboard.JustDown(this.wasd.D);
    const up    = Phaser.Input.Keyboard.JustDown(this.cursors.up!)    || Phaser.Input.Keyboard.JustDown(this.wasd.W);
    const down  = Phaser.Input.Keyboard.JustDown(this.cursors.down!)  || Phaser.Input.Keyboard.JustDown(this.wasd.S);

    let dx = 0, dy = 0;
    if (left)  dx = -1;
    if (right) dx =  1;
    if (up)    dy = -1;
    if (down)  dy =  1;
    if (dx === 0 && dy === 0) return;

    const nx = this.playerGX + dx;
    const ny = this.playerGY + dy;
    if (this.canMoveTo(nx, ny)) {
      this.playerGX = nx;
      this.playerGY = ny;
      const { sx, sy } = this.worldToScreen(this.playerGX, this.playerGY);
      this.playerSprite.setPosition(sx, sy - 16);
    }
  }

  private canMoveTo(gx: number, gy: number): boolean {
    if (gx < 0 || gx >= 12 || gy < 0 || gy >= 12) return false;
    return this.mapData[gy][gx] === 0;
  }

  private checkBattleProximity() {
    const adjacent = this.enemies.some((e) => {
      const dx = Math.abs(e.gx - this.playerGX);
      const dy = Math.abs(e.gy - this.playerGY);
      return (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
    });
    this.battleTipText.setVisible(adjacent);
    if (adjacent) this.battleTipText.setText('[ ENTER 键 战斗 ]');
  }

  private handleBattleTrigger() {
    if (Phaser.Input.Keyboard.JustDown(this.enterKey!)) {
      const adjacentEnemy = this.enemies.find((e) => {
        const dx = Math.abs(e.gx - this.playerGX);
        const dy = Math.abs(e.gy - this.playerGY);
        return (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
      });
      if (adjacentEnemy) {
        this.scene.start('BattleScene', {
          enemyGX: adjacentEnemy.gx,
          enemyGY: adjacentEnemy.gy,
        });
      }
    }
  }
}
