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
-- Add isActive and lastLogin columns to User table

-- Add isActive column (default true for existing users)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT TRUE NOT NULL;

-- Add lastLogin column
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLogin" TIMESTAMPTZ;

-- Update existing users to have lastLogin set to their createdAt date
UPDATE "User" 
SET "lastLogin" = "createdAt" 
WHERE "lastLogin" IS NULL;
ALTER TABLE "Boat" ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 1 NOT NULL;
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
-- Trigger to automatically create User record when someone signs up with Supabase Auth
-- This syncs auth.users (managed by Supabase) with public.User (used by your app)

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."User" (id, email, name, image, "emailVerified", "createdAt", "updatedAt")
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email_confirmed_at,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public."User".name),
    image = COALESCE(EXCLUDED.image, public."User".image),
    "emailVerified" = EXCLUDED."emailVerified",
    "updatedAt" = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger that fires when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also sync existing auth.users (if any)
INSERT INTO public."User" (id, email, name, image, "emailVerified", "createdAt", "updatedAt")
SELECT 
  id::text,
  email,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)) as name,
  raw_user_meta_data->>'avatar_url' as image,
  email_confirmed_at,
  created_at,
  updated_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;
-- Add provider column to User table
ALTER TABLE public."User" ADD COLUMN IF NOT EXISTS provider TEXT;

-- Update the trigger function to include provider
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."User" (id, email, name, image, provider, "emailVerified", "createdAt", "updatedAt")
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_app_meta_data->>'provider',
    NEW.email_confirmed_at,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public."User".name),
    image = COALESCE(EXCLUDED.image, public."User".image),
    provider = COALESCE(EXCLUDED.provider, public."User".provider),
    "emailVerified" = EXCLUDED."emailVerified",
    "updatedAt" = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing users with provider info from auth.users
UPDATE public."User" u
SET provider = au.raw_app_meta_data->>'provider'
FROM auth.users au
WHERE u.id = au.id::text
AND u.provider IS NULL;

-- For users where provider is still null, try to get it from the first identity
UPDATE public."User" u
SET provider = (
  SELECT i.provider
  FROM auth.identities i
  WHERE i.user_id = u.id::uuid
  ORDER BY i.created_at ASC
  LIMIT 1
)
WHERE u.provider IS NULL;
-- Allow rebooking of cancelled slots by removing the strict unique constraint
-- and replacing it with a partial unique index for confirmed bookings only.

-- Drop old unique constraint if it exists
ALTER TABLE "Booking"
  DROP CONSTRAINT IF EXISTS "Booking_boatId_startTime_key";

-- Create partial unique index for confirmed bookings
CREATE UNIQUE INDEX IF NOT EXISTS "Booking_boatId_startTime_confirmed_key"
  ON "Booking"("boatId", "startTime")
  WHERE status = 'CONFIRMED';
-- Subscription & Payments migration
-- Run this against your Supabase database after MULTI_TENANT_MIGRATION.sql

-- Add subscription columns to the Club table
ALTER TABLE "Club"
    ADD COLUMN IF NOT EXISTS "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
    ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT,          -- 'active', 'canceled', 'past_due', 'trialing'
    ADD COLUMN IF NOT EXISTS "billingInterval" TEXT,              -- 'month' | 'year'
    ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS "subscriptionCurrentPeriodEnd" TIMESTAMPTZ;

-- Payments table – records every invoice / charge event from Stripe
CREATE TABLE IF NOT EXISTS "Payment" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "clubId" TEXT NOT NULL REFERENCES "Club"(id) ON DELETE CASCADE,
    "stripeInvoiceId" TEXT UNIQUE,
    "stripePaymentIntentId" TEXT,
    amount INTEGER NOT NULL,            -- amount in pence (e.g. 1299 = £12.99)
    currency TEXT NOT NULL DEFAULT 'gbp',
    status TEXT NOT NULL,              -- 'succeeded' | 'failed' | 'pending'
    description TEXT,
    "billingInterval" TEXT,            -- 'month' | 'year' (snapshot at time of payment)
    "periodStart" TIMESTAMPTZ,
    "periodEnd" TIMESTAMPTZ,
    "receiptUrl" TEXT,                 -- Stripe-hosted receipt URL
    "hostedInvoiceUrl" TEXT,          -- Stripe-hosted invoice PDF URL
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS "Payment_clubId_idx" ON "Payment"("clubId");
CREATE INDEX IF NOT EXISTS "Payment_createdAt_idx" ON "Payment"("createdAt" DESC);
-- Login tracking migration
-- Run this against your Supabase database to enable login event tracking

-- Table to record each successful user login
CREATE TABLE IF NOT EXISTS "LoginEvent" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS "LoginEvent_userId_idx" ON "LoginEvent"("userId");
CREATE INDEX IF NOT EXISTS "LoginEvent_createdAt_idx" ON "LoginEvent"("createdAt");

-- ── Row Level Security ─────────────────────────────────────────────────────────
-- Only the service-role client should read/write this table.
ALTER TABLE "LoginEvent" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "LoginEvent_deny_all"
  ON "LoginEvent"
  AS RESTRICTIVE
  FOR ALL
  TO authenticated, anon
  USING (false);
-- Management screens migration
-- Run this against your Supabase database to enable platform owner management features

-- Table to store IP addresses allowed to access management screens
CREATE TABLE IF NOT EXISTS "ManagementIpAllowlist" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    ip TEXT NOT NULL UNIQUE,
    label TEXT,                          -- optional human-readable description
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS "ManagementIpAllowlist_ip_idx" ON "ManagementIpAllowlist"(ip);

-- ── Row Level Security ─────────────────────────────────────────────────────────
-- Enable RLS. No policies are granted for the `anon` or `authenticated` roles,
-- so all direct client access is denied by default.
-- The server-side service-role client bypasses RLS and is the only path that
-- should ever read or write this table.
ALTER TABLE "ManagementIpAllowlist" ENABLE ROW LEVEL SECURITY;

-- Explicit deny-all policy for authenticated users (belt-and-braces — RLS with
-- no permissive policies already denies, but this makes the intent unambiguous).
CREATE POLICY "ManagementIpAllowlist_deny_all"
  ON "ManagementIpAllowlist"
  AS RESTRICTIVE
  FOR ALL
  TO authenticated, anon
  USING (false);
-- Add isSystemOwner flag to User table
-- System owner accounts:
--   • can access /management screens
--   • are excluded from login metrics in platform stats
--   • are excluded from active-user counts in platform stats

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isSystemOwner" BOOLEAN DEFAULT FALSE NOT NULL;

-- Index so stats queries that filter out system owners stay fast
CREATE INDEX IF NOT EXISTS "User_isSystemOwner_idx" ON "User"("isSystemOwner");
-- =============================================================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- =============================================================================
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor).
--
-- OVERVIEW
-- --------
-- This app uses Supabase Auth (anon key + session cookie). Because the server
-- routes pass the user's JWT, auth.uid() is available inside policies and will
-- equal the User.id value for the logged-in user.
--
-- The trigger in TRIGGER_USER_SYNC.sql is SECURITY DEFINER so it bypasses RLS
-- when creating the initial User row – no change needed there.
--
-- ADMIN DETECTION
-- ---------------
-- "Admin" is determined by membership of a Group named exactly "Admin" inside
-- the user's own club (matching the isAdmin() function in src/lib/admin.ts).
-- =============================================================================


-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Returns the clubId for the currently authenticated user.
CREATE OR REPLACE FUNCTION public.get_my_club_id()
RETURNS TEXT LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT "clubId" FROM public."User" WHERE id = (SELECT auth.uid()::TEXT) LIMIT 1;
$$;

-- Returns TRUE if the current user is an admin of the given club.
CREATE OR REPLACE FUNCTION public.is_club_admin(p_club_id TEXT)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public."UserGroup" ug
    JOIN public."Group"  g  ON g.id = ug."groupId"
    WHERE ug."userId" = (SELECT auth.uid()::TEXT)
      AND g.name      = 'Admin'
      AND g."clubId"  = p_club_id
  );
$$;


-- =============================================================================
-- CLUB TABLE
-- =============================================================================
ALTER TABLE public."Club" ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read clubs (required for the join-with-code flow).
CREATE POLICY "clubs_select"
  ON public."Club" FOR SELECT
  TO authenticated
  USING (TRUE);

-- Any authenticated user can create a club (onboarding – a user with no club creates one).
CREATE POLICY "clubs_insert"
  ON public."Club" FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- Only admins of a club can update it.
CREATE POLICY "clubs_update"
  ON public."Club" FOR UPDATE
  TO authenticated
  USING  (public.is_club_admin(id))
  WITH CHECK (public.is_club_admin(id));

-- Deleting a club is blocked at the policy level; do it via service role only.
-- (No DELETE policy → the operation is denied for all authenticated / anon requests.)


-- =============================================================================
-- USER TABLE
-- =============================================================================
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- Users can always see their own record.
-- Users can also see other members of their club (needed for booking calendar display).
CREATE POLICY "users_select"
  ON public."User" FOR SELECT
  TO authenticated
  USING (
    id = (SELECT auth.uid()::TEXT)
    OR "clubId" = public.get_my_club_id()
  );

-- INSERT is handled exclusively by the SECURITY DEFINER trigger (handle_new_user).
-- No INSERT policy → direct inserts via anon/authenticated role are blocked.

-- Users may update only their own record (e.g., display name / avatar).
CREATE POLICY "users_update_own"
  ON public."User" FOR UPDATE
  TO authenticated
  USING      (id = (SELECT auth.uid()::TEXT))
  WITH CHECK (id = (SELECT auth.uid()::TEXT));

-- Admins of the user's club can also update other users (e.g., status field).
CREATE POLICY "users_update_admin"
  ON public."User" FOR UPDATE
  TO authenticated
  USING      (public.is_club_admin("clubId"))
  WITH CHECK (public.is_club_admin("clubId"));

-- Users can delete only their own account.
CREATE POLICY "users_delete_own"
  ON public."User" FOR DELETE
  TO authenticated
  USING (id = (SELECT auth.uid()::TEXT));


-- =============================================================================
-- ACCOUNT / SESSION / VERIFICATIONTOKEN (legacy NextAuth artefacts)
-- These tables are not actively used by Supabase Auth but are locked down
-- as a precaution in case they still exist.  Wrapped in existence checks so
-- this script does not error when the tables were never created.
-- =============================================================================
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Account'
  ) THEN
    EXECUTE 'ALTER TABLE public."Account" ENABLE ROW LEVEL SECURITY';
    EXECUTE $pol$
      CREATE POLICY "accounts_owner_only"
        ON public."Account" FOR ALL
        TO authenticated
        USING      ("userId" = (SELECT auth.uid()::TEXT))
        WITH CHECK ("userId" = (SELECT auth.uid()::TEXT))
    $pol$;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Session'
  ) THEN
    EXECUTE 'ALTER TABLE public."Session" ENABLE ROW LEVEL SECURITY';
    EXECUTE $pol$
      CREATE POLICY "sessions_owner_only"
        ON public."Session" FOR ALL
        TO authenticated
        USING      ("userId" = (SELECT auth.uid()::TEXT))
        WITH CHECK ("userId" = (SELECT auth.uid()::TEXT))
    $pol$;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'VerificationToken'
  ) THEN
    EXECUTE 'ALTER TABLE public."VerificationToken" ENABLE ROW LEVEL SECURITY';
    -- No policy → all access denied for non-service-role.
  END IF;
END $$;


-- =============================================================================
-- BOAT TABLE
-- =============================================================================
ALTER TABLE public."Boat" ENABLE ROW LEVEL SECURITY;

-- Members can see active boats that belong to their club.
CREATE POLICY "boats_select"
  ON public."Boat" FOR SELECT
  TO authenticated
  USING (
    "isActive" = TRUE
    AND "clubId" = public.get_my_club_id()
  );

-- Admins can also see inactive boats (for management UI).
CREATE POLICY "boats_select_admin"
  ON public."Boat" FOR SELECT
  TO authenticated
  USING (public.is_club_admin("clubId"));

-- Only admins can create boats.
CREATE POLICY "boats_insert"
  ON public."Boat" FOR INSERT
  TO authenticated
  WITH CHECK (public.is_club_admin("clubId"));

-- Only admins can update boats.
CREATE POLICY "boats_update"
  ON public."Boat" FOR UPDATE
  TO authenticated
  USING      (public.is_club_admin("clubId"))
  WITH CHECK (public.is_club_admin("clubId"));

-- Only admins can delete boats.
CREATE POLICY "boats_delete"
  ON public."Boat" FOR DELETE
  TO authenticated
  USING (public.is_club_admin("clubId"));


-- =============================================================================
-- GROUP TABLE
-- =============================================================================
ALTER TABLE public."Group" ENABLE ROW LEVEL SECURITY;

-- Members can see groups in their own club.
CREATE POLICY "groups_select"
  ON public."Group" FOR SELECT
  TO authenticated
  USING ("clubId" = public.get_my_club_id());

-- Only admins can create / modify / delete groups.
CREATE POLICY "groups_insert"
  ON public."Group" FOR INSERT
  TO authenticated
  WITH CHECK (public.is_club_admin("clubId"));

CREATE POLICY "groups_update"
  ON public."Group" FOR UPDATE
  TO authenticated
  USING      (public.is_club_admin("clubId"))
  WITH CHECK (public.is_club_admin("clubId"));

CREATE POLICY "groups_delete"
  ON public."Group" FOR DELETE
  TO authenticated
  USING (public.is_club_admin("clubId"));


-- =============================================================================
-- USERGROUP TABLE  (user ↔ group memberships)
-- =============================================================================
ALTER TABLE public."UserGroup" ENABLE ROW LEVEL SECURITY;

-- Users can see their own memberships.
-- Admins can see all memberships for groups within their club.
CREATE POLICY "usergroups_select"
  ON public."UserGroup" FOR SELECT
  TO authenticated
  USING (
    "userId" = (SELECT auth.uid()::TEXT)
    OR EXISTS (
      SELECT 1 FROM public."Group" g
      WHERE g.id = "groupId"
        AND public.is_club_admin(g."clubId")
    )
  );

-- Only admins can assign / remove users from groups.
CREATE POLICY "usergroups_insert"
  ON public."UserGroup" FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."Group" g
      WHERE g.id = "groupId"
        AND public.is_club_admin(g."clubId")
    )
  );

CREATE POLICY "usergroups_delete"
  ON public."UserGroup" FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Group" g
      WHERE g.id = "groupId"
        AND public.is_club_admin(g."clubId")
    )
  );


-- =============================================================================
-- BOATGROUP TABLE  (boat ↔ group access permissions)
-- =============================================================================
ALTER TABLE public."BoatGroup" ENABLE ROW LEVEL SECURITY;

-- Members can see which groups are allowed to book boats in their club
-- (needed to evaluate their own booking permissions).
CREATE POLICY "boatgroups_select"
  ON public."BoatGroup" FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Boat" b
      WHERE b.id = "boatId"
        AND b."clubId" = public.get_my_club_id()
    )
  );

-- Only admins can configure boat–group permissions.
CREATE POLICY "boatgroups_insert"
  ON public."BoatGroup" FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."Boat" b
      WHERE b.id = "boatId"
        AND public.is_club_admin(b."clubId")
    )
  );

CREATE POLICY "boatgroups_delete"
  ON public."BoatGroup" FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Boat" b
      WHERE b.id = "boatId"
        AND public.is_club_admin(b."clubId")
    )
  );


-- =============================================================================
-- BOOKING TABLE
-- =============================================================================
ALTER TABLE public."Booking" ENABLE ROW LEVEL SECURITY;

-- All club members can see bookings for boats in their club
-- (required for the booking calendar to show availability).
CREATE POLICY "bookings_select"
  ON public."Booking" FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Boat" b
      WHERE b.id = "boatId"
        AND b."clubId" = public.get_my_club_id()
    )
  );

-- Authenticated users can create bookings.
-- The application layer enforces group-based permission checks before calling
-- the API; RLS provides a secondary backstop: the booking's userId must match
-- the caller so a user cannot forge bookings on behalf of someone else.
CREATE POLICY "bookings_insert"
  ON public."Booking" FOR INSERT
  TO authenticated
  WITH CHECK ("userId" = (SELECT auth.uid()::TEXT));

-- Users can cancel (update status) only their own bookings.
-- Admins can cancel any booking within their club.
CREATE POLICY "bookings_update_own"
  ON public."Booking" FOR UPDATE
  TO authenticated
  USING      ("userId" = (SELECT auth.uid()::TEXT))
  WITH CHECK ("userId" = (SELECT auth.uid()::TEXT));

CREATE POLICY "bookings_update_admin"
  ON public."Booking" FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Boat" b
      WHERE b.id = "boatId"
        AND public.is_club_admin(b."clubId")
    )
  );

-- Users can delete only their own bookings.
-- Admins can delete any booking within their club.
CREATE POLICY "bookings_delete_own"
  ON public."Booking" FOR DELETE
  TO authenticated
  USING ("userId" = (SELECT auth.uid()::TEXT));

CREATE POLICY "bookings_delete_admin"
  ON public."Booking" FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Boat" b
      WHERE b.id = "boatId"
        AND public.is_club_admin(b."clubId")
    )
  );


-- =============================================================================
-- PAYMENT TABLE
-- =============================================================================
-- The Payment table records Stripe invoice/charge events for each club.
--
-- Write path:  Stripe webhook → getSupabaseAdminClient() (service-role key).
--              The service-role key bypasses RLS entirely, so no INSERT/UPDATE/
--              DELETE policies are needed for that path.
--
-- Read path:   GET /api/admin/subscription/payments → getSupabaseClient()
--              (anon key + user JWT).  requireAdmin() validates the caller
--              server-side; RLS provides a second layer by restricting SELECT
--              to admins of the matching club only.
--
-- Regular members have no access to payment records at all.
-- =============================================================================
ALTER TABLE public."Payment" ENABLE ROW LEVEL SECURITY;

-- Only club admins may read payment records for their own club.
CREATE POLICY "payments_select_admin"
  ON public."Payment" FOR SELECT
  TO authenticated
  USING (public.is_club_admin("clubId"));

-- INSERT / UPDATE / DELETE are intentionally left without a policy.
-- All writes come via the Stripe webhook which uses the service-role key and
-- is therefore not subject to RLS.  Blocking these operations for the
-- authenticated / anon roles is an extra safeguard against accidental or
-- malicious direct writes.


-- =============================================================================
-- VERIFICATION: quick check queries to run after applying this script
-- =============================================================================
-- SELECT tablename, rowsecurity FROM pg_tables
--   WHERE schemaname = 'public'
--   ORDER BY tablename;
--
-- SELECT schemaname, tablename, policyname, roles, cmd, qual
--   FROM pg_policies
--   WHERE schemaname = 'public'
--   ORDER BY tablename, policyname;
-- =============================================================================
-- FIX: Auth RLS Initialization Plan Warning
-- =============================================================================
-- Supabase warns that RLS policies calling auth.uid() directly re-evaluate
-- the function once per row. Wrapping it in (SELECT auth.uid()) causes the
-- planner to evaluate it once per statement (an "init plan"), yielding much
-- better performance at scale.
--
-- Run this script in the Supabase SQL Editor to apply the fix.
-- It mirrors the helper-function updates already in RLS_SETUP.sql.
-- =============================================================================


-- =============================================================================
-- HELPER FUNCTIONS (also updated for consistency)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_my_club_id()
RETURNS TEXT LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT "clubId" FROM public."User" WHERE id = (SELECT auth.uid()::TEXT) LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_club_admin(p_club_id TEXT)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public."UserGroup" ug
    JOIN public."Group"  g  ON g.id = ug."groupId"
    WHERE ug."userId" = (SELECT auth.uid()::TEXT)
      AND g.name      = 'Admin'
      AND g."clubId"  = p_club_id
  );
$$;


-- =============================================================================
-- USER TABLE
-- =============================================================================
DROP POLICY IF EXISTS "users_select"     ON public."User";
DROP POLICY IF EXISTS "users_update_own" ON public."User";
DROP POLICY IF EXISTS "users_delete_own" ON public."User";

CREATE POLICY "users_select"
  ON public."User" FOR SELECT
  TO authenticated
  USING (
    id = (SELECT auth.uid()::TEXT)
    OR "clubId" = public.get_my_club_id()
  );

CREATE POLICY "users_update_own"
  ON public."User" FOR UPDATE
  TO authenticated
  USING      (id = (SELECT auth.uid()::TEXT))
  WITH CHECK (id = (SELECT auth.uid()::TEXT));

CREATE POLICY "users_delete_own"
  ON public."User" FOR DELETE
  TO authenticated
  USING (id = (SELECT auth.uid()::TEXT));


-- =============================================================================
-- ACCOUNT TABLE (legacy NextAuth artefact – skipped if table does not exist)
-- =============================================================================
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Account'
  ) THEN
    DROP POLICY IF EXISTS "accounts_owner_only" ON public."Account";
    EXECUTE $pol$
      CREATE POLICY "accounts_owner_only"
        ON public."Account" FOR ALL
        TO authenticated
        USING      ("userId" = (SELECT auth.uid()::TEXT))
        WITH CHECK ("userId" = (SELECT auth.uid()::TEXT))
    $pol$;
  END IF;
END $$;


-- =============================================================================
-- SESSION TABLE (legacy NextAuth artefact – skipped if table does not exist)
-- =============================================================================
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Session'
  ) THEN
    DROP POLICY IF EXISTS "sessions_owner_only" ON public."Session";
    EXECUTE $pol$
      CREATE POLICY "sessions_owner_only"
        ON public."Session" FOR ALL
        TO authenticated
        USING      ("userId" = (SELECT auth.uid()::TEXT))
        WITH CHECK ("userId" = (SELECT auth.uid()::TEXT))
    $pol$;
  END IF;
END $$;


-- =============================================================================
-- USERGROUP TABLE
-- =============================================================================
DROP POLICY IF EXISTS "usergroups_select" ON public."UserGroup";

CREATE POLICY "usergroups_select"
  ON public."UserGroup" FOR SELECT
  TO authenticated
  USING (
    "userId" = (SELECT auth.uid()::TEXT)
    OR EXISTS (
      SELECT 1 FROM public."Group" g
      WHERE g.id = "groupId"
        AND public.is_club_admin(g."clubId")
    )
  );


-- =============================================================================
-- BOOKING TABLE
-- =============================================================================
DROP POLICY IF EXISTS "bookings_insert"     ON public."Booking";
DROP POLICY IF EXISTS "bookings_update_own" ON public."Booking";
DROP POLICY IF EXISTS "bookings_delete_own" ON public."Booking";

CREATE POLICY "bookings_insert"
  ON public."Booking" FOR INSERT
  TO authenticated
  WITH CHECK ("userId" = (SELECT auth.uid()::TEXT));

CREATE POLICY "bookings_update_own"
  ON public."Booking" FOR UPDATE
  TO authenticated
  USING      ("userId" = (SELECT auth.uid()::TEXT))
  WITH CHECK ("userId" = (SELECT auth.uid()::TEXT));

CREATE POLICY "bookings_delete_own"
  ON public."Booking" FOR DELETE
  TO authenticated
  USING ("userId" = (SELECT auth.uid()::TEXT));
