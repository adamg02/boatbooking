-- =============================================================================
-- 01  SHARED PLATFORM  (run ONCE on the consolidated Supabase project)
-- =============================================================================
-- The consolidated project hosts two applications in two schemas:
--
--   boatbooking  ->  this repo (adamg02/boatbooking)
--   tt           ->  adamg02/tt
--
-- Both apps share ONE auth.users table (Supabase Auth is per project).
-- A person is a member of an app if, and only if, they have a profile row in
-- that app's schema:
--
--   boatbooking  ->  boatbooking."User"      (created by /auth/callback, service role)
--   tt           ->  tt.user_profiles        (created by the TT client on first login)
--
-- Every RLS policy in each schema requires that membership, so being signed in
-- to the shared auth is NOT enough to read another app's data.
--
-- This script removes the app-specific trigger on auth.users (both apps used
-- the same name `on_auth_user_created` / `public.handle_new_user`, and a
-- shared trigger cannot know which app a sign-up came from), and locks down
-- the `public` schema so that nothing new created there is exposed by default.
--
-- Run order: 01 -> 02 (this repo) -> 03 -> 04 (tt repo). See README.md.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Remove the per-app auth trigger.
--    Profile rows are now created by each app when the user signs in to it.
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 2. Lock down the `public` schema.
--    Supabase grants anon/authenticated full privileges on new objects in
--    `public` by default. Neither app uses `public` any more, so revoke those
--    defaults: anything created there later must be granted explicitly.
-- -----------------------------------------------------------------------------
REVOKE CREATE ON SCHEMA public FROM PUBLIC, anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES    FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON FUNCTIONS FROM PUBLIC, anon, authenticated;

COMMIT;
