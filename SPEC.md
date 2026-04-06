# PixelWorld — Octopath Traveler Style RPG MVP

> **Platform Note**: This document describes the gameplay layer. Implementation is web-based (Phaser 3) for rapid prototyping. UE5 port inherits gameplay specs verbatim; performance/visual tier is an UE5 concern.

---

## 1. Game Overview

**Type**: Single-player, turn-based, pixel RPG with Octopath Traveler aesthetic.

**Core Loop**: Explore → Trigger Battle → Use Card Skills → Defeat Enemies → Collect / Upgrade → Repeat.

**Target**: 2D pixel art, isometric-adjacent perspective, SNES-era feel with modern UI polish.

---

## 2. Core Systems

### 2.1 Map / Exploration

- **View**: Top-down or slightly angled isometric tile map.
- **Player Movement**: 8-directional (WASD / arrow keys), tile-based collision.
- **Battle Trigger**: Walk into enemy sprite on map → Enter battle scene.
- **Map Tiles**: Walkable (grass), blocked (wall/cube).
- **Enemies**: Visible on map as sprites. Defeated enemies do not respawn (persisted via registry).

### 2.2 Battle System

**Layout**: Left-right horizontal layout (not surround/grid).
- Player party: Right side of screen.
- Enemies: Left side of screen.

**Turn Structure**:
```
Player Turn
  → Select card / action
  → Execute → Damage / Effect
  → [Optional] Element reaction check
Enemy Turn
  → Each living enemy attacks sequentially
  → Player takes damage
  → MP regeneration (+5 per full round)
Player Turn (loop)
```

**Win Condition**: All enemies HP reach 0.
**Lose Condition**: Player HP reaches 0.

### 2.3 Card / Skill System

**Hand**: 5 cards held at bottom of battle screen. Player selects with number keys 1-5.

| Card | Element | Damage | MP Cost | Effect |
|------|---------|--------|---------|--------|
| Strike | Physical | 18 | 0 | Basic attack |
| Fireball | Fire | 24 | 6 | Fire magic |
| Ice Spike | Ice | 20 | 5 | Ice magic |
| Thunder | Thunder | 28 | 8 | Lightning |
| Wind Slash | Wind | 16 | 4 | Wind slash |
| Heal | — | — | 7 | Restore 30 HP |
| Defend | — | — | 3 | Block 50% next hit |

**Discard Mechanic**: Press X to discard selected card and draw a new one (free action).

**Reshuffle**: After using a card, draw one new card from the deck. Deck does not run out (Strike is weighted more heavily).

### 2.4 Element Reaction System

**Elements**: Physical / Fire / Ice / Thunder / Wind / Water

**Reaction Table**:

| Trigger (Enemy) | Response (Player) | Reaction | Bonus |
|-----------------|------------------|----------|-------|
| Fire | Thunder | VAPORIZE | +50% damage |
| Ice | Fire | MELT | +25% damage |
| Thunder | Water | CHAIN | +40% damage |
| Wind | Ice | FREEZE | +25% damage |
| Water | Thunder | SHOCK | +40% damage |

**Logic**: Track last element used by player this turn. If enemy uses triggering element next turn, reaction triggers. Reaction bonus is multiplicative.

**Visual**: Each reaction spawns a distinct particle burst at impact point.

### 2.5 Resources

| Resource | Max | Regen |
|----------|-----|-------|
| HP | 80 | None (item/heal only) |
| MP | 30 | +5 per full round |

### 2.6 Enemies

| Name | HP | Notes |
|------|----|-------|
| Goblin Grunt | 30 | Front line |
| Goblin Archer | 20 | Back line |
| Goblin Shaman | 38 | Back line, magic |

Enemy attack damage: 5-12 per hit.

---

## 3. Visual & Rendering Specs

> **For UE5 port**: These specs describe the aesthetic goal. Implementation differs by platform.

### 3.1 Art Style
- Pixel art sprites: 32x32 source, rendered at 2.5x scale.
- Character: Warm skin tone, blue tunic, visible from front.
- Enemy (Goblin): Green skin, red eyes, brown cloth.
- Color palette: Dark, moody backgrounds with high-saturation character sprites.

### 3.2 Battle Scene
- Background: Dark blue-black (#0a0a1a) with isometric floor tiles.
- Distant mountain silhouettes (dark blue-gray).
- Moonlight glow effect (warm white circle with soft radial gradient).
- Ground: Checkerboard dark brown tiles.
- Shadows: Semi-transparent ellipses beneath all characters.

### 3.3 UI Style
- Font: Courier New (retro terminal feel).
- HUD: Semi-transparent dark panels, rounded corners.
- HP bar: Green > Yellow > Red gradient based on percentage.
- MP bar: Blue gradient.
- Cards: Dark card background, colored top stripe per element, white border.
- Selected card: Bright border + brighter top stripe.
- Unaffordable card: Grayed out text.

### 3.4 Particle Effects

| Element | Effect |
|---------|--------|
| Fire | Orange-red circle burst, 12 particles expanding outward and fading |
| Thunder | Yellow lightning line segments, 8 radiating from center |
| Ice | Blue diamond shapes, 10 rotating and dispersing |
| Wind | Green arc lines, 8 spinning outward |
| Water | Blue circles, 10 splashing upward |
| Damage | Red "-X" text floating upward and fading |
| Heal | Green "+X HP" text floating upward |

---

## 4. Controls

| Key | Context | Action |
|-----|---------|--------|
| WASD / Arrows | Map | Move player |
| Enter | Map (near enemy) | Trigger battle |
| 1-5 | Battle | Select card in hand |
| Enter | Battle | Confirm selected card |
| A | Battle | Quick attack (Strike card) |
| S | Battle | Skip turn |
| D | Battle | Defend (reduce next incoming damage 50%) |
| X | Battle | Discard selected card, draw new one |

---

## 5. Game Flow

```
Title Screen
  → Select hero class → Map Scene
      → Explore (WASD)
      → Encounter enemy → Enter Battle Scene
          → Player Turn: select card → execute
          → Enemy Turn: enemies attack
          → Victory: return Map, enemy removed
          → Defeat: return Title Screen
      → Continue exploring
```

---

## 6. Current Feature Status

| System | Status |
|--------|--------|
| Map Scene (grass) | ✅ Done |
| Player movement (WASD) | ✅ Done |
| Enemy trigger (collision) | ✅ Done |
| Battle layout (left-right) | ✅ Done |
| Card hand (5 cards) | ✅ Done |
| Card selection (1-5) | ✅ Done |
| Card use (Enter) | ✅ Done |
| Strike / Fire / Ice / Thunder / Wind | ✅ Done |
| Heal card | ✅ Done |
| Defend card | ✅ Done |
| X discard + draw | ✅ Done |
| MP cost & affordability | ✅ Done |
| MP regen per round | ✅ Done |
| Element reactions (5 reactions) | ✅ Done |
| Reaction particles | ✅ Done |
| Damage/heal particles | ✅ Done |
| Enemy defeat (sprite destroy) | ✅ Done |
| Victory / Defeat flow | ✅ Done |
| **Multi-map data registry** | ✅ Done |
| **Cave map + transitions** | ✅ Done |
| **Treasure chest system** | ✅ Done |
| **Tavern scene (events overlay)** | ✅ Done |
| Enemy persistence on map | 🔲 TODO |
| Player leveling / soul upgrade | 🔲 TODO |
| Sound / BGM | 🔲 TODO |

## 6.1 Map System Architecture

### Map Registry
All maps defined in `src/game/map-registry.ts`:
```typescript
interface MapDefinition {
  id: 'grass' | 'cave' | 'dungeon';
  name: string;
  tiles: TileType[][];        // 2D grid
  enemies: EnemySpawn[];       // positions + enemy type
  portals: Portal[];           // tile → target map
  treasures: Treasure[];       // position → reward
  bgColor: number;            // background tint
}
```

### Tile Types
| ID | Walkable | Trigger |
|----|----------|---------|
| 0 GRASS | ✅ | — |
| 1 WALL | ❌ | — |
| 2 PATH | ✅ | — |
| 3 PORTAL | ✅ | → switch scene |
| 4 WATER | ❌ | — |
| 5 CHEST | ✅ | → open chest + give reward |
| 6 BUILDING | ✅ | → open tavern/event overlay |

### Scene Lifecycle
```
MapScene (grass)
  → Player walks onto PORTAL tile
  → scene.start('CaveScene')
  → Player walks onto PORTAL tile (exit)
  → scene.start('MapScene')
```

### Treasure Reward Pool
```typescript
type TreasureReward =
  | { type: 'hp_restore';    value: 20 }    // restore 20 HP
  | { type: 'mp_restore';    value: 15 }    // restore 15 MP
  | { type: 'buff';          id: 'atk_up'; duration: 3 }  // +10% atk, 3 battles
  | { type: 'card';          cardId: string }           // gain random card
```

---

## 7. UE5 Port Considerations

When migrating from web prototype to UE5:

1. **Gameplay layer**: Specs in this document are directly transferable.
2. **Rendering**: Replace Phaser 3 sprites with UE5 Paper2D or UMG widgets. Consider using 3D isometric camera with 2D sprites (Paper2D character sprites).
3. **Battle system**: Implement as Blueprint or C++ state machine. Card system maps directly to GameplayAbility or custom struct.
4. **Element reactions**: Data-driven via DataTable (reaction matrix).
5. **Particles**: Replace with Niagara systems per element type.
6. **Performance targets**: 60 FPS on mid-range hardware (UE5 LOD + instancing).
7. **Visual fidelity upgrade**: Keep pixel-art aesthetic but add lighting (directional + ambient), depth-of-field, post-processing bloom on particles.
