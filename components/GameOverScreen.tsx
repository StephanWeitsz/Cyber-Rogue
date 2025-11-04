import React from 'react';
import { saveToLeaderboard } from '../services/leaderboard';
import { Leaderboard } from './Leaderboard';
import { Difficulty } from '../types';

interface GameOverScreenProps {
  score: number;
  level: number;
  difficulty: Difficulty | undefined;
  onRestart: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ score, level, difficulty, onRestart }) => {
  const [name, setName] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const canSubmitScore = difficulty !== 'test';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && !submitted && difficulty && canSubmitScore) {
      saveToLeaderboard({ name, score, level, difficulty });
      setSubmitted(true);
    }
  };

  return (
    <div className="absolute inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center text-white z-50">
      <div className="bg-gray-900 p-8 rounded-lg shadow-xl text-center max-w-md w-full">
        <h1 className="text-5xl font-bold text-red-500 mb-4">Game Over</h1>
        <p className="text-xl mb-2">You reached level <span className="font-bold text-yellow-400">{level}</span></p>
        <p className="text-xl mb-6">Final Score: <span className="font-bold text-yellow-400">{score.toLocaleString()}</span></p>
        
        {canSubmitScore && !submitted && (
          <form onSubmit={handleSubmit} className="mb-6">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name for the leaderboard"
              className="p-2 rounded bg-gray-700 text-white w-full mb-2"
              maxLength={12}
            />
            <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors">
              Save Score
            </button>
          </form>
        )}
        {submitted && <p className="text-green-400 mb-6">Score saved!</p>}
        {!canSubmitScore && <p className="text-gray-400 mb-6">Scores are not saved in Test Mode.</p>}

        <button
          onClick={onRestart}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Restart Game
        </button>
        <div className="mt-8">
            {difficulty && <Leaderboard initialDifficulty={difficulty} />}
        </div>
      </div>
    </div>
  );
};
