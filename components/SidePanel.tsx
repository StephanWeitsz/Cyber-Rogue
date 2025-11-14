import React, { useState, useEffect } from 'react';
import { Player, Difficulty, AudioSettings } from '../types';
import { HealthBar } from './HealthBar';
import { Inventory } from './Inventory';
import { Store } from './Store';
import { Codex } from './Codex';
import { AudioControls } from './AudioControls';
import { CancelIcon, ArrowUpIcon, ArrowDownIcon } from './Icons';

type ActiveTab = 'inventory' | 'store' | 'codex';

interface SidePanelProps {
  player: Player;
  dungeonLevel: number;
  difficulty: Difficulty | undefined;
  messages: string[];
  isTargeting: boolean;
  discoveredItems: Set<string>;
  discoveredEnemies: Set<string>;
  gameStatus: 'playing' | 'gameOver' | 'victory';
  audioSettings: AudioSettings;
  isMobile: boolean;
  initialTab: ActiveTab;
  tutorialMessage?: string;
  onEquipItem: (itemId: string) => void;
  onUseItem: (itemId: string) => void;
  onBuyItem: (item: any) => void;
  onSellItem: (itemId: string) => void;
  onToggleAudio: (type: 'music' | 'sfx') => void;
  onClose: () => void;
  onSaveGame: () => void;
}

export const SidePanel: React.FC<SidePanelProps> = (props) => {
  const { player, dungeonLevel, messages, gameStatus, difficulty, audioSettings, onToggleAudio, isMobile, onClose, initialTab, tutorialMessage, onSaveGame } = props;
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
  const [isStatsCollapsed, setIsStatsCollapsed] = useState(isMobile);


  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const TabButton: React.FC<{tab: ActiveTab, children: React.ReactNode}> = ({tab, children}) => (
    <button
        onClick={() => setActiveTab(tab)}
        className={`flex-1 p-2 font-bold uppercase tracking-wider text-sm transition-colors ${activeTab === tab ? 'bg-cyan-800 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
    >
        {children}
    </button>
  );

  const panelClasses = isMobile 
    ? "w-full h-full bg-gray-800 p-4 flex flex-col shadow-2xl"
    : "w-96 bg-gray-800 p-4 flex flex-col border-r-2 border-cyan-500 shadow-2xl overflow-y-auto flex-shrink-0";

  return (
    <aside className={panelClasses}>
      {/* Player Info */}
      <div className="flex-shrink-0 border-b-2 border-gray-600 pb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-cyan-400">Cyber Rogue</h2>
           {isMobile ? (
                <button onClick={onClose} className="p-1 rounded-full text-white hover:bg-gray-700">
                    <CancelIcon />
                </button>
            ) : (
                <AudioControls settings={audioSettings} onToggle={onToggleAudio} />
            )}
        </div>
        <div className="mt-2">
            <div className="flex justify-between items-center mb-1">
                <p className="font-bold text-lg">Health: {player.health} / {player.maxHealth}</p>
                 <button onClick={() => setIsStatsCollapsed(!isStatsCollapsed)} className="p-1 text-gray-400 hover:text-white">
                    {isStatsCollapsed ? <ArrowDownIcon /> : <ArrowUpIcon />}
                </button>
            </div>
            <HealthBar currentValue={player.health} maxValue={player.maxHealth} />
        </div>
        {!isStatsCollapsed && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-sm animate-fade-in">
                <p><span className="font-bold text-gray-400">Sector:</span> {dungeonLevel}</p>
                <p><span className="font-bold text-gray-400">Level:</span> {player.level}</p>
                <p>
                    <span className="font-bold text-gray-400">Attack:</span> {player.attack}
                    <span className="text-xs ml-1 capitalize text-gray-300">({player.activeWeaponSlot})</span>
                </p>
                <p><span className="font-bold text-gray-400">Defense:</span> {player.defense}</p>
                <p><span className="font-bold text-gray-400">Credits:</span> <span className="text-yellow-400">{player.gold}</span></p>
                <p><span className="font-bold text-gray-400">XP:</span> {player.xp} / {player.xpToNextLevel}</p>
                {difficulty && <p className="capitalize col-span-2"><span className="font-bold text-gray-400">Difficulty:</span> {difficulty}</p>}
            </div>
        )}
      </div>

      {gameStatus === 'playing' && (
        <div className="flex-shrink-0 mt-4">
            <button
                onClick={onSaveGame}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded transition-colors"
            >
                Save Progress
            </button>
        </div>
      )}

      {dungeonLevel === 0 && tutorialMessage && (
        <div className="flex-shrink-0 mt-4 p-3 bg-cyan-900 bg-opacity-50 border border-cyan-700 rounded text-cyan-200 text-sm">
            <p className="font-bold mb-1 uppercase tracking-wider">Objective</p>
            <p>{tutorialMessage}</p>
        </div>
      )}
      
      {/* Tabs */}
      <div className="flex-shrink-0 flex mt-4 rounded-md overflow-hidden">
        <TabButton tab="inventory">Inventory</TabButton>
        <TabButton tab="store">Store</TabButton>
        <TabButton tab="codex">Codex</TabButton>
      </div>

      {/* Tab Content */}
      <div className="flex-grow mt-2 min-h-0 flex flex-col overflow-y-auto">
          {activeTab === 'inventory' && <Inventory player={player} onEquipItem={props.onEquipItem} onUseItem={props.onUseItem} gameStatus={gameStatus} />}
          {activeTab === 'store' && <Store player={player} onBuyItem={props.onBuyItem} onSellItem={props.onSellItem} dungeonLevel={dungeonLevel} gameStatus={gameStatus} />}
          {activeTab === 'codex' && <Codex discoveredItems={props.discoveredItems} discoveredEnemies={props.discoveredEnemies} />}
      </div>

      {/* Message Log (Desktop only) */}
      {!isMobile && (
        <>
            <div className="flex-shrink-0 h-64 bg-black bg-opacity-40 rounded p-2 mt-4 border border-gray-600 flex flex-col">
                <h3 className="font-bold text-gray-400 border-b border-gray-600 mb-2 flex-shrink-0">System Log</h3>
                <div className="overflow-y-auto text-xs space-y-1 flex-grow">
                    {messages.map((msg, index) => (
                    <p key={index} className="leading-snug">{msg}</p>
                    ))}
                </div>
            </div>
            
            <footer className="flex-shrink-0 text-center p-2 mt-4 text-xs text-gray-400 bg-gray-900 rounded">
                Controls: [Arrows/WASD] Move | [Q] Swap | [F] Search | [T] Target | [Space] Wait
            </footer>
        </>
      )}
    </aside>
  );
};