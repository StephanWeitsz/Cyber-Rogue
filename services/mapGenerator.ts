import { Position, Room, Difficulty, GameItem, Enemy, Trap } from '../types';
import { ALL_ENEMIES } from '../data/enemies';
import { ALL_WEAPONS, ALL_ARMOR } from '../data/items';

class Rect {
  x: number;
  y: number;
  w: number;
  h: number;

  constructor(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  public get center(): Position {
    const centerX = Math.floor(this.x + this.w / 2);
    const centerY = Math.floor(this.y + this.h / 2);
    return { x: centerX, y: centerY };
  }

  public intersects(other: Rect): boolean {
    return (
      this.x <= other.x + other.w &&
      this.x + this.w >= other.x &&
      this.y <= other.y + other.h &&
      this.h + this.y >= other.y
    );
  }
}

const uuid = () => crypto.randomUUID();

export const generateMap = (
  width: number,
  height: number,
  maxRooms = 12,
  roomMinSize = 4,
  roomMaxSize = 8,
  level: number,
  difficulty: Difficulty
) => {
  const grid: number[][] = Array.from({ length: height }, () => Array(width).fill(1)); // 1 is wall
  const rooms: Rect[] = [];

  const carveRoom = (room: Rect) => {
    for (let y = room.y + 1; y < room.y + room.h; y++) {
      for (let x = room.x + 1; x < room.x + room.w; x++) {
        if (y > 0 && y < height - 1 && x > 0 && x < width - 1) {
            grid[y][x] = 0; // 0 is floor
        }
      }
    }
  };

  const createHTunnel = (x1: number, x2: number, y: number) => {
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
        if (y > 0 && y < height - 1 && x > 0 && x < width - 1) {
            grid[y][x] = 0;
        }
    }
  };

  const createVTunnel = (y1: number, y2: number, x: number) => {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
        if (y > 0 && y < height - 1 && x > 0 && x < width - 1) {
            grid[y][x] = 0;
        }
    }
  };

  for (let i = 0; i < maxRooms * 2 && rooms.length < maxRooms; i++) {
    const w = Math.floor(Math.random() * (roomMaxSize - roomMinSize + 1)) + roomMinSize;
    const h = Math.floor(Math.random() * (roomMaxSize - roomMinSize + 1)) + roomMinSize;
    const x = Math.floor(Math.random() * (width - w - 2)) + 1;
    const y = Math.floor(Math.random() * (height - h - 2)) + 1;

    const newRoom = new Rect(x, y, w, h);

    let failed = false;
    for (const otherRoom of rooms) {
      if (newRoom.intersects(otherRoom)) {
        failed = true;
        break;
      }
    }

    if (!failed) {
      carveRoom(newRoom);
      
      if (rooms.length !== 0) {
        const prevRoom = rooms[rooms.length - 1];
        const newCenter = newRoom.center;
        const prevCenter = prevRoom.center;

        if (Math.random() > 0.5) {
          createHTunnel(prevCenter.x, newCenter.x, prevCenter.y);
          createVTunnel(prevCenter.y, newCenter.y, newCenter.x);
        } else {
          createVTunnel(prevCenter.y, newCenter.y, prevCenter.x);
          createHTunnel(prevCenter.x, newCenter.x, newCenter.y);
        }
      }
      rooms.push(newRoom);
    }
  }

  const secretDoors: { position: Position; revealed: boolean }[] = [];
  const secretRooms: Rect[] = [];
  const attempts = 100;
  const maxSecretRooms = 3;
  const bossRoom = rooms.length > 0 ? rooms[rooms.length - 1] : null;

  for (let i = 0; i < attempts && secretDoors.length < maxSecretRooms; i++) {
    const x = Math.floor(Math.random() * (width - 6)) + 3;
    const y = Math.floor(Math.random() * (height - 6)) + 3;

    if (grid[y][x] !== 1) continue;
    
    if (bossRoom) {
        const isAdjacentToBossRoom = 
            (x >= bossRoom.x - 1 && x <= bossRoom.x + bossRoom.w + 1) &&
            (y >= bossRoom.y - 1 && y <= bossRoom.y + bossRoom.h + 1);
        if (isAdjacentToBossRoom) continue;
    }


    const adjacentFloors = [
      grid[y - 1]?.[x], grid[y + 1]?.[x], grid[y]?.[x - 1], grid[y]?.[x + 1]
    ].filter(tile => tile === 0).length;

    if (adjacentFloors !== 1) continue;

    let roomX = 0, roomY = 0;
    if (grid[y - 1]?.[x] === 0) { roomX = x - 1; roomY = y + 1; } // Room below corridor
    else if (grid[y + 1]?.[x] === 0) { roomX = x - 1; roomY = y - 3; } // Room above
    else if (grid[y]?.[x - 1] === 0) { roomX = x + 1; roomY = y - 1; } // Room to the right
    else if (grid[y]?.[x + 1] === 0) { roomX = x - 3; roomY = y - 1; } // Room to the left
    else continue;

    const roomW = 3; const roomH = 3;
    let spaceIsClear = true;
    for (let sy = roomY - 1; sy < roomY + roomH + 1; sy++) {
      for (let sx = roomX - 1; sx < roomX + roomW + 1; sx++) {
        if (grid[sy]?.[sx] !== 1) {
          spaceIsClear = false;
          break;
        }
      }
      if (!spaceIsClear) break;
    }

    if (spaceIsClear) {
      for (let sy = roomY; sy < roomY + roomH; sy++) {
        for (let sx = roomX; sx < roomX + roomW; sx++) {
          grid[sy][sx] = 0;
        }
      }
      secretDoors.push({ position: { x, y }, revealed: false });
      secretRooms.push(new Rect(roomX, roomY, roomW, roomH));
    }
  }

  const playerStart = rooms.length > 0 ? rooms[0].center : { x: 2, y: 2 };
  let stairsPosition = (level % 5 !== 0 && bossRoom) ? bossRoom.center : null;
  const items: GameItem[] = [];
  const enemies: Enemy[] = [];
  const traps: Trap[] = [];

  const getEmptyTileInRoom = (room: Room) => {
    let x, y;
    let attempts = 0;
    const occupied = new Set([
      ...items.map(i => `${i.position.x},${i.position.y}`),
      ...enemies.map(e => `${e.position.x},${e.position.y}`),
      ...traps.map(t => `${t.position.x},${t.position.y}`),
    ]);
    if (playerStart) occupied.add(`${playerStart.x},${playerStart.y}`);
    if (stairsPosition) occupied.add(`${stairsPosition.x},${stairsPosition.y}`);

    do {
      x = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
      y = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
      attempts++;
    } while (occupied.has(`${x},${y}`) && attempts < 20);
    return attempts < 20 ? { x, y } : null;
  };

  const validRoomsForSpawning = rooms.slice(1, rooms.length > 1 ? -1 : undefined);

  if (rooms.length > 2) {
    const difficultyMultiplier = difficulty === 'easy' ? 0.8 : difficulty === 'difficult' ? 1.5 : 1;
    const numEnemies = Math.floor((2 + level) * difficultyMultiplier);
    const numItems = 2 + Math.floor(level / 2);
    const numTraps = 1 + Math.floor(level / 3);

    for (let i = 0; i < numEnemies && validRoomsForSpawning.length > 0; i++) {
        const room = validRoomsForSpawning[Math.floor(Math.random() * validRoomsForSpawning.length)];
        const position = getEmptyTileInRoom(room);
        if (!position) continue;
        
        let possibleEnemies = ALL_ENEMIES.filter(e => e.rank !== 'boss' && e.rank !== 'training');
        if (level < 5) {
            possibleEnemies = possibleEnemies.filter(e => e.rank !== 'mini-boss');
        }
        
        if (possibleEnemies.length === 0) continue;

        const enemyData = possibleEnemies[Math.floor(Math.random() * possibleEnemies.length)];
        
        const health = Math.floor(enemyData.baseHealth * (1 + level * 0.1));
        const attack = Math.floor(enemyData.baseAttack * (1 + level * 0.1));

        enemies.push({
          id: uuid(), codexId: enemyData.codexId, position, health, maxHealth: health, attack, name: enemyData.name, rank: enemyData.rank, char: enemyData.char,
        });
    }

    const maxTier = Math.min(3, Math.ceil(level / 4) + 1);
    const possibleItems = [...ALL_WEAPONS, ...ALL_ARMOR].filter(item => item.tier <= maxTier);
    for (let i = 0; i < numItems && validRoomsForSpawning.length > 0; i++) {
        const room = validRoomsForSpawning[Math.floor(Math.random() * validRoomsForSpawning.length)];
        const position = getEmptyTileInRoom(room);
        if (!position) continue;
        
        if (Math.random() < 0.2) {
            items.push({ id: uuid(), codexId: 'gold', position, type: 'gold', name: 'Credits', value: 10 + Math.floor(Math.random() * level * 5), tier: 1, rarity: 'common' });
        } else if (possibleItems.length > 0) {
            const itemData = possibleItems[Math.floor(Math.random() * possibleItems.length)];
            items.push({ ...itemData, id: uuid(), position });
        }
    }

    for (let i = 0; i < numTraps && validRoomsForSpawning.length > 0; i++) {
        const room = validRoomsForSpawning[Math.floor(Math.random() * validRoomsForSpawning.length)];
        const position = getEmptyTileInRoom(room);
        if (!position) continue;
        traps.push({ position, type: 'spike', damage: 5 + level, revealed: false, triggered: false });
    }
  }

  // Place loot in secret rooms
  const allSpecialItems: GameItem[] = [
      { id: uuid(), codexId: 'scroll_teleport', position: {x:-1, y:-1}, type: 'scroll', name: 'Scroll of Teleport', value: 0, tier: 1, scrollType: 'teleport', rarity: 'uncommon' },
      { id: uuid(), codexId: 'scroll_invisibility', position: {x:-1, y:-1}, type: 'scroll', name: 'Scroll of Invisibility', value: 0, tier: 1, scrollType: 'invisibility', rarity: 'uncommon' },
      { id: uuid(), codexId: 'buff_attack', position: {x:-1, y:-1}, type: 'buff', name: 'Attack Boost', value: 2, tier: 1, buffType: 'attack_boost', rarity: 'uncommon' },
      { id: uuid(), codexId: 'buff_defense', position: {x:-1, y:-1}, type: 'buff', name: 'Defense Boost', value: 2, tier: 1, buffType: 'defense_boost', rarity: 'uncommon' },
  ];

  const maxItemTierForLevel = Math.min(3, Math.ceil(level / 4) + 1);
  const goodEquipment = [...ALL_WEAPONS, ...ALL_ARMOR].filter(item => item.tier >= maxItemTierForLevel - 1 && item.tier <= maxItemTierForLevel);

  for (const room of secretRooms) {
      const position = getEmptyTileInRoom(room);
      if (!position) continue;

      const rand = Math.random();
      let item: GameItem | null = null;

      if (rand < 0.4 && goodEquipment.length > 0) { // 40% chance for good equipment
          const itemData = goodEquipment[Math.floor(Math.random() * goodEquipment.length)];
          item = { ...itemData, id: uuid(), position };
      } else if (rand < 0.7) { // 30% chance for a special item
          const itemData = allSpecialItems[Math.floor(Math.random() * allSpecialItems.length)];
          item = { ...itemData, id: uuid(), position };
      } else { // 30% chance for gold
          const goldValue = 50 + Math.floor(Math.random() * level * 10);
          item = { id: uuid(), codexId: 'gold', position, type: 'gold', name: 'Credits Cache', value: goldValue, tier: 1, rarity: 'common' };
      }
      
      if(item) {
        items.push(item);
      }
  }
  
  const bossSpawnPosition = bossRoom ? bossRoom.center : null;

  if (level > 0 && level % 10 === 0 && bossRoom && bossSpawnPosition) {
      const bossData = ALL_ENEMIES.find(e => e.rank === 'boss');
      if (bossData) {
          const health = Math.floor(bossData.baseHealth * (1 + level * 0.15));
          const attack = Math.floor(bossData.baseAttack * (1 + level * 0.15));
          enemies.push({
              id: uuid(), codexId: bossData.codexId, position: bossSpawnPosition, health, maxHealth: health, attack,
              name: bossData.name, rank: 'boss', isLevelBoss: true, char: bossData.char,
          });
      }
      stairsPosition = null; // No stairs until boss is defeated
  } else if (level > 0 && level % 5 === 0 && bossRoom && bossSpawnPosition) {
      const miniBossData = ALL_ENEMIES.filter(e => e.rank === 'mini-boss');
      if (miniBossData.length > 0) {
          const bossData = miniBossData[Math.floor(Math.random() * miniBossData.length)];
          const health = Math.floor(bossData.baseHealth * (1 + level * 0.1));
          const attack = Math.floor(bossData.baseAttack * (1 + level * 0.1));
           enemies.push({
              id: uuid(), codexId: bossData.codexId, position: bossSpawnPosition, health, maxHealth: health, attack,
              name: bossData.name, rank: 'mini-boss', isLevelBoss: true, char: bossData.char,
          });
      }
      stairsPosition = null;
  }
  
  const toPlainRoom = (rect: Rect): Room => ({ x: rect.x, y: rect.y, w: rect.w, h: rect.h, center: rect.center });
  const plainRooms = rooms.map(toPlainRoom);
  const plainSecretRooms = secretRooms.map(toPlainRoom);
  const plainBossRoom = bossRoom ? toPlainRoom(bossRoom) : null;

  return { grid, rooms: plainRooms, secretDoors, secretRooms: plainSecretRooms, playerStart, items, enemies, traps, stairsPosition, bossRoom: plainBossRoom };
};