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
  capacity?: number | null;
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
  // Check for recreational boats first (they have 'xR' or ' R ' in name)
  // This pattern matches boats like "1xR Wintec Explore 700" and "2xR Wintec Explorer STN 703"
  const isRecreational = boat.name.includes('xR ') || boat.name.includes('R ') || boat.name.toLowerCase().includes('recreational');
  
  if (isRecreational) {
    return 'recreational';
  }

  // Classify by capacity
  // Note: Capacity includes cox where applicable
  // If capacity is missing/undefined, return 'other' as fallback
  if (boat.capacity == null) {
    return 'other';
  }

  switch (boat.capacity) {
    case 1:
      return 'single';  // 1x (single scull)
    case 2:
      return 'double';  // 2x (double scull) or 2- (pair)
    case 4:
    case 5:
      return 'four';    // 4- (coxless four), 4x (quad), 4+ (coxed four/quad, capacity 5 includes cox)
    case 9:
      return 'eight';   // 8+ (eight with cox, capacity 9 = 8 rowers + 1 cox)
    case 8:
      return 'other';   // Launches (used for coaching/support, not rowing boats)
    default:
      return 'other';   // Any uncategorized boats
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
      <BoatFilter 
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter} 
        boatCounts={boatCounts} 
      />
      
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
