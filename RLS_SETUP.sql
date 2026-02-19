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
