import Phaser from 'phaser';
import {
  CARD_POOL,
  MP_REGEN_PER_ROUND,
  PLAYER_MAX_HP,
  PLAYER_MAX_MP,
  createBattleEnemyState,
  createInitialHand,
  drawCard,
  getTurnReaction,
  type BattleCard,
  type BattleEnemyState,
  type MapEnemyDefinition,
} from '../game/battle-data';
import { sceneEvents, type BattleWonPayload } from '../game/events';
import { CardHand } from '../game/ui/CardHand';
import { HPBar } from '../game/ui/HPBar';
import { MPBar } from '../game/ui/MPBar';
import { TurnIndicator } from '../game/ui/TurnIndicator';
import type { Element } from '../types/element';

interface BattleSceneInitData {
  enemy?: MapEnemyDefinition | BattleEnemyState;
  enemies?: Array<MapEnemyDefinition | BattleEnemyState>;
}

interface EnemyView {
  enemy: BattleEnemyState;
  sprite: Phaser.GameObjects.Sprite;
  shadow: Phaser.GameObjects.Ellipse;
  hpBar: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
}

const PLAYER_POSITION = { x: 760, y: 330 };
const ENEMY_POSITIONS = [
  { x: 210, y: 250 },
  { x: 160, y: 360 },
  { x: 260, y: 430 },
];
const MAX_LOG_LINES = 5;

export class BattleScene extends Phaser.Scene {
  private playerHP = PLAYER_MAX_HP;
  private playerMP = PLAYER_MAX_MP;
  private playerSprite!: Phaser.GameObjects.Sprite;
  private hpBar!: HPBar;
  private mpBar!: MPBar;
  private cardHand!: CardHand;
  private turnIndicator!: TurnIndicator;
  private logText!: Phaser.GameObjects.Text;
  private instructionsText!: Phaser.GameObjects.Text;
  private overlayContainer?: Phaser.GameObjects.Container;
  private guardActive = false;
  private playerTurnActive = true;
  private lastPlayerElement: Element | null = null;
  private selectedCardIndex = 0;
  private hand: BattleCard[] = [];
  private enemyViews: EnemyView[] = [];
  private logLines: string[] = [];
  private enemyQueue: BattleEnemyState[] = [];
  private keys: Phaser.Input.Keyboard.Key[] = [];
  private enterKey!: Phaser.Input.Keyboard.Key;
  private discardKey!: Phaser.Input.Keyboard.Key;
  private restartKey!: Phaser.Input.Keyboard.Key;
  private battleEnded = false;

  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data: BattleSceneInitData = {}) {
    const storedHP = this.registry.get('playerHP');
    const storedMP = this.registry.get('playerMP');
    this.playerHP = typeof storedHP === 'number' ? storedHP : PLAYER_MAX_HP;
    this.playerMP = typeof storedMP === 'number' ? storedMP : PLAYER_MAX_MP;
    this.guardActive = false;
    this.playerTurnActive = true;
    this.lastPlayerElement = null;
    this.selectedCardIndex = 0;
    this.logLines = [];
    this.hand = createInitialHand();
    this.enemyViews = [];
    this.battleEnded = false;
    this.overlayContainer = undefined;

    const incomingEnemies = data.enemies?.length
      ? data.enemies
      : data.enemy
        ? [data.enemy]
        : [];

    this.enemyQueue = incomingEnemies.map((enemy) =>
      'hp' in enemy ? { ...enemy } : createBattleEnemyState(enemy)
    );
  }

  create() {
    this.drawBackground();
    this.createBattlefield();
    this.createHud();
    this.createInput();
    this.renderEnemyHPBars();
    this.refreshPlayerUi();
    this.refreshHand();

    this.game.events.emit('battleStart');
    this.addLog('Battle started.');
  }

  update() {
    if (!this.playerTurnActive || this.battleEnded) {
      return;
    }

    for (let i = 0; i < 5; i += 1) {
      if (Phaser.Input.Keyboard.JustDown(this.keys[i])) {
        this.selectedCardIndex = i;
        this.refreshHand();
        return;
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.discardKey)) {
      this.discardSelectedCard();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.playSelectedCard();
    }
  }

  private drawBackground() {
    const bg = this.add.graphics();
    bg.fillStyle(0x09111f, 1);
    bg.fillRect(0, 0, 960, 640);

    bg.fillStyle(0x111f32, 1);
    bg.fillCircle(784, 96, 54);
    bg.fillStyle(0x111f32, 0.35);
    bg.fillCircle(784, 96, 90);

    const mountains = this.add.graphics();
    mountains.fillStyle(0x0d1828, 1);
    mountains.beginPath();
    mountains.moveTo(0, 420);
    mountains.lineTo(120, 280);
    mountains.lineTo(280, 360);
    mountains.lineTo(420, 250);
    mountains.lineTo(600, 350);
    mountains.lineTo(760, 220);
    mountains.lineTo(900, 320);
    mountains.lineTo(960, 290);
    mountains.lineTo(960, 420);
    mountains.closePath();
    mountains.fillPath();

    const floor = this.add.graphics();
    floor.fillStyle(0x130f16, 1);
    floor.fillRect(0, 420, 960, 220);
    for (let y = 420; y < 640; y += 28) {
      for (let x = 0; x < 960; x += 56) {
        floor.fillStyle((x / 56 + y / 28) % 2 === 0 ? 0x2b1f18 : 0x211712, 1);
        floor.fillRect(x, y, 56, 28);
      }
    }
  }

  private createBattlefield() {
    this.enemyQueue.forEach((enemy, index) => {
      const position = ENEMY_POSITIONS[index] ?? ENEMY_POSITIONS[ENEMY_POSITIONS.length - 1];
      const shadow = this.add.ellipse(position.x, position.y + 34, 56, 16, 0x000000, 0.28);
      const sprite = this.add.sprite(position.x, position.y, 'enemy_goblin').setScale(2.3);
      const hpBar = this.add.graphics();
      const label = this.add.text(position.x, position.y - 58, enemy.name, {
        fontFamily: 'Courier New',
        fontSize: '14px',
        color: '#f4d8d8',
      }).setOrigin(0.5);

      this.enemyViews.push({ enemy, sprite, shadow, hpBar, label });
    });

    this.add.ellipse(PLAYER_POSITION.x, PLAYER_POSITION.y + 34, 56, 16, 0x000000, 0.28);
    this.playerSprite = this.add.sprite(PLAYER_POSITION.x, PLAYER_POSITION.y, 'player_sprite')
      .setScale(2.4)
      .setFlipX(true);
  }

  private createHud() {
    const header = this.add.graphics();
    header.fillStyle(0x04070d, 0.8);
    header.fillRect(0, 0, 960, 72);
    header.lineStyle(2, 0x31435e, 0.7);
    header.lineBetween(0, 72, 960, 72);

    this.turnIndicator = new TurnIndicator({ scene: this, x: 140, y: 36 });
    this.turnIndicator.setTurn('player');

    this.hpBar = new HPBar({ scene: this, x: 630, y: 18, width: 210, height: 18 });
    this.mpBar = new MPBar({ scene: this, x: 630, y: 48, width: 210, height: 14 });

    this.instructionsText = this.add.text(24, 88, '1-5 Select  ENTER Use  X Discard & Draw', {
      fontFamily: 'Courier New',
      fontSize: '15px',
      color: '#d8d8d8',
    });

    this.logText = this.add.text(24, 116, '', {
      fontFamily: 'Courier New',
      fontSize: '15px',
      color: '#9eb3c7',
      lineSpacing: 6,
    });

    const handPanel = this.add.graphics();
    handPanel.fillStyle(0x04070d, 0.82);
    handPanel.fillRect(0, 492, 960, 148);
    handPanel.lineStyle(2, 0x31435e, 0.7);
    handPanel.lineBetween(0, 492, 960, 492);

    this.cardHand = new CardHand({ scene: this, y: 508 });
  }

  private createInput() {
    this.keys = [
      Phaser.Input.Keyboard.KeyCodes.ONE,
      Phaser.Input.Keyboard.KeyCodes.TWO,
      Phaser.Input.Keyboard.KeyCodes.THREE,
      Phaser.Input.Keyboard.KeyCodes.FOUR,
      Phaser.Input.Keyboard.KeyCodes.FIVE,
      Phaser.Input.Keyboard.KeyCodes.SIX,
      Phaser.Input.Keyboard.KeyCodes.SEVEN,
    ].map((code) => this.input.keyboard!.addKey(code));

    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.discardKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.restartKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);
  }

  private playSelectedCard() {
    const card = this.hand[this.selectedCardIndex];
    if (!card) {
      return;
    }

    if (this.playerMP < card.mpCost) {
      this.addLog(`${card.name} needs ${card.mpCost} MP.`);
      return;
    }

    this.playerMP -= card.mpCost;
    this.addLog(`You used ${card.name}.`);

    if (card.type === 'heal') {
      const amount = card.heal ?? 0;
      const recovered = Math.min(amount, PLAYER_MAX_HP - this.playerHP);
      this.playerHP = Math.min(PLAYER_MAX_HP, this.playerHP + amount);
      this.game.events.emit('heal', { value: recovered, x: PLAYER_POSITION.x, y: PLAYER_POSITION.y });
    } else if (card.type === 'defend') {
      this.guardActive = true;
      this.addLog('Guard raised for the next hit.');
    } else {
      this.lastPlayerElement = card.element;
      const target = this.enemyViews.find((entry) => entry.enemy.hp > 0);
      if (target) {
        this.damageEnemy(target, card.damage ?? 0, card.element);
      }
    }

    this.hand[this.selectedCardIndex] = drawCard();
    this.refreshPlayerUi();
    this.refreshHand();

    if (!this.battleEnded) {
      this.endPlayerTurn();
    }
  }

  private discardSelectedCard() {
    if (this.battleEnded) {
      return;
    }

    const current = this.hand[this.selectedCardIndex];
    this.hand[this.selectedCardIndex] = drawCard();
    this.addLog(`Discarded ${current.name}. Drew ${this.hand[this.selectedCardIndex].name}.`);
    this.refreshHand();
  }

  private damageEnemy(view: EnemyView, baseDamage: number, element: Element | null) {
    const damage = baseDamage;
    view.enemy.hp = Math.max(0, view.enemy.hp - damage);
    this.game.events.emit('damage', { value: damage, x: view.sprite.x, y: view.sprite.y - 10 });
    this.flash(view.sprite, element ? CARD_POOL.find((card) => card.element === element)?.accentColor ?? 0xffffff : 0xffffff);
    this.addLog(`${view.enemy.name} takes ${damage} damage.`);
    this.renderEnemyHPBars();

    if (view.enemy.hp <= 0) {
      this.addLog(`${view.enemy.name} was defeated.`);
      view.sprite.setTint(0x333333);
      view.shadow.setVisible(false);
    }

    if (this.enemyViews.every((entry) => entry.enemy.hp <= 0)) {
      this.handleVictory();
    }
  }

  private endPlayerTurn() {
    this.playerTurnActive = false;
    this.turnIndicator.setTurn('enemy');
    this.time.delayedCall(500, () => {
      this.runEnemyTurn(0);
    });
  }

  private runEnemyTurn(index: number) {
    if (this.battleEnded) {
      return;
    }

    const livingEnemies = this.enemyViews.filter((entry) => entry.enemy.hp > 0);
    if (index >= livingEnemies.length) {
      this.finishEnemyTurn();
      return;
    }

    const attacker = livingEnemies[index];
    const attackElement = Phaser.Utils.Array.GetRandom(attacker.enemy.attackElements);
    const baseDamage = Phaser.Math.Between(5, 12);
    const reaction = getTurnReaction(this.lastPlayerElement, attackElement);
    let totalDamage = baseDamage;

    if (reaction) {
      totalDamage = Math.floor(baseDamage * reaction.multiplier);
      this.addLog(`${reaction.label} triggered.`);
      this.game.events.emit('elementReact', {
        element: reaction.visualElement,
        x: PLAYER_POSITION.x,
        y: PLAYER_POSITION.y - 20,
        label: reaction.label,
      });
    }

    this.lastPlayerElement = null;
    this.addLog(`${attacker.enemy.name} attacks with ${attackElement}.`);
    this.damagePlayer(totalDamage, attackElement);

    if (this.battleEnded) {
      return;
    }

    this.time.delayedCall(700, () => this.runEnemyTurn(index + 1));
  }

  private damagePlayer(amount: number, element: Element) {
    const actual = this.guardActive ? Math.floor(amount * 0.5) : amount;
    if (this.guardActive) {
      this.addLog(`Guard reduced damage to ${actual}.`);
    }

    this.guardActive = false;
    this.playerHP = Math.max(0, this.playerHP - actual);
    this.game.events.emit('damage', { value: actual, x: PLAYER_POSITION.x, y: PLAYER_POSITION.y - 10 });
    this.flash(this.playerSprite, CARD_POOL.find((card) => card.element === element)?.accentColor ?? 0xff6666);
    this.refreshPlayerUi();

    if (this.playerHP <= 0) {
      this.handleDefeat();
    }
  }

  private finishEnemyTurn() {
    if (this.battleEnded) {
      return;
    }

    const recoveredMp = Math.min(MP_REGEN_PER_ROUND, PLAYER_MAX_MP - this.playerMP);
    this.playerMP = Math.min(PLAYER_MAX_MP, this.playerMP + MP_REGEN_PER_ROUND);
    if (recoveredMp > 0) {
      this.addLog(`Recovered ${recoveredMp} MP.`);
    }

    this.playerTurnActive = true;
    this.turnIndicator.setTurn('player');
    this.refreshPlayerUi();
    this.refreshHand();
  }

  private handleVictory() {
    this.battleEnded = true;
    this.playerTurnActive = false;
    this.registry.set('playerHP', this.playerHP);
    this.registry.set('playerMP', this.playerMP);

    const enemyId = this.enemyViews[0]?.enemy.id;
    this.addLog('Battle won.');
    this.turnIndicator.setTurn('player');
    this.game.events.emit('victory');

    if (enemyId) {
      const defeated = (this.registry.get('defeatedEnemies') as string[] | undefined) ?? [];
      if (!defeated.includes(enemyId)) {
        this.registry.set('defeatedEnemies', [...defeated, enemyId]);
      }
    }

    const banner = this.add.text(480, 264, 'Victory', {
      fontFamily: 'Georgia',
      fontSize: '58px',
      color: '#ffdb6e',
      fontStyle: 'bold',
      stroke: '#5f4300',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(120);

    this.time.delayedCall(900, () => {
      banner.destroy();
      if (enemyId) {
        sceneEvents.emit('battleWon', { enemyId } satisfies BattleWonPayload);
        return;
      }
      this.scene.stop();
    });
  }

  private handleDefeat() {
    this.battleEnded = true;
    this.playerTurnActive = false;
    this.registry.remove('playerHP');
    this.registry.remove('playerMP');
    sceneEvents.emit('battleLost');
    this.showGameOverOverlay();
  }

  private showGameOverOverlay() {
    const container = this.add.container(0, 0).setDepth(200);
    const blocker = this.add.rectangle(480, 320, 960, 640, 0x000000, 0.72);
    const panel = this.add.rectangle(480, 320, 360, 220, 0x0c1320, 0.96);
    panel.setStrokeStyle(3, 0xe06b6b, 1);
    const title = this.add.text(480, 258, 'Game Over', {
      fontFamily: 'Georgia',
      fontSize: '44px',
      color: '#ff8f8f',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    const subtitle = this.add.text(480, 314, 'Press R or click Restart', {
      fontFamily: 'Courier New',
      fontSize: '18px',
      color: '#d8d8d8',
    }).setOrigin(0.5);
    const button = this.add.rectangle(480, 380, 180, 46, 0x3b7cff, 1)
      .setInteractive({ useHandCursor: true });
    const buttonText = this.add.text(480, 380, 'Restart', {
      fontFamily: 'Courier New',
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const restart = () => {
      this.registry.remove('defeatedEnemies');
      this.registry.remove('playerHP');
      this.registry.remove('playerMP');
      this.scene.stop('MapScene');
      this.scene.start('MapScene', { resetProgress: true });
    };

    button.on('pointerdown', restart);
    this.restartKey.once('down', restart);

    container.add([blocker, panel, title, subtitle, button, buttonText]);
    this.overlayContainer = container;
  }

  private refreshPlayerUi() {
    this.hpBar.setValue(this.playerHP, PLAYER_MAX_HP);
    this.mpBar.setValue(this.playerMP, PLAYER_MAX_MP);
  }

  private refreshHand() {
    this.cardHand.render(this.hand, this.selectedCardIndex, this.playerMP);
  }

  private renderEnemyHPBars() {
    this.enemyViews.forEach((view) => {
      const ratio = Phaser.Math.Clamp(view.enemy.hp / view.enemy.maxHP, 0, 1);
      view.hpBar.clear();
      view.hpBar.fillStyle(0x1c1114, 1);
      view.hpBar.fillRoundedRect(view.sprite.x - 44, view.sprite.y + 42, 88, 10, 5);
      view.hpBar.fillStyle(0xe06060, 1);
      view.hpBar.fillRoundedRect(view.sprite.x - 42, view.sprite.y + 44, 84 * ratio, 6, 4);
      view.hpBar.lineStyle(1, 0xffffff, 0.25);
      view.hpBar.strokeRoundedRect(view.sprite.x - 44, view.sprite.y + 42, 88, 10, 5);
      view.label.setText(`${view.enemy.name} ${view.enemy.hp}/${view.enemy.maxHP}`);
      view.sprite.setAlpha(view.enemy.hp > 0 ? 1 : 0.45);
    });
  }

  private addLog(message: string) {
    this.logLines.push(message);
    this.logLines = this.logLines.slice(-MAX_LOG_LINES);
    this.logText.setText(this.logLines.join('\n'));
  }

  private flash(target: Phaser.GameObjects.Sprite, color: number) {
    target.setTint(color);
    this.time.delayedCall(160, () => {
      if (target.active) {
        target.clearTint();
      }
    });
  }
}
