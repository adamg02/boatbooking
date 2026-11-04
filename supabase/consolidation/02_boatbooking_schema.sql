-- =============================================================================
-- 02  BOATBOOKING SCHEMA  (run on the consolidated project, after 01)
-- =============================================================================
-- Moves every boatbooking table from `public` into the `boatbooking` schema
-- (data, indexes, constraints and FKs move with the table), then rebuilds the
-- table-level privileges and row-level security from scratch.
--
-- Security model
-- --------------
--  * anon           : no access to the schema at all.
--  * authenticated  : only the table/column privileges the app actually uses,
--                     AND every policy requires boatbooking membership
--                     (an active row in boatbooking."User"). A user who only
--                     uses TT has no such row and therefore sees nothing.
--  * service_role   : full access (Stripe webhook, auth callback, management).
--
-- Idempotent: safe to re-run.
-- =============================================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS boatbooking;

-- -----------------------------------------------------------------------------
-- 1. Move objects from public -> boatbooking
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'Club', 'User', 'Boat', 'Group', 'UserGroup', 'BoatGroup', 'Booking',
    'Payment', 'LoginEvent', 'ManagementIpAllowlist',
    -- legacy NextAuth artefacts (moved if present so nothing is left in public)
    'Account', 'Session', 'VerificationToken'
  ] LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I SET SCHEMA boatbooking', t);
    END IF;
  END LOOP;

  IF to_regtype('public."BookingStatus"') IS NOT NULL THEN
    ALTER TYPE public."BookingStatus" SET SCHEMA boatbooking;
  END IF;

  -- Fail loudly if the core tables are not where we expect them.
  FOREACH t IN ARRAY ARRAY[
    'Club', 'User', 'Boat', 'Group', 'UserGroup', 'BoatGroup', 'Booking',
    'Payment', 'LoginEvent', 'ManagementIpAllowlist'
  ] LOOP
    IF to_regclass(format('boatbooking.%I', t)) IS NULL THEN
      RAISE EXCEPTION 'boatbooking.% is missing - has the legacy schema been fully migrated?', t;
    END IF;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Drop all existing policies and the old public helper functions.
--    (They are recreated below with membership checks.)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'boatbooking' LOOP
    EXECUTE format('DROP POLICY %I ON boatbooking.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS public.get_my_club_id();
DROP FUNCTION IF EXISTS public.is_club_admin(text);

-- -----------------------------------------------------------------------------
-- 3. Helper functions (SECURITY DEFINER so they can be used inside policies
--    without recursive RLS evaluation; search_path pinned for safety).
-- -----------------------------------------------------------------------------

-- TRUE when the caller is an active boatbooking user.
CREATE OR REPLACE FUNCTION boatbooking.is_member()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM boatbooking."User" u
    WHERE u.id = (SELECT auth.uid())::text
      AND u."isActive"
  );
$$;

-- Club of the caller (NULL for non-members, inactive users and users pending onboarding).
CREATE OR REPLACE FUNCTION boatbooking.my_club_id()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT u."clubId" FROM boatbooking."User" u
  WHERE u.id = (SELECT auth.uid())::text
    AND u."isActive"
  LIMIT 1;
$$;

-- TRUE when the caller is an active member of p_club_id AND in its "Admin" group.
CREATE OR REPLACE FUNCTION boatbooking.is_club_admin(p_club_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM boatbooking."User"      u
    JOIN boatbooking."UserGroup" ug ON ug."userId" = u.id
    JOIN boatbooking."Group"     g  ON g.id = ug."groupId"
    WHERE u.id       = (SELECT auth.uid())::text
      AND u."isActive"
      AND u."clubId" = p_club_id
      AND g."clubId" = p_club_id
      AND g.name     = 'Admin'
  );
$$;

-- Club that owns a boat (bypasses Boat RLS so policies on other tables stay simple).
CREATE OR REPLACE FUNCTION boatbooking.boat_club_id(p_boat_id text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT b."clubId" FROM boatbooking."Boat" b WHERE b.id = p_boat_id;
$$;

-- Club that owns a group.
CREATE OR REPLACE FUNCTION boatbooking.group_club_id(p_group_id text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT g."clubId" FROM boatbooking."Group" g WHERE g.id = p_group_id;
$$;

REVOKE ALL ON FUNCTION
  boatbooking.is_member(), boatbooking.my_club_id(), boatbooking.is_club_admin(text),
  boatbooking.boat_club_id(text), boatbooking.group_club_id(text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION
  boatbooking.is_member(), boatbooking.my_club_id(), boatbooking.is_club_admin(text),
  boatbooking.boat_club_id(text), boatbooking.group_club_id(text)
TO authenticated, service_role;

-- Only club admins (or the service role) may change a user's active flag.
-- Column grants (below) already stop authenticated users touching clubId,
-- isSystemOwner, email, etc.; this closes "re-activate myself".
CREATE OR REPLACE FUNCTION boatbooking.guard_user_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF current_user = 'authenticated'
     AND NEW."isActive" IS DISTINCT FROM OLD."isActive"
     AND NOT boatbooking.is_club_admin(OLD."clubId") THEN
    RAISE EXCEPTION 'Only club admins can change isActive' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION boatbooking.guard_user_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_user_update ON boatbooking."User";
CREATE TRIGGER guard_user_update
  BEFORE UPDATE ON boatbooking."User"
  FOR EACH ROW EXECUTE FUNCTION boatbooking.guard_user_update();

-- -----------------------------------------------------------------------------
-- 4. TABLE-LEVEL SECURITY (privileges)
--    Start from nothing, then grant exactly what the app uses.
-- -----------------------------------------------------------------------------
REVOKE ALL ON SCHEMA boatbooking FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA boatbooking TO authenticated, service_role;

REVOKE ALL ON ALL TABLES    IN SCHEMA boatbooking FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA boatbooking FROM PUBLIC, anon, authenticated;
GRANT ALL ON ALL TABLES    IN SCHEMA boatbooking TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA boatbooking TO service_role;

-- Future objects: service_role only unless explicitly granted.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA boatbooking REVOKE ALL ON TABLES    FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA boatbooking REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA boatbooking REVOKE ALL ON FUNCTIONS FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA boatbooking GRANT ALL ON TABLES    TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA boatbooking GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA boatbooking GRANT EXECUTE ON FUNCTIONS TO service_role;

-- Club: members read their club; admins edit name/description/join code.
-- (Club creation, join-by-code and Stripe fields are written with the service role.)
GRANT SELECT ON boatbooking."Club" TO authenticated;
GRANT UPDATE (name, description, "joinCode", "updatedAt") ON boatbooking."Club" TO authenticated;

-- User: rows are created by the service role (auth callback). Users can edit
-- their profile fields and lastLogin; admins can toggle isActive (trigger-guarded).
GRANT SELECT, DELETE ON boatbooking."User" TO authenticated;
GRANT UPDATE (name, image, "lastLogin", "isActive", "updatedAt") ON boatbooking."User" TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON boatbooking."Boat"      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON boatbooking."Group"     TO authenticated;
GRANT SELECT, INSERT, DELETE         ON boatbooking."UserGroup" TO authenticated;
GRANT SELECT, INSERT, DELETE         ON boatbooking."BoatGroup" TO authenticated;

GRANT SELECT, INSERT, DELETE ON boatbooking."Booking" TO authenticated;
GRANT UPDATE (status, "updatedAt") ON boatbooking."Booking" TO authenticated;

GRANT SELECT ON boatbooking."Payment" TO authenticated;

-- LoginEvent, ManagementIpAllowlist, Account, Session, VerificationToken:
-- no grants -> service role only.

-- -----------------------------------------------------------------------------
-- 5. ROW-LEVEL SECURITY
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'boatbooking' LOOP
    EXECUTE format('ALTER TABLE boatbooking.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- ---- Club -------------------------------------------------------------------
CREATE POLICY club_select_member ON boatbooking."Club"
  FOR SELECT TO authenticated
  USING (id = (SELECT boatbooking.my_club_id()));

CREATE POLICY club_update_admin ON boatbooking."Club"
  FOR UPDATE TO authenticated
  USING      (boatbooking.is_club_admin(id))
  WITH CHECK (boatbooking.is_club_admin(id));

-- ---- User -------------------------------------------------------------------
-- Own row is always visible (middleware needs it to detect deactivated users);
-- other users only within the caller's club.
CREATE POLICY user_select ON boatbooking."User"
  FOR SELECT TO authenticated
  USING (
    id = (SELECT auth.uid())::text
    OR "clubId" = (SELECT boatbooking.my_club_id())
  );

CREATE POLICY user_update_own ON boatbooking."User"
  FOR UPDATE TO authenticated
  USING      (id = (SELECT auth.uid())::text)
  WITH CHECK (id = (SELECT auth.uid())::text);

CREATE POLICY user_update_admin ON boatbooking."User"
  FOR UPDATE TO authenticated
  USING      (boatbooking.is_club_admin("clubId"))
  WITH CHECK (boatbooking.is_club_admin("clubId"));

-- Leaving boatbooking removes only the boatbooking profile, never the shared auth user.
CREATE POLICY user_delete_own ON boatbooking."User"
  FOR DELETE TO authenticated
  USING (id = (SELECT auth.uid())::text);

-- ---- Boat -------------------------------------------------------------------
CREATE POLICY boat_select_member ON boatbooking."Boat"
  FOR SELECT TO authenticated
  USING ("isActive" AND "clubId" = (SELECT boatbooking.my_club_id()));

CREATE POLICY boat_select_admin ON boatbooking."Boat"
  FOR SELECT TO authenticated
  USING (boatbooking.is_club_admin("clubId"));

CREATE POLICY boat_insert_admin ON boatbooking."Boat"
  FOR INSERT TO authenticated
  WITH CHECK (boatbooking.is_club_admin("clubId"));

CREATE POLICY boat_update_admin ON boatbooking."Boat"
  FOR UPDATE TO authenticated
  USING      (boatbooking.is_club_admin("clubId"))
  WITH CHECK (boatbooking.is_club_admin("clubId"));

CREATE POLICY boat_delete_admin ON boatbooking."Boat"
  FOR DELETE TO authenticated
  USING (boatbooking.is_club_admin("clubId"));

-- ---- Group ------------------------------------------------------------------
CREATE POLICY group_select_member ON boatbooking."Group"
  FOR SELECT TO authenticated
  USING ("clubId" = (SELECT boatbooking.my_club_id()));

CREATE POLICY group_insert_admin ON boatbooking."Group"
  FOR INSERT TO authenticated
  WITH CHECK (boatbooking.is_club_admin("clubId"));

CREATE POLICY group_update_admin ON boatbooking."Group"
  FOR UPDATE TO authenticated
  USING      (boatbooking.is_club_admin("clubId"))
  WITH CHECK (boatbooking.is_club_admin("clubId"));

CREATE POLICY group_delete_admin ON boatbooking."Group"
  FOR DELETE TO authenticated
  USING (boatbooking.is_club_admin("clubId"));

-- ---- UserGroup --------------------------------------------------------------
CREATE POLICY usergroup_select ON boatbooking."UserGroup"
  FOR SELECT TO authenticated
  USING (
    ("userId" = (SELECT auth.uid())::text AND (SELECT boatbooking.is_member()))
    OR boatbooking.is_club_admin(boatbooking.group_club_id("groupId"))
  );

CREATE POLICY usergroup_insert_admin ON boatbooking."UserGroup"
  FOR INSERT TO authenticated
  WITH CHECK (boatbooking.is_club_admin(boatbooking.group_club_id("groupId")));

CREATE POLICY usergroup_delete_admin ON boatbooking."UserGroup"
  FOR DELETE TO authenticated
  USING (boatbooking.is_club_admin(boatbooking.group_club_id("groupId")));

-- ---- BoatGroup --------------------------------------------------------------
CREATE POLICY boatgroup_select_member ON boatbooking."BoatGroup"
  FOR SELECT TO authenticated
  USING (boatbooking.boat_club_id("boatId") = (SELECT boatbooking.my_club_id()));

CREATE POLICY boatgroup_insert_admin ON boatbooking."BoatGroup"
  FOR INSERT TO authenticated
  WITH CHECK (
    boatbooking.is_club_admin(boatbooking.boat_club_id("boatId"))
    AND boatbooking.group_club_id("groupId") = boatbooking.boat_club_id("boatId")
  );

CREATE POLICY boatgroup_delete_admin ON boatbooking."BoatGroup"
  FOR DELETE TO authenticated
  USING (boatbooking.is_club_admin(boatbooking.boat_club_id("boatId")));

-- ---- Booking ----------------------------------------------------------------
CREATE POLICY booking_select_member ON boatbooking."Booking"
  FOR SELECT TO authenticated
  USING (boatbooking.boat_club_id("boatId") = (SELECT boatbooking.my_club_id()));

-- Members book for themselves, and only boats in their own club.
-- (Group-based boat permissions are still enforced by the API route.)
CREATE POLICY booking_insert_own ON boatbooking."Booking"
  FOR INSERT TO authenticated
  WITH CHECK (
    "userId" = (SELECT auth.uid())::text
    AND boatbooking.boat_club_id("boatId") = (SELECT boatbooking.my_club_id())
  );

CREATE POLICY booking_update_own ON boatbooking."Booking"
  FOR UPDATE TO authenticated
  USING      ("userId" = (SELECT auth.uid())::text AND (SELECT boatbooking.is_member()))
  WITH CHECK ("userId" = (SELECT auth.uid())::text AND (SELECT boatbooking.is_member()));

CREATE POLICY booking_update_admin ON boatbooking."Booking"
  FOR UPDATE TO authenticated
  USING      (boatbooking.is_club_admin(boatbooking.boat_club_id("boatId")))
  WITH CHECK (boatbooking.is_club_admin(boatbooking.boat_club_id("boatId")));

CREATE POLICY booking_delete_own ON boatbooking."Booking"
  FOR DELETE TO authenticated
  USING ("userId" = (SELECT auth.uid())::text AND (SELECT boatbooking.is_member()));

CREATE POLICY booking_delete_admin ON boatbooking."Booking"
  FOR DELETE TO authenticated
  USING (boatbooking.is_club_admin(boatbooking.boat_club_id("boatId")));

-- ---- Payment ----------------------------------------------------------------
CREATE POLICY payment_select_admin ON boatbooking."Payment"
  FOR SELECT TO authenticated
  USING (boatbooking.is_club_admin("clubId"));

-- ---- Service-role-only tables ----------------------------------------------
-- No grants exist for anon/authenticated; a restrictive deny-all policy is kept
-- as belt-and-braces in case a grant is ever added by mistake.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['LoginEvent', 'ManagementIpAllowlist', 'Account', 'Session', 'VerificationToken'] LOOP
    IF to_regclass(format('boatbooking.%I', t)) IS NOT NULL THEN
      EXECUTE format(
        'CREATE POLICY %I ON boatbooking.%I AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)',
        t || '_deny_all', t);
    END IF;
  END LOOP;
END $$;

COMMIT;

-- Reload PostgREST's schema cache.
NOTIFY pgrst, 'reload schema';
