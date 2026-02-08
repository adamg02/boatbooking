-- Add provider column to User table
ALTER TABLE public."User" ADD COLUMN IF NOT EXISTS provider TEXT;

-- Update the trigger function to include provider
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."User" (id, email, name, image, provider, "emailVerified", "createdAt", "updatedAt")
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_app_meta_data->>'provider',
    NEW.email_confirmed_at,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public."User".name),
    image = COALESCE(EXCLUDED.image, public."User".image),
    provider = COALESCE(EXCLUDED.provider, public."User".provider),
    "emailVerified" = EXCLUDED."emailVerified",
    "updatedAt" = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing users with provider info from auth.users
UPDATE public."User" u
SET provider = au.raw_app_meta_data->>'provider'
FROM auth.users au
WHERE u.id = au.id::text
AND u.provider IS NULL;

-- For users where provider is still null, try to get it from the first identity
UPDATE public."User" u
SET provider = (
  SELECT i.provider
  FROM auth.identities i
  WHERE i.user_id = u.id::uuid
  ORDER BY i.created_at ASC
  LIMIT 1
)
WHERE u.provider IS NULL;
