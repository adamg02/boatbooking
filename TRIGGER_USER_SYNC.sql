-- Trigger to automatically create User record when someone signs up with Supabase Auth
-- This syncs auth.users (managed by Supabase) with public.User (used by your app)

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."User" (id, email, name, image, "emailVerified", "createdAt", "updatedAt")
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email_confirmed_at,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public."User".name),
    image = COALESCE(EXCLUDED.image, public."User".image),
    "emailVerified" = EXCLUDED."emailVerified",
    "updatedAt" = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger that fires when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also sync existing auth.users (if any)
INSERT INTO public."User" (id, email, name, image, "emailVerified", "createdAt", "updatedAt")
SELECT 
  id::text,
  email,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)) as name,
  raw_user_meta_data->>'avatar_url' as image,
  email_confirmed_at,
  created_at,
  updated_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;
