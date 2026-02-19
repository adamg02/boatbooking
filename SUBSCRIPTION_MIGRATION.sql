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
