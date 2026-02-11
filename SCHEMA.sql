-- Create tables for boat booking system

-- Users table (managed by NextAuth)
CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    "emailVerified" TIMESTAMPTZ,
    image TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- NextAuth Account table
CREATE TABLE IF NOT EXISTS "Account" (
    "userId" TEXT NOT NULL,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (provider, "providerAccountId"),
    FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- NextAuth Session table
CREATE TABLE IF NOT EXISTS "Session" (
    "sessionToken" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- NextAuth Verification Token table
CREATE TABLE IF NOT EXISTS "VerificationToken" (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (identifier, token)
);

-- Boats table
CREATE TABLE IF NOT EXISTS "Boat" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT NOT NULL,
    description TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN DEFAULT TRUE NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Groups table (for permissions)
CREATE TABLE IF NOT EXISTS "Group" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User-Group junction table
CREATE TABLE IF NOT EXISTS "UserGroup" (
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY ("userId", "groupId"),
    FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
    FOREIGN KEY ("groupId") REFERENCES "Group"(id) ON DELETE CASCADE
);

-- Boat-Group junction table (defines which groups can book which boats)
CREATE TABLE IF NOT EXISTS "BoatGroup" (
    "boatId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY ("boatId", "groupId"),
    FOREIGN KEY ("boatId") REFERENCES "Boat"(id) ON DELETE CASCADE,
    FOREIGN KEY ("groupId") REFERENCES "Group"(id) ON DELETE CASCADE
);

-- Booking status enum
DO $$ BEGIN
    CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Bookings table
CREATE TABLE IF NOT EXISTS "Booking" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    "boatId" TEXT NOT NULL,
    "startTime" TIMESTAMPTZ NOT NULL,
    "endTime" TIMESTAMPTZ NOT NULL,
    status "BookingStatus" DEFAULT 'CONFIRMED' NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
    FOREIGN KEY ("boatId") REFERENCES "Boat"(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "Booking_userId_idx" ON "Booking"("userId");
CREATE INDEX IF NOT EXISTS "Booking_boatId_idx" ON "Booking"("boatId");
CREATE INDEX IF NOT EXISTS "Booking_startTime_idx" ON "Booking"("startTime");
-- Enforce uniqueness only for active (confirmed) bookings
CREATE UNIQUE INDEX IF NOT EXISTS "Booking_boatId_startTime_confirmed_key"
    ON "Booking"("boatId", "startTime")
    WHERE status = 'CONFIRMED';

-- Enable Row Level Security (optional, recommended for production)
-- ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Boat" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;

-- You can add RLS policies here for additional security
