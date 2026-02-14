'use client';

import { useState, useMemo } from 'react';
import BoatCard from './BoatCard';
import BoatFilter from './BoatFilter';

type BoatFilterType = 'all' | 'single' | 'double' | 'four' | 'eight' | 'recreational' | 'other';

interface Boat {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  capacity: number;
  boatType?: string | null;
}

interface BoatsListProps {
  boats: Boat[];
}

// Helper function to determine boat type from name and capacity
function getBoatType(boat: Boat): BoatFilterType {
  // If boatType is already set in DB, use it
  if (boat.boatType) {
    return boat.boatType as BoatFilterType;
  }

  // Fallback: determine from naming conventions
  const isRecreational = boat.name.includes('xR ') || boat.name.includes('R ') || boat.name.toLowerCase().includes('recreational');
  
  if (isRecreational) {
    return 'recreational';
  }

  switch (boat.capacity) {
    case 1:
      return 'single';
    case 2:
      return 'double';
    case 4:
    case 5:
      return 'four';
    case 9:
      return 'eight';
    case 8:
      return 'other'; // launches
    default:
      return 'other';
  }
}

export default function BoatsList({ boats }: BoatsListProps) {
  const [selectedFilter, setSelectedFilter] = useState<BoatFilterType>('all');

  // Calculate boat counts for each filter
  const boatCounts = useMemo(() => {
    const counts: Record<BoatFilterType, number> = {
      all: boats.length,
      single: 0,
      double: 0,
      four: 0,
      eight: 0,
      recreational: 0,
      other: 0,
    };

    boats.forEach(boat => {
      const type = getBoatType(boat);
      counts[type]++;
    });

    return counts;
  }, [boats]);

  // Filter boats based on selected filter
  const filteredBoats = useMemo(() => {
    if (selectedFilter === 'all') {
      return boats;
    }

    return boats.filter(boat => getBoatType(boat) === selectedFilter);
  }, [boats, selectedFilter]);

  return (
    <>
      <BoatFilter onFilterChange={setSelectedFilter} boatCounts={boatCounts} />
      
      {filteredBoats.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No boats available for this filter.
          </p>
        </div>
      ) : (
        <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBoats.map((boat) => (
            <BoatCard key={boat.id} boat={boat} />
          ))}
        </div>
      )}
    </>
  );
}
