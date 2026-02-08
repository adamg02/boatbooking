# Supabase Authentication Setup

This project uses Supabase Authentication with OAuth providers (Google, Microsoft/Azure, and Facebook) for user login.

## Prerequisites

- A Supabase project (you should already have this set up from DATABASE_SETUP.md)
- OAuth credentials from Google, Microsoft, and Facebook

## Step 1: Configure OAuth Providers in Supabase

### Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "APIs & Services" > "Credentials"
5. Click "Create Credentials" > "OAuth 2.0 Client ID"
6. Select "Web application"
7. Add authorized redirect URIs:
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - For local development: `http://localhost:3000/auth/callback`
8. Copy the Client ID and Client Secret

In Supabase Dashboard:
1. Go to Authentication > Providers > Google
2. Enable Google provider
3. Paste your Client ID and Client Secret
4. Save configuration

### Microsoft/Azure OAuth Setup

1. Go to the [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" > "App registrations"
3. Click "New registration"
4. Name your app and **IMPORTANT**: Select **"Accounts in any organizational directory (Any Azure AD directory - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)"**
   - ⚠️ Do NOT select "Personal Microsoft accounts only" - this will cause the `/common/` endpoint error
5. Add redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
6. After creation, go to **"API permissions"** in the left menu
7. Click "Add a permission" → "Microsoft Graph" → "Delegated permissions"
8. Add these permissions:
   - `openid` (should already be there)
   - `profile`
   - `email` ⚠️ **REQUIRED** - without this you'll get "Error getting user email" error
9. Click "Add permissions"
10. Go to "Certificates & secrets"
11. Create a new client secret and copy it immediately
12. Go to "Overview" and copy the "Application (client) ID"

In Supabase Dashboard:
1. Go to Authentication > Providers > Azure
2. Enable Azure provider
3. Paste your Application (client) ID and Client Secret
4. For "Azure Tenant ID", use `common` (this works with the multi-tenant + personal accounts option above)
5. **IMPORTANT**: In the "Scopes" field (if available), add: `openid profile email`
   - If there's no Scopes field visible, that's okay - continue to next step
6. Save configuration

**If you already created the app with wrong audience:**
1. Go to your app in Azure Portal
2. Navigate to "Authentication" in the left menu
3. Under "Supported account types", click "Edit"
4. Select "Accounts in any organizational directory (Any Azure AD directory - Multitenant) and personal Microsoft accounts"
5. Save changes

**If you're getting "Error getting user email" error:**
1. Go to your app in Azure Portal
2. Navigate to "API permissions" in the left menu
3. Click "Add a permission" → "Microsoft Graph" → "Delegated permissions"
4. Search for and select `email`, `profile`, and `openid`
5. Click "Add permissions"
6. **IMPORTANT**: After adding permissions, you may need to click **"Grant admin consent for [your organization]"** button at the top of the permissions list
   - If you don't have admin rights, the consent will happen during the first login
7. Wait 5-10 minutes for Azure to propagate the changes
8. Clear your browser cookies or try in an incognito/private window
9. Try signing in again

**Still not working?**
- Verify all three permissions (`openid`, `profile`, `email`) show "Granted" status in Azure
- Check that the permission type is "Delegated" not "Application"
- Make sure you're using the correct Client ID and Secret in Supabase Dashboard
- Try creating a new client secret and updating it in Supabase
- **Configure Optional Claims in Azure:**
  1. In your Azure app, go to "Token configuration"
  2. Click "Add optional claim"
  3. Select "ID" token type
  4. Add these claims: `email`, `preferred_username`
  5. If prompted about Microsoft Graph permissions, click "Add" to include them
  6. Save and try again
- **Check token version:** In Azure app's "Manifest", verify `accessTokenAcceptedVersion` is set to `2` (not `null` or `1`)
- **Alternative solution - Use Microsoft provider instead of Azure:**
  - In Supabase Dashboard, try using "Microsoft" provider instead of "Azure" 
  - Microsoft provider may handle personal accounts better than Azure provider

### Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or select an existing one
3. Add "Facebook Login" product
4. In Facebook Login settings, add OAuth redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
5. Go to Settings > Basic to get your App ID and App Secret

In Supabase Dashboard:
1. Go to Authentication > Providers > Facebook
2. Enable Facebook provider
3. Paste your App ID (as Client ID) and App Secret (as Client Secret)
4. Save configuration

## Step 2: Configure Site URL and Redirect URLs

In Supabase Dashboard > Authentication > URL Configuration:

1. Set **Site URL** to your production URL (e.g., `https://yourapp.com`)
   - For development, use `http://localhost:3000`

2. Add **Redirect URLs**:
   - Production: `https://yourapp.com/auth/callback`
   - Development: `http://localhost:3000/auth/callback`

## Step 3: Verify Environment Variables

Your `.env` file should already have:

```env
NEXT_PUBLIC_SUPABASE_URL=https://zykspozosjiubmezhxfr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

These are the only environment variables needed. No OAuth provider credentials are required in your app - they're all managed in the Supabase Dashboard.

## Step 4: Test Authentication

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/auth/signin`

3. Click one of the OAuth provider buttons

4. You should be redirected to the provider's login page

5. After successful login, you'll be redirected back to `/auth/callback`, which will exchange the code for a session

6. Finally, you'll be redirected to `/boats` (the main app page)

## Authentication Flow

1. User clicks "Sign in with Google/Microsoft/Facebook" on `/auth/signin`
2. App calls `supabase.auth.signInWithOAuth({ provider, redirectTo: '/auth/callback' })`
3. User is redirected to the OAuth provider
4. After authentication, provider redirects to `/auth/callback?code=...`
5. Callback route exchanges the code for a session using `supabase.auth.exchangeCodeForSession()`
6. User is redirected to `/boats` with an active session
7. Session is stored in cookies and automatically managed by Supabase

## Sign Out

Users can sign out by clicking the "Sign Out" button on any authenticated page. This calls `supabase.auth.signOut()` and redirects to the home page.

## Protected Routes

Pages and API routes check for authentication using:

```typescript
const supabase = await getSupabaseClient();
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  // Redirect or return 401
}
```

## Troubleshooting

### OAuth redirect not working
- Verify redirect URLs are added in both the OAuth provider settings and Supabase Dashboard
- Check that URLs match exactly (including protocol and trailing slashes)

### "Invalid client" error
- Double-check Client ID and Client Secret in Supabase Dashboard
- Ensure OAuth provider app is set to production/active status

### Session not persisting
- Check that cookies are enabled in the browser
- Verify Site URL is set correctly in Supabase Dashboard
- Ensure your app is running on the same domain as configured

### User data not appearing
- Run the SQL schema from SCHEMA.sql if you haven't already
- Check that Row Level Security (RLS) policies allow the operations you need

## Next Steps

- Run the database schema: See [DATABASE_SETUP.md](./DATABASE_SETUP.md)
- Set up user groups and permissions in the database
- Configure which boats are available to which groups
