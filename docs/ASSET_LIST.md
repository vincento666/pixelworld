# 🎮 PixelWorld 素材清单

> 版本：v0.4 | 更新日期：2026-04-06  
> 用途：统一规划所有美术资产，团队成员按清单上传

---

## 📌 命名规范

所有文件统一格式：
```
[类别前缀]_[主题]_[名称]_[状态].[扩展名]
```

| 类别前缀 | 含义 |
|---|---|
| `char_` | 角色/精灵 |
| `tile_` | 瓦片/地图元素 |
| `ui_` | UI 元素 |
| `fx_` | 特效/动画 |
| `bg_` | 背景 |
| `icon_` | 图标/符号 |
| `card_` | 卡牌图案 |
| `bgm_` | 背景音乐 |
| `sfx_` | 音效 |

---

## 🧌 角色精灵（Character Sprites）

> 规格：PNG / 透明背景 / 建议 128×128

| 资源名 | 说明 | 尺寸 | 备注 |
|---|---|---|---|
| `char_player_hero` | 玩家主角（默认皮肤） | 128×128 | 正面站姿 |
| `char_player_hero_blue` | 玩家蓝皮肤（可选） | 128×128 | 配色变体 |
| `char_enemy_goblin_grunt` | 哥布林战士 | 128×128 | 绿色，武器 |
| `char_enemy_goblin_archer` | 哥布林弓箭手 | 128×128 | 背弓姿态 |
| `char_enemy_goblin_shaman` | 哥布林萨满 | 128×128 | 带杖/有光环 |
| `char_enemy_goblin_dead` | 哥布林死亡状态 | 128×128 | 灰度/透明化 |
| `char_boss_troll` | 巨石魔（Boss预留） | 256×256 | 大尺寸 |

---

## 🗺️ 地图瓦片（Map Tiles）

> 规格：PNG / 透明背景 / 瓦片 64×64

| 资源名 | 说明 | 尺寸 |
|---|---|---|
| `tile_grass_light` | 浅草地 | 64×64 |
| `tile_grass_dark` | 深草地 | 64×64 |
| `tile_wall_stone` | 石墙 | 64×64 |
| `tile_wall_ruin` | 遗迹墙 | 64×64 |
| `tile_path_dirt` | 泥土路 | 64×64 |
| `tile_water` | 水面 | 64×64 |
| `tile_tree` | 树木 | 64×128 |
| `tile_rock` | 岩石 | 64×64 |
| `tile_chest` | 宝箱 | 64×64 |
| `tile_door` | 门 | 64×64 |
| `tile_portal` | 传送门 | 128×128 |

---

## 🖼️ 背景图（Backgrounds）

> 规格：PNG / 960×640（战斗场景）

| 资源名 | 说明 |
|---|---|
| `bg_battle_dungeon` | 地牢战斗背景 |
| `bg_battle_forest` | 森林战斗背景 |
| `bg_battle_cave` | 洞穴战斗背景 |
| `bg_map_world` | 大世界地图背景 |
| `bg_title_screen` | 标题画面背景 |

---

## 🃏 卡牌图案（Card Art）

> 规格：PNG / 透明背景 / 建议 160×120

| 资源名 | 说明 | 元素 |
|---|---|---|
| `card_strike` | Strike（物理攻击） | 物理 |
| `card_fireball` | Fireball（火球术） | 火 |
| `card_ice_spike` | Ice Spike（冰刺术） | 冰 |
| `card_thunder` | Thunder（雷击术） | 雷 |
| `card_wind_slash` | Wind Slash（风刃术） | 风 |
| `card_heal` | Heal（治疗术） | 无 |
| `card_defend` | Defend（防御姿态） | 无 |

---

## ⚔️ 特效（Effects）

> 规格：PNG序列帧 或 WebM / 透明背景

| 资源名 | 说明 | 尺寸 |
|---|---|---|
| `fx_fire_hit` | 火焰命中特效 | 64×64 |
| `fx_ice_hit` | 冰霜命中特效 | 64×64 |
| `fx_thunder_hit` | 雷击特效 | 128×128 |
| `fx_heal_aura` | 治疗光环 | 96×96 |
| `fx_vaporize` | 蒸发反应特效 | 96×96 |
| `fx_melt` | 融化反应特效 | 96×96 |
| `fx_chain` | 链式反应特效 | 128×128 |
| `fx_freeze` | 冻结反应特效 | 96×96 |
| `fx_shock` | 感电反应特效 | 96×96 |
| `fx_guard` | 防御姿态光盾 | 96×96 |
| `fx_damage_number` | 伤害数字（通用） | 64×32 |
| `fx_death` | 敌人死亡特效 | 96×96 |

---

## 🖥️ UI 元素（UI Assets）

> 规格：PNG / 透明背景

| 资源名 | 说明 | 尺寸 |
|---|---|---|
| `ui_hp_bar` | 血条背景+边框 | 220×18 |
| `ui_mp_bar` | 蓝条背景+边框 | 220×14 |
| `ui_card_frame` | 卡牌外框（选中态） | 160×120 |
| `ui_card_frame_normal` | 卡牌外框（普通态） | 160×120 |
| `ui_turn_indicator` | 回合指示框 | 176×36 |
| `ui_button_restart` | 重开按钮 | 180×46 |
| `ui_panel_dark` | 深色面板 | 360×220 |
| `ui_panel_gameover` | GameOver 面板 | 360×220 |
| `ui_hand_bg` | 手牌区域背景 | 960×148 |

---

## 🌍 图标（Icons）

> 规格：PNG / 透明背景 / 32×32

| 资源名 | 说明 |
|---|---|
| `icon_fire` | 火元素图标 |
| `icon_ice` | 冰元素图标 |
| `icon_thunder` | 雷元素图标 |
| `icon_wind` | 风元素图标 |
| `icon_water` | 水元素图标 |
| `icon_physical` | 物理图标（拳头） |
| `icon_hp` | 生命值图标 |
| `icon_mp` | 魔法值图标 |
| `icon_shield` | 防御图标 |

---

## 🔊 音频素材（Audio）

> 格式：MP3 / OGG

| 资源名 | 说明 | 时长 | 优先级 |
|---|---|---|---|
| `bgm_battle` | 战斗 BGM（循环） | 循环 | ⭐高 |
| `bgm_map` | 地图探索 BGM（循环） | 循环 | ⭐高 |
| `sfx_card_draw` | 抽卡音效 | ~0.3s | 中 |
| `sfx_card_play` | 出牌音效 | ~0.5s | 中 |
| `sfx_fire` | 火系攻击音效 | ~1s | 中 |
| `sfx_ice` | 冰系攻击音效 | ~1s | 中 |
| `sfx_thunder` | 雷系攻击音效 | ~1s | 中 |
| `sfx_heal` | 治疗音效 | ~1s | 低 |
| `sfx_enemy_hit` | 敌人受击音效 | ~0.3s | 高 |
| `sfx_player_hit` | 玩家受击音效 | ~0.3s | 高 |
| `sfx_victory` | 胜利音效 | ~2s | 高 |
| `sfx_defeat` | 失败音效 | ~2s | 高 |
| `sfx_step_grass` | 草地脚步声 | ~0.2s | 低 |
| `sfx_chest_open` | 宝箱开启音效 | ~0.5s | 低 |

---

## 📋 上传追踪表

上传完成后，将飞书文件链接填入下表：

| 资源名 | 飞书文件链接 | 上传人 | 状态 |
|---|---|---|---|
| `char_player_hero` | （待上传） | - | ⬜ |
| `char_enemy_goblin_grunt` | （待上传） | - | ⬜ |
| `char_enemy_goblin_archer` | （待上传） | - | ⬜ |
| `char_enemy_goblin_shaman` | （待上传） | - | ⬜ |
| `card_strike` | （待上传） | - | ⬜ |
| `card_fireball` | （待上传） | - | ⬜ |
| `card_ice_spike` | （待上传） | - | ⬜ |
| `card_thunder` | （待上传） | - | ⬜ |
| `card_wind_slash` | （待上传） | - | ⬜ |
| `card_heal` | （待上传） | - | ⬜ |
| `card_defend` | （待上传） | - | ⬜ |
| `tile_grass_light` | （待上传） | - | ⬜ |
| `tile_wall_stone` | （待上传） | - | ⬜ |
| `fx_fire_hit` | （待上传） | - | ⬜ |
| `fx_ice_hit` | （待上传） | - | ⬜ |
| `fx_thunder_hit` | （待上传） | - | ⬜ |
| `bg_battle_dungeon` | （待上传） | - | ⬜ |
| `ui_hp_bar` | （待上传） | - | ⬜ |
| `bgm_battle` | （待上传） | - | ⬜ |
| `sfx_enemy_hit` | （待上传） | - | ⬜ |

---

*由 PixelWorld Agent 自动生成 | 最后更新：2026-04-06*  
*存放路径：/workspace/pixelworld/assets/ASSET_LIST.md*
