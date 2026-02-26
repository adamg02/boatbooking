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
