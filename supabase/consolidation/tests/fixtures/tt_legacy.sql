-- Supabase database setup for Rowing Time Trials app
-- Run these commands in your Supabase SQL editor

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;


-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'timer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create competitions table
CREATE TABLE IF NOT EXISTS competitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  archived BOOLEAN DEFAULT FALSE NOT NULL,
  created_by UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create competition_links table to pair competitions
CREATE TABLE IF NOT EXISTS competition_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_a_id UUID REFERENCES competitions(id) ON DELETE CASCADE UNIQUE,
  competition_b_id UUID REFERENCES competitions(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT competition_links_distinct CHECK (competition_a_id <> competition_b_id),
  CONSTRAINT competition_links_order CHECK (competition_a_id < competition_b_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS competition_links_pair_idx
  ON competition_links (competition_a_id, competition_b_id);

-- Create timing_points table
CREATE TABLE IF NOT EXISTS timing_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  assigned_user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create crews table
CREATE TABLE IF NOT EXISTS crews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  crew_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(competition_id, crew_number)
);

-- Enforce unique crew names per competition (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS crews_unique_competition_lower_name
  ON crews (competition_id, LOWER(name));

-- Create time_records table
CREATE TABLE IF NOT EXISTS time_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID REFERENCES crews(id) ON DELETE CASCADE NOT NULL,
  timing_point_id UUID REFERENCES timing_points(id) ON DELETE CASCADE NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  recorded_by UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(crew_id, timing_point_id)
);

-- Row Level Security Policies

-- user_profiles policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any user profile" ON user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete any user profile" ON user_profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- competitions policies
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view competitions" ON competitions
  FOR SELECT USING (true);

CREATE POLICY "Admins can create competitions" ON competitions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update competitions" ON competitions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- timing_points policies
ALTER TABLE timing_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view timing points" ON timing_points
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage timing points" ON timing_points
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- crews policies
ALTER TABLE crews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view crews" ON crews
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage crews" ON crews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- time_records policies
ALTER TABLE time_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view time records" ON time_records
  FOR SELECT USING (true);

CREATE POLICY "Users with timer or admin role can create time records" ON time_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'timer')
    )
  );

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NULL -- No default role assigned, must be manually assigned by admin
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Migration to allow NULL roles for existing users
-- Run this in your Supabase SQL editor to update the existing database

-- First, drop the existing constraint that requires role to be NOT NULL
ALTER TABLE user_profiles ALTER COLUMN role DROP NOT NULL;

-- Update the trigger function to not assign default roles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NULL -- No default role assigned, must be manually assigned by admin
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: If you want to reset existing users to have no role (uncomment the line below)
-- UPDATE user_profiles SET role = NULL WHERE role = 'timer';

-- Note: This migration preserves existing admin users but new users will have no role by default-- Migration to fix user registration issues after allowing NULL roles
-- Run this in your Supabase SQL editor

-- First, ensure the table structure is correct
ALTER TABLE user_profiles ALTER COLUMN role DROP NOT NULL;

-- Drop and recreate the trigger function with better error handling
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_full_name TEXT;
BEGIN
  -- Get user email and name with fallbacks
  user_email := COALESCE(NEW.email, '');
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'New User');
  
  -- Log for debugging
  RAISE LOG 'Creating user profile for user: %, email: %', NEW.id, user_email;
  
  -- Insert the user profile
  INSERT INTO user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    user_email,
    user_full_name,
    NULL -- No default role assigned
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
  
  RAISE LOG 'User profile created successfully for user: %', NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error creating user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW; -- Don't fail the auth process even if profile creation fails
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Verify the trigger exists
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check if there are any orphaned auth users without profiles
SELECT COUNT(*) as orphaned_users
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Optional: Create profiles for any existing orphaned users
-- Uncomment the following if you want to create profiles for existing users without them:
/*
INSERT INTO user_profiles (id, email, full_name, role)
SELECT 
  au.id,
  COALESCE(au.email, ''),
  COALESCE(au.raw_user_meta_data->>'full_name', au.email, 'User'),
  NULL
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL;
*/-- Database migration to fix user deletion constraint issue
-- This allows time records to persist when users are deleted
-- Run this in your Supabase SQL editor

-- 1. First, remove the NOT NULL constraint on recorded_by
ALTER TABLE time_records 
ALTER COLUMN recorded_by DROP NOT NULL;

-- 2. Drop the existing foreign key constraint
ALTER TABLE time_records 
DROP CONSTRAINT IF EXISTS time_records_recorded_by_fkey;

-- 3. Add new foreign key constraint that sets to NULL on delete
ALTER TABLE time_records 
ADD CONSTRAINT time_records_recorded_by_fkey 
FOREIGN KEY (recorded_by) 
REFERENCES user_profiles(id) 
ON DELETE SET NULL;

-- 4. Update any existing records that might have invalid references
-- (This shouldn't be necessary but ensures data consistency)
UPDATE time_records 
SET recorded_by = NULL 
WHERE recorded_by NOT IN (SELECT id FROM user_profiles);

-- Verify the changes
SELECT 
  column_name,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'time_records' 
  AND column_name = 'recorded_by';

-- Check the constraint
SELECT 
  constraint_name,
  update_rule,
  delete_rule
FROM information_schema.referential_constraints 
WHERE constraint_name = 'time_records_recorded_by_fkey';-- Allow multiple time entries per crew per timing point
-- Drop the unique constraint that limited one record per crew/timing point pair
ALTER TABLE time_records
  DROP CONSTRAINT IF EXISTS time_records_crew_id_timing_point_id_key;

-- Optional: ensure queries stay performant by keeping a useful composite index
CREATE INDEX IF NOT EXISTS time_records_crew_timing_idx
  ON time_records (crew_id, timing_point_id, timestamp DESC);
-- Ensure crew names are unique per competition (case-insensitive)

-- 1) Normalize existing duplicates by appending a numeric suffix to later rows
WITH ranked AS (
  SELECT
    id,
    competition_id,
    name,
    LOWER(name) AS lname,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY competition_id, LOWER(name) ORDER BY created_at, id) AS rn
  FROM crews
), dups AS (
  SELECT * FROM ranked WHERE rn > 1
)
UPDATE crews c
SET name = d.name || ' (' || d.rn || ')'
FROM dups d
WHERE c.id = d.id;

-- 2) Create a unique index on (competition_id, lower(name)) to enforce case-insensitive uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS crews_unique_competition_lower_name
  ON crews (competition_id, LOWER(name));

-- Note: For new installations, this index should be present via supabase_setup.sql as well.
ALTER TABLE competition_links ENABLE ROW LEVEL SECURITY; CREATE POLICY "Anyone can view links" ON competition_links FOR SELECT USING (true);

-- (moved from top of supabase_setup.sql, which ran it before the table existed)
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE NOT NULL;
