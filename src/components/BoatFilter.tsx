'use client';

import { useEffect, useState } from 'react';

type BoatFilterType = 'all' | 'single' | 'double' | 'four' | 'eight' | 'recreational' | 'other';

interface BoatFilterProps {
  onFilterChange: (filter: BoatFilterType) => void;
  boatCounts?: Record<BoatFilterType, number>;
}

const FILTER_STORAGE_KEY = 'boat-filter-selection';

export default function BoatFilter({ onFilterChange, boatCounts }: BoatFilterProps) {
  const [selectedFilter, setSelectedFilter] = useState<BoatFilterType>('all');

  // Load filter from localStorage on mount
  useEffect(() => {
    const savedFilter = localStorage.getItem(FILTER_STORAGE_KEY) as BoatFilterType;
    if (savedFilter && ['all', 'single', 'double', 'four', 'eight', 'recreational', 'other'].includes(savedFilter)) {
      setSelectedFilter(savedFilter);
      onFilterChange(savedFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const handleFilterClick = (filter: BoatFilterType) => {
    setSelectedFilter(filter);
    localStorage.setItem(FILTER_STORAGE_KEY, filter);
    onFilterChange(filter);
  };

  const filters: Array<{ value: BoatFilterType; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'single', label: '1' },
    { value: 'double', label: '2' },
    { value: 'four', label: '4' },
    { value: 'eight', label: '8' },
    { value: 'recreational', label: 'Rec' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
      {filters.map((filter) => {
        const count = boatCounts?.[filter.value] ?? 0;
        const isSelected = selectedFilter === filter.value;
        
        return (
          <button
            key={filter.value}
            onClick={() => handleFilterClick(filter.value)}
            className={`
              flex-shrink-0 px-6 py-2 rounded-full font-medium text-sm transition-all
              ${isSelected
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }
            `}
          >
            {filter.label}
            {count > 0 && (
              <span className={`ml-1.5 ${isSelected ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                ({count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
