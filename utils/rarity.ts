import { Rarity } from '../types';

/**
 * Returns a Tailwind CSS text color class based on the item's rarity.
 * @param rarity The rarity of the item.
 * @returns A string containing the Tailwind CSS class.
 */
export const getRarityColor = (rarity: Rarity | undefined): string => {
  switch (rarity) {
    case 'common':
      return 'text-white';
    case 'uncommon':
      return 'text-green-400';
    case 'rare':
      return 'text-blue-400';
    case 'epic':
      return 'text-purple-500';
    case 'legendary':
      return 'text-orange-400';
    default:
      return 'text-gray-400';
  }
};
