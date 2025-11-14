import React from 'react';
import { Player, GameItem, GameState } from '../types';
import { ItemIcon } from './Icons';
import { getRarityColor } from '../utils/rarity';

interface InventoryProps {
  player: Player;
  onEquipItem: (itemId: string) => void;
  onUseItem: (itemId: string) => void;
  gameStatus: GameState['gameStatus'];
}

const ItemDetails: React.FC<{ item: GameItem }> = ({ item }) => (
    <div className="text-xs text-gray-400 ml-2">
        <p className={`font-bold ${getRarityColor(item.rarity)}`}>{item.name}</p>
        <p>Tier {item.tier}</p>
        {item.type === 'weapon' && <p>ATK: {item.value} ({item.weaponType})</p>}
        {item.type === 'armor' && <p>DEF: {item.value}</p>}
        {item.type === 'potion' && <p>Heals {item.value} HP</p>}
        {item.type === 'scroll' && <p>Type: {item.scrollType}</p>}
    </div>
);

const InventorySlot: React.FC<{ item: GameItem | null, label: string }> = ({ item, label }) => (
    <div>
        <p className="text-sm font-bold text-gray-400 mb-1">{label}</p>
        <div className="flex items-center p-2 bg-gray-900 rounded h-16">
            {item ? (
                <>
                    <div className="flex-shrink-0"><ItemIcon item={item} /></div>
                    <ItemDetails item={item} />
                </>
            ) : (
                <p className="text-gray-500 text-sm">Empty</p>
            )}
        </div>
    </div>
);

export const Inventory: React.FC<InventoryProps> = ({ player, onEquipItem, onUseItem, gameStatus }) => {
    const isActionable = gameStatus === 'playing';

    const handleAction = (item: GameItem) => {
        if (!isActionable) return;
        if (item.type === 'weapon' || item.type === 'armor') {
            onEquipItem(item.id);
        } else if (item.type === 'potion' || item.type === 'scroll' || item.type === 'buff') {
            onUseItem(item.id);
        }
    };
    
    return (
        <div className="flex flex-col text-white">
            <h3 className="text-lg font-bold text-cyan-400 mb-2">Equipment</h3>
            <div className="space-y-2 mb-4">
                <InventorySlot item={player.meleeWeapon} label="Melee Weapon" />
                <InventorySlot item={player.rangedWeapon} label="Ranged Weapon" />
                <InventorySlot item={player.armor} label="Armor" />
            </div>
            <h3 className="text-lg font-bold text-cyan-400 mb-2">Backpack ({player.inventory.length})</h3>
            <div className="bg-black bg-opacity-30 rounded p-2">
                {player.inventory.length === 0 ? (
                    <p className="text-gray-500 text-center mt-4">Inventory is empty.</p>
                ) : (
                    <ul className="space-y-2">
                        {player.inventory.map(item => (
                            <li key={item.id} className="flex items-center p-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors">
                                <div className="flex-shrink-0"><ItemIcon item={item} /></div>
                                <ItemDetails item={item} />
                                <div className="ml-auto">
                                    <button
                                        onClick={() => handleAction(item)}
                                        disabled={!isActionable}
                                        className="text-xs bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-500 text-white font-bold py-1 px-2 rounded"
                                    >
                                        {item.type === 'weapon' || item.type === 'armor' ? 'Equip' : 'Use'}
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};
