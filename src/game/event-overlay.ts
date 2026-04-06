// Tavern / Random Event Overlay
// Shown when player walks onto a BUILDING tile

export interface EventEntry {
  icon: string;
  title: string;
  body: string;
  choices?: { label: string; effect: () => string }[];
  autoText?: string;  // single outcome
}

const TAVERN_EVENTS: EventEntry[] = [
  {
    icon: '🍺',
    title: '酒馆老板的消息',
    body: '"前一伙冒险者留下了这张地图，标着洞穴深处的宝藏位置..."',
    autoText: '📜 获得洞穴线索：下一个区域可能有更多宝箱。',
  },
  {
    icon: '⚔️',
    title: '流浪剑客的交易',
    body: '"我这把旧剑用腻了，跟你换一把新的怎么样？"',
    autoText: '💰 花费 20 魂值，攻击力临时 +5%（永久增益未实现，跳过）',
  },
  {
    icon: '🧙',
    title: '神秘占卜师',
    body: '"我看到了你的未来...前方有强大的敌人在等待..."',
    autoText: '🔮 预感：下一个敌人弱点为火属性。',
  },
  {
    icon: '🍖',
    title: '旅店宴会',
    body: '"来喝一杯！今晚我请客！"',
    autoText: '🍖 HP 完全恢复！精神抖擞继续冒险！',
  },
  {
    icon: '🎭',
    title: '街头艺人',
    body: '"给个赏钱吧，旅行者！"',
    autoText: '💸 赠送 5 魂值，获得「好心情」buff：本场战斗伤害 +3%',
  },
  {
    icon: '📖',
    title: '老书商的建议',
    body: '"年轻人，你知道元素之间有相克关系吗？火克冰，冰克风..."',
    autoText: '📖 知识解锁：战斗日志将显示元素弱点提示。',
  },
  {
    icon: '🌿',
    title: '草药商人',
    body: '"这株草药能恢复体力，便宜卖给你！"',
    autoText: '🌿 HP +15。继续探索吧！',
  },
  {
    icon: '🔮',
    title: '奇怪的商人',
    body: '"我这儿有样好东西...但你需要付出一点代价。"',
    autoText: '🔮 MP -5，攻击力 +8%，持续3场战斗（永久增益未实现，跳过）',
  },
];

export function pickRandomEvent(): EventEntry {
  return TAVERN_EVENTS[Math.floor(Math.random() * TAVERN_EVENTS.length)];
}

export function showEventOverlay(scene: Phaser.Scene, event: EventEntry, depth = 300): void {
  const bg = scene.add.rectangle(480, 320, 960, 640, 0x000000, 0.62).setDepth(depth).setInteractive();

  const panel = scene.add.rectangle(480, 300, 420, 260, 0x0d0d1f, 0.98)
    .setDepth(depth + 1).setStrokeStyle(2, 0x6688cc);

  const titleText = scene.add.text(480, 230, `${event.icon} ${event.title}`, {
    fontFamily: 'Georgia', fontSize: '22px', color: '#aaccee', fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(depth + 2);

  const bodyText = scene.add.text(480, 280, event.body, {
    fontFamily: 'Courier New', fontSize: '15px', color: '#ddeeff',
    align: 'center', wordWrap: { width: 360 },
  }).setOrigin(0.5, 0).setDepth(depth + 2);

  const resultText = scene.add.text(480, 350, event.autoText ?? '', {
    fontFamily: 'Courier New', fontSize: '14px', color: '#ffcc66',
    align: 'center', wordWrap: { width: 360 },
  }).setOrigin(0.5, 0).setDepth(depth + 2);

  const closeBtn = scene.add.rectangle(480, 410, 140, 38, 0x3366cc, 1)
    .setDepth(depth + 2).setInteractive({ useHandCursor: true });
  const closeTxt = scene.add.text(480, 410, '继续冒险 →', {
    fontFamily: 'Courier New', fontSize: '16px', color: '#ffffff', fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(depth + 3);

  closeBtn.on('pointerdown', () => {
    bg.destroy(); panel.destroy(); titleText.destroy();
    bodyText.destroy(); resultText.destroy();
    closeBtn.destroy(); closeTxt.destroy();
  });
}
