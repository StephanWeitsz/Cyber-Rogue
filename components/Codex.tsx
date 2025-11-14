import React, { useState } from 'react';
import { ALL_WEAPONS, ALL_ARMOR } from '../data/items';
import { ALL_ENEMIES } from '../data/enemies';
import { ItemData, EnemyData } from '../types';
import { getRarityColor } from '../utils/rarity';

interface CodexProps {
    discoveredItems: Set<string>;
    discoveredEnemies: Set<string>;
}

const allItems: ItemData[] = [...ALL_WEAPONS, ...ALL_ARMOR];
const codexEnemies: EnemyData[] = ALL_ENEMIES.filter(e => e.rank !== 'training');

export const Codex: React.FC<CodexProps> = ({ discoveredItems, discoveredEnemies }) => {
    const [activeTab, setActiveTab] = useState<'items' | 'enemies'>('items');

    return (
        <div className="flex flex-col text-white">
            <div className="flex-shrink-0 flex mb-2 rounded-md overflow-hidden">
                <button onClick={() => setActiveTab('items')} className={`flex-1 p-2 font-bold uppercase text-sm ${activeTab === 'items' ? 'bg-cyan-700' : 'bg-gray-700 hover:bg-gray-600'}`}>Items ({discoveredItems.size})</button>
                <button onClick={() => setActiveTab('enemies')} className={`flex-1 p-2 font-bold uppercase text-sm ${activeTab === 'enemies' ? 'bg-cyan-700' : 'bg-gray-700 hover:bg-gray-600'}`}>Enemies ({discoveredEnemies.size})</button>
            </div>
            <div className="bg-black bg-opacity-30 rounded p-2">
                {activeTab === 'items' && (
                     <ul className="space-y-2">
                        {allItems.map(item => (
                            <li key={item.codexId} className={`p-2 bg-gray-700 rounded transition-opacity ${discoveredItems.has(item.codexId) ? 'opacity-100' : 'opacity-30'}`}>
                                <p className={`font-bold ${discoveredItems.has(item.codexId) ? getRarityColor(item.rarity) : 'text-white'}`}>{discoveredItems.has(item.codexId) ? item.name : '?????'}</p>
                                {discoveredItems.has(item.codexId) && (
                                    <div className="text-xs text-gray-400">
                                        <p>Type: {item.type}, Tier: {item.tier}</p>
                                        {item.rarity && <p>Rarity: <span className={`capitalize ${getRarityColor(item.rarity)}`}>{item.rarity}</span></p>}
                                        {item.type === 'weapon' && <p>Base ATK: {item.value}, Class: {item.weaponType}</p>}
                                        {item.type === 'armor' && <p>Base DEF: {item.value}</p>}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
                {activeTab === 'enemies' && (
                    <ul className="space-y-2">
                        {codexEnemies.map(enemy => (
                            <li key={enemy.codexId} className={`p-2 bg-gray-700 rounded transition-opacity ${discoveredEnemies.has(enemy.codexId) ? 'opacity-100' : 'opacity-30'}`}>
                                <p className="font-bold text-white">{discoveredEnemies.has(enemy.codexId) ? enemy.name : '?????'}</p>
                                 {discoveredEnemies.has(enemy.codexId) && (
                                    <div className="text-xs text-gray-400">
                                        <p>Rank: {enemy.rank}</p>
                                        <p>Base Health: {enemy.baseHealth}, Base Attack: {enemy.baseAttack}</p>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};
