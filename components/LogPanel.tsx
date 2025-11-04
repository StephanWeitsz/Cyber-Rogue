import React from 'react';
import { CancelIcon } from './Icons';

interface LogPanelProps {
    messages: string[];
    onClose: () => void;
}

export const LogPanel: React.FC<LogPanelProps> = ({ messages, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 p-4 flex items-center justify-center">
            <div className="w-full h-full max-w-lg max-h-[95vh] bg-gray-800 rounded-lg flex flex-col p-4">
                <div className="flex justify-between items-center border-b-2 border-gray-600 pb-2 mb-2 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-cyan-400">System Log</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-white hover:bg-gray-700">
                        <CancelIcon />
                    </button>
                </div>
                <div className="overflow-y-auto text-sm space-y-1 flex-grow">
                    {messages.map((msg, index) => (
                        <p key={index} className="leading-snug p-1 bg-black bg-opacity-20 rounded">
                            {msg}
                        </p>
                    ))}
                </div>
            </div>
        </div>
    );
};
