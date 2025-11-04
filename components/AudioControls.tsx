import React from 'react';
import { AudioSettings } from '../types';
import { MusicOnIcon, MusicOffIcon, SfxOnIcon, SfxOffIcon } from './Icons';

interface AudioControlsProps {
    settings: AudioSettings;
    onToggle: (type: 'music' | 'sfx') => void;
}

export const AudioControls: React.FC<AudioControlsProps> = ({ settings, onToggle }) => {
    return (
        <div className="flex space-x-2">
            <button
                onClick={() => onToggle('music')}
                className="p-1 rounded-full bg-gray-700 hover:bg-gray-600 text-cyan-400 transition-colors"
                title={settings.musicOn ? "Mute Music" : "Unmute Music"}
            >
                {settings.musicOn ? <MusicOnIcon /> : <MusicOffIcon />}
            </button>
            <button
                onClick={() => onToggle('sfx')}
                className="p-1 rounded-full bg-gray-700 hover:bg-gray-600 text-cyan-400 transition-colors"
                title={settings.sfxOn ? "Mute SFX" : "Unmute SFX"}
            >
                {settings.sfxOn ? <SfxOnIcon /> : <SfxOffIcon />}
            </button>
        </div>
    );
};
