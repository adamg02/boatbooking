# Supabase Auth Migration Summary

This document summarizes the migration from NextAuth.js to Supabase Auth.

## What Changed

### Removed

1. **Packages**
   - `next-auth` (v5.0.0-beta.25)
   - `@auth/prisma-adapter`

2. **Files**
   - `src/lib/auth.ts` - NextAuth configuration
   - `src/app/api/auth/[...nextauth]/route.ts` - NextAuth API routes
   - `src/types/next-auth.d.ts` - NextAuth type definitions

3. **Environment Variables**
   ```env
   # No longer needed
   NEXTAUTH_URL
   NEXTAUTH_SECRET
   GOOGLE_CLIENT_ID
   GOOGLE_CLIENT_SECRET
   MICROSOFT_CLIENT_ID
   MICROSOFT_CLIENT_SECRET
   FACEBOOK_CLIENT_ID
   FACEBOOK_CLIENT_SECRET
   ```

### Added

1. **Packages**
   - `@supabase/ssr` (v0.6.0) - Official Supabase SSR package for Next.js

2. **Files**
   - `src/lib/supabase-client.ts` - Client-side Supabase client (for 'use client' components)
   - `src/app/auth/callback/route.ts` - OAuth callback handler
   - `AUTH_SETUP.md` - Authentication setup guide
   - `QUICKSTART.md` - Quick start guide

3. **Updated Files**
   - `src/lib/supabase.ts` - Updated to use @supabase/ssr for server components
   - `src/app/auth/signin/page.tsx` - Converted to use Supabase Auth
   - `src/app/boats/page.tsx` - Updated authentication check
   - `src/app/boats/[id]/page.tsx` - Updated authentication check
   - `src/components/SignOutButton.tsx` - Updated to use Supabase Auth
   - `src/app/api/bookings/route.ts` - Updated authentication for GET and POST
   - `src/app/api/bookings/[id]/route.ts` - Updated authentication for DELETE

## Code Changes

### Authentication Pattern

**Before (NextAuth):**
```typescript
import { auth } from "@/lib/auth";

const session = await auth();
if (!session?.user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const userId = session.user.id;
```

**After (Supabase Auth):**
```typescript
import { getSupabaseClient } from "@/lib/supabase";

const supabase = await getSupabaseClient();
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const userId = user.id;
```

### Sign In

**Before (NextAuth):**
```typescript
import { signIn } from "next-auth/react";

await signIn("google", { callbackUrl: "/boats" });
```

**After (Supabase Auth):**
```typescript
import { getSupabaseClientComponent } from "@/lib/supabase-client";

const supabase = getSupabaseClientComponent();
await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
});
```

### Sign Out

**Before (NextAuth):**
```typescript
import { signOut } from "next-auth/react";

await signOut({ callbackUrl: "/" });
```

**After (Supabase Auth):**
```typescript
import { getSupabaseClientComponent } from "@/lib/supabase-client";

const supabase = getSupabaseClientComponent();
await supabase.auth.signOut();
router.push("/");
```

## Benefits of Supabase Auth

1. **Simplified Configuration**: OAuth providers are configured in the Supabase Dashboard, not in your app's environment variables
2. **Integrated with Database**: Auth tables are part of your Supabase database
3. **Better DX**: No need to manage multiple OAuth callback routes
4. **Built-in Features**: Email verification, password reset, magic links, etc.
5. **Session Management**: Automatic session refresh and cookie handling
6. **Fewer Dependencies**: One less package to manage

## Environment Variables

Now only 2 environment variables are needed:

```env
NEXT_PUBLIC_SUPABASE_URL=https://zykspozosjiubmezhxfr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

All OAuth provider credentials are managed in the Supabase Dashboard under Authentication > Providers.

## OAuth Flow

1. User clicks sign-in button → `supabase.auth.signInWithOAuth()`
2. Redirected to OAuth provider (Google/Azure/Facebook)
3. User authorizes the app
4. Redirected to `/auth/callback?code=...`
5. Callback route exchanges code for session → `supabase.auth.exchangeCodeForSession()`
6. Session stored in cookies
7. User redirected to `/boats`

## Database Impact

The database schema remains the same. Supabase Auth uses these tables (created in SCHEMA.sql):
- `User` - User accounts
- `Account` - OAuth provider accounts
- `Session` - Active sessions
- `VerificationToken` - Email verification tokens

## Testing Checklist

- [ ] Build completes successfully (`npm run build`)
- [ ] Sign in with Google works
- [ ] Sign in with Microsoft/Azure works
- [ ] Sign in with Facebook works
- [ ] OAuth callback redirects to `/boats`
- [ ] Session persists after page refresh
- [ ] Sign out works and redirects to home
- [ ] Protected routes redirect to sign-in when not authenticated
- [ ] API routes return 401 for unauthenticated requests
- [ ] Booking creation works with authenticated user
- [ ] Booking listing shows only user's bookings
- [ ] Booking cancellation only works for own bookings

## Rollback Plan

If you need to rollback to NextAuth:

1. Install NextAuth:
   ```bash
   npm install next-auth@beta @auth/prisma-adapter
   ```

2. Restore deleted files from git:
   ```bash
   git checkout HEAD -- src/lib/auth.ts src/app/api/auth/[...nextauth]/route.ts src/types/next-auth.d.ts
   ```

3. Revert code changes in API routes and components

4. Add OAuth environment variables back to `.env`

5. Remove Supabase Auth files and update imports

However, Supabase Auth is recommended for simpler configuration and better integration.

## Support & Documentation

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [@supabase/ssr Package](https://github.com/supabase/ssr)
- Project-specific: See [AUTH_SETUP.md](./AUTH_SETUP.md)
