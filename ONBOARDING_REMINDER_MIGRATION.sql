-- Onboarding reminder migration
-- Adds tracking for the one-off re-engagement email sent to users who signed
-- up but never joined or created a club (see /api/cron/onboarding-reminder).
--
-- Run this against your Supabase database.
-- If your tables live in the consolidated "boatbooking" schema, first run:
--   SET search_path TO boatbooking;

ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS "onboardingReminderSentAt" TIMESTAMPTZ;

-- Helps the cron job find users who still need a reminder
CREATE INDEX IF NOT EXISTS "User_onboarding_reminder_idx"
    ON "User" ("createdAt")
    WHERE "clubId" IS NULL AND "onboardingReminderSentAt" IS NULL;
