import React from 'react';

export type SortOption = 'all' | 'recentCreated' | 'ended' | 'bomper';

interface SortOptionsProps {
  onSort: (option: SortOption) => void;
  currentSort: SortOption;
}

const sortOptionMapping: { [key: string]: SortOption } = {
  'All': 'all',
  'Creation Time': 'recentCreated',
  'Ended': 'ended',
  'Bomper': 'bomper'
};

const SortOptions: React.FC<SortOptionsProps> = ({ onSort, currentSort }) => {
  return (
    <div className="mb-5 flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
      {Object.keys(sortOptionMapping).map((option) => (
        <button
          key={option}
          onClick={() => onSort(sortOptionMapping[option])}
          className={`px-3 py-1 text-[10px] sm:text-xs rounded-full transition-colors duration-200 ${
            currentSort === sortOptionMapping[option]
              ? 'bg-blue-500 text-white neon-border'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
};

export default SortOptions;