import React, { useState, useEffect } from 'react';
import { Difficulty } from '../types';

interface StartScreenProps {
  onStartGame: (difficulty: Difficulty, level?: number) => void;
  onStartTraining: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStartGame, onStartTraining }) => {
  const [showDifficulty, setShowDifficulty] = useState(false);
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [testLevel, setTestLevel] = useState('1');
  const [titleClicks, setTitleClicks] = useState(0);
  const [showTestButton, setShowTestButton] = useState(false);

  useEffect(() => {
    if (titleClicks >= 5) {
      setShowTestButton(true);
    }
  }, [titleClicks]);

  const handleTestStart = () => {
      const level = parseInt(testLevel, 10);
      if (!isNaN(level) && level > 0) {
          onStartGame('test', level);
      }
  }

  const handleTitleClick = () => {
    setTitleClicks(c => c + 1);
  };

  const DifficultyButton: React.FC<{ difficulty: Difficulty, title: string, description: string }> = ({ difficulty, title, description }) => (
    <div>
        <button
            onClick={() => onStartGame(difficulty)}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded transition-colors text-lg"
        >
            {title}
        </button>
        <p className="text-sm text-gray-400 mt-2">{description}</p>
    </div>
  );
  
  if (showLevelSelect) {
    return (
        <div className="bg-black text-white h-screen flex flex-col items-center justify-center font-mono">
            <div className="text-center p-8 bg-gray-900 border-4 border-cyan-500 rounded-lg shadow-2xl max-w-sm w-full">
                <h2 className="text-4xl font-bold text-cyan-400 mb-6">Developer Test</h2>
                <div className="space-y-4">
                    <label htmlFor="level-select" className="block text-gray-300">Enter Starting Sector</label>
                    <input 
                        type="number" 
                        id="level-select"
                        value={testLevel}
                        onChange={(e) => setTestLevel(e.target.value)}
                        className="p-2 rounded bg-gray-700 text-white w-full text-center text-lg"
                        min="1"
                    />
                    <button 
                        onClick={handleTestStart}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded transition-colors text-lg"
                    >
                        Deploy
                    </button>
                </div>
                <button onClick={() => setShowLevelSelect(false)} className="mt-8 text-gray-400 hover:text-white transition-colors">
                    &lt; Back
                </button>
            </div>
        </div>
    );
  }

  if (showDifficulty) {
    return (
        <div className="bg-black text-white h-screen flex flex-col items-center justify-center font-mono">
            <div className="text-center p-8 bg-gray-900 border-4 border-cyan-500 rounded-lg shadow-2xl max-w-sm w-full">
                <h2 className="text-4xl font-bold text-cyan-400 mb-6">Select Difficulty</h2>
                <div className="space-y-6">
                    <DifficultyButton difficulty="easy" title="Easy" description="More credits, weaker enemies. A more forgiving experience." />
                    <DifficultyButton difficulty="difficult" title="Difficult" description="The standard, balanced Cyber Rogue experience." />
                    <DifficultyButton difficulty="hard" title="Hard" description="Increased number of stronger hostile threats. For veterans." />
                </div>
                <button onClick={() => setShowDifficulty(false)} className="mt-8 text-gray-400 hover:text-white transition-colors">
                    &lt; Back
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="bg-black text-white h-screen flex flex-col items-center justify-center font-mono">
      <div className="text-center p-8 bg-gray-900 border-4 border-cyan-500 rounded-lg shadow-2xl">
        <h1 onClick={handleTitleClick} className="text-6xl font-bold text-cyan-400 tracking-widest mb-4 cursor-pointer" title="A secret may be revealed...">CYBER ROGUE</h1>
        <p className="text-gray-300 mb-8">Descend into the neon-drenched sectors of a rogue AI.</p>
        <div className="space-y-4">
            <button
                onClick={() => setShowDifficulty(true)}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded transition-colors text-lg"
            >
                Start New Game
            </button>
            <button
                onClick={onStartTraining}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded transition-colors text-lg"
            >
                Enter Training Sector
            </button>
            {showTestButton && (
              <button
                  onClick={() => setShowLevelSelect(true)}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded transition-colors text-sm mt-4"
              >
                  Developer Test
              </button>
            )}
        </div>
      </div>
    </div>
  );
};