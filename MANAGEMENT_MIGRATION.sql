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
