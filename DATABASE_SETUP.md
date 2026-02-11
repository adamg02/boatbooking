# Database Setup Guide

This project uses **Supabase** with direct SQL schema creation (no ORM required).

## Quick Start

### 1. Get Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Navigate to **Project Settings** → **API**
3. Copy these values to your `.env` file:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Create Database Schema

1. In your Supabase project, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of [SCHEMA.sql](SCHEMA.sql)
4. Paste into the query editor
5. Click **Run** (or press Ctrl+Enter)

This creates all necessary tables:
- User, Account, Session, VerificationToken (for NextAuth)
- Boat, Group, UserGroup, BoatGroup (for boat management)
- Booking (for reservations)

### 3. Add Sample Data (Optional)

1. In **SQL Editor**, create another new query
2. Copy the contents of [SEED.sql](SEED.sql)
3. Paste and click **Run**

This adds:
- 2 groups (Admin and Member)
- 3 boats with different permission levels
- Boat permission assignments

## Environment Variables

Your `.env` file should look like this:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# NextAuth (generate a secure secret)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OAuth Providers (get from respective platforms)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

MICROSOFT_CLIENT_ID="your-microsoft-client-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"

FACEBOOK_CLIENT_ID="your-facebook-client-id"
FACEBOOK_CLIENT_SECRET="your-facebook-client-secret"
```

## Managing Data

### View Data
- Go to **Table Editor** in Supabase Dashboard
- Browse tables, view rows, filter and sort

### Edit Data
- Click any cell in Table Editor to edit
- Add new rows with the **Insert** button
- Delete rows with the row menu

### Run Custom Queries
- Use **SQL Editor** for complex queries
- View query history
- Save frequently used queries

### Assign Users to Groups

After users sign in, assign them to groups:

1. Go to **Table Editor** → **UserGroup** table
2. Click **Insert row**
3. Add:
   - `userId`: Copy from User table
   - `groupId`: Either `admin-group` or `member-group`

Or use SQL:
```sql
INSERT INTO "UserGroup" ("userId", "groupId") 
VALUES ('user-id-here', 'admin-group');
```

## Boat Permissions

- **No BoatGroup entries** = All users can book
- **With BoatGroup entries** = Only users in those groups can book

Example:
```sql
-- Make a boat bookable only by admins
INSERT INTO "BoatGroup" ("boatId", "groupId") 
VALUES ('boat-id', 'admin-group');
```

## Schema Updates

To modify the schema:

1. Write your ALTER TABLE statements
2. Run in Supabase SQL Editor
3. Update SCHEMA.sql for future reference

If you already created the schema, apply incremental updates with the provided SQL files. For example, to allow rebooking cancelled slots, run [BOOKING_UNIQUE_CONFIRMED.sql](BOOKING_UNIQUE_CONFIRMED.sql).

Example:
```sql
-- Add a capacity field to boats
ALTER TABLE "Boat" ADD COLUMN capacity INTEGER DEFAULT 1;
```

## Troubleshooting

### Tables not appearing?
- Verify SCHEMA.sql ran successfully
- Check for error messages in SQL Editor
- Ensure you're looking at the correct project

### Can't insert data?
- Check for required fields
- Verify foreign key references exist
- Check data types match schema

### Users can't sign in?
- Verify NextAuth environment variables
- Check OAuth provider configuration
- Look at browser console for errors

## Production Checklist

- [ ] All environment variables configured
- [ ] SCHEMA.sql executed successfully
- [ ] Sample data added (or real data migrated)
- [ ] At least one user assigned to admin group
- [ ] OAuth providers configured for production URLs
- [ ] NEXTAUTH_SECRET is a secure random string

## Need Help?

See:
- [README.md](README.md) - Full project documentation
- [SUPABASE_SETUP.md](SUPABASE_SETUP.md) - Supabase client details
- [Supabase Documentation](https://supabase.com/docs)
