import { LeaderboardEntry, Difficulty } from '../types';

const LEADERBOARDS_KEY = 'roguelike_leaderboards';

type AllLeaderboards = {
  [key in 'easy' | 'hard' | 'difficult']: LeaderboardEntry[];
};

export const getLeaderboards = (): AllLeaderboards => {
  try {
    const data = localStorage.getItem(LEADERBOARDS_KEY);
    if (data) {
      const boards = JSON.parse(data);
      // Ensure all keys exist to prevent runtime errors
      return {
        easy: boards.easy || [],
        hard: boards.hard || [],
        difficult: boards.difficult || [],
      };
    }
  } catch (error) {
    console.error('Failed to get leaderboards from localStorage', error);
  }
  return { easy: [], hard: [], difficult: [] };
};

export const saveToLeaderboard = (entry: Omit<LeaderboardEntry, 'date'>) => {
  // Don't save scores for 'test' mode
  if (entry.difficulty === 'test') {
    return;
  }

  try {
    const allBoards = getLeaderboards();
    const newEntry: LeaderboardEntry = {
      ...entry,
      date: new Date().toISOString(),
    };
    
    // Add to the correct board
    const relevantBoard = allBoards[entry.difficulty];
    relevantBoard.push(newEntry);
    
    // Sort and slice to keep top 10
    relevantBoard.sort((a, b) => b.score - a.score);
    allBoards[entry.difficulty] = relevantBoard.slice(0, 10);
    
    localStorage.setItem(LEADERBOARDS_KEY, JSON.stringify(allBoards));
  } catch (error) {
    console.error('Failed to save to leaderboard in localStorage', error);
  }
};
