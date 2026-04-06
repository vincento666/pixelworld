# PixelWorld — 技术规格说明书 / SPEC.md
> 版本：v0.1（MVP 技术规格）
> 日期：2026-04-05
> 状态：✅ 已冻结
> 关联：PRD v0.4

---

## 1. 架构总览

```
┌─────────────────────────────────────────────────────────┐
│                     客户端（Browser）                     │
│  Vite + TypeScript + Phaser 3.80+ (WebGL)               │
│  ├── 场景层（Scene）                                     │
│  │   ├── BootScene       资源预加载                       │
│  │   ├── TitleScene      标题/创建角色                    │
│  │   ├── MapScene        等距地图探索（2.5D）              │
│  │   ├── BattleScene     回合制战斗（3x3 九宫格）          │
│  │   └── UIScene         HUD/卡片/对话框                  │
│  └── 系统层                                              │
│      ├── SoulManager      Soul.md 读写与融合              │
│      ├── CardManager      卡片抽卡/持有/效果系统           │
│      ├── ElementSystem   元素反应引擎（一阶 + 二阶）       │
│      └── SaveManager      本地存档 + Rebirth 序列化        │
└─────────────────────────────────────────────────────────┘
                           │ WebSocket
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   服务端（Node.js）                      │
│  Colyseus 0.15+  (权威状态同步)                         │
│  ├── PixelRoom        世界房间（状态广播）                │
│  ├── BattleRoom       战斗房间（同步操作）                │
│  └── ArchiveRoom       存档/跨周目数据                    │
└─────────────────────────────────────────────────────────┘
                           │ MCP
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   AI 层（OpenClaw）                     │
│  openclaw.MCP tools → AI Agent 驱动 NPC 行为             │
│  ├── SOUL.md          角色灵魂文件                       │
│  ├── Memory.md        操作日志                          │
│  └── SOUL_ARCHIVE/   多周目记忆库                        │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 技术选型

| 层级 | 技术 | 版本要求 | 说明 |
|------|------|---------|------|
| 前端构建 | Vite | 5.x | 极速 HMR，支持 TS |
| 前端语言 | TypeScript | 5.x | 类型安全 |
| 游戏引擎 | Phaser | 3.80+ | WebGL，等距视角 |
| 服务端 | Node.js | 20.x | ESM |
| 游戏服务器 | Colyseus | 0.15.x | 权威状态同步 |
| AI 接入 | OpenClaw MCP | 已有 | 直接复用 |
| 部署 | @openclaw/deploy | 已有 | 前端静态部署 |

---

## 3. 客户端架构

### 3.1 场景（Scene）定义

| 场景 | 职责 | 入口条件 |
|------|------|---------|
| `BootScene` | 加载资源（sprite/音频/字体） | 应用启动 |
| `TitleScene` | 标题画面 + 角色创建（读入 SOUL.md） | Boot 完成 |
| `MapScene` | 等距地图渲染 + 区域切换 | 开始冒险 |
| `BattleScene` | 回合制战斗 + 元素反应 + 卡片效果 | 遭遇敌人 |
| `UIScene` | 全局 HUD、对话框、菜单覆盖 | 始终运行 |

### 3.2 等距引擎（MapScene 核心）

```
坐标系转换：
  逻辑坐标 [x, y]（2D 数组）→ 屏幕像素 [px, py]（等距投影）
  px = (x - y) * TILE_WIDTH_HALF
  py = (x + y) * TILE_HEIGHT_HALF

地图数据格式（JSON）：
{
  "width": 12,       // 逻辑宽度（格子数）
  "height": 12,      // 逻辑高度（格子数）
  "tileWidth": 64,   // 瓦片像素宽
  "tileHeight": 32,  // 瓦片像素高（2:1 比率 = 标准等距）
  "layers": [
    {
      "name": "ground",
      "data": [0,1,2,...]  // 瓦片 ID 数组，w*h 个
    }
  ],
  "entities": [
    { "type": "player", "x": 2, "y": 3 },
    { "type": "npc", "x": 5, "y": 5, "id": "blacksmith" },
    { "type": "enemy", "x": 8, "y": 4, "id": "goblin" }
  ]
}

碰撞：Tileset 定义每张瓦片的碰撞属性（0=可通过，1=阻挡，2=触发战斗）
```

### 3.3 回合制战斗（BattleScene 核心）

```
战斗流程：
  [玩家回合] → 选行动 → 选目标 → 执行 → 结算反馈
        ↑                              ↓
        ←←←←←←← 轮到敌方 ←←←←←←←←←←←←←

AP 系统（Action Point）：
  每个角色每回合获得 3 AP
  攻击消耗 1~2 AP（取决于技能）
  移动消耗 1 AP（九宫格内移动一格）
  使用卡牌消耗 0~2 AP

3x3 九宫格定位：
  位置编码：[0,1,2]（第1行），[3,4,5]（第2行），[6,7,8]（第3行）
  主角固定在中心格（位置 4），敌人分布在其他格
  站位影响技能命中率和元素反应范围

行动选项：
  1. 攻击（物理/元素）→ 选择目标格
  2. 移动 → 选择目标格（消耗 1 AP）
  3. 使用卡牌 → 选择手牌 → 选择目标
  4. 待机 → 跳过本回合

伤害公式：
  物理伤害 = 攻击力 × (1 - 防御率) × 元素克制修正 × 暴击修正
  元素伤害 = 元素精通 × 反应系数 × 元素克制修正
```

### 3.4 元素反应引擎

```typescript
// 元素类型枚举
type Element = 'fire' | 'ice' | 'thunder' | 'water' | 'wind' | 'physical';

// 一阶反应表（先行元素 → 触发元素 → 反应类型）
const REACTION_TABLE: Record<Element, Partial<Record<Element, ReactionType>>> = {
  fire:    { ice: 'melt', thunder: 'vaporize', water: 'vaporize', wind: 'spread' },
  ice:     { fire: 'melt', thunder: 'conductive', water: 'melt', wind: 'spread' },
  thunder: { fire: 'vaporize', ice: 'conductive', water: 'strong_conductive', wind: 'spread' },
  water:   { fire: 'vaporize', ice: 'melt', thunder: 'strong_conductive', wind: 'spread' },
  wind:    { fire: 'spread', ice: 'spread', thunder: 'spread', water: 'spread' },
  physical:{ fire: 'melt', ice: 'shatter', thunder: 'conductive', water: 'strong_conductive' },
};

// 二阶反应（需要先有元素附着状态）
type ReactionState = 'none' | 'ignited' | 'frozen' | 'electrocuted' | 'wet';

const SECONDARY_REACTIONS: Record<string, SecondaryReaction> = {
  'frozen+physical': { name: 'shatter', damage: 15, effect: '破冰附加物理伤害' },
  'electrocuted+physical': { name: 'conductive_break', damage: 12, effect: '导体断裂，感电期间物理伤害+15%' },
  'ignited+water': { name: 'vaporize_ex', damage: 20, effect: '沸腾，额外火属性范围伤害' },
  'wet+thunder': { name: 'chain_lightning', damage: 18, effect: '强导，导电链，附近水体传递电流' },
};
```

### 3.5 卡片系统

```typescript
// 卡片基础接口
interface Card {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'legendary';
  cost: number;         // AP 消耗
  type: 'attack' | 'skill' | 'buff' | 'debuff' | 'reaction';
  element?: Element;
  effect: string;        // 描述文本
  apply: (ctx: BattleContext) => void;  // 效果函数
}

// 持有上限
const HOLD_LIMITS = { common: 6, rare: 4, legendary: 2 };

// 初始抽卡：每局开始抽 3 张，ROLL 1 次可换
// 周目加成：多周目后持有上限和初始卡组扩充
```

### 3.6 SoulManager（Soul.md 读写引擎）

```typescript
// Soul 文件路径
const SOUL_PATH = './SOUL.md';
const MEMORY_PATH = './memory/YYYY-MM-DD.md';
const ARCHIVE_PATH = './SOUL_ARCHIVE/';

// Soul 结构（对齐 PRD v0.4 + 荣格原型）
interface Soul {
  // 身份核心（自性原型）
  core: {
    name: string;
    archetype: JungArchetype;  // 12原型之一
    values: string[];          // 核心价值观（3~5条）
    fears: string[];          // 核心恐惧（2~3条）
  };
  // 人格面具（对外呈现）
  persona: {
    style: 'formal' | 'casual' | 'warm' | 'cold' | 'humorous';
    speechPatterns: string[];
  };
  // 阴影（边界）
  shadow: {
    boundaries: string[];      // 绝对不做的事
    blindSpots: string[];     // 不自知的弱点
  };
  // 战斗风格（由记忆蒸馏而来）
  combatStyle: {
    preferredElements: Element[];
    tactics: 'aggressive' | 'defensive' | 'balanced';
    cardPreferences: string[]; // 偏好卡组
  };
  // 跨周目印记（Rebirth 不清零）
  soul印记: string[];
}

// 存档格式
interface GameSave {
  version: string;
  ngCount: number;             // 周目数
  currentZone: number;        // 当前区域（1~3）
  currentArea: number;         // 当前小关
  player: {
    hp: number;
    maxHp: number;
    ap: number;
    position: number;         // 九宫格位置 0~8
    soul: Soul;
    cards: Card[];            // 当前手牌
    soulValue: number;        // 魂值
  };
  permanentUnlocks: {
    unlockedCards: string[];  // 已解锁卡库
    maxCardSlots: number;     // 最大卡槽数
    permanentBuffs: string[]; // 永久增益
  };
  archive: SoulArchiveEntry[];
}
```

---

## 4. 服务端架构（Colyseus）

### 4.1 房间类型

| 房间 | 生命周期 | 状态 | 说明 |
|------|---------|------|------|
| `WorldRoom` | 长期 | 地图 + 玩家位置 + NPC 状态 | 常驻，支持访客 |
| `BattleRoom` | 战斗时长 | HP/AP/站位/行动序列 | 战斗结束后销毁 |
| `ArchiveRoom` | 存档操作 | Soul.md 版本历史 | 按需创建 |

### 4.2 权威状态 Schema

```typescript
// WorldRoom 状态
class WorldRoom extends Room {
  onInit() {
    this.setState({
      players: Map<sessionId, PlayerState>,
      npcs: Map<npcId, NpcState>,
      zone: 'zone_1',
      worldMood: 'exploration',  // 世界基调标记
    });
  }
}

// BattleRoom 状态
class BattleRoom extends Room {
  state: {
    turn: number;
    currentActorId: string;
    phase: 'player_turn' | 'enemy_turn' | 'resolution' | 'victory' | 'defeat';
    grid: (ActorState | null)[9];  // 九宫格，9个位置
    playerAction: PlayerAction | null;
    log: BattleLogEntry[];
  };
}
```

---

## 5. 开发方法论：SDD + TDD

### 5.1 SDD（Story-Driven Development）流程

```
每个功能开发流程：

  ① 写 .spec.ts（验收规格）
       ↓ 明确输入/输出/边界行为
  ② 写最小实现代码
       ↓ 通过规格验证
  ③ 重构（可选）
       ↓ 保持行为不变，提升质量
  ④ 提交 + 报告
```

### 5.2 MVP Spec 列表（按优先级）

| # | 功能模块 | Spec 文件 | 优先级 | 依赖 |
|---|---------|---------|-------|------|
| 1 | 项目初始化 + 打包 | `spec.init.md` | P0 | 无 |
| 2 | Phaser 3 等距地图渲染 | `spec.map.md` | P0 | 1 |
| 3 | 角色移动 + 碰撞检测 | `spec.move.md` | P0 | 2 |
| 4 | 3x3 九宫格战斗场景 | `spec.battle.md` | P0 | 2 |
| 5 | 回合制 AP + 行动系统 | `spec.turn.md` | P0 | 4 |
| 6 | 元素反应引擎（一阶） | `spec.element.md` | P1 | 4 |
| 7 | 卡片系统基础版 | `spec.card.md` | P1 | 4 |
| 8 | Soul.md 读写 + 角色创建 | `spec.soul.md` | P1 | 1 |
| 9 | 区域推进 + 存档 | `spec.zone.md` | P1 | 3 |
| 10 | Rebirth 机制 | `spec.rebirth.md` | P2 | 8+9 |
| 11 | Colyseus 多人同步 | `spec.multiplayer.md` | P2 | 4 |
| 12 | AI NPC 行为驱动 | `spec.ai.md` | P2 | 8 |

---

## 6. 目录结构

```
/workspace/pixelworld/
├── SPEC.md                      # 本规格文档
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── src/
│   ├── main.ts                  # 入口
│   ├── scenes/
│   │   ├── BootScene.ts
│   │   ├── TitleScene.ts
│   │   ├── MapScene.ts          # 等距地图核心
│   │   ├── BattleScene.ts       # 回合制战斗核心
│   │   └── UIScene.ts
│   ├── game/
│   │   ├── SoulManager.ts       # Soul.md 读写
│   │   ├── CardManager.ts
│   │   ├── ElementSystem.ts     # 元素反应引擎
│   │   ├── SaveManager.ts       # 存档 + Rebirth
│   │   └── AStarPathfinder.ts   # 寻路（如需要）
│   ├── network/
│   │   └── ColyseusClient.ts
│   ├── assets/
│   │   ├── tilesets/            # 瓦片图
│   │   ├── sprites/             # 角色精灵
│   │   └── audio/
│   └── types/
│       ├── soul.ts
│       ├── element.ts
│       └── card.ts
├── server/
│   ├── index.ts                 # Colyseus 服务端入口
│   ├── rooms/
│   │   ├── WorldRoom.ts
│   │   └── BattleRoom.ts
│   └── schema/
│       └── GameState.ts
└── public/
    └── assets/
```

---

## 7. 验收标准（MVP 可运行）

- [ ] `npm run dev` 启动前端开发服务器，无报错
- [ ] 等距地图加载并渲染（瓦片 + 角色）
- [ ] 角色可以用方向键/WASD 在地图上移动
- [ ] 走到敌人触发区域，切换到 BattleScene
- [ ] 九宫格显示，角色站在位置 4
- [ ] 玩家可选择：攻击/移动/使用卡牌/待机
- [ ] 攻击有数值结算，HP 减少
- [ ] 元素反应正确触发（一阶反应）
- [ ] 战斗胜利 → 区域推进 → 存档
- [ ] Soul.md 文件创建并正确写入角色数据
- [ ] 死亡 → Rebirth 界面 → 重新开始
- [ ] `npm run build` 产出可用 dist/
- [ ] `deploy` 工具部署后公网可访问

---

*SPEC.md 与 PRD v0.4 对应。每项功能开发前必须先写 spec，通过后才提交。*
