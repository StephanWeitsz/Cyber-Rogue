import React from 'react';
import { GameState, Position, GameItem, Trap } from '../types';
import { TILE_SIZE } from '../constants';
import { EnemyIcon, StairsIcon, ItemIcon, TrapIcon, PlayerIcon } from './Icons';

interface GameBoardProps {
  gameState: GameState;
  visibleTiles: Set<string>;
  renderPlayer: boolean;
  isMobile: boolean;
  targetPath: Position[] | null;
}

export const GameBoard: React.FC<GameBoardProps> = ({ gameState, visibleTiles, renderPlayer, isMobile, targetPath }) => {
  const { grid, enemies, stairsPosition, items, traps, visitedTiles, projectilePath, player, targetCoordinates } = gameState;

  const renderTile = (x: number, y: number) => {
    const key = `${x},${y}`;
    const isVisible = visibleTiles.has(key);
    const isVisited = visitedTiles[key];

    if (!isVisited) {
        return null; // Don't render unvisited tiles
    }

    const style = {
      width: TILE_SIZE,
      height: TILE_SIZE,
      left: x * TILE_SIZE,
      top: y * TILE_SIZE,
      opacity: isVisible ? 1 : 0.4,
    };
    
    const tileType = grid[y][x];
    let content: string;
    let className = 'absolute flex items-center justify-center transition-opacity duration-300';

    if (tileType === 1) { // Wall
      className += ' bg-gray-800 text-gray-600';
      content = '#';
    } else if (tileType === 2) { // Locked Door
      className += ' bg-cyan-900 text-cyan-500';
      content = '█';
    }
    else { // Floor
      className += ' bg-black text-gray-700';
      content = '·';
    }

    return (
      <div key={key} className={className} style={style}>
        {content}
      </div>
    );
  };

  const entityStyle = (position: Position) => ({
    width: TILE_SIZE,
    height: TILE_SIZE,
    left: position.x * TILE_SIZE,
    top: position.y * TILE_SIZE,
    transition: 'left 0.1s ease-out, top 0.1s ease-out',
  });

  const renderEntity = (
      key: string,
      position: Position,
      zIndex: number,
      content: React.ReactNode
  ) => {
      if (!visibleTiles.has(`${position.x},${position.y}`)) {
          return null;
      }
      return (
        <div
          key={key}
          className="absolute flex items-center justify-center"
          style={{ ...entityStyle(position), zIndex }}
        >
          {content}
        </div>
      );
  };

  const stairsKey = stairsPosition ? `${stairsPosition.x},${stairsPosition.y}` : '';
  const areStairsVisible = visibleTiles.has(stairsKey);

  return (
    <div
      className="relative bg-black"
      style={{
        width: grid[0].length * TILE_SIZE,
        height: grid.length * TILE_SIZE,
      }}
    >
      {grid.map((row, y) => row.map((_tile, x) => renderTile(x, y)))}
      
      {stairsPosition && (gameState.stairsDiscovered || areStairsVisible) && visitedTiles[stairsKey] && (
          <div
              key="stairs"
              className="absolute flex items-center justify-center"
              style={{ ...entityStyle(stairsPosition), zIndex: 5, opacity: areStairsVisible ? 1 : 0.4 }}
          >
              <StairsIcon />
          </div>
      )}
      {items.map(item => renderEntity(item.id, item.position, 8, <ItemIcon item={item} />))}
      {traps.filter(t => t.revealed).map(trap => renderEntity(`trap-${trap.position.x}-${trap.position.y}`, trap.position, 6, <TrapIcon trap={trap} />))}
      
      {targetPath?.map((pos, i) => {
          const isTargetPos = i === targetPath.length - 1;
          return (
             <div key={`target-${i}`} className={`absolute pointer-events-none ${isTargetPos ? 'bg-red-500' : 'bg-yellow-400'} opacity-50`} style={{
              width: TILE_SIZE,
              height: TILE_SIZE,
              left: pos.x * TILE_SIZE,
              top: pos.y * TILE_SIZE,
              zIndex: 11,
              transform: isTargetPos ? 'scale(1.2)' : 'scale(0.5)',
              borderRadius: isTargetPos ? '25%' : '50%',
          }}/>
          )
      })}
      
      {projectilePath?.map((pos, i) => (
          <div key={`proj-${i}`} className="absolute bg-yellow-300 opacity-75 rounded-full" style={{
              width: TILE_SIZE / 2,
              height: TILE_SIZE / 2,
              left: pos.x * TILE_SIZE + TILE_SIZE / 4,
              top: pos.y * TILE_SIZE + TILE_SIZE / 4,
              zIndex: 11,
          }}/>
      ))}
      
      {renderPlayer && renderEntity('player', player.position, 10, <PlayerIcon player={player} isMobile={isMobile} />)}
      {enemies.map((enemy) => renderEntity(enemy.id, enemy.position, 9, <EnemyIcon enemy={enemy} isMobile={isMobile} targetCoordinates={targetCoordinates} />))}
    </div>
  );
};