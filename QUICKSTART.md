# Quick Start Guide

## TL;DR - Get Running in 5 Minutes

1. **Clone and Install**
   ```bash
   npm install
   ```

2. **Set Up Environment**
   
   Create `.env` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://zykspozosjiubmezhxfr.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Set Up Database**
   - Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/zykspozosjiubmezhxfr/sql)
   - Copy contents of `SCHEMA.sql`
   - Paste and run it
   - (Optional) Copy contents of `SEED.sql` and run it for sample data

4. **Configure OAuth Providers**
   - Go to [Supabase Authentication](https://supabase.com/dashboard/project/zykspozosjiubmezhxfr/auth/providers)
   - Enable Google, Azure, and Facebook providers
   - Add OAuth credentials from each provider (see [AUTH_SETUP.md](./AUTH_SETUP.md) for details)
   - Set Site URL to `http://localhost:3000`
   - Add Redirect URL: `http://localhost:3000/auth/callback`

5. **Run the App**
   ```bash
   npm run dev
   ```
   
   Open http://localhost:3000

## First Time Setup Checklist

- [ ] `.env` file created with Supabase credentials
- [ ] Database schema created (run SCHEMA.sql)
- [ ] Sample data loaded (run SEED.sql) - optional
- [ ] OAuth providers enabled in Supabase Dashboard
- [ ] Redirect URLs configured in Supabase
- [ ] `npm install` completed
- [ ] `npm run dev` running successfully

## Available Commands

```bash
npm run dev          # Start development server on http://localhost:3000
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

## Project Structure

```
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── auth/           # Authentication pages
│   │   │   ├── signin/     # Sign-in page
│   │   │   └── callback/   # OAuth callback handler
│   │   ├── boats/          # Boat listing and details
│   │   └── api/            # API routes
│   │       └── bookings/   # Booking endpoints
│   ├── components/         # Reusable React components
│   │   ├── BoatCard.tsx
│   │   ├── BookingCalendar.tsx
│   │   └── SignOutButton.tsx
│   └── lib/                # Utility functions
│       ├── supabase.ts     # Server-side Supabase client
│       └── supabase-client.ts # Client-side Supabase client
├── SCHEMA.sql              # Database schema
├── SEED.sql                # Sample data
├── AUTH_SETUP.md           # Detailed auth setup guide
└── DATABASE_SETUP.md       # Detailed database guide
```

## Common Issues

### "Invalid API key"
- Check your `.env` file has correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart the dev server after changing environment variables

### OAuth not working
- Verify redirect URLs in both OAuth provider settings and Supabase Dashboard
- Make sure OAuth provider is enabled in Supabase Dashboard
- Check that Site URL is set correctly

### No boats showing up
- Run the SEED.sql file to add sample boats
- Check the database has data in the `Boat` table

### Can't book boats
- Make sure you're signed in
- Check that you have permission (see Permission System in README.md)
- Verify the booking slot is not already taken

## Next Steps

- Read [AUTH_SETUP.md](./AUTH_SETUP.md) for detailed OAuth configuration
- Read [DATABASE_SETUP.md](./DATABASE_SETUP.md) for database structure details
- Customize the app for your rowing club's needs
- Deploy to Vercel, Netlify, or your preferred hosting platform
