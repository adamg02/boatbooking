-- Delete a test club and ALL of its associated data:
--   bookings, boat/group links, boats, groups, payments, login events,
--   users (app table + Supabase auth.users), and the club itself.
--
-- ⚠️  THIS IS DESTRUCTIVE AND CANNOT BE UNDONE. Use only on test clubs.
--
-- Usage: set the club id in the DECLARE block below, then run the whole
-- script in the Supabase SQL Editor. Everything runs in a single
-- transaction — if anything fails, nothing is deleted.
--
-- Notes:
--   * User."clubId" is ON DELETE SET NULL, so users must be deleted
--     explicitly (they would otherwise be orphaned, not removed).
--   * System owner accounts (User."isSystemOwner" = true) are preserved:
--     they are detached from the club instead of deleted.
--   * Account/Session/UserGroup/LoginEvent rows cascade from User, and
--     BoatGroup/Booking rows cascade from Boat, but we delete explicitly
--     for clarity and to report counts.

DO $$
DECLARE
    target_club_id TEXT := 'PUT-CLUB-ID-HERE';  -- <<< SET THE CLUB ID HERE

    club_name TEXT;
    n_bookings BIGINT;
    n_boats BIGINT;
    n_groups BIGINT;
    n_payments BIGINT;
    n_users BIGINT;
BEGIN
    -- Guard: make sure the club exists
    SELECT name INTO club_name FROM "Club" WHERE id = target_club_id;
    IF club_name IS NULL THEN
        RAISE EXCEPTION 'Club with id % not found — nothing deleted', target_club_id;
    END IF;
    RAISE NOTICE 'Deleting club "%" (id %)', club_name, target_club_id;

    -- Collect the club's deletable users (system owners are kept)
    CREATE TEMP TABLE _club_users ON COMMIT DROP AS
        SELECT id FROM "User"
        WHERE "clubId" = target_club_id
          AND "isSystemOwner" = FALSE;

    -- Detach any system owners from the club instead of deleting them
    UPDATE "User" SET "clubId" = NULL
    WHERE "clubId" = target_club_id AND "isSystemOwner" = TRUE;

    -- 1. Bookings: on the club's boats, or made by the club's users
    DELETE FROM "Booking"
    WHERE "boatId" IN (SELECT id FROM "Boat" WHERE "clubId" = target_club_id)
       OR "userId" IN (SELECT id FROM _club_users);
    GET DIAGNOSTICS n_bookings = ROW_COUNT;

    -- 2. Boat/group permission links
    DELETE FROM "BoatGroup"
    WHERE "boatId" IN (SELECT id FROM "Boat" WHERE "clubId" = target_club_id)
       OR "groupId" IN (SELECT id FROM "Group" WHERE "clubId" = target_club_id);

    -- 3. User/group memberships
    DELETE FROM "UserGroup"
    WHERE "groupId" IN (SELECT id FROM "Group" WHERE "clubId" = target_club_id)
       OR "userId" IN (SELECT id FROM _club_users);

    -- 4. Login events for the club's users
    DELETE FROM "LoginEvent"
    WHERE "userId" IN (SELECT id FROM _club_users);

    -- 5. Boats
    DELETE FROM "Boat" WHERE "clubId" = target_club_id;
    GET DIAGNOSTICS n_boats = ROW_COUNT;

    -- 6. Groups
    DELETE FROM "Group" WHERE "clubId" = target_club_id;
    GET DIAGNOSTICS n_groups = ROW_COUNT;

    -- 7. Payments (Stripe invoice/charge records)
    DELETE FROM "Payment" WHERE "clubId" = target_club_id;
    GET DIAGNOSTICS n_payments = ROW_COUNT;

    -- 8. Users (Account and Session rows cascade from User)
    DELETE FROM "User" WHERE id IN (SELECT id FROM _club_users);
    GET DIAGNOSTICS n_users = ROW_COUNT;

    -- 9. Matching Supabase auth accounts (no FK links auth.users to
    --    public."User", so this must be done explicitly)
    DELETE FROM auth.users
    WHERE id::TEXT IN (SELECT id FROM _club_users);

    -- 10. The club itself
    DELETE FROM "Club" WHERE id = target_club_id;

    RAISE NOTICE 'Deleted: % bookings, % boats, % groups, % payments, % users',
        n_bookings, n_boats, n_groups, n_payments, n_users;
END $$;
