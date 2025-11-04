import React, { useState, useEffect } from 'react';
import { getLeaderboards } from '../services/leaderboard';
import { LeaderboardEntry, Difficulty } from '../types';

interface LeaderboardProps {
    initialDifficulty: Difficulty;
}

type LeaderboardDifficulty = 'easy' | 'difficult' | 'hard';

export const Leaderboard: React.FC<LeaderboardProps> = ({ initialDifficulty }) => {
  const [allScores, setAllScores] = useState<Record<LeaderboardDifficulty, LeaderboardEntry[]>>({ easy: [], hard: [], difficult: [] });
  const [viewedDifficulty, setViewedDifficulty] = useState<LeaderboardDifficulty>(
      initialDifficulty === 'easy' || initialDifficulty === 'difficult' || initialDifficulty === 'hard' ? initialDifficulty : 'difficult'
  );

  useEffect(() => {
    setAllScores(getLeaderboards());
  }, []);
  
  const difficulties: LeaderboardDifficulty[] = ['easy', 'difficult', 'hard'];
  const scoresToShow = allScores[viewedDifficulty] || [];

  return (
    <div className="p-4 bg-gray-800 text-white rounded-lg shadow-lg w-full">
      <h2 className="text-xl font-bold mb-4 text-yellow-400">Leaderboard</h2>
      <div className="flex mb-4 border-b border-gray-600">
        {difficulties.map(diff => (
            <button 
                key={diff}
                onClick={() => setViewedDifficulty(diff)}
                className={`flex-1 p-2 text-sm font-bold uppercase tracking-wider transition-colors capitalize ${viewedDifficulty === diff ? 'border-b-2 border-yellow-400 text-white' : 'text-gray-400 hover:text-white'}`}
            >
                {diff}
            </button>
        ))}
      </div>
      {scoresToShow.length === 0 ? (
        <p className="text-gray-400">No scores yet for {viewedDifficulty} difficulty. Be the first!</p>
      ) : (
        <ol className="space-y-2">
            {scoresToShow.map((score, index) => (
            <li key={index} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                <span className="font-semibold">
                {index + 1}. {score.name}
                </span>
                <div className="text-right">
                <div className="font-bold text-lg">{score.score.toLocaleString()}</div>
                <div className="text-xs text-gray-400">Level {score.level}</div>
                </div>
            </li>
            ))}
        </ol>
      )}
    </div>
  );
};
