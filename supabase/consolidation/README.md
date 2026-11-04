# Supabase consolidation: boatbooking + tt on one project

Both apps (`adamg02/boatbooking` and `adamg02/tt`) share **one** Supabase project
(this one, the boatbooking project). Each app has its own Postgres schema:

| App         | Schema        | Membership = row in            |
|-------------|---------------|--------------------------------|
| boatbooking | `boatbooking` | `boatbooking."User"` (active)  |
| tt          | `tt`          | `tt.user_profiles`             |

`auth.users` is shared (Supabase has a single auth per project). One person can
use both apps with the same login, but **being signed in grants nothing**:
every RLS policy requires membership of the app whose table is being accessed.

## Security model

* **Schema / table level** – `anon` has no privileges on `boatbooking`; it only
  has `SELECT` on the public results tables in `tt` (needed for `/results/:id`).
  `authenticated` gets explicit per-table (and for sensitive tables, per-column)
  grants. Stripe/subscription columns, `User.clubId` and `isSystemOwner` are not
  writable by end users at all. Nothing is granted on `public`, and `CREATE` on
  `public` is revoked.
* **Row level** – RLS is enabled on every table. Policies call
  `SECURITY DEFINER` helpers (`boatbooking.is_member()`, `my_club_id()`,
  `is_club_admin()`, `tt.is_member()`, `tt.is_admin()`, `tt.can_record_times()`).
  A boatbooking-only user calling a `tt` table (or vice versa) gets zero rows and
  cannot write.
* **Privilege escalation guards** – triggers stop users changing their own
  `isActive` (boatbooking) or `role` (tt); only admins of that app can.
* **Profile creation** – the shared `on_auth_user_created` trigger is removed.
  boatbooking creates `boatbooking."User"` with the service role in
  `/auth/callback`; tt inserts `tt.user_profiles` client-side and RLS forces
  `role = NULL` (an admin must grant a role).
* Club creation, join-by-code and Stripe updates in boatbooking run server-side
  with the service-role key (members can only read their own club).

## Files

| File | Repo | Purpose |
|------|------|---------|
| `01_shared_platform.sql` | boatbooking | Remove shared trigger, lock down `public` |
| `02_boatbooking_schema.sql` | boatbooking | Move tables `public` → `boatbooking`, grants, RLS |
| `03_tt_schema.sql` | tt | Create `tt` schema, grants, RLS, realtime |
| `04_tt_import.sql` + `migrate_tt_data.sh` | tt | Copy TT auth users + data from the old TT project |

All scripts are idempotent (safe to re-run).

## Runbook

Plan a short maintenance window: boatbooking is broken between running `02` and
deploying the boatbooking code from this branch; tt is broken between `03`/import
and deploying its new env vars + code.

1. **Back up both projects** (Dashboard → Database → Backups, or `pg_dump`).
2. **Auth configuration** on this (boatbooking) project, Dashboard → Authentication:
   * URL Configuration → add the tt site URL(s) and `https://<tt-domain>/**` to
     *Redirect URLs* (keep the boatbooking ones). *Site URL* stays boatbooking's;
     tt always passes `redirectTo`, so that's fine.
   * Providers → make sure every provider tt uses (Google, Facebook, Azure, email)
     is enabled. If tt used different OAuth client IDs, add tt's domain to the
     redirect URIs of the OAuth apps used here (the callback is now
     `https://<this-project>.supabase.co/auth/v1/callback`).
   * Email templates are shared – word them neutrally.
3. **Run SQL on this project** (SQL editor or `psql "$TARGET_DB_URL" -f …`):
   ```bash
   psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 -f 01_shared_platform.sql
   psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 -f 02_boatbooking_schema.sql
   psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 -f ../../../tt/supabase/consolidation/03_tt_schema.sql
   ```
4. **Expose the schemas**: Dashboard → Project Settings → Data API →
   *Exposed schemas*: add `boatbooking` and `tt` (you may remove `public`).
   Do this *after* step 3 – PostgREST fails if a listed schema doesn't exist.
5. **Deploy boatbooking** from this branch (no env changes needed).
6. **Import tt** (from the tt repo, needs `psql` ≥ 15; use direct/session
   connection strings, not the transaction pooler):
   ```bash
   TT_SOURCE_DB_URL='postgresql://postgres:…@db.<old-tt-ref>.supabase.co:5432/postgres' \
   TARGET_DB_URL='postgresql://postgres:…@db.<this-ref>.supabase.co:5432/postgres' \
   ./supabase/consolidation/migrate_tt_data.sh
   ```
   Users are matched by OAuth identity, then by e-mail (case-insensitive); matched
   people keep their existing (boatbooking) UUID and TT rows are re-pointed to it.
   Unmatched users are copied with their original UUID, password hash and
   identities, so they can sign in without resetting anything. The script runs
   in one transaction and verifies row counts. Avoid recording tt times between
   this step and step 7 (they would land in the old project). The mapping is kept in
   `tt_import.user_map` for auditing (drop the `tt_import` schema when happy).
7. **Deploy tt** with `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` set to
   this project's values.
8. **Verify** (see below), then pause/delete the old tt project after a grace period.

## Verification

```sql
-- every table has RLS on
select n.nspname, c.relname, c.relrowsecurity
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('boatbooking','tt') and c.relkind = 'r' order by 1,2;

-- nothing left in public, no leftover auth trigger
select table_name from information_schema.tables where table_schema = 'public';
select tgname from pg_trigger where tgrelid = 'auth.users'::regclass and not tgisinternal;

-- grants for anon (should be tt results tables only)
select table_schema, table_name, privilege_type from information_schema.role_table_grants
where grantee = 'anon' and table_schema in ('boatbooking','tt');
```

Functional checks: sign in to each app as an existing user; a boatbooking-only
user signing into tt sees the "awaiting role" state and cannot record times; tt
public results pages load signed out; live results update.

## Rollback

* boatbooking: restore the step-1 backup (or move the tables back with
  `alter table boatbooking."<Table>" set schema public;` and re-run the old
  `RLS_SETUP.sql`) and redeploy the previous boatbooking commit. The old tt project is untouched.
* tt can be pointed back at the old project at any time (it is
  never modified by the import) by restoring the old env vars and previous commit.

## Local testing

`tests/run-local.sh` builds both legacy databases on a local Supabase stack
(fixtures include a user present in both apps via the same Google identity and
one matched only by e-mail with different case), runs 01–03 + the import, re-runs
01–03 to prove idempotency, then runs `tests/rls.test.mjs` (117 REST-level checks
of cross-app isolation, anon access, column locks and privilege-escalation
guards). See the header of `run-local.sh` for usage. `tests/reset.sql` undoes the
test suite's writes so it can be re-run.
