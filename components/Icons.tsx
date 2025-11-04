import React from 'react';
import { Enemy, GameItem, Trap, Player, Position } from '../types';
import { HealthBar } from './HealthBar';

const IconBase: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {children}
    </svg>
);

export const PlayerIcon: React.FC<{ player: Player; isMobile?: boolean }> = ({ player, isMobile }) => (
    <div className="relative flex flex-col items-center justify-center h-full">
        <div className={`absolute ${isMobile ? '-top-2' : '-top-3'} w-6 z-10`}>
            <HealthBar currentValue={player.health} maxValue={player.maxHealth} small={true} tiny={isMobile} playerBar={true} />
        </div>
        <div className="text-cyan-400 font-bold text-lg">@</div>
    </div>
);

export const EnemyIcon: React.FC<{ enemy: Enemy; isMobile?: boolean, targetCoordinates?: Position | null }> = ({ enemy, isMobile, targetCoordinates }) => {
    const { char, rank, position } = enemy;
    let color = 'text-red-500'; // Default for normal

    if (rank === 'mini-boss') {
        color = 'text-red-400';
    } else if (rank === 'boss') {
        color = 'text-purple-500';
    } else if (rank === 'training') {
        color = 'text-gray-400';
    }
    
    const isTargeted = targetCoordinates?.x === position.x && targetCoordinates?.y === position.y;

    return (
        <div className="relative flex flex-col items-center justify-center h-full">
            {isTargeted && (
                <div className="absolute -inset-1 border-2 border-red-500 rounded-full animate-pulse z-0" />
            )}
            <div className={`absolute ${isMobile ? '-top-2' : '-top-3'} w-6 z-10`}>
                <HealthBar currentValue={enemy.health} maxValue={enemy.maxHealth} small={true} tiny={isMobile} />
            </div>
            <div className={`${color} font-bold text-lg relative z-1`}>{char}</div>
        </div>
    );
};

export const StairsIcon: React.FC = () => <div className="text-yellow-400 font-bold text-lg">&gt;</div>;

export const ItemIcon: React.FC<{ item: GameItem | { type: string, name: string } }> = ({ item }) => {
    let char = '?';
    let color = 'text-gray-400';
    switch (item.type) {
        case 'weapon': char = ')'; color = 'text-green-400'; break;
        case 'armor': char = '['; color = 'text-blue-400'; break;
        case 'potion': char = '!'; color = 'text-pink-400'; break;
        case 'gold': char = '$'; color = 'text-yellow-400'; break;
        case 'scroll': char = '~'; color = 'text-purple-400'; break;
        case 'buff': char = '^'; color = 'text-orange-400'; break;
    }
    return <div className={`${color} font-bold text-lg`}>{char}</div>;
};

export const TrapIcon: React.FC<{ trap: Trap }> = ({ trap }) => {
    let char = '^';
    let color = 'text-red-700';
    if (trap.triggered) {
        color = 'text-red-500';
    }
    return <div className={`${color} font-bold text-lg`}>{char}</div>;
};

export const CancelIcon: React.FC = () => (
    <IconBase>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </IconBase>
);

export const MusicOnIcon: React.FC = () => (
    <IconBase>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </IconBase>
);

export const MusicOffIcon: React.FC = () => (
    <IconBase>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3m-9 9l6-6m-6 0l6 6" />
    </IconBase>
);

export const SfxOnIcon: React.FC = () => (
    <IconBase>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </IconBase>
);

export const SfxOffIcon: React.FC = () => (
    <IconBase>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l-4-4m0 4l4-4" />
    </IconBase>
);


export const ArrowUpIcon: React.FC = () => <IconBase><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></IconBase>;
export const ArrowDownIcon: React.FC = () => <IconBase><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></IconBase>;
export const ArrowLeftIcon: React.FC = () => <IconBase><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></IconBase>;
export const ArrowRightIcon: React.FC = () => <IconBase><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></IconBase>;
export const FireIcon: React.FC = () => <IconBase className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 4v1m0 0v1m0-1h1m-1 0H6m1.11 9.993l-.22 2.22m.22-2.22a.75.75 0 00.22 2.22m0 0l2.22.22m-2.22-.22a.75.75 0 01-2.22-.22m2.22.22l-.22-2.22m8.66-8.66l-2.22-.22m2.22.22a.75.75 0 01.22 2.22m-2.22-2.22a.75.75 0 002.22-.22m-2.22.22l2.22 2.22m0 0l.22 2.22m-.22-2.22a.75.75 0 01-.22-2.22m.22 2.22l-.22.22m-8.88-8.88l.22.22m-.22-.22a.75.75 0 01.22-.22m.22.22l2.22-.22m-2.22.22a.75.75 0 00-.22 2.22m2.22-2.22l2.22 2.22M12 12a.75.75 0 00.75-.75V11.25a.75.75 0 00-1.5 0V11.25A.75.75 0 0012 12z" /></IconBase>

export const SearchIcon: React.FC = () => <IconBase><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></IconBase>;
export const WaitIcon: React.FC = () => <IconBase><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></IconBase>;
export const SwapIcon: React.FC = () => <IconBase><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></IconBase>;
export const TargetIcon: React.FC = () => <IconBase><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></IconBase>;
export const InventoryIcon: React.FC = () => <IconBase><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></IconBase>;
export const StoreIcon: React.FC = () => <IconBase><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></IconBase>;
export const CodexIcon: React.FC = () => <IconBase><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></IconBase>;
export const LogIcon: React.FC = () => <IconBase><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></IconBase>;
export const RotateDeviceIcon: React.FC = () => <IconBase><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></IconBase>;