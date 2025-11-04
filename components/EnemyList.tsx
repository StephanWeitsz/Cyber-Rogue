import React from 'react';
import { Enemy } from '../types';
import { HealthBar } from './HealthBar';

interface EnemyListProps {
  enemies: Enemy[];
}

export const EnemyList: React.FC<EnemyListProps> = ({ enemies }) => {
  if (enemies.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-4 right-4 z-20 bg-black bg-opacity-60 p-2 rounded-lg shadow-lg text-white text-xs w-48 pointer-events-none">
      <h3 className="font-bold uppercase tracking-wider text-red-400 border-b border-red-400/50 mb-2 pb-1">Hostiles Detected</h3>
      <ul className="space-y-2">
        {enemies.map(enemy => (
          <li key={enemy.id}>
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold">{enemy.name}</span>
              <span>{enemy.health}/{enemy.maxHealth}</span>
            </div>
            <HealthBar currentValue={enemy.health} maxValue={enemy.maxHealth} small={true} />
          </li>
        ))}
      </ul>
    </div>
  );
};
