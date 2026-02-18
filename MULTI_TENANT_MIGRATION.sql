-- Multi-tenant migration: Add Club support
-- Run this against your Supabase database

-- Create the Club table
CREATE TABLE IF NOT EXISTS "Club" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT NOT NULL,
    description TEXT,
    "joinCode" TEXT UNIQUE NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add clubId to User table (nullable - NULL means pending onboarding)
ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS "clubId" TEXT REFERENCES "Club"(id) ON DELETE SET NULL;

-- Add clubId to Boat table
ALTER TABLE "Boat"
    ADD COLUMN IF NOT EXISTS "clubId" TEXT REFERENCES "Club"(id) ON DELETE CASCADE;

-- Add clubId to Group table
ALTER TABLE "Group"
    ADD COLUMN IF NOT EXISTS "clubId" TEXT REFERENCES "Club"(id) ON DELETE CASCADE;

-- Index for fast club lookups
CREATE INDEX IF NOT EXISTS "User_clubId_idx" ON "User"("clubId");
CREATE INDEX IF NOT EXISTS "Boat_clubId_idx" ON "Boat"("clubId");
CREATE INDEX IF NOT EXISTS "Group_clubId_idx" ON "Group"("clubId");

-- If you have existing data, assign it all to a default club:
-- Step 1: Create a default club
-- INSERT INTO "Club" (id, name, "joinCode")
-- VALUES (gen_random_uuid()::TEXT, 'Default Club', upper(substring(gen_random_uuid()::TEXT, 1, 8)))
-- RETURNING id;

-- Step 2: Assign all existing users, boats and groups to the default club
-- UPDATE "User" SET "clubId" = '<id from step 1>' WHERE "clubId" IS NULL;
-- UPDATE "Boat" SET "clubId" = '<id from step 1>' WHERE "clubId" IS NULL;
-- UPDATE "Group" SET "clubId" = '<id from step 1>' WHERE "clubId" IS NULL;

-- Step 3: Once data is migrated, make clubId NOT NULL on Boat and Group (optional)
-- ALTER TABLE "Boat" ALTER COLUMN "clubId" SET NOT NULL;
-- ALTER TABLE "Group" ALTER COLUMN "clubId" SET NOT NULL;

-- Remove the UNIQUE constraint from Group.name since names are now scoped per club
ALTER TABLE "Group" DROP CONSTRAINT IF EXISTS "Group_name_key";

-- Add a per-club uniqueness constraint for Group names
CREATE UNIQUE INDEX IF NOT EXISTS "Group_clubId_name_key" ON "Group"("clubId", name)
    WHERE "clubId" IS NOT NULL;
