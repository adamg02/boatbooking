-- Add boatType column to Boat table for filtering
ALTER TABLE "Boat" ADD COLUMN IF NOT EXISTS "boatType" TEXT;

-- Update boat types based on naming conventions and capacity
-- Singles (1x)
UPDATE "Boat" SET "boatType" = 'single' WHERE capacity = 1 AND name NOT LIKE '%R%';

-- Recreational singles (1xR)
UPDATE "Boat" SET "boatType" = 'recreational' WHERE capacity = 1 AND name LIKE '%R%';

-- Doubles/Pairs (2x/2-)
UPDATE "Boat" SET "boatType" = 'double' WHERE capacity = 2 AND name NOT LIKE '%R%';

-- Recreational doubles (2xR)
UPDATE "Boat" SET "boatType" = 'recreational' WHERE capacity = 2 AND name LIKE '%R%';

-- Coxless fours/quads (4-/4x)
UPDATE "Boat" SET "boatType" = 'four' WHERE capacity = 4;

-- Coxed fours/quads (4+)
UPDATE "Boat" SET "boatType" = 'four' WHERE capacity = 5;

-- Eights (8+)
UPDATE "Boat" SET "boatType" = 'eight' WHERE capacity = 9;

-- Launches and other support boats
UPDATE "Boat" SET "boatType" = 'other' WHERE capacity = 8 OR name LIKE 'Launch%';

-- Display summary
SELECT 
    "boatType",
    COUNT(*) as count
FROM "Boat"
GROUP BY "boatType"
ORDER BY "boatType";
