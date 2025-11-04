import React, { useState } from 'react';
import { 
    ArrowUpIcon, ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon,
    SearchIcon, WaitIcon, SwapIcon, TargetIcon, CancelIcon, 
    InventoryIcon, StoreIcon, CodexIcon, LogIcon
} from './Icons';

interface MobileControlsProps {
    isTargeting: boolean;
    onMove: (dx: number, dy: number) => void;
    onDirectionalAttack: (dx: number, dy: number) => void;
    onSearch: () => void;
    onWait: () => void;
    onSwap: () => void;
    onToggleTargeting: () => void;
    onOpenModal: (modal: 'inventory' | 'store' | 'codex' | 'log') => void;
    showSidePanel: boolean;
    showLogPanel: boolean;
}

const DPadButton: React.FC<{onClick: () => void, className?: string, children: React.ReactNode}> = ({ onClick, className, children }) => (
    <button
        onClick={onClick}
        className={`w-12 h-12 flex items-center justify-center bg-gray-700 bg-opacity-70 text-white rounded-lg active:bg-cyan-500 active:bg-opacity-80 transition-colors ${className}`}
    >
        {children}
    </button>
);

const ActionButton: React.FC<{onClick: () => void, children: React.ReactNode, className?: string}> = ({ onClick, children, className }) => (
    <button
        onClick={onClick}
        className={`w-16 h-16 flex flex-col items-center justify-center bg-gray-800 bg-opacity-70 text-white rounded-full active:bg-cyan-600 active:bg-opacity-80 transition-colors border-2 border-gray-600 ${className}`}
    >
        {children}
    </button>
);

const MenuButton: React.FC<{onClick: () => void, children: React.ReactNode}> = ({ onClick, children }) => (
    <button onClick={onClick} className="w-12 h-12 flex flex-col items-center justify-center bg-gray-800 bg-opacity-70 text-white rounded-full active:bg-cyan-600 active:bg-opacity-80 transition-colors border-2 border-gray-600">
        {children}
    </button>
);


export const MobileControls: React.FC<MobileControlsProps> = (props) => {
    const { isTargeting, onMove, onDirectionalAttack, onSearch, onWait, onSwap, onToggleTargeting, onOpenModal, showSidePanel, showLogPanel } = props;
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleDpad = (dx: number, dy: number) => {
        if (isTargeting) {
            onDirectionalAttack(dx, dy);
        } else {
            onMove(dx, dy);
        }
    }

    return (
        <>
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50">
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-20 h-6 flex items-center justify-center bg-gray-800 bg-opacity-80 text-white rounded-t-lg border-t border-x border-gray-600"
                    aria-label={isCollapsed ? "Expand Controls" : "Collapse Controls"}
                >
                    {isCollapsed ? <ArrowUpIcon /> : <ArrowDownIcon />}
                </button>
            </div>

            {!isCollapsed && (
                <>
                    <div className="fixed bottom-4 left-4 z-40 grid grid-cols-3 grid-rows-3 gap-1 w-40 h-40">
                       <div className="col-start-2">
                           <DPadButton onClick={() => handleDpad(0, -1)}><ArrowUpIcon /></DPadButton>
                       </div>
                       <div className="row-start-2">
                           <DPadButton onClick={() => handleDpad(-1, 0)}><ArrowLeftIcon /></DPadButton>
                       </div>
                       <div className="row-start-2 col-start-3">
                           <DPadButton onClick={() => handleDpad(1, 0)}><ArrowRightIcon /></DPadButton>
                       </div>
                       <div className="row-start-3 col-start-2">
                           <DPadButton onClick={() => handleDpad(0, 1)}><ArrowDownIcon /></DPadButton>
                       </div>
                    </div>

                    <div className="fixed bottom-4 right-4 z-40">
                        {isTargeting ? (
                            <ActionButton onClick={onToggleTargeting} className="bg-red-800 border-red-600">
                                <CancelIcon />
                                <span className="text-xs mt-1">Cancel</span>
                            </ActionButton>
                        ) : (
                            <div className="grid grid-cols-2 grid-rows-2 gap-2">
                                <ActionButton onClick={onSearch}>
                                    <SearchIcon />
                                    <span className="text-xs mt-1">Search</span>
                                </ActionButton>
                                 <ActionButton onClick={onWait}>
                                    <WaitIcon />
                                    <span className="text-xs mt-1">Wait</span>
                                </ActionButton>
                                 <ActionButton onClick={onSwap}>
                                    <SwapIcon />
                                    <span className="text-xs mt-1">Swap</span>
                                </ActionButton>
                                 <ActionButton onClick={onToggleTargeting}>
                                    <TargetIcon />
                                    <span className="text-xs mt-1">Target</span>
                                </ActionButton>
                            </div>
                        )}
                    </div>
                </>
            )}

            {!showSidePanel && !showLogPanel && (
                <div className="fixed top-4 right-4 z-40 flex space-x-2">
                    <MenuButton onClick={() => onOpenModal('inventory')}>
                        <InventoryIcon />
                        <span className="text-[10px] mt-0.5">HUD</span>
                    </MenuButton>
                    <MenuButton onClick={() => onOpenModal('log')}>
                        <LogIcon />
                        <span className="text-[10px] mt-0.5">Log</span>
                    </MenuButton>
                </div>
            )}
        </>
    );
};