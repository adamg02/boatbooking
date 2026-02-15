-- Add boatType column to Boat table for filtering
ALTER TABLE "Boat" ADD COLUMN IF NOT EXISTS "boatType" TEXT;

-- Update boat types based on naming conventions and capacity
-- Recreational boats (1xR, 2xR) - check first before other classifications
UPDATE "Boat" SET "boatType" = 'recreational' WHERE name LIKE '%xR %' OR name LIKE '%R %' OR LOWER(name) LIKE '%recreational%';

-- Singles (1x) - excluding recreational
UPDATE "Boat" SET "boatType" = 'single' WHERE capacity = 1 AND "boatType" IS NULL;

-- Doubles/Pairs (2x/2-) - excluding recreational
UPDATE "Boat" SET "boatType" = 'double' WHERE capacity = 2 AND "boatType" IS NULL;

-- Coxless fours/quads (4-/4x) and Coxed fours/quads (4+)
UPDATE "Boat" SET "boatType" = 'four' WHERE (capacity = 4 OR capacity = 5) AND "boatType" IS NULL;

-- Eights (8+) - capacity 9 includes cox
UPDATE "Boat" SET "boatType" = 'eight' WHERE capacity = 9 AND "boatType" IS NULL;

-- Launches and other support boats - capacity 8 is for launches
UPDATE "Boat" SET "boatType" = 'other' WHERE (capacity = 8 OR name LIKE 'Launch%' OR "boatType" IS NULL);

-- Display summary
SELECT 
    "boatType",
    COUNT(*) as count
FROM "Boat"
GROUP BY "boatType"
ORDER BY "boatType";
