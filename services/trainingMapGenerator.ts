import { MAP_WIDTH, MAP_HEIGHT } from '../constants';
import { ALL_WEAPONS, ALL_ARMOR } from '../data/items';
import { ALL_ENEMIES } from '../data/enemies';
import { Room, GameItem, Enemy, Trap, GameState } from '../types';

class Rect implements Room {
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

  public get center() {
    const centerX = Math.floor(this.x + this.w / 2);
    const centerY = Math.floor(this.y + this.h / 2);
    return { x: centerX, y: centerY };
  }
}

export const createTrainingMap = (uuid: () => string) => {
    const grid = Array.from({ length: MAP_HEIGHT }, () => Array(MAP_WIDTH).fill(1));
    const rooms: Rect[] = [];
    const items: GameItem[] = [];
    const enemies: Enemy[] = [];
    const traps: Trap[] = [];
    const secretDoors: { position: { x: number; y: number; }; revealed: boolean; }[] = [];
    const secretRooms: Rect[] = [];
    const tutorialObjectiveIds: GameState['tutorialObjectiveIds'] = {};

    const carveRoom = (room: Rect) => {
        rooms.push(room);
        for (let y = room.y + 1; y < room.y + room.h; y++) {
            for (let x = room.x + 1; x < room.x + room.w; x++) {
                if (x > 0 && x < MAP_WIDTH -1 && y > 0 && y < MAP_HEIGHT-1) {
                     grid[y][x] = 0; // 0 is floor
                }
            }
        }
    };

    const carveHTunnel = (x1: number, x2: number, y: number) => {
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
            if (grid[y] && grid[y][x] !== undefined) grid[y][x] = 0;
        }
    };

    const carveVTunnel = (y1: number, y2: number, x: number) => {
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
           if (grid[y] && grid[y][x] !== undefined) grid[y][x] = 0;
        }
    };
    
    // --- Room 1: Melee ---
    const room1 = new Rect(2, 8, 8, 8);
    carveRoom(room1);
    const playerStart = {x: room1.center.x - 2, y: room1.center.y};
    const tutorialWrench = { ...ALL_WEAPONS.find(w => w.codexId === 'wpn_pipe')!, id: uuid(), position: room1.center };
    tutorialObjectiveIds.wrenchId = tutorialWrench.id;
    items.push(tutorialWrench);
    const meleeDummyData = ALL_ENEMIES.find(e => e.codexId === 'dummy_melee')!;
    const meleeDummyId = uuid();
    tutorialObjectiveIds.meleeDummyId = meleeDummyId;
    enemies.push({
        id: meleeDummyId, codexId: meleeDummyData.codexId, position: { x: 14, y: 12 },
        health: meleeDummyData.baseHealth, maxHealth: meleeDummyData.baseHealth, attack: meleeDummyData.baseAttack,
        name: meleeDummyData.name, rank: meleeDummyData.rank, char: meleeDummyData.char,
    });
    carveHTunnel(room1.center.x, 14, 12);

    // --- Room 2: Ranged ---
    const room2 = new Rect(19, 8, 8, 8);
    carveRoom(room2);
    const tutorialPistol = { ...ALL_WEAPONS.find(w => w.codexId === 'wpn_pistol1')!, id: uuid(), position: room2.center };
    tutorialObjectiveIds.pistolId = tutorialPistol.id;
    items.push(tutorialPistol);
    const rangedDummyData = ALL_ENEMIES.find(e => e.codexId === 'dummy_ranged')!;
    const rangedDummyId = uuid();
    tutorialObjectiveIds.rangedDummyId = rangedDummyId;
    enemies.push({
        id: rangedDummyId, codexId: rangedDummyData.codexId, position: { x: 23, y: 14 },
        health: rangedDummyData.baseHealth, maxHealth: rangedDummyData.baseHealth, attack: rangedDummyData.baseAttack,
        name: rangedDummyData.name, rank: rangedDummyData.rank, char: rangedDummyData.char,
    });
    
    // --- Room 3: Armor & Wait ---
    const room3 = new Rect(19, 18, 8, 8);
    carveRoom(room3);
    const tutorialArmor = { ...ALL_ARMOR.find(a => a.codexId === 'arm_jacket')!, id: uuid(), position: room3.center };
    tutorialObjectiveIds.armorId = tutorialArmor.id;
    items.push(tutorialArmor);

    // --- Room 4: Traps ---
    const room4 = new Rect(28, 8, 8, 8);
    carveRoom(room4);
    traps.push({ position: { x: 32, y: 12 }, type: 'spike', damage: 10, revealed: false, triggered: false });

    // --- Room 5 & Secret Room: Search for Secrets ---
    const room5 = new Rect(28, 18, 8, 8);
    carveRoom(room5);

    // Add Security Bot and Health Pack for healing tutorial
    const secBotData = ALL_ENEMIES.find(e => e.codexId === 'sec_bot')!;
    const secBotId = uuid();
    tutorialObjectiveIds.securityBotId = secBotId;
    enemies.push({
        id: secBotId, codexId: secBotData.codexId, position: room5.center,
        health: secBotData.baseHealth, maxHealth: secBotData.baseHealth, attack: secBotData.baseAttack,
        name: secBotData.name, rank: secBotData.rank, char: secBotData.char,
    });
    items.push({ id: uuid(), codexId: 'potion_health', position: { x: room5.center.x + 2, y: room5.center.y }, type: 'potion', name: 'Health Pack', value: 25, tier: 1 });
    
    const deadEndCorridorX = 38;
    carveHTunnel(room5.center.x, deadEndCorridorX, 22); // Horizontal corridor leading to the dead end.
    
    const secretDoorPos = { x: deadEndCorridorX, y: 21 };
    const secretRoom = new Rect(secretDoorPos.x - 2, 17, 5, 4);
    
    secretRooms.push(secretRoom);
    for (let y = secretRoom.y + 1; y < secretRoom.y + secretRoom.h; y++) {
        for (let x = secretRoom.x + 1; x < secretRoom.x + secretRoom.w; x++) {
            if (x > 0 && x < MAP_WIDTH -1 && y > 0 && y < MAP_HEIGHT-1) {
                 grid[y][x] = 0; // 0 is floor
            }
        }
    }
    
    // After carving, ensure the door position is a wall, creating the secret entrance.
    grid[secretDoorPos.y][secretDoorPos.x] = 1;
    secretDoors.push({ position: secretDoorPos, revealed: false });

    // Place scrolls in the newly carved secret room
    items.push({ id: uuid(), codexId: 'scroll_teleport', position: { x: secretRoom.center.x - 1, y: secretRoom.center.y }, type: 'scroll', name: 'Scroll of Teleport', value: 0, tier: 1, scrollType: 'teleport' });
    items.push({ id: uuid(), codexId: 'scroll_invisibility', position: { x: secretRoom.center.x + 1, y: secretRoom.center.y }, type: 'scroll', name: 'Scroll of Invisibility', value: 0, tier: 1, scrollType: 'invisibility' });

    // --- Room 6: Arsenal ---
    const arsenal = new Rect(41, 2, 8, 26);
    carveRoom(arsenal);

    // --- Corridors ---
    carveHTunnel(14, room2.center.x, 12);
    carveVTunnel(room2.center.y, 12, room2.center.x);
    carveVTunnel(room2.center.y, room3.center.y, 23);
    carveHTunnel(room2.center.x, 23, room2.center.y);
    carveHTunnel(room3.center.x, 23, room3.center.y);
    carveVTunnel(room2.center.y, room4.center.y, 23);
    carveHTunnel(23, room4.center.x, room4.center.y);
    carveVTunnel(room4.center.y, room5.center.y, 32);
    carveHTunnel(room5.center.x, 32, room5.center.y);
    carveHTunnel(32, arsenal.x, 22);


    // Populate Arsenal
    let itemY = 3;
    ALL_WEAPONS.forEach(w => {
        items.push({ ...w, id: uuid(), position: {x: 43, y: itemY} });
        itemY++;
    });
    itemY = 3;
    ALL_ARMOR.forEach(a => {
        items.push({ ...a, id: uuid(), position: {x: 46, y: itemY} });
        itemY += 2;
    });

    // Add high-health dummies to arsenal for testing
    const meleeArsenalDummyData = ALL_ENEMIES.find(e => e.codexId === 'dummy_melee')!;
    enemies.push({
        id: uuid(), codexId: meleeArsenalDummyData.codexId, position: { x: 45, y: 10 },
        health: 500, maxHealth: 500, attack: 0,
        name: 'Arsenal Dummy', rank: 'training', char: meleeArsenalDummyData.char,
    });
    
    const rangedArsenalDummyData = ALL_ENEMIES.find(e => e.codexId === 'dummy_ranged')!;
    enemies.push({
        id: uuid(), codexId: rangedArsenalDummyData.codexId, position: { x: 45, y: 20 },
        health: 500, maxHealth: 500, attack: 0,
        name: 'Arsenal Dummy', rank: 'training', char: rangedArsenalDummyData.char,
    });


    const stairsPosition = { x: 48, y: 27 };
    
    const toPlainRoom = (rect: Rect): Room => ({ x: rect.x, y: rect.y, w: rect.w, h: rect.h, center: rect.center });
    const plainRooms = rooms.map(toPlainRoom);
    const plainSecretRooms = secretRooms.map(toPlainRoom);

    return { grid, rooms: plainRooms, secretRooms: plainSecretRooms, playerStart, items, enemies, stairsPosition, traps, secretDoors, tutorialObjectiveIds, bossRoom: null };
};