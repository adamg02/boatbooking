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
