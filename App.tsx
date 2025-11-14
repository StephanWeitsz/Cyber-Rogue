import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { GameState, Player, Enemy, GameItem, Position, Difficulty, AudioSettings, Buff, BuffType, Room, ItemData, Trap } from './types';
import { MAP_WIDTH, MAP_HEIGHT, FOV_RADIUS, PLAYER_BASE_ATTACK, PLAYER_BASE_DEFENSE, SECRET_DOOR_SEARCH_CHANCE, TRAP_SEARCH_CHANCE, INVISIBILITY_TURNS, BUFF_TURNS, PLAYER_MISS_CHANCE, ENEMY_MISS_CHANCE, PLAYER_CRITICAL_HIT_CHANCE, PLAYER_CRITICAL_HIT_MULTIPLIER } from './constants';
import { generateMap } from './services/mapGenerator';
import { createTrainingMap } from './services/trainingMapGenerator';
import { GameBoard } from './components/GameBoard';
import { SidePanel } from './components/SidePanel';
import { GameOverScreen } from './components/GameOverScreen';
import { StartScreen } from './components/StartScreen';
import { MobileControls } from './components/MobileControls';
import { LogPanel } from './components/LogPanel';
import { OrientationLock } from './components/OrientationLock';
import { ALL_WEAPONS, ALL_ARMOR } from './data/items';
import { ALL_ENEMIES } from './data/enemies';
import { playSound } from './services/audio';
import { TILE_SIZE } from './constants';
import { PlayerIcon } from './components/Icons';
import { EnemyList } from './components/EnemyList';

const uuid = () => crypto.randomUUID();

// --- Utility: Line of Sight ---
const getLine = (from: Position, to: Position): Position[] => {
    const points: Position[] = [];
    let x0 = from.x, y0 = from.y;
    const x1 = to.x, y1 = to.y;

    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;

    while (true) {
        points.push({ x: x0, y: y0 });
        if (x0 === x1 && y0 === y1) break;
        let e2 = 2 * err;
        if (e2 >= dy) {
            err += dy;
            x0 += sx;
        }
        if (e2 <= dx) {
            err += dx;
            y0 += sy;
        }
    }
    return points;
};

// --- Main App Component ---
const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [showLogPanel, setShowLogPanel] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [activeSidePanelTab, setActiveSidePanelTab] = useState<'inventory' | 'store' | 'codex'>('inventory');
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({ musicOn: false, sfxOn: true });
  const [layoutReady, setLayoutReady] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playerActionTaken = useRef(false);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  // --- Utility Functions ---
  const addMessage = useCallback((message: string, gs: GameState): GameState => {
    const newMessages = [message, ...gs.messages.slice(0, 99)];
    return { ...gs, messages: newMessages };
  }, []);

  const playSfx = useCallback((type: 'hit' | 'miss' | 'pickup' | 'level' | 'death' | 'equip' | 'door' | 'trap') => {
    if (!audioSettings.sfxOn) return;
    try {
      switch(type) {
        case 'hit': playSound(100, 0.1, 'square', 0.2); break;
        case 'miss': playSound(300, 0.1, 'sawtooth', 0.1); break;
        case 'pickup': playSound(600, 0.05, 'sine', 0.3); break;
        case 'level': playSound(800, 0.2, 'triangle', 0.4); break;
        case 'death': playSound(50, 0.5, 'sawtooth', 0.5); break;
        case 'equip': playSound(440, 0.1, 'sine', 0.3); break;
        case 'door': playSound(350, 0.1, 'sawtooth', 0.2); break;
        case 'trap': playSound(200, 0.3, 'sawtooth', 0.3); break;
      }
    } catch (e) { console.error(e) }
  }, [audioSettings.sfxOn]);

  const calculateFov = useCallback((grid: number[][], playerPos: Position, radius: number): Set<string> => {
    const visible = new Set<string>([`${playerPos.x},${playerPos.y}`]);
    for (let i = 0; i < 360; i += 1) {
      let ox = playerPos.x + 0.5;
      let oy = playerPos.y + 0.5;
      const x = Math.cos(i * 0.01745);
      const y = Math.sin(i * 0.01745);
      for (let j = 0; j < radius; j++) {
        const tileX = Math.floor(ox);
        const tileY = Math.floor(oy);
        if (tileX >= 0 && tileX < grid[0].length && tileY >= 0 && tileY < grid.length) {
          visible.add(`${tileX},${tileY}`);
          if (grid[tileY][tileX] === 1) break;
        }
        ox += x;
        oy += y;
      }
    }
    return visible;
  }, []);
  
  const recalculatePlayerStats = (gs: GameState): GameState => {
    const player = { ...gs.player };
    let attack = player.baseAttack + player.attackUpgrades;
    let defense = player.baseDefense + player.healthUpgrades;

    if (player.activeWeaponSlot === 'melee' && player.meleeWeapon) {
        attack += player.meleeWeapon.value;
    } else if (player.activeWeaponSlot === 'ranged' && player.rangedWeapon) {
        attack += player.rangedWeapon.value;
    }

    if (player.armor) defense += player.armor.value;

    player.buffs.forEach(buff => {
        if (buff.type === 'attack_boost') attack += buff.value;
        if (buff.type === 'defense_boost') defense += buff.value;
    });

    player.attack = attack;
    player.defense = defense;

    return { ...gs, player };
  };

    const checkForLevelUp = useCallback((gs: GameState): GameState => {
    let newGs = gs;
    let player = { ...newGs.player };
    let leveledUp = false;

    while (player.xp >= player.xpToNextLevel) {
        leveledUp = true;
        player.level++;

        newGs = addMessage(`You have reached level ${player.level}!`, newGs);
        playSfx('level');
        
        player.maxHealth += 10;
        player.health = player.maxHealth; // Full heal
        newGs = addMessage(`Max health increased. You are fully healed.`, newGs);

        player.baseAttack++;
        newGs = addMessage(`Base attack increased.`, newGs);

        if (player.level % 2 === 0) {
            player.baseDefense++;
            newGs = addMessage(`Base defense increased.`, newGs);
        }

        player.xpToNextLevel = Math.floor(100 * Math.pow(player.level, 1.5));
    }

    if (leveledUp) {
        newGs.player = player;
        return recalculatePlayerStats(newGs);
    }

    return newGs;
  }, [addMessage, playSfx]);

  const updateVisibility = useCallback((gs: GameState): GameState => {
    let playerPos = gs.player.position;
    const invisibilityBuff = gs.player.buffs.find(b => b.type === 'invisibility');
    if (invisibilityBuff) {
        // If invisible, FOV is limited to 1 tile to still see player's location
        const visibleTiles = new Set<string>([`${playerPos.x},${playerPos.y}`]);
         return { ...gs, visibleTiles };
    }

    const visibleTiles = calculateFov(gs.grid, playerPos, FOV_RADIUS);
    const visitedTiles = { ...gs.visitedTiles };
    visibleTiles.forEach(key => visitedTiles[key] = true);
    
    const discoveredItems = new Set(gs.discoveredItems);
    gs.items.forEach(i => { if (visibleTiles.has(`${i.position.x},${i.position.y}`)) discoveredItems.add(i.codexId) });

    const discoveredEnemies = new Set(gs.discoveredEnemies);
    gs.enemies.forEach(e => { if (visibleTiles.has(`${e.position.x},${e.position.y}`)) discoveredEnemies.add(e.codexId) });

    const stairsKey = gs.stairsPosition ? `${gs.stairsPosition.x},${gs.stairsPosition.y}` : '';
    const stairsDiscovered = gs.stairsDiscovered || (stairsKey && visibleTiles.has(stairsKey));

    return { ...gs, visibleTiles, visitedTiles, discoveredItems, discoveredEnemies, stairsDiscovered };
  }, [calculateFov]);
  
  // --- Game State Initialization ---
  const createInitialState = useCallback((difficulty: Difficulty, level = 1, existingPlayer?: Player, existingDiscoveredItems?: Set<string>, existingDiscoveredEnemies?: Set<string>): GameState => {
     const isTraining = difficulty === 'test' && level === 0;
     const mapData = isTraining
      ? createTrainingMap(uuid)
      : generateMap(MAP_WIDTH, MAP_HEIGHT, 12, 4, 8, level, difficulty);
    
    const { grid, rooms, secretRooms, secretDoors, playerStart, items, enemies, traps, stairsPosition, bossRoom } = mapData;

    let player: Player;
    const isNewGame = !existingPlayer;
    let messages = [isTraining ? 'Welcome to the Training Sector.' : `Entering Sector ${level}`];

    if (isNewGame) {
        player = {
          position: playerStart, health: 100, maxHealth: 100, attack: PLAYER_BASE_ATTACK, defense: PLAYER_BASE_DEFENSE,
          baseAttack: PLAYER_BASE_ATTACK, baseDefense: PLAYER_BASE_DEFENSE, level: 1, xp: 0, xpToNextLevel: 100, gold: difficulty === 'easy' ? 50 : 0,
          meleeWeapon: null, rangedWeapon: null, activeWeaponSlot: 'melee', armor: null,
          inventory: [], buffs: [], healthUpgrades: 0, attackUpgrades: 0,
        };
    } else {
        player = { ...existingPlayer, position: playerStart };
        const regenAmount = Math.floor(player.maxHealth * 0.25);
        if (regenAmount > 0) {
            const newHealth = Math.min(player.maxHealth, player.health + regenAmount);
            const recovered = newHealth - player.health;
            if (recovered > 0) {
                 messages.unshift(`You descend and recover ${recovered} health.`);
            }
            player.health = newHealth;
        }
    }

     if (difficulty === 'test' && !isTraining && isNewGame) {
      const bestMelee = { ...ALL_WEAPONS.find(w => w.codexId === 'wpn_hammer')!, id: uuid(), position: {x: -1, y: -1} };
      const bestRanged = { ...ALL_WEAPONS.find(w => w.codexId === 'wpn_railgun')!, id: uuid(), position: {x: -1, y: -1} };
      const bestArmor = { ...ALL_ARMOR.find(a => a.codexId === 'arm_exosuit')!, id: uuid(), position: {x: -1, y: -1} };
      player.meleeWeapon = bestMelee;
      player.rangedWeapon = bestRanged;
      player.armor = bestArmor;
      player.gold = 5000;
      player.health = 500;
      player.maxHealth = 500;
      player.level = 10;
    }
    
    let tutorialStep = isTraining ? 0 : undefined;
    let tutorialMessage = isTraining ? "Walk over the Pipe Wrench to pick it up." : undefined;
    
    const newGameState: GameState = {
      grid, rooms, secretRooms, player, enemies, items, traps,
      stairsPosition, stairsDiscovered: false, secretDoors, dungeonLevel: level, gameStatus: 'playing', difficulty, 
      messages: messages,
      visibleTiles: new Set(), visitedTiles: {}, isTargeting: false, projectilePath: null, targetCoordinates: null, threatLevel: 0,
      discoveredItems: existingDiscoveredItems || new Set(),
      discoveredEnemies: existingDiscoveredEnemies || new Set(),
      tutorialStep, tutorialMessage,
      tutorialObjectiveIds: (mapData as any).tutorialObjectiveIds || {},
      bossRoom,
    };
    
    return updateVisibility(recalculatePlayerStats(newGameState));
  }, [updateVisibility]);

  const handleStartGame = (difficulty: Difficulty, level = 1) => {
    setGameState(createInitialState(difficulty, level));
    playerActionTaken.current = false; // Reset on new game
  };
  
  // --- Save / Load ---
  const handleSaveGame = useCallback(() => {
    if (!gameState || gameState.gameStatus !== 'playing') return;

    const stateToSave = {
        gameState: {
            ...gameState,
            visibleTiles: Array.from(gameState.visibleTiles),
            discoveredItems: Array.from(gameState.discoveredItems),
            discoveredEnemies: Array.from(gameState.discoveredEnemies),
        },
        audioSettings: audioSettings,
    };

    try {
        localStorage.setItem('cyber_rogue_savegame', JSON.stringify(stateToSave));
        setGameState(gs => gs ? addMessage("Game progress saved.", gs) : null);
    } catch (error) {
        console.error("Failed to save game:", error);
        setGameState(gs => gs ? addMessage("Error: Could not save game.", gs) : null);
    }
  }, [gameState, audioSettings, addMessage]);

  const handleLoadGame = useCallback(() => {
    try {
        const savedDataJSON = localStorage.getItem('cyber_rogue_savegame');
        if (savedDataJSON) {
            const savedData = JSON.parse(savedDataJSON);
            const loadedGameState = {
                ...savedData.gameState,
                visibleTiles: new Set(savedData.gameState.visibleTiles),
                discoveredItems: new Set(savedData.gameState.discoveredItems),
                discoveredEnemies: new Set(savedData.gameState.discoveredEnemies),
            };
            setGameState(loadedGameState);
            setAudioSettings(savedData.audioSettings);
        }
    } catch (error) {
        console.error("Failed to load game:", error);
        localStorage.removeItem('cyber_rogue_savegame');
        alert("Failed to load saved game. The save file might be corrupted and has been deleted.");
    }
  }, []);

  const checkTutorialProgress = (gs: GameState): GameState => {
    if (gs.dungeonLevel !== 0 || gs.tutorialStep === undefined) return gs;
    
    let newStep = gs.tutorialStep;
    let newMessage = gs.tutorialMessage;
    let needsUpdate = false;

    const objectiveCompleted = (currentStep: number) => {
        if (newStep === currentStep) {
            newStep++;
            needsUpdate = true;
        }
    };
    
    // Step 0: Pick up & auto-equip melee weapon
    if (newStep === 0 && gs.player.meleeWeapon?.id === gs.tutorialObjectiveIds.wrenchId) {
        objectiveCompleted(0);
        newMessage = "Destroy the melee Training Dummy.";
    }
    // Step 1: Destroy melee dummy
    if (newStep === 1 && !gs.enemies.some(e => e.id === gs.tutorialObjectiveIds.meleeDummyId)) {
        objectiveCompleted(1);
        newMessage = "Proceed to the next area for ranged combat training.";
    }
    // Step 2: Pick up ranged weapon
    if (newStep === 2 && gs.player.rangedWeapon?.id === gs.tutorialObjectiveIds.pistolId) {
        objectiveCompleted(2);
        newMessage = "Destroy the ranged Training Dummy. Press [Q] to swop to ranged attack. Now press [T] to Target.";
    }
    // Step 3: Destroy ranged dummy
    if (newStep === 3 && !gs.enemies.some(e => e.id === gs.tutorialObjectiveIds.rangedDummyId)) {
        objectiveCompleted(3);
        newMessage = "Proceed to the next area for armor training.";
    }
    // Step 4: Pick up armor
    if (newStep === 4 && gs.player.armor?.id === gs.tutorialObjectiveIds.armorId) {
        objectiveCompleted(4);
        newMessage = "Armor reduces damage. Press [Space] to wait a turn and regenerate health. Go to next room.";
    }
    // Step 5: Enter trap room
    if (newStep === 5 && gs.player.position.x > 27 && gs.player.position.x < 37 && gs.player.position.y > 7 && gs.player.position.y < 17) {
        objectiveCompleted(5);
        newMessage = "This room may contain traps. Press [F] to search for them.";
    }
    // Step 6: Find trap
    if (newStep === 6 && gs.traps.some(t => t.revealed)) {
        objectiveCompleted(6);
        newMessage = "A hostile bot is in the next room. Prepare for combat.";
    }
    // Step 7: Destroy security bot
    if (newStep === 7 && !gs.enemies.some(e => e.id === gs.tutorialObjectiveIds.securityBotId)) {
        objectiveCompleted(7);
        newMessage = "Heal up! Use the Health Pack or press [Space] to wait.";
    }
    // Step 8: Heal up
    if (newStep === 8 && gs.player.health === gs.player.maxHealth) {
        objectiveCompleted(8);
        newMessage = "Some walls hide secret passages. Find the dead-end corridor and search it.";
    }
    // Step 9: Find secret door
    if (newStep === 9 && gs.secretDoors.some(d => d.revealed)) {
        objectiveCompleted(9);
        newMessage = "Scrolls are powerful one-time use items. Proceed to the arsenal.";
    }
    // Step 10: Enter arsenal
    if (newStep === 10 && gs.player.position.x > 40) {
        objectiveCompleted(10);
        newMessage = "Training complete. Experiment with the gear, then find the exit '>' to start your run.";
    }
    
    if (needsUpdate) {
        let finalState: GameState = { ...gs, tutorialStep: newStep, tutorialMessage: newMessage };
        if (newStep > 0 && newStep < 11) {
            finalState = addMessage(`Objective Complete.`, finalState);
        }
        return finalState;
    }
    return gs;
  };
  
  // --- Game Loop / Turn Management ---
  const endPlayerTurn = (gs: GameState) => {
    let newState = { ...gs };

    // Update buffs immutably
    const updatedBuffs = newState.player.buffs.map(buff => ({
        ...buff,
        turnsRemaining: buff.turnsRemaining - 1
    }));
    const activeBuffs = updatedBuffs.filter(buff => buff.turnsRemaining > 0);
    const expiredBuffs = updatedBuffs.filter(buff => buff.turnsRemaining <= 0);

    if (expiredBuffs.length > 0) {
        const newPlayer = { ...newState.player, buffs: activeBuffs };
        let tempState = { ...newState, player: newPlayer };
        expiredBuffs.forEach(buff => {
            tempState = addMessage(`Your ${buff.type.replace('_', ' ')} has worn off.`, tempState);
        });
        newState = recalculatePlayerStats(tempState);
    } else {
        const newPlayer = { ...newState.player, buffs: activeBuffs };
        newState = { ...newState, player: newPlayer };
    }
    
    // Enemy turns
    const enemies = [...newState.enemies];
    for (let i = 0; i < enemies.length; i++) {
        let enemy = { ...enemies[i] };
        const playerPos = newState.player.position;

        if (enemy.rank === 'training') continue;
        
        const dist = Math.sqrt(Math.pow(playerPos.x - enemy.position.x, 2) + Math.pow(playerPos.y - enemy.position.y, 2));
        const isVisible = newState.visibleTiles.has(`${enemy.position.x},${enemy.position.y}`);
        
        if (isVisible && dist < FOV_RADIUS) {
            let dx = playerPos.x - enemy.position.x;
            let dy = playerPos.y - enemy.position.y;
            
            if (dist <= 1.5) {
                if (Math.random() < ENEMY_MISS_CHANCE) {
                    newState = addMessage(`The ${enemy.name} attacks but you dodge out of the way.`, newState);
                    playSfx('miss');
                } else {
                    let damage = Math.max(0, enemy.attack - newState.player.defense);
                    if (damage > 0) {
                        newState.player.health = Math.max(0, newState.player.health - damage);
                        newState = addMessage(`The ${enemy.name} hits you for ${damage} damage!`, newState);
                        playSfx('hit');
                    } else {
                        newState = addMessage(`The ${enemy.name} attacks but you block it.`, newState);
                        playSfx('miss');
                    }
                    if (newState.player.health <= 0) {
                        newState.gameStatus = 'gameOver';
                        newState = addMessage('You have died.', newState);
                        playSfx('death');
                        break;
                    }
                }
            } else { 
                if (enemy.codexId === 'warden' && Math.random() < 0.5) {
                    // Warden is slow
                } else {
                    let moveX = Math.sign(dx);
                    let moveY = Math.sign(dy);

                    if (Math.abs(dx) > Math.abs(dy)) {
                        if (newState.grid[enemy.position.y][enemy.position.x + moveX] === 0) enemy.position.x += moveX;
                        else if (newState.grid[enemy.position.y + moveY][enemy.position.x] === 0) enemy.position.y += moveY;
                    } else {
                        if (newState.grid[enemy.position.y + moveY][enemy.position.x] === 0) enemy.position.y += moveY;
                        else if (newState.grid[enemy.position.y][enemy.position.x + moveX] === 0) enemy.position.x += moveX;
                    }
                }
            }
        }
        enemies[i] = enemy;
    }
    
    let finalState = { ...newState, enemies };
    finalState = checkTutorialProgress(finalState);
    finalState = updateVisibility(finalState);
    
    setGameState(finalState);
    playerActionTaken.current = false;
  };

  const handlePlayerAction = (action: (gs: GameState) => GameState) => {
    if (!gameState || gameState.gameStatus !== 'playing' || playerActionTaken.current) return;
    playerActionTaken.current = true;
    
    const bossBeforeAction = gameState.enemies.find(e => e.isLevelBoss);

    const { visibleTiles, discoveredItems, discoveredEnemies, ...serializableState } = gameState;
    const clonedSerializableState = JSON.parse(JSON.stringify(serializableState));
    const stateForAction: GameState = {
        ...(clonedSerializableState as Omit<GameState, 'visibleTiles' | 'discoveredItems' | 'discoveredEnemies'>),
        visibleTiles: new Set(visibleTiles),
        discoveredItems: new Set(discoveredItems),
        discoveredEnemies: new Set(discoveredEnemies),
    };

    let nextState = action(stateForAction);

    if (nextState.gameStatus === 'playing') {
        if (bossBeforeAction && !nextState.enemies.some(e => e.id === bossBeforeAction.id)) {
            let stairsPos: Position | null = null;
            if (nextState.bossRoom) {
                stairsPos = nextState.bossRoom.center;
            } else {
                stairsPos = bossBeforeAction.position;
            }
            
            if(stairsPos){
                nextState = { ...nextState, stairsPosition: stairsPos };
                nextState = addMessage("The way down is now open.", nextState);
                playSfx('level');
            }
        }
    }

    setTimeout(() => endPlayerTurn(nextState), 50);
  };
  
  // --- Player Actions ---
  const movePlayer = (dx: number, dy: number) => {
    handlePlayerAction((gs) => {
      let { x, y } = gs.player.position;
      const newX = x + dx;
      const newY = y + dy;
      let newState = { ...gs };

      if (newX < 0 || newX >= MAP_WIDTH || newY < 0 || newY >= MAP_HEIGHT) return gs;
      
      const enemyAtTarget = newState.enemies.find(e => e.position.x === newX && e.position.y === newY);
      if (enemyAtTarget) {
        return playerAttack(enemyAtTarget.id, gs);
      }
      
      if (newState.grid[newY][newX] === 0) { // Floor
        let newPlayer = { ...newState.player, position: { x: newX, y: newY } };
        newState = { ...newState, player: newPlayer };

        if (newState.stairsPosition && newX === newState.stairsPosition.x && newY === newState.stairsPosition.y) {
            playSfx('level');
            if (newState.dungeonLevel === 0) {
              let newGs = addMessage("Training complete. Returning to main menu.", newState);
              newGs.gameStatus = 'startScreen';
              return newGs;
            }
            return createInitialState(newState.difficulty!, newState.dungeonLevel + 1, newState.player, newState.discoveredItems, newState.discoveredEnemies);
        }
        
        const trap = newState.traps.find(t => !t.triggered && t.position.x === newX && t.position.y === newY);
        if(trap) {
            trap.triggered = true;
            trap.revealed = true;
            newPlayer.health = Math.max(0, newPlayer.health - trap.damage);
            newState = addMessage(`You triggered a spike trap for ${trap.damage} damage!`, newState);
            playSfx('trap');

            const xpPenalty = 10 * newState.dungeonLevel;
            if (xpPenalty > 0) {
                newPlayer.xp = Math.max(0, newPlayer.xp - xpPenalty);
                newState = addMessage(`The shock of the trap makes you lose ${xpPenalty} XP.`, newState);
            }

            if (newPlayer.health <= 0) {
                 newState.gameStatus = 'gameOver';
                 newState = addMessage('You have died.', newState);
                 playSfx('death');
            }
        }
        
        const itemsAtLocation = newState.items.filter(i => i.position.x === newX && i.position.y === newY);
        if (itemsAtLocation.length > 0) {
            let remainingItems = [...newState.items];
            for (const item of itemsAtLocation) {
                playSfx('pickup');
                if (item.type === 'gold') {
                    newPlayer.gold += item.value;
                    newState = addMessage(`You found ${item.value} credits.`, newState);
                } else {
                    let equipped = false;
                    if (item.type === 'weapon' && item.weaponType === 'melee' && !newPlayer.meleeWeapon) {
                        newPlayer.meleeWeapon = { ...item, equipped: true };
                        equipped = true;
                    } else if (item.type === 'weapon' && item.weaponType === 'ranged' && !newPlayer.rangedWeapon) {
                        newPlayer.rangedWeapon = { ...item, equipped: true };
                        equipped = true;
                    } else if (item.type === 'armor' && !newPlayer.armor) {
                        newPlayer.armor = { ...item, equipped: true };
                        equipped = true;
                    }

                    if(equipped) {
                       newState = addMessage(`You picked up and equipped the ${item.name}.`, newState);
                       playSfx('equip');
                    } else {
                       newPlayer.inventory.push(item);
                       newState = addMessage(`You picked up the ${item.name}.`, newState);
                    }
                }
                remainingItems = remainingItems.filter(i => i.id !== item.id);
            }
            newState = { ...newState, player: newPlayer, items: remainingItems };
            newState = recalculatePlayerStats(newState);
        }
        
        return newState;

      } else if (newState.grid[newY][newX] === 1) { // Wall
        const secretDoor = newState.secretDoors.find(d => d.position.x === newX && d.position.y === newY);
        if(secretDoor && secretDoor.revealed) {
            newState.grid[newY][newX] = 0; // Open the door
            newState = addMessage("You open the secret door.", newState);
            playSfx('door');
            return { ...newState, player: { ...newState.player, position: { x: newX, y: newY } } };
        }
      }
      return newState;
    });
  };

  const playerAttack = (enemyId: string, gs: GameState): GameState => {
    let newState = { ...gs };
    const enemyIndex = newState.enemies.findIndex(e => e.id === enemyId);
    if (enemyIndex === -1) return gs;
    
    let newEnemies = [...newState.enemies];
    const enemy = { ...newEnemies[enemyIndex] };
    
    if (Math.random() < PLAYER_MISS_CHANCE) {
        newState = addMessage(`You swing wildly and miss the ${enemy.name}.`, newState);
        playSfx('miss');
        return { ...newState, enemies: newEnemies };
    }

    const isMelee = gs.player.activeWeaponSlot === 'melee';
    let damage = Math.max(1, newState.player.attack - (isMelee ? 0 : 1));
    
    const isCritical = Math.random() < PLAYER_CRITICAL_HIT_CHANCE;
    if (isCritical) {
        damage = Math.floor(damage * PLAYER_CRITICAL_HIT_MULTIPLIER);
        newState = addMessage(`CRITICAL HIT! You hit the ${enemy.name} for ${damage} damage.`, newState);
    } else {
        newState = addMessage(`You hit the ${enemy.name} for ${damage} damage.`, newState);
    }
    playSfx('hit');

    enemy.health -= damage;
    
    if (enemy.health <= 0) {
        newEnemies.splice(enemyIndex, 1);
        const xpGain = (enemy.rank === 'boss' ? 100 : enemy.rank === 'mini-boss' ? 25 : 5) * newState.dungeonLevel;
        newState.player.xp += xpGain;
        newState = addMessage(`You destroyed the ${enemy.name} and gained ${xpGain} XP.`, newState);
        playSfx('death');
        newState = checkForLevelUp(newState);
    } else {
        newEnemies[enemyIndex] = enemy;
    }
    
    return { ...newState, enemies: newEnemies };
  };
  
  const handleWait = () => {
      handlePlayerAction(gs => {
          let newGs = {...gs};
          const regenAmount = Math.max(1, Math.floor(newGs.player.maxHealth / 20));
          const newHealth = Math.min(newGs.player.maxHealth, newGs.player.health + regenAmount);
          if (newHealth > newGs.player.health) {
              newGs.player = {...newGs.player, health: newHealth};
          }
          newGs = addMessage("You wait a turn, regenerating health.", newGs);
          return newGs;
      });
  };

  const handleSearch = () => {
    handlePlayerAction(gs => {
        let newGs = addMessage("You search the area...", gs);
        let foundSomething = false;
        const pos = gs.player.position;
        const newGrid = newGs.grid.map(row => [...row]);

        const updatedTraps = gs.traps.map(trap => {
            if (!trap.revealed && Math.abs(trap.position.x - pos.x) <= 1 && Math.abs(trap.position.y - pos.y) <= 1) {
                if (Math.random() < TRAP_SEARCH_CHANCE) {
                    foundSomething = true;
                    newGs = addMessage("You found a trap!", newGs);
                    const xpGain = 10 * newGs.dungeonLevel;
                    if (xpGain > 0) {
                        newGs.player.xp += xpGain;
                        newGs = addMessage(`You gained ${xpGain} XP for disarming the trap.`, newGs);
                        newGs = checkForLevelUp(newGs);
                    }
                    return { ...trap, revealed: true };
                }
            }
            return trap;
        });

        const updatedSecretDoors = gs.secretDoors.map(door => {
            if (!door.revealed && Math.abs(door.position.x - pos.x) <= 1 && Math.abs(door.position.y - pos.y) <= 1) {
                if (Math.random() < SECRET_DOOR_SEARCH_CHANCE) {
                    foundSomething = true;
                    newGrid[door.position.y][door.position.x] = 0;
                    newGs = addMessage("You found and opened a secret door!", newGs);
                    playSfx('door');
                    const xpGain = 25 * newGs.dungeonLevel;
                    if (xpGain > 0) {
                        newGs.player.xp += xpGain;
                        newGs = addMessage(`You gained ${xpGain} XP for discovering a secret!`, newGs);
                        newGs = checkForLevelUp(newGs);
                    }
                    return { ...door, revealed: true };
                }
            }
            return door;
        });
        
        if (!foundSomething) {
            newGs = addMessage("You didn't find anything.", newGs);
        }

        return { ...newGs, grid: newGrid, traps: updatedTraps, secretDoors: updatedSecretDoors };
    });
  };

  const handleWeaponSwap = () => {
    if (!gameState || gameState.gameStatus !== 'playing') return;
    const newSlot: 'melee' | 'ranged' = gameState.player.activeWeaponSlot === 'melee' ? 'ranged' : 'melee';
    const newPlayer = { ...gameState.player, activeWeaponSlot: newSlot };
    let newGameState = { ...gameState, player: newPlayer };
    newGameState = addMessage(`Switched to ${newSlot} weapon.`, newGameState);
    newGameState = recalculatePlayerStats(newGameState);
    setGameState(newGameState);
  };

  const handleEquipItem = (itemId: string) => {
    handlePlayerAction(gs => {
      let newPlayer = { ...gs.player };
      const itemIndex = newPlayer.inventory.findIndex(i => i.id === itemId);
      if (itemIndex === -1) return gs;
      
      const newInventory = [...newPlayer.inventory];
      const itemToEquip = { ...newInventory[itemIndex], equipped: true };
      newInventory.splice(itemIndex, 1);
      newPlayer.inventory = newInventory;

      if (itemToEquip.type === 'weapon') {
          const slot = itemToEquip.weaponType as 'melee' | 'ranged';
          const oldItem = newPlayer[slot === 'melee' ? 'meleeWeapon' : 'rangedWeapon'];
          if (oldItem) {
              newPlayer.inventory.push({ ...oldItem, equipped: false });
          }
          if (slot === 'melee') newPlayer.meleeWeapon = itemToEquip;
          else newPlayer.rangedWeapon = itemToEquip;
          newPlayer.activeWeaponSlot = slot;
      } else if (itemToEquip.type === 'armor') {
          const oldArmor = newPlayer.armor;
          if (oldArmor) {
              newPlayer.inventory.push({ ...oldArmor, equipped: false });
          }
          newPlayer.armor = itemToEquip;
      }
      
      let newGs = { ...gs, player: newPlayer };
      newGs = addMessage(`Equipped ${itemToEquip.name}.`, newGs);
      playSfx('equip');
      return recalculatePlayerStats(newGs);
    });
  };

  const handleUseItem = (itemId: string) => {
    handlePlayerAction(gs => {
        let newPlayer = { ...gs.player };
        const itemIndex = newPlayer.inventory.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return gs;
        
        const item = newPlayer.inventory[itemIndex];
        let newGs = { ...gs };
        let consumed = true;

        switch (item.type) {
            case 'potion':
                const healed = Math.min(newPlayer.maxHealth - newPlayer.health, item.value);
                if(healed > 0) {
                    newPlayer.health += healed;
                    newGs = addMessage(`You use the ${item.name} and heal for ${healed} HP.`, newGs);
                } else {
                    newGs = addMessage(`You use the ${item.name} but you are already at full health.`, newGs);
                    consumed = false;
                }
                break;
            case 'scroll':
                newGs = addMessage(`You read the ${item.name}.`, newGs);
                if (item.scrollType === 'teleport') {
                    const randomRoom = newGs.rooms[Math.floor(Math.random() * newGs.rooms.length)];
                    newPlayer.position = randomRoom.center;
                } else if (item.scrollType === 'invisibility') {
                    newPlayer.buffs.push({ type: 'invisibility', value: 0, turnsRemaining: INVISIBILITY_TURNS });
                }
                break;
            case 'buff':
                 const buffType = item.codexId === 'buff_attack' ? 'attack_boost' : 'defense_boost';
                 newPlayer.buffs.push({ type: buffType, value: item.value, turnsRemaining: BUFF_TURNS });
                 newGs = addMessage(`You use the ${item.name}!`, newGs);
                 newGs = recalculatePlayerStats(newGs);
                break;
            default:
                consumed = false;
        }

        if(consumed) {
             const newInventory = [...newPlayer.inventory];
             newInventory.splice(itemIndex, 1);
             newPlayer.inventory = newInventory;
        }
        
        return { ...newGs, player: newPlayer };
    });
  };

  const handleBuyItem = (itemData: any) => {
    handlePlayerAction(gs => {
        const cost = itemData.cost || ((itemData.tier * itemData.value * 10) || 10);
        if (gs.player.gold >= cost) {
            const newPlayer = { ...gs.player, gold: gs.player.gold - cost };
            const newItem: GameItem = {
                id: uuid(),
                codexId: itemData.codexId,
                position: {x: -1, y: -1},
                type: itemData.type,
                name: itemData.name,
                value: itemData.value,
                tier: itemData.tier,
                weaponType: itemData.weaponType,
                scrollType: itemData.scrollType,
                buffType: itemData.buffType,
                rarity: itemData.rarity,
            };
            newPlayer.inventory = [...newPlayer.inventory, newItem];
            let newGs = { ...gs, player: newPlayer };
            newGs = addMessage(`You purchased the ${newItem.name}.`, newGs);
            playSfx('pickup');
            return newGs;
        } else {
            return addMessage("You can't afford that.", gs);
        }
    });
  };

  const handleSellItem = (itemId: string) => {
    handlePlayerAction(gs => {
        const itemIndex = gs.player.inventory.findIndex(i => i.id === itemId);
        if (itemIndex > -1) {
            const item = gs.player.inventory[itemIndex];
            const price = Math.floor(item.value * item.tier * 2.5);
            const newInventory = [...gs.player.inventory];
            newInventory.splice(itemIndex, 1);
            const newPlayer = { ...gs.player, gold: gs.player.gold + price, inventory: newInventory };
            let newGs = { ...gs, player: newPlayer };
            newGs = addMessage(`You sold the ${item.name} for ${price} credits.`, newGs);
            return newGs;
        }
        return gs;
    });
  };

  // --- Ranged Targeting ---
  const handleToggleTargeting = () => {
    if (!gameState) return;
    if (gameState.player.activeWeaponSlot !== 'ranged' || !gameState.player.rangedWeapon) {
        setGameState(addMessage("You must have a ranged weapon active.", gameState));
        return;
    }
    setGameState(p => {
        if (!p) return null;
        if (p.isTargeting) {
            return { ...p, isTargeting: false, projectilePath: null, targetCoordinates: null };
        } else {
            return { ...p, isTargeting: true, targetCoordinates: null };
        }
    });
  };
  
  const handleRangedAttack = (dx: number, dy: number) => {
    handlePlayerAction(gs => {
        if (!gs.isTargeting || !gs.player.rangedWeapon) {
             return addMessage("Invalid action.", {...gs, isTargeting: false, targetCoordinates: null});
        }
        
        const path: Position[] = [];
        let targetEnemy: Enemy | null = null;
        let obstruction = false;

        for (let i = 1; i <= FOV_RADIUS; i++) {
            const nextX = gs.player.position.x + i * dx;
            const nextY = gs.player.position.y + i * dy;
            
            if (nextX < 0 || nextX >= MAP_WIDTH || nextY < 0 || nextY >= MAP_HEIGHT) break;
            
            path.push({ x: nextX, y: nextY });
            
            if (gs.grid[nextY][nextX] === 1) { // Hit a wall
                obstruction = true;
                break;
            }
            
            const enemyAtPos = gs.enemies.find(e => e.position.x === nextX && e.position.y === nextY);
            if (enemyAtPos) {
                targetEnemy = enemyAtPos;
                break;
            }
        }

        let newGs = { ...gs, projectilePath: path };

        if(targetEnemy) {
            if (Math.random() < PLAYER_MISS_CHANCE) {
                newGs = addMessage(`Your shot whizzes past the ${targetEnemy.name}.`, newGs);
                playSfx('miss');
            } else {
                let damage = Math.max(1, newGs.player.attack);
                const isCritical = Math.random() < PLAYER_CRITICAL_HIT_CHANCE;
                if (isCritical) {
                    damage = Math.floor(damage * PLAYER_CRITICAL_HIT_MULTIPLIER);
                    newGs = addMessage(`CRITICAL SHOT! You hit the ${targetEnemy.name} for ${damage} damage.`, newGs);
                } else {
                    newGs = addMessage(`You shoot the ${targetEnemy.name} for ${damage} damage.`, newGs);
                }
                playSfx('hit');
    
                const newHealth = targetEnemy.health - damage;
                if (newHealth <= 0) {
                    newGs.enemies = newGs.enemies.filter(e => e.id !== targetEnemy!.id);
                    const xpGain = (targetEnemy.rank === 'boss' ? 100 : targetEnemy.rank === 'mini-boss' ? 25 : 5) * newGs.dungeonLevel;
                    newGs.player = {...newGs.player, xp: newGs.player.xp + xpGain};
                    newGs = addMessage(`You destroyed the ${targetEnemy.name} and gained ${xpGain} XP.`, newGs);
                    playSfx('death');
                    newGs = checkForLevelUp(newGs);
                } else {
                    newGs.enemies = newGs.enemies.map(e => e.id === targetEnemy!.id ? {...e, health: newHealth} : e);
                }
            }
        } else {
            const message = obstruction ? "Your shot hits a wall." : "You fire into the darkness.";
            newGs = addMessage(message, newGs);
            playSfx('miss');
        }
        
        setTimeout(() => setGameState(p => p ? {...p, projectilePath: null} : null), 200);
        return {...newGs, isTargeting: false, targetCoordinates: null};
    });
  };

  // --- Input Handling ---
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!gameState || gameState.gameStatus !== 'playing') return;
    
    if (gameState.isTargeting) {
        switch (event.key) {
          case 'ArrowUp': case 'w':
            handleRangedAttack(0, -1);
            break;
          case 'ArrowDown': case 's':
            handleRangedAttack(0, 1);
            break;
          case 'ArrowLeft': case 'a':
            handleRangedAttack(-1, 0);
            break;
          case 'ArrowRight': case 'd':
            handleRangedAttack(1, 0);
            break;
          case 'Escape': case 't': 
              handleToggleTargeting(); 
              break;
        }
    } else {
       switch (event.key) {
        case 'ArrowUp': case 'w': movePlayer(0, -1); break;
        case 'ArrowDown': case 's': movePlayer(0, 1); break;
        case 'ArrowLeft': case 'a': movePlayer(-1, 0); break;
        case 'ArrowRight': case 'd': movePlayer(1, 0); break;
        case ' ': handleWait(); break;
        case 'f': handleSearch(); break;
        case 'q': handleWeaponSwap(); break;
        case 't': handleToggleTargeting(); break;
      }
    }
  }, [gameState, movePlayer, checkForLevelUp]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // --- Audio ---
  const handleToggleAudio = (type: 'music' | 'sfx') => {
    setAudioSettings(prev => ({...prev, [type === 'music' ? 'musicOn' : 'sfxOn']: !prev[type === 'music' ? 'musicOn' : 'sfxOn']}));
  };

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.volume = 0.2;
    }

    const audio = audioRef.current;
    const shouldPlay = gameState?.gameStatus === 'playing' && audioSettings.musicOn;

    if (shouldPlay) {
        const isBossLevel = (gameState.dungeonLevel % 5 === 0 && gameState.dungeonLevel > 0) || gameState.enemies.some(e => e.rank === 'boss' || e.rank === 'mini-boss');
        const musicSrc = isBossLevel ? '/boss_music.mp3' : '/bg_music.mp3';
        const newSrc = window.location.origin + musicSrc;

        if (audio.src !== newSrc) {
            audio.src = newSrc;
        }

        if (audio.paused) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    if (error.name !== 'AbortError') {
                        console.error("Audio playback error:", error);
                    }
                });
            }
        }
    } else {
        audio.pause();
    }
}, [gameState?.gameStatus, gameState?.dungeonLevel, gameState?.enemies, audioSettings.musicOn]);

  useLayoutEffect(() => {
    const handleResize = () => {
      const mobileCheck = window.innerWidth < 1024;
      if (mobileCheck !== isMobile) {
          setIsMobile(mobileCheck);
      }
      if (gameContainerRef.current) {
        setViewport({
          width: gameContainerRef.current.clientWidth,
          height: gameContainerRef.current.clientHeight
        });
      }
    };
    handleResize();
    setLayoutReady(true);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  useLayoutEffect(() => {
    if (isMobile && gameContainerRef.current && gameState && layoutReady && gameState.gameStatus === 'playing') {
        const container = gameContainerRef.current;
        const targetScrollLeft = (gameState.player.position.x * TILE_SIZE) - (container.clientWidth / 2) + (TILE_SIZE / 2);
        const targetScrollTop = (gameState.player.position.y * TILE_SIZE) - (container.clientHeight / 2) + (TILE_SIZE / 2);
        
        container.scrollLeft = targetScrollLeft;
        container.scrollTop = targetScrollTop;
    }
  }, [gameState?.player.position, isMobile, layoutReady, viewport]);


  if (!gameState || gameState.gameStatus === 'startScreen') {
    return <StartScreen onStartGame={handleStartGame} onStartTraining={() => handleStartGame('test', 0)} onLoadGame={handleLoadGame} />;
  }

  const score = (gameState.player.gold ?? 0) + (gameState.player.xp ?? 0) + (gameState.dungeonLevel * 100);
  
  const targetPath = gameState.isTargeting && gameState.targetCoordinates ? getLine(gameState.player.position, gameState.targetCoordinates) : null;
  
  return (
    <div className="bg-black text-white w-screen h-screen flex flex-col lg:flex-row overflow-hidden font-mono">
      {isMobile && <OrientationLock />}
      
      {isMobile && showLogPanel && <LogPanel messages={gameState.messages} onClose={() => setShowLogPanel(false)} />}
      
      {isMobile && showSidePanel && (
         <div className="fixed inset-0 z-50">
          <SidePanel
            player={gameState.player} dungeonLevel={gameState.dungeonLevel} difficulty={gameState.difficulty}
            messages={gameState.messages} isTargeting={gameState.isTargeting} discoveredItems={gameState.discoveredItems}
            discoveredEnemies={gameState.discoveredEnemies} gameStatus={gameState.gameStatus} audioSettings={audioSettings}
            isMobile={true} initialTab={activeSidePanelTab} tutorialMessage={gameState.tutorialMessage}
            onEquipItem={handleEquipItem} onUseItem={handleUseItem} onBuyItem={handleBuyItem} onSellItem={handleSellItem}
            onToggleAudio={handleToggleAudio} onClose={() => setShowSidePanel(false)} onSaveGame={handleSaveGame}
          />
        </div>
      )}

      {gameState.gameStatus === 'gameOver' && <GameOverScreen score={score} level={gameState.dungeonLevel} difficulty={gameState.difficulty} onRestart={() => setGameState(p => p ? {...p, gameStatus: 'startScreen'}: null)} />}
      
      {!isMobile && (
        <SidePanel 
          player={gameState.player} dungeonLevel={gameState.dungeonLevel} difficulty={gameState.difficulty}
          messages={gameState.messages} isTargeting={gameState.isTargeting} discoveredItems={gameState.discoveredItems}
          discoveredEnemies={gameState.discoveredEnemies} gameStatus={gameState.gameStatus} audioSettings={audioSettings}
          isMobile={false} initialTab={activeSidePanelTab} tutorialMessage={gameState.tutorialMessage}
          onEquipItem={handleEquipItem} onUseItem={handleUseItem} onBuyItem={handleBuyItem} onSellItem={handleSellItem}
          onToggleAudio={handleToggleAudio} onClose={() => {}} onSaveGame={handleSaveGame}
        />
      )}
      
      <main 
        ref={gameContainerRef} 
        className={`flex-grow relative ${isMobile ? 'overflow-auto' : 'flex items-center justify-center overflow-auto'}`} 
        style={{ touchAction: 'none' }}
      >
        {layoutReady && gameState && (
            <div>
                {gameState.grid.length > 0 && <GameBoard gameState={gameState} visibleTiles={gameState.visibleTiles} renderPlayer={true} isMobile={isMobile} targetPath={targetPath} />}
            </div>
        )}
        {gameState && gameState.gameStatus === 'playing' && (
            <EnemyList enemies={gameState.enemies.filter(e => gameState.visibleTiles.has(`${e.position.x},${e.position.y}`))} />
        )}
      </main>

      {isMobile && gameState.gameStatus === 'playing' && (
        <MobileControls 
          isTargeting={gameState.isTargeting}
          onMove={movePlayer}
          onDirectionalAttack={handleRangedAttack}
          onSearch={handleSearch}
          onWait={handleWait}
          onSwap={handleWeaponSwap}
          onToggleTargeting={handleToggleTargeting}
          onOpenModal={(modal) => {
            if (modal === 'log') {
              setShowLogPanel(true);
            } else {
              setActiveSidePanelTab(modal);
              setShowSidePanel(true);
            }
          }}
          showSidePanel={showSidePanel}
          showLogPanel={showLogPanel}
        />
      )}
    </div>
  );
};

export default App;