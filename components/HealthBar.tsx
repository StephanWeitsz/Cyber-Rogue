import React from 'react';

interface HealthBarProps {
  currentValue: number;
  maxValue: number;
  small?: boolean;
  playerBar?: boolean;
  tiny?: boolean;
}

export const HealthBar: React.FC<HealthBarProps> = ({ currentValue, maxValue, small, playerBar, tiny }) => {
  const percentage = Math.max(0, (currentValue / maxValue) * 100);
  
  let color: string;
  if (playerBar) {
    color = 'bg-cyan-500';
  } else {
    color = percentage > 60 ? 'bg-green-500' : percentage > 30 ? 'bg-yellow-500' : 'bg-red-500';
  }

  const height = tiny ? 'h-1' : small ? 'h-1.5' : 'h-5';
  const border = tiny ? '' : small ? 'border' : 'border-2';

  return (
    <div className={`w-full bg-gray-700 rounded-full ${height} overflow-hidden ${border} border-gray-900 relative`}>
      <div
        className={`h-full rounded-full transition-all duration-300 ease-out ${color}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};