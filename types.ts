export interface Position {
  x: number;
  y: number;
}

export interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
  center: Position;
}

export type ItemType = 'weapon' | 'armor' | 'potion' | 'gold' | 'scroll' | 'buff';
export type WeaponType = 'melee' | 'ranged';
export type ScrollType = 'teleport' | 'invisibility';
export type BuffType = 'attack_boost' | 'defense_boost' | 'invisibility';
export type TrapType = 'spike' | 'poison';
export type Difficulty = 'easy' | 'difficult' | 'hard' | 'test';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface ItemData {
  codexId: string;
  name: string;
  type: 'weapon' | 'armor';
  value: number;
  tier: number;
  weaponType?: WeaponType;
  rarity?: Rarity;
}

export interface GameItem {
  id: string;
  codexId: string;
  position: Position;
  type: ItemType;
  name: string;
  value: number;
  tier: number;
  equipped?: boolean;
  weaponType?: WeaponType;
  scrollType?: ScrollType;
  buffType?: BuffType;
  duration?: number;
  rarity?: Rarity;
}

export interface Buff {
  type: BuffType;
  value: number;
  turnsRemaining: number;
}

export interface Player {
  position: Position;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  baseAttack: number;
  baseDefense: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  gold: number;
  meleeWeapon: GameItem | null;
  rangedWeapon: GameItem | null;
  activeWeaponSlot: 'melee' | 'ranged';
  armor: GameItem | null;
  inventory: GameItem[];
  buffs: Buff[];
  healthUpgrades: number;
  attackUpgrades: number;
}

export interface Enemy {
  id: string;
  codexId: string;
  position: Position;
  health: number;
  maxHealth: number;
  attack: number;
  name: string;
  char: string;
  rank: 'normal' | 'mini-boss' | 'boss' | 'training';
  isLevelBoss?: boolean;
}

export interface EnemyData {
  codexId: string;
  name: string;
  char: string;
  rank: 'normal' | 'mini-boss' | 'boss' | 'training';
  baseHealth: number;
  baseAttack: number;
}

export interface Trap {
  position: Position;
  type: TrapType;
  damage: number;
  revealed: boolean;
  triggered: boolean;
}

export interface AudioSettings {
  musicOn: boolean;
  sfxOn: boolean;
}

export interface GameState {
  grid: number[][];
  rooms: Room[];
  secretRooms: Room[];
  player: Player;
  enemies: Enemy[];
  items: GameItem[];
  traps: Trap[];
  stairsPosition: Position | null;
  stairsDiscovered: boolean;
  secretDoors: { position: Position; revealed: boolean }[];
  dungeonLevel: number;
  gameStatus: 'playing' | 'gameOver' | 'victory' | 'startScreen';
  difficulty?: Difficulty;
  messages: string[];
  visibleTiles: Set<string>;
  visitedTiles: Record<string, boolean>;
  isTargeting: boolean;
  targetCoordinates: Position | null;
  projectilePath: Position[] | null;
  threatLevel: number;
  discoveredItems: Set<string>;
  discoveredEnemies: Set<string>;
  tutorialStep?: number;
  tutorialMessage?: string;
  tutorialObjectiveIds: {
    meleeDummyId?: string;
    rangedDummyId?: string;
    securityBotId?: string;
    wrenchId?: string;
    pistolId?: string;
    armorId?: string;
  };
  // FIX: Added optional bossRoom property to store the boss room data for the level.
  bossRoom?: Room | null;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  level: number;
  date: string;
  difficulty: Difficulty;
}