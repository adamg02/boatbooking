-- Add isSystemOwner flag to User table
-- System owner accounts:
--   • can access /management screens
--   • are excluded from login metrics in platform stats
--   • are excluded from active-user counts in platform stats

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isSystemOwner" BOOLEAN DEFAULT FALSE NOT NULL;

-- Index so stats queries that filter out system owners stay fast
CREATE INDEX IF NOT EXISTS "User_isSystemOwner_idx" ON "User"("isSystemOwner");
