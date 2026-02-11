-- Add isActive and lastLogin columns to User table

-- Add isActive column (default true for existing users)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT TRUE NOT NULL;

-- Add lastLogin column
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLogin" TIMESTAMPTZ;

-- Update existing users to have lastLogin set to their createdAt date
UPDATE "User" 
SET "lastLogin" = "createdAt" 
WHERE "lastLogin" IS NULL;
