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
