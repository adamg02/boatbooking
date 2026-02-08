# How to Run the Boat Booking App

This guide shows you how to start the application after setup is complete.

## Prerequisites

Before running the app, make sure you have completed:

1. ✅ Installed dependencies (`npm install`)
2. ✅ Created `.env` file with Supabase credentials
3. ✅ Run database schema (`SCHEMA.sql` in Supabase SQL Editor)
4. ✅ Configured OAuth providers in Supabase Dashboard

If you haven't done these steps, see [QUICKSTART.md](./QUICKSTART.md) or [README.md](./README.md).

## Development Mode

Start the development server with hot reload:

```bash
npm run dev
```

The app will be available at **http://localhost:3000**

### What happens in development mode:
- Server starts on port 3000
- Hot module replacement (HMR) enabled - changes reflect instantly
- Detailed error messages and stack traces
- React DevTools support

## Production Build

Build and run the optimized production version:

```bash
# Build the app
npm run build

# Start production server
npm start
```

The production build:
- Optimizes and minifies code
- Generates static pages where possible
- Creates optimized bundles
- Production server runs on port 3000 by default

## Using the App

### 1. Sign In

1. Navigate to http://localhost:3000
2. Click on a sign-in option or go directly to http://localhost:3000/auth/signin
3. Choose your OAuth provider (Google, Microsoft, or Facebook)
4. Authorize the application
5. You'll be redirected back to the app

### 2. Browse Boats

After signing in, you'll see the boats list at http://localhost:3000/boats

- All boats you have permission to book will be displayed
- Click on any boat to see its booking calendar

### 3. Book a Boat

1. Click on a boat card
2. View the calendar showing available 2-hour slots
3. Click on an available (green) slot to book it
4. Slots operate from 6:00 AM to 8:00 PM daily

Slot colors:
- 🟢 **Green**: Available - click to book
- 🔴 **Red**: Booked by someone else
- 🔵 **Blue**: Your booking - click to cancel

### 4. Manage Your Bookings

- Your bookings are highlighted in blue on the calendar
- Click on your booking to cancel it
- Only future bookings can be cancelled

### 5. Sign Out

Click the "Sign Out" button in the header to end your session.

## Development Tips

### Watch the Console

Open browser DevTools (F12) to see:
- Network requests to API routes
- Client-side errors
- React component warnings

### Check Server Logs

The terminal running `npm run dev` shows:
- Server-side errors
- API route logs
- Build warnings

### Hot Reload Not Working?

If changes don't reflect:
1. Save the file again
2. Refresh the browser
3. Restart the dev server (Ctrl+C, then `npm run dev`)

### Port 3000 Already in Use?

Change the port:
```bash
# Windows (PowerShell)
$env:PORT=3001; npm run dev

# Linux/Mac
PORT=3001 npm run dev
```

## Environment Variables

Make sure your `.env` file exists and has:

```env
NEXT_PUBLIC_SUPABASE_URL=https://zykspozosjiubmezhxfr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: Restart the dev server after changing environment variables.

## Troubleshooting

### "Invalid API key" or "401 Unauthorized"

**Problem**: Supabase can't authenticate your requests

**Solution**:
1. Check `.env` file exists in project root
2. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
3. Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
4. Restart dev server

### OAuth Sign-in Fails

**Problem**: OAuth redirect doesn't work or shows error

**Solution**:
1. Check OAuth provider is enabled in Supabase Dashboard
2. Verify redirect URL is `http://localhost:3000/auth/callback`
3. Check OAuth credentials are correct in Supabase
4. Ensure Site URL is set to `http://localhost:3000` in Supabase

### No Boats Showing Up

**Problem**: Boats list is empty

**Solution**:
1. Check database has boats: Go to Supabase Dashboard → Table Editor → Boat
2. Run `SEED.sql` to add sample boats
3. Check browser console for errors
4. Verify you're signed in

### Can't Book a Boat

**Problem**: Booking button doesn't work or shows error

**Solution**:
1. Verify you're signed in (check for "Sign Out" button)
2. Check boat permissions in database (see Permission System in README.md)
3. Ensure slot is not already booked
4. Check browser console and server logs for errors

### Build Fails

**Problem**: `npm run build` shows errors

**Solution**:
1. Delete `.next` folder: `Remove-Item -Recurse -Force .next`
2. Delete `node_modules`: `Remove-Item -Recurse -Force node_modules`
3. Reinstall: `npm install`
4. Try building again: `npm run build`

## Performance

### Development Mode
- Slower than production
- Includes development tools
- Detailed error messages
- Not optimized

### Production Mode
- Fast and optimized
- Minified code
- Server-side rendering
- Better performance

**Always use production mode for deployment.**

## Next Steps

- Deploy to Vercel: `vercel --prod`
- Configure production OAuth redirect URLs
- Set up custom domain
- Enable Row Level Security (RLS) in Supabase
- Add more boats and user groups

## Need Help?

- Check [README.md](./README.md) for full documentation
- See [AUTH_SETUP.md](./AUTH_SETUP.md) for authentication details
- See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for database structure
- Review [QUICKSTART.md](./QUICKSTART.md) for setup checklist
