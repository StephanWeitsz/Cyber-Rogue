
import { ItemData } from '../types';

export const ALL_WEAPONS: ItemData[] = [
    // Tier 1
    { codexId: 'wpn_pipe', name: 'Pipe Wrench', type: 'weapon', value: 2, tier: 1, weaponType: 'melee', rarity: 'common' },
    { codexId: 'wpn_baton', name: 'Energy Baton', type: 'weapon', value: 3, tier: 1, weaponType: 'melee', rarity: 'common' },
    { codexId: 'wpn_smg', name: 'Submachine Gun', type: 'weapon', value: 2, tier: 1, weaponType: 'ranged', rarity: 'common' },
    { codexId: 'wpn_pistol1', name: 'Laser Pistol', type: 'weapon', value: 3, tier: 1, weaponType: 'ranged', rarity: 'common' },
    
    // Tier 2
    { codexId: 'wpn_knife', name: 'Combat Knife', type: 'weapon', value: 4, tier: 1, weaponType: 'melee', rarity: 'uncommon' },
    { codexId: 'wpn_shotgun', name: 'Scattergun', type: 'weapon', value: 6, tier: 2, weaponType: 'ranged', rarity: 'uncommon' },
    { codexId: 'wpn_sword', name: 'Vibro-Blade', type: 'weapon', value: 7, tier: 2, weaponType: 'melee', rarity: 'uncommon' },
    { codexId: 'wpn_chainsword', name: 'Chainsword', type: 'weapon', value: 8, tier: 2, weaponType: 'melee', rarity: 'rare' },
    
    // Tier 3
    { codexId: 'wpn_rifle1', name: 'Pulse Rifle', type: 'weapon', value: 8, tier: 2, weaponType: 'ranged', rarity: 'rare' },
    { codexId: 'wpn_hammer', name: 'Power Sledge', type: 'weapon', value: 10, tier: 3, weaponType: 'melee', rarity: 'rare' },
    { codexId: 'wpn_plasma', name: 'Plasma Rifle', type: 'weapon', value: 12, tier: 3, weaponType: 'ranged', rarity: 'epic' },
    { codexId: 'wpn_railgun', name: 'Railgun', type: 'weapon', value: 15, tier: 3, weaponType: 'ranged', rarity: 'epic' },
    { codexId: 'wpn_sniper', name: 'Sniper Rifle', type: 'weapon', value: 18, tier: 3, weaponType: 'ranged', rarity: 'legendary' },
];

export const ALL_ARMOR: ItemData[] = [
    // Tier 1
    { codexId: 'arm_jacket', name: 'Flak Jacket', type: 'armor', value: 1, tier: 1, rarity: 'common' },
    { codexId: 'arm_vest1', name: 'Ballistic Vest', type: 'armor', value: 2, tier: 1, rarity: 'common' },

    // Tier 2
    { codexId: 'arm_vest2', name: 'Combat Armor', type: 'armor', value: 3, tier: 2, rarity: 'uncommon' },
    { codexId: 'arm_plating1', name: 'Ceramic Plating', type: 'armor', value: 4, tier: 2, rarity: 'rare' },

    // Tier 3
    { codexId: 'arm_plating2', name: 'Titanium Plating', type: 'armor', value: 5, tier: 3, rarity: 'rare' },
    { codexId: 'arm_exosuit', name: 'Exo-Frame', type: 'armor', value: 7, tier: 3, rarity: 'epic' },
];