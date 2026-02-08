-- Add capacity column to Boat table if it doesn't exist
ALTER TABLE "Boat" ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 1 NOT NULL;

-- Batch insert boats from legacy system
INSERT INTO "Boat" (name, description, capacity, "isActive") VALUES
    ('1x Polycarp 55KG STN107', 'Single scull, 55KG weight class', 1, true),
    ('1x Thamesis STN121', 'Single scull', 1, true),
    ('1x Burgundy & White 90KG STN158', 'Single scull, 90KG weight class', 1, true),
    ('1x Chinese White 90KG STN157', 'Single scull, 90KG weight class', 1, true),
    ('1x Dusty 60kg STN120', 'Single scull, 60KG weight class', 1, true),
    ('1x Janousek 60KG STN 159', 'Single scull, 60KG weight class', 1, true),
    ('1x Janousek 60KG STN140', 'Single scull, 60KG weight class', 1, true),
    ('1x Lightning STN131', 'Single scull', 1, true),
    ('1x Mary Adeline Flyer 155', 'Single scull', 1, true),
    ('1x Ted''s Pride 65KG STN104', 'Single scull, 65KG weight class', 1, true),
    ('1x Wintec 80KG STN174', 'Single scull, 80KG weight class', 1, true),
    ('1xR Wintec Explore 700', 'Single scull - recreational', 1, true),
    ('1xR Wintec Explore 701', 'Single scull - recreational', 1, true),
    ('2x Alan Wickens 90KG Jano STN203', 'Double scull, 90KG weight class', 2, true)
ON CONFLICT DO NOTHING;

-- Confirmation message
SELECT 
    COUNT(*) as total_boats,
    SUM(CASE WHEN capacity = 1 THEN 1 ELSE 0 END) as single_sculls,
    SUM(CASE WHEN capacity = 2 THEN 1 ELSE 0 END) as double_sculls
FROM "Boat";
