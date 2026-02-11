-- Allow rebooking of cancelled slots by removing the strict unique constraint
-- and replacing it with a partial unique index for confirmed bookings only.

-- Drop old unique constraint if it exists
ALTER TABLE "Booking"
  DROP CONSTRAINT IF EXISTS "Booking_boatId_startTime_key";

-- Create partial unique index for confirmed bookings
CREATE UNIQUE INDEX IF NOT EXISTS "Booking_boatId_startTime_confirmed_key"
  ON "Booking"("boatId", "startTime")
  WHERE status = 'CONFIRMED';
