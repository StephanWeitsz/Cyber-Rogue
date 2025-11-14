import React, { useState, useMemo } from 'react';
// FIX: import Rarity to explicitly type shop consumables
import { Player, GameItem, ItemData, GameState, Rarity } from '../types';
import { ALL_WEAPONS, ALL_ARMOR } from '../data/items';
import { ItemIcon } from './Icons';
import { getRarityColor } from '../utils/rarity';

interface StoreProps {
  player: Player;
  onBuyItem: (item: ItemData | { type: 'potion' | 'buff'; name: string; value: number, tier: number, codexId: string, cost: number, rarity: Rarity }) => void;
  onSellItem: (itemId: string) => void;
  dungeonLevel: number;
  gameStatus: GameState['gameStatus'];
}

// FIX: Define a type for shop consumables to fix type inference issue.
type ShopConsumable = {
    type: 'potion' | 'buff';
    name: string;
    value: number;
    tier: number;
    codexId: string;
    cost: number;
    rarity: Rarity;
};

const getShopItems = (level: number) => {
    const itemPool: (ItemData)[] = [];
    const maxTier = Math.min(3, Math.ceil(level / 4));

    itemPool.push(...ALL_WEAPONS.filter(i => i.tier <= maxTier));
    itemPool.push(...ALL_ARMOR.filter(i => i.tier <= maxTier));
    
    // FIX: Explicitly type the consumables array to allow for multiple rarities on the same item type.
    const consumables: ShopConsumable[] = [
        { type: 'potion', name: 'Health Pack', value: 25, tier: 1, codexId: 'potion_health', cost: 25, rarity: 'common' },
        { type: 'buff', name: 'Attack Boost', value: 2, tier: 1, codexId: 'buff_attack', cost: 50, rarity: 'uncommon' },
        { type: 'buff', name: 'Defense Boost', value: 2, tier: 1, codexId: 'buff_defense', cost: 50, rarity: 'uncommon' },
    ];
    if (level > 3) {
        consumables.push({ type: 'potion', name: 'Large Health Pack', value: 75, tier: 2, codexId: 'potion_health_large', cost: 75, rarity: 'uncommon' });
    }

    const shopInventory: (ItemData | ShopConsumable)[] = [];
    
    const tempPool = [...itemPool];
    for(let i=0; i < 3 && tempPool.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * tempPool.length);
        shopInventory.push(tempPool[randomIndex]);
        tempPool.splice(randomIndex, 1);
    }
    
    return [...shopInventory, ...consumables];
};

const getItemCost = (item: ItemData | {cost?: number, tier: number, value?: number}) => {
    if ('cost' in item && item.cost) return item.cost;
    if ('value' in item && item.value) return item.value * 10 * item.tier;
    return 10;
}

const getSellPrice = (item: GameItem) => {
    return Math.floor(item.value * item.tier * 2.5);
}

export const Store: React.FC<StoreProps> = ({ player, onBuyItem, onSellItem, dungeonLevel, gameStatus }) => {
    const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
    const shopItems = useMemo(() => getShopItems(dungeonLevel), [dungeonLevel]);
    const isActionable = gameStatus === 'playing';

    return (
        <div className="flex flex-col text-white">
            <div className="flex-shrink-0 flex mb-2 rounded-md overflow-hidden">
                <button onClick={() => setActiveTab('buy')} className={`flex-1 p-2 font-bold uppercase text-sm ${activeTab === 'buy' ? 'bg-cyan-700' : 'bg-gray-700 hover:bg-gray-600'}`}>Buy</button>
                <button onClick={() => setActiveTab('sell')} className={`flex-1 p-2 font-bold uppercase text-sm ${activeTab === 'sell' ? 'bg-cyan-700' : 'bg-gray-700 hover:bg-gray-600'}`}>Sell</button>
            </div>
            <div className="bg-black bg-opacity-30 rounded p-2">
                {activeTab === 'buy' && (
                    <ul className="space-y-2">
                        {shopItems.map((item, i) => {
                            const cost = getItemCost(item);
                            const canAfford = player.gold >= cost;
                            return (
                                <li key={i} className="flex items-center p-2 bg-gray-700 rounded">
                                    <ItemIcon item={item as GameItem} />
                                    <div className="ml-2 text-xs">
                                        <p className={`font-bold ${getRarityColor(item.rarity)}`}>{item.name}</p>
                                        <p>Tier {item.tier}</p>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <p className="font-bold text-yellow-400">{cost} CR</p>
                                        <button disabled={!canAfford || !isActionable} onClick={() => onBuyItem(item)} className="text-xs bg-green-600 hover:bg-green-500 disabled:bg-gray-500 text-white font-bold py-1 px-2 rounded mt-1">
                                            Buy
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
                {activeTab === 'sell' && (
                    <ul className="space-y-2">
                        {player.inventory.filter(i => i.type !== 'gold').map(item => (
                            <li key={item.id} className="flex items-center p-2 bg-gray-700 rounded">
                                <ItemIcon item={item} />
                                <div className="ml-2 text-xs">
                                    <p className={`font-bold ${getRarityColor(item.rarity)}`}>{item.name}</p>
                                    <p>Tier {item.tier}</p>
                                </div>
                                <div className="ml-auto text-right">
                                    <p className="font-bold text-yellow-400">{getSellPrice(item)} CR</p>
                                    <button disabled={!isActionable} onClick={() => onSellItem(item.id)} className="text-xs bg-red-600 hover:bg-red-500 disabled:bg-gray-500 text-white font-bold py-1 px-2 rounded mt-1">
                                        Sell
                                    </button>
                                </div>
                            </li>
                        ))}
                         {player.inventory.length === 0 && <p className="text-gray-500 text-center mt-4">Nothing to sell.</p>}
                    </ul>
                )}
            </div>
        </div>
    );
};
