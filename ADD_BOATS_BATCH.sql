-- Add capacity column to Boat table if it doesn't exist
ALTER TABLE "Boat" ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 1 NOT NULL;

-- Add unique constraint on boat name to prevent duplicates
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'boat_name_unique'
    ) THEN
        ALTER TABLE "Boat" ADD CONSTRAINT boat_name_unique UNIQUE (name);
    END IF;
END $$;

-- Batch insert boats from legacy system
-- ON CONFLICT will skip any boats that already exist with the same name
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
    ('1xR Wintec Explore 700', 'Recreational single scull', 1, true),
    ('1xR Wintec Explore 701', 'Recreational single scull', 1, true),
    ('2x Alan Wickens 90KG Jano STN203', 'Double scull, 90KG weight class', 2, true),
    ('2x Alison Bond 60kg Jano STN204', 'Double scull, 60KG weight class', 2, true),
    ('2x Bryan Griffin 80KG Pred STN201', 'Double scull, 80KG weight class, Predator', 2, true),
    ('2x David Firman 80KG Jano STN207', 'Double scull, 80KG weight class', 2, true),
    ('2x Drew Shoolbread 90KG Win STN215', 'Double scull, 90KG weight class, Wintech', 2, true),
    ('2x Elton White STN218', 'Double scull', 2, false),
    ('2x Follow the Sapper 60KG Kanghua STN 221', 'Double scull, 60KG weight class, Kanghua', 2, true),
    ('2x Hudson Tom', 'Double scull', 2, true),
    ('2x John Walton 75kg Jano STN202', 'Double scull, 75KG weight class', 2, true),
    ('2x Pasha Gordon Kanghua STN222', 'Double scull, Kanghua', 2, true),
    ('2x Regatta 1 60kg Win STN212', 'Double scull, 60KG weight class, Wintech', 2, true),
    ('2x Regatta 2 80KG Win STN216', 'Double scull, 80KG weight class, Wintech', 2, true),
    ('2x Roy Dauncey 80KG Win STN214', 'Double scull, 80KG weight class, Wintech', 2, true),
    ('2x Tony Rawlings 60kg Win STN213', 'Double scull, 60KG weight class, Wintech', 2, true),
    ('2x Trisha Corless 60kg Burga STN206', 'Double scull, 60KG weight class, Burgashell', 2, false),
    ('2xR Wintec Explorer STN 703', 'Recreational double scull, Wintec', 2, true),
    ('2xR Wintec Explorer STN707', 'Recreational double scull, Wintec', 2, false),
    ('2xR Wintec Explorer STN709', 'Recreational double scull, Wintec', 2, true),
    ('4- Bill Bainbridge 90KG STN415', 'Quad scull, 90KG weight class', 4, true),
    ('4- Bob the Dog 80KG STN412', 'Quad scull, 80KG weight class', 4, true),
    ('4- Dudley Fletcher 80KG STN 418', 'Quad scull, 80KG weight class', 4, true),
    ('4- Jill Corless 80KG STN419', 'Quad scull, 80KG weight class', 4, true),
    ('4- Len Neville 75KG STN413', 'Quad scull, 75KG weight class', 4, true),
    ('4- Waphie 80KG STN414', 'Quad scull, 80KG weight class', 4, false),
    ('4- Peter Harvey 90KG STN416', 'Quad scull, 90KG weight class', 4, true),
    ('4+ Blaze 80KG STN404', 'Coxed quad, 80KG weight class', 5, false),
    ('4+ Butterfield Janousek STN432', 'Coxed quad, Janousek', 5, true),
    ('4+ Graham Carey 80KG STN402', 'Coxed quad, 80KG weight class', 5, false),
    ('4+ Janousek STN420', 'Coxed quad, Janousek', 5, true),
    ('4+ Martin Corless Janousek 425', 'Coxed quad, Janousek', 5, true),
    ('4+ Mike Patt 75KG STN405', 'Coxed quad, 75KG weight class', 5, false),
    ('4+ Roger Palles 75KG STN403', 'Coxed quad, 75KG weight class', 5, true),
    ('4+ Saila Janousek STN426', 'Coxed quad, Janousek', 5, true),
    ('4+ Smithy 75KG STN406', 'Coxed quad, 75KG weight class', 5, true),
    ('4+ Ted Dyos 75KG STN407', 'Coxed quad, 75KG weight class', 5, false),
    ('4+ Tony Christie 75KG STN409', 'Coxed quad, 75KG weight class', 5, true),
    ('4x Elaine Stewart WinTec STN423', 'Quad scull, Wintech', 4, true),
    ('4x The Swan 75KG STN411', 'Quad scull, 75KG weight class', 4, true),
    ('8+ Alan Hawes 75KG STN804', 'Coxed eight, 75KG weight class', 9, true),
    ('8+ Janousek STN 809', 'Coxed eight, Janousek', 9, true),
    ('8+ Janousek STN810', 'Coxed eight, Janousek', 9, true),
    ('8+ Jeremy 90KG STN 808', 'Coxed eight, 90KG weight class', 9, true),
    ('8+ Nigel John 90KG STN 803', 'Coxed eight, 90KG weight class', 9, true),
    ('8+ The Ashes 90KG STN 807', 'Coxed eight, 90KG weight class', 9, true),
    ('Launch Alan Choules', 'Launch boat for coaching and support', 8, false),
    ('Launch Egham Regatta', 'Launch boat for coaching and support', 8, false),
    ('Launch Jeremy Pollen', 'Launch boat for coaching and support', 8, false)
ON CONFLICT (name) DO NOTHING;

-- Display summary
SELECT 
    COUNT(*) as total_boats,
    SUM(CASE WHEN capacity = 1 THEN 1 ELSE 0 END) as single_sculls,
    SUM(CASE WHEN capacity = 2 THEN 1 ELSE 0 END) as double_sculls,
    SUM(CASE WHEN capacity = 4 THEN 1 ELSE 0 END) as quad_sculls,
    SUM(CASE WHEN capacity = 5 THEN 1 ELSE 0 END) as coxed_quads,
    SUM(CASE WHEN capacity = 9 THEN 1 ELSE 0 END) as coxed_eights,
    SUM(CASE WHEN capacity = 8 THEN 1 ELSE 0 END) as launches,
    SUM(CASE WHEN "isActive" = true THEN 1 ELSE 0 END) as active_boats,
    SUM(CASE WHEN "isActive" = false THEN 1 ELSE 0 END) as inactive_boats
FROM "Boat";

