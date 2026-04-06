import Phaser from 'phaser';
import { getTurnReactionBonus } from '../game/ElementSystem';

type Element = 'physical' | 'fire' | 'ice' | 'thunder' | 'wind' | 'water';

interface SkillCard {
  id: string;
  name: string;
  element: Element;
  damage: number;
  mpCost: number;
  desc: string;
}

interface Enemy {
  hp: number;
  maxHP: number;
  sprite: Phaser.GameObjects.Sprite;
  shadow: Phaser.GameObjects.Ellipse;
  name: string;
  sx: number;
  sy: number;
  bar: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
}

const ELEMENT_COLORS: Record<Element, number> = {
  physical: 0xcccccc,
  fire:     0xff4400,
  ice:      0x44aaff,
  thunder:  0xffdd00,
  wind:     0x44ff88,
  water:    0x4488ff,
};
const ELEMENT_NAMES: Record<Element, string> = {
  physical: '物理',
  fire:     '火',
  ice:      '冰',
  thunder:  '雷',
  wind:     '风',
  water:    '水',
};

const DEFAULT_CARDS: SkillCard[] = [
  { id: 'strike',    name: 'Strike',      element: 'physical', damage: 18, mpCost: 0,  desc: 'Basic attack' },
  { id: 'fireball',  name: 'Fireball',    element: 'fire',     damage: 24, mpCost: 6,  desc: 'Fire magic' },
  { id: 'icespike',  name: 'Ice Spike',   element: 'ice',      damage: 20, mpCost: 5,  desc: 'Ice magic' },
  { id: 'thunder',   name: 'Thunder',     element: 'thunder',  damage: 28, mpCost: 8,  desc: 'Lightning' },
  { id: 'windslash', name: 'Wind Slash',  element: 'wind',     damage: 16, mpCost: 4,  desc: 'Wind slash' },
  { id: 'heal',      name: 'Heal',        element: 'physical', damage: 0,  mpCost: 7,  desc: 'Restore HP' },
  { id: 'defend',    name: 'Defend',      element: 'physical', damage: 0,  mpCost: 3,  desc: 'Block next hit' },
];

const ENEMY_DEFS = [
  { name: 'Goblin Grunt',   maxHP: 30, sx: 120, sy: 330 },
  { name: 'Goblin Archer',  maxHP: 20, sx: 90,  sy: 390 },
  { name: 'Goblin Shaman',  maxHP: 38, sx: 150, sy: 390 },
];

export class BattleScene extends Phaser.Scene {
  private playerHP = 80;
  private playerMaxHP = 80;
  private playerMP = 30;
  private playerMaxMP = 30;
  private playerAtk = 14;
  private playerSprite!: Phaser.GameObjects.Sprite;
  private playerHpBar!: Phaser.GameObjects.Graphics;
  private playerMpBar!: Phaser.GameObjects.Graphics;
  private playerHpText!: Phaser.GameObjects.Text;
  private playerMpText!: Phaser.GameObjects.Text;
  private defending = false;
  private lastPlayerElement: Element | null = null;
  private lastEnemyElement: Element | null = null;

  private hand: SkillCard[] = [];
  private selectedCardIdx = -1;
  private cardTexts: Phaser.GameObjects.Text[] = [];
  private cardGraphics: Phaser.GameObjects.Graphics[] = [];
  private cardOverlay!: Phaser.GameObjects.Graphics;

  private enemies: Enemy[] = [];

  private phaseText!: Phaser.GameObjects.Text;
  private logText!: Phaser.GameObjects.Text;
  private logLines: string[] = [];
  private phase: 'player' | 'enemy' | 'victory' | 'defeat' = 'player';
  private battleEnemyGX: number | null = null;
  private battleEnemyGY: number | null = null;

  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyF!: Phaser.Input.Keyboard.Key;
  private key1!: Phaser.Input.Keyboard.Key;
  private key2!: Phaser.Input.Keyboard.Key;
  private key3!: Phaser.Input.Keyboard.Key;
  private key4!: Phaser.Input.Keyboard.Key;
  private key5!: Phaser.Input.Keyboard.Key;
  private key6!: Phaser.Input.Keyboard.Key;
  private key7!: Phaser.Input.Keyboard.Key;
  private key8!: Phaser.Input.Keyboard.Key;
  private key9!: Phaser.Input.Keyboard.Key;
  private keyEnter!: Phaser.Input.Keyboard.Key;
  private keyX!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data: { enemyGX?: number; enemyGY?: number } = {}) {
    this.playerHP = 80;
    this.playerMaxHP = 80;
    this.playerMP = 30;
    this.playerMaxMP = 30;
    this.defending = false;
    this.lastEnemyElement = null;
    this.lastPlayerElement = null;
    this.enemies = [];
    this.phase = 'player';
    this.logLines = [];
    this.selectedCardIdx = -1;
    this.battleEnemyGX = typeof data.enemyGX === 'number' ? data.enemyGX : null;
    this.battleEnemyGY = typeof data.enemyGY === 'number' ? data.enemyGY : null;
    this.hand = [...DEFAULT_CARDS].sort(() => Math.random() - 0.5).slice(0, 5);
  }

  create() {
    this.drawBackground();
    this.spawnEnemies();
    this.spawnPlayer();
    this.buildHUD();
    this.buildCardHand();
    this.setupInput();
    this.game.events.emit('battleStart');
    this.addLog('Battle Start!');
    this.updateHUD();
    this.updateCardDisplay();
  }

  private drawBackground() {
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a1a, 1);
    bg.fillRect(0, 0, 960, 640);
    bg.fillStyle(0x1e1208, 1);
    bg.fillRect(0, 460, 960, 180);
    for (let x = 0; x < 960; x += 48) {
      for (let y = 460; y < 640; y += 24) {
        bg.fillStyle((x / 48 + y / 24) % 2 === 0 ? 0x1a1008 : 0x221408, 1);
        bg.fillRect(x, y, 48, 24);
      }
    }
    bg.lineStyle(2, 0x5a4030, 0.8);
    bg.lineBetween(0, 460, 960, 460);
    const mtn = this.add.graphics();
    mtn.fillStyle(0x0c1020, 1);
    mtn.beginPath();
    mtn.moveTo(0, 460);
    mtn.lineTo(120, 320); mtn.lineTo(240, 390);
    mtn.lineTo(360, 270); mtn.lineTo(500, 360);
    mtn.lineTo(640, 240); mtn.lineTo(780, 340);
    mtn.lineTo(900, 280); mtn.lineTo(960, 310);
    mtn.lineTo(960, 460);
    mtn.closePath();
    mtn.fill();
    bg.fillStyle(0xfffbe0, 0.9);
    bg.fillCircle(800, 80, 28);
    bg.fillStyle(0xfffbe0, 0.08);
    bg.fillCircle(800, 80, 60);
    bg.fillStyle(0xfffbe0, 0.04);
    bg.fillCircle(800, 80, 100);
  }

  private spawnEnemies() {
    ENEMY_DEFS.forEach((def) => {
      const sprite = this.add.sprite(def.sx, def.sy, 'enemy_goblin').setScale(2.5);
      const shadow = this.add.ellipse(def.sx, def.sy + 20, 44, 12, 0x000000, 0.3);
      const bar = this.add.graphics();
      const label = this.add.text(def.sx, def.sy - 52, def.name, {
        fontFamily: 'Courier New', fontSize: '11px', color: '#ffaaaa',
      }).setOrigin(0.5);
      this.enemies.push({
        hp: def.maxHP, maxHP: def.maxHP,
        sprite, name: def.name,
        shadow,
        sx: def.sx, sy: def.sy,
        bar, label,
      });
    });
    this.updateEnemyHP();
  }

  private spawnPlayer() {
    const px = 760, py = 370;
    this.playerSprite = this.add.sprite(px, py, 'player_sprite').setScale(2.5);
    this.playerSprite.setFlipX(true);
    this.add.ellipse(px, py + 20, 44, 12, 0x000000, 0.3);
  }

  private buildHUD() {
    const top = this.add.graphics();
    top.fillStyle(0x000000, 0.65);
    top.fillRect(0, 0, 960, 50);
    top.lineStyle(1, 0x2a3a5a, 0.5);
    top.lineBetween(0, 50, 960, 50);
    this.add.text(480, 25, '-- BATTLE --', {
      fontFamily: 'Georgia', fontSize: '22px', color: '#ffd700', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.phaseText = this.add.text(20, 54, '> Your Turn', {
      fontFamily: 'Courier New', fontSize: '13px', color: '#88ccff',
    });
    const pBox = this.add.graphics();
    pBox.fillStyle(0x040e1a, 0.9);
    pBox.fillRoundedRect(560, 56, 390, 90, 8);
    pBox.lineStyle(1, 0x1a3a6a, 0.8);
    pBox.strokeRoundedRect(560, 56, 390, 90, 8);
    this.add.text(574, 62, 'HERO', {
      fontFamily: 'Courier New', fontSize: '11px', color: '#88aacc',
    });
    this.playerHpBar = this.add.graphics();
    this.playerHpText = this.add.text(574, 80, '', {
      fontFamily: 'Courier New', fontSize: '11px', color: '#aaddff',
    });
    this.playerMpBar = this.add.graphics();
    this.playerMpText = this.add.text(574, 100, '', {
      fontFamily: 'Courier New', fontSize: '11px', color: '#aaaaff',
    });
    const cBox = this.add.graphics();
    cBox.fillStyle(0x040e1a, 0.8);
    cBox.fillRoundedRect(14, 54, 220, 90, 8);
    cBox.lineStyle(1, 0x1a3a6a, 0.6);
    cBox.strokeRoundedRect(14, 54, 220, 90, 8);
    this.add.text(22, 60, '1-5: Use Card', {
      fontFamily: 'Courier New', fontSize: '11px', color: '#aaaaaa',
    });
    this.add.text(22, 76, 'A: Attack  S: Skip', {
      fontFamily: 'Courier New', fontSize: '11px', color: '#888888',
    });
    this.add.text(22, 92, 'ENTER: Confirm  X: Discard', {
      fontFamily: 'Courier New', fontSize: '11px', color: '#888888',
    });
    this.logText = this.add.text(20, 152, '', {
      fontFamily: 'Courier New', fontSize: '12px', color: '#777777',
    });
    this.updateHUD();
  }

  private buildCardHand() {
    const barBg = this.add.graphics();
    barBg.fillStyle(0x000000, 0.7);
    barBg.fillRect(0, 460, 960, 180);
    barBg.setDepth(5);
    this.cardOverlay = this.add.graphics().setDepth(6);
    this.cardTexts = [];
    this.cardGraphics = [];
    for (let i = 0; i < 5; i++) {
      const g = this.add.graphics().setDepth(7);
      const t = this.add.text(0, 0, '', {
        fontFamily: 'Courier New', fontSize: '11px', color: '#ffffff',
      }).setDepth(8);
      this.cardGraphics.push(g);
      this.cardTexts.push(t);
    }
    this.updateCardDisplay();
  }

  private updateCardDisplay() {
    for (let i = 0; i < 5; i++) {
      const cx = 96 + i * 172;
      const cy = 548;
      const card = this.hand[i];
      const g = this.cardGraphics[i];
      const t = this.cardTexts[i];
      g.clear();
      if (!card) { t.setText(''); continue; }
      const isSelected = i === this.selectedCardIdx;
      const canAfford = this.playerMP >= card.mpCost;
      const col = ELEMENT_COLORS[card.element];
      g.fillStyle(isSelected ? 0x1a2a4a : 0x08080f, 0.95);
      g.fillRoundedRect(cx - 76, cy - 70, 152, 140, 8);
      g.fillStyle(col, isSelected ? 0.9 : 0.5);
      g.fillRoundedRect(cx - 76, cy - 70, 152, 18, { tl: 8, tr: 8, bl: 0, br: 0 });
      g.lineStyle(isSelected ? 2 : 1, col, isSelected ? 1 : 0.6);
      g.strokeRoundedRect(cx - 76, cy - 70, 152, 140, 8);
      const lines = [card.name, card.damage > 0 ? `HP:${card.damage}` : '', `MP:${card.mpCost}`, `[${i + 1}]`];
      if (card.element !== 'physical') lines.push(ELEMENT_NAMES[card.element]);
      t.setText(lines.filter(Boolean).join('\n'));
      t.setPosition(cx - 68, cy - 64);
      t.setColor(isSelected ? '#ffd700' : canAfford ? '#e8d4b8' : '#666666');
    }
  }

  private setupInput() {
    this.key1    = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.key2    = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.key3    = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
    this.key4    = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);
    this.key5    = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.FIVE);
    this.key6    = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SIX);
    this.key7    = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SEVEN);
    this.key8    = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.EIGHT);
    this.key9    = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.NINE);
    this.keyA    = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS    = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD    = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyF    = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.keyEnter = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.keyX    = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.X);
  }

  update() {
    if (this.phase !== 'player') return;
    const keyMap = [this.key1, this.key2, this.key3, this.key4, this.key5,
                    this.key6, this.key7, this.key8, this.key9];
    for (let i = 0; i < 5; i++) {
      if (Phaser.Input.Keyboard.JustDown(keyMap[i])) {
        this.selectedCardIdx = i;
        this.updateCardDisplay();
        this.addLog(`Selected: ${this.hand[i]?.name}`);
        return;
      }
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyEnter) && this.selectedCardIdx >= 0) {
      this.useSelectedCard();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyX)) {
      this.discardSelectedCard();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyA)) {
      this.selectedCardIdx = 0;
      this.updateCardDisplay();
      this.useSelectedCard();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyS)) {
      this.addLog('Skip turn');
      this.endPlayerTurn();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyD)) {
      this.addLog('Defend (+50% block)');
      this.defending = true;
      this.endPlayerTurn();
    }
  }

  private discardSelectedCard() {
    if (this.selectedCardIdx < 0 || this.selectedCardIdx >= this.hand.length) return;
    const cardName = this.hand[this.selectedCardIdx]?.name;
    this.addLog(`Discard: ${cardName}`);
    const newCard = this.drawRandomCard();
    this.hand[this.selectedCardIdx] = newCard;
    this.selectedCardIdx = -1;
    this.updateCardDisplay();
    this.addLog(`Draw: ${newCard.name}`);
  }

  private useSelectedCard() {
    const idx = this.selectedCardIdx;
    if (idx < 0 || idx >= this.hand.length) return;
    const card = this.hand[idx];
    if (this.playerMP < card.mpCost) {
      this.addLog(`Not enough MP! (need ${card.mpCost})`);
      return;
    }
    this.playerMP -= card.mpCost;
    this.lastPlayerElement = card.element;
    this.addLog(`Use ${card.name}!`);

    if (card.id === 'heal') {
      const healAmt = 30;
      this.playerHP = Math.min(this.playerMaxHP, this.playerHP + healAmt);
      this.game.events.emit('heal', { value: healAmt, x: 760, y: 370 });
      this.addLog(`Heal ${healAmt} HP!`);
      this.tweens.add({
        targets: this.playerSprite,
        y: 355, duration: 200, yoyo: true,
      });
    } else if (card.id === 'defend') {
      this.defending = true;
      this.addLog('Defensive stance!');
    } else {
      const alive = this.enemies.filter(e => e.hp > 0);
      if (alive.length === 0) return;
      const target = alive[0];
      const tidx = this.enemies.indexOf(target);

      // Apply reaction bonus from previous enemy element
      const reaction = getTurnReactionBonus(this.lastEnemyElement, card.element);
      let totalDmg = card.damage;
      let extraTxt = '';
      if (reaction) {
        totalDmg = Math.floor(card.damage * reaction.multiplier);
        extraTxt = ` [${reaction.label}]`;
        this.addLog(`Reaction! ${reaction.label} x${reaction.multiplier}`);
        this.game.events.emit('elementReact', {
          element: card.element,
          x: target.sx, y: target.sy,
        });
      }
      if (card.element !== 'physical') {
        extraTxt = extraTxt || ` [${ELEMENT_NAMES[card.element]}]`;
      }
      this.dealDamageToEnemy(tidx, totalDmg, card.element);
      this.addLog(`${card.name}${extraTxt} -> ${target.name} ${totalDmg} dmg`);
      this.flashSprite(this.playerSprite, ELEMENT_COLORS[card.element]);
    }

    const newCard = this.drawRandomCard();
    this.hand[idx] = newCard;
    this.selectedCardIdx = -1;
    this.updateCardDisplay();
    this.updateHUD();

    if (this.phase !== 'victory') this.endPlayerTurn();
  }

  private drawRandomCard(): SkillCard {
    const pool = [
      ...DEFAULT_CARDS.filter(c => c.id === 'strike'),
      ...DEFAULT_CARDS,
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private dealDamageToEnemy(idx: number, dmg: number, element: Element) {
    const e = this.enemies[idx];
    if (!e || e.hp <= 0) return;
    e.hp = Math.max(0, e.hp - dmg);
    this.game.events.emit('damage', { value: dmg, x: e.sx, y: e.sy - 10 });
    this.flashSprite(e.sprite, ELEMENT_COLORS[element]);
    this.updateEnemyHP();
    if (e.hp <= 0) {
      this.addLog(`* ${e.name} defeated!`);
      e.sprite.destroy();
      e.shadow.destroy();
      e.bar.destroy();
      e.label.destroy();
      this.enemies.splice(idx, 1);
    }
    if (this.enemies.length === 0) this.triggerVictory();
  }

  private dealDamageToPlayer(dmg: number, element?: Element) {
    const actual = this.defending ? Math.floor(dmg * 0.5) : dmg;
    if (this.defending) {
      this.addLog(`Blocked! ${dmg} -> ${actual} dmg`);
      this.defending = false;
    }
    this.playerHP = Math.max(0, this.playerHP - actual);
    this.game.events.emit('damage', { value: actual, x: 760, y: 360 });
    if (element) this.flashSprite(this.playerSprite, ELEMENT_COLORS[element]);
    else this.flashSprite(this.playerSprite, 0xff4444);
    this.updateHUD();
    if (this.playerHP <= 0) this.triggerDefeat();
  }

  private endPlayerTurn() {
    this.selectedCardIdx = -1;
    this.defending = false;
    this.updateCardDisplay();
    this.phase = 'enemy';
    this.phaseText.setText('> Enemy Turn');
    this.phaseText.setColor('#ff8888');
    this.time.delayedCall(700, () => this.runEnemyTurn());
  }

  private runEnemyTurn() {
    if (this.phase !== 'enemy') return;
    const alive = this.enemies.filter(e => e.hp > 0);
    if (alive.length === 0) { this.triggerVictory(); return; }

    let delay = 0;
    alive.forEach((attacker) => {
      this.time.delayedCall(delay, () => {
        if (this.phase !== 'enemy') return;
        const dmg = Phaser.Math.Between(5, 12);
        const atkElement: Element = 'physical';
        this.lastEnemyElement = atkElement;

        // Check reaction
        const reaction = getTurnReactionBonus(this.lastPlayerElement, atkElement);
        let totalDmg = dmg;
        if (reaction) {
          totalDmg = Math.floor(dmg * reaction.multiplier);
          this.addLog(`Enemy ${reaction.label}! ${dmg}->${totalDmg} dmg`);
          this.game.events.emit('elementReact', {
            element: atkElement,
            x: 760, y: 370,
          });
        } else {
          this.addLog(`* ${attacker.name} attacks! ${totalDmg} dmg`);
        }
        this.dealDamageToPlayer(totalDmg, atkElement);
      });
      delay += 700;
    });

    this.time.delayedCall(delay + 400, () => {
      if (this.phase !== 'enemy') return;
      // MP regen at end of enemy turn
      const regen = Math.min(5, this.playerMaxMP - this.playerMP);
      if (regen > 0) {
        this.playerMP = Math.min(this.playerMaxMP, this.playerMP + 5);
        this.addLog(`MP +${regen}`);
      }
      this.phase = 'player';
      this.phaseText.setText('> Your Turn');
      this.phaseText.setColor('#88ccff');
      this.updateHUD();
      this.updateCardDisplay();
    });
  }

  private triggerVictory() {
    this.phase = 'victory';
    this.phaseText.setText('> VICTORY!');
    this.phaseText.setColor('#ffd700');
    this.game.events.emit('victory');
    if (this.battleEnemyGX !== null && this.battleEnemyGY !== null) {
      const defeatedEnemyKey = `${this.battleEnemyGX},${this.battleEnemyGY}`;
      const defeatedEnemies = (this.registry.get('defeatedEnemies') as string[] | undefined) ?? [];
      if (!defeatedEnemies.includes(defeatedEnemyKey)) {
        this.registry.set('defeatedEnemies', [...defeatedEnemies, defeatedEnemyKey]);
      }
    }
    const t = this.add.text(480, 280, 'VICTORY', {
      fontFamily: 'Georgia', fontSize: '64px', color: '#ffd700',
      fontStyle: 'bold', stroke: '#5a3a00', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(100);
    this.add.text(480, 345, 'Press ENTER', {
      fontFamily: 'Courier New', fontSize: '16px', color: '#888888',
    }).setOrigin(0.5).setDepth(100);
    this.input.keyboard!.once('keydown-ENTER', () => {
      this.scene.start('MapScene', { preserveDefeatedEnemies: true });
    });
  }

  private triggerDefeat() {
    this.phase = 'defeat';
    this.phaseText.setText('> DEFEAT');
    this.phaseText.setColor('#ff4444');
    this.add.text(480, 280, 'DEFEATED', {
      fontFamily: 'Georgia', fontSize: '64px', color: '#ff4444',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(100);
    this.time.delayedCall(2500, () => this.scene.start('TitleScene'));
  }

  private flashSprite(sprite: Phaser.GameObjects.Sprite, color: number) {
    sprite.setTint(color);
    this.time.delayedCall(150, () => {
      if (!sprite.active) return;
      sprite.clearTint();
    });
  }

  private updateHUD() {
    this.playerHpBar.clear();
    const bw = 220, bh = 12, bx = 574, by = 94;
    this.playerHpBar.fillStyle(0x1a1a33, 1);
    this.playerHpBar.fillRect(bx, by, bw, bh);
    const hp = this.playerHP / this.playerMaxHP;
    this.playerHpBar.fillStyle(hp > 0.5 ? 0x44dd44 : hp > 0.25 ? 0xffaa00 : 0xff4444, 1);
    this.playerHpBar.fillRect(bx, by, bw * hp, bh);
    this.playerHpBar.lineStyle(1, 0x334455, 0.4);
    this.playerHpBar.strokeRect(bx, by, bw, bh);
    this.playerHpText.setText(`HP  ${this.playerHP} / ${this.playerMaxHP}`);

    this.playerMpBar.clear();
    const mbx = 574, mby = 112, mbw = 220, mbh = 10;
    this.playerMpBar.fillStyle(0x1a1a33, 1);
    this.playerMpBar.fillRect(mbx, mby, mbw, mbh);
    const mp = this.playerMP / this.playerMaxMP;
    this.playerMpBar.fillStyle(0x4488ff, 1);
    this.playerMpBar.fillRect(mbx, mby, mbw * mp, mbh);
    this.playerMpBar.lineStyle(1, 0x334455, 0.4);
    this.playerMpBar.strokeRect(mbx, mby, mbw, mbh);
    this.playerMpText.setText(`MP  ${this.playerMP} / ${this.playerMaxMP}`);
  }

  private updateEnemyHP() {
    this.enemies.forEach((e) => {
      e.bar.clear();
      const bw = 70, bh = 8, bx = e.sx - bw / 2, by2 = e.sy + 24;
      e.bar.fillStyle(0x1a0000, 1);
      e.bar.fillRect(bx, by2, bw, bh);
      const p = Math.max(0, e.hp / e.maxHP);
      e.bar.fillStyle(p > 0.5 ? 0xff6644 : p > 0.25 ? 0xffaa00 : 0xff4444, 1);
      e.bar.fillRect(bx, by2, bw * p, bh);
    });
  }

  private addLog(msg: string) {
    this.logLines.push(msg);
    if (this.logLines.length > 4) this.logLines.shift();
    this.logText.setText(this.logLines.slice(-3).join('\n'));
  }
}
