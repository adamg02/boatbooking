# Boat Booking Filter Feature

## Overview
This feature adds a filter bar at the top of the boat booking page to allow users to filter boats by type.

## Filter Categories

- **All**: Shows all active boats
- **1**: Single sculls (1x) - excludes recreational boats
- **2**: Double sculls and pairs (2x, 2-) - excludes recreational boats
- **4**: Fours and quads (4-, 4x, 4+) - excludes recreational boats
- **8**: Eights (8+)
- **Rec**: Recreational boats only (1xR, 2xR, etc.)
- **Other**: Launches and other uncategorized boats

## Implementation

### Database Changes

**Optional but Recommended**: Run these migration scripts for optimal filtering:

1. **Add capacity column** (if not already present):
   ```bash
   psql -d your_database < ADD_BOATS_BATCH.sql
   ```

2. **Add boatType column**:
   ```bash
   psql -d your_database < ADD_BOAT_TYPE_COLUMN.sql
   ```

These migrations will:
1. Add `capacity` and `boatType` columns to the `Boat` table
2. Automatically classify existing boats based on their names and capacity
3. Display a summary of boat counts by type

**Note**: The filter feature works even without these migrations, but will classify all boats as "other" type. Running the migrations provides more accurate categorization.

### Boat Type Classification Logic

The code uses a three-tier classification system:

**Tier 1: Database Value (Preferred)**
- If `boatType` is set in the database, it's used directly

**Tier 2: Name-Based Classification (Fallback)**
- **Recreational**: Names containing 'xR ', 'R ', or 'recreational' (case insensitive)

**Tier 3: Capacity-Based Classification (Fallback)**
- **Single**: Capacity = 1 (single sculls)
- **Double**: Capacity = 2 (double sculls, pairs)
- **Four**: Capacity = 4 or 5 (coxless/coxed fours and quads)
- **Eight**: Capacity = 9 (8 rowers + 1 cox)
- **Other**: Capacity = 8 (launches), missing capacity, or any uncategorized boats

**Behavior Without Migrations**:
- If `capacity` and `boatType` columns don't exist, boats will be classified as:
  - "recreational" if name matches patterns
  - "other" for all other boats
- The "All" filter will always show all boats regardless of classification

### Components

#### BoatFilter Component
Location: `src/components/BoatFilter.tsx`

A client-side component that renders the filter buttons with:
- Active state styling (blue background with shadow)
- Boat counts for each category
- localStorage persistence of the selected filter

#### BoatsList Component
Location: `src/components/BoatsList.tsx`

A client-side component that:
- Manages filter state
- Calculates boat counts for each filter category
- Filters boats based on the selected filter
- Renders the BoatFilter and filtered boat cards

### LocalStorage Persistence

The selected filter is stored in localStorage under the key `boat-filter-selection`. This ensures that users' filter preferences persist across page reloads during their session.

## Usage

Users can:
1. Click any filter button to view boats of that type
2. See the count of boats in each category (shown in parentheses)
3. The selected filter will be remembered when they return to the page
4. Filter buttons scroll horizontally on mobile devices for accessibility

## Styling

The filter buttons use:
- Rounded full (`rounded-full`) styling for a pill-shaped appearance
- Blue (`bg-blue-600`) background with white text for the selected state
- Gray (`bg-gray-200`) background with dark text for unselected state
- Smooth transitions for hover and active states
- Responsive padding and font sizing
