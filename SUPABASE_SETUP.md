# Quick Setup Guide - Supabase JS Client

This project uses the **Supabase JavaScript client** for all database operations, providing a native integration with Supabase.

## What You Need

### Environment Variables

You need **two** Supabase-related environment variables in your `.env` file:

```env
# Supabase API credentials (from Project Settings -> API)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-public-key"
```

## How to Get These Values

### 1. Supabase URL and Anon Key

1. Go to your Supabase project dashboard
2. Click **Project Settings** (gear icon)
3. Go to **API** section
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Database Setup

### Create Schema

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the sidebar
3. Create a new query
4. Paste the content from [SCHEMA.sql](SCHEMA.sql)
5. Click **Run** to create all tables

### Add Sample Data (Optional)

1. In the **SQL Editor**
2. Create a new query
3. Paste the content from [SEED.sql](SEED.sql)
4. Click **Run** to insert sample boats and groups

## Database Operations

### Query Examples

All database operations use the Supabase client:

```typescript
// Fetch boats
const { data: boats } = await supabase
  .from('Boat')
  .select('*')
  .eq('isActive', true);

// Create a booking
const { data: booking } = await supabase
  .from('Booking')
  .insert({
    userId: session.user.id,
    boatId: 'boat-id',
    startTime: '2026-02-08T10:00:00Z',
    endTime: '2026-02-08T12:00:00Z',
    status: 'CONFIRMED'
  })
  .select()
  .single();
```

### Where Supabase Client is Used

- ✅ All API routes (`/api/bookings/*`)
- ✅ Boat listing page
- ✅ Boat booking page
- ✅ Direct database queries

## Managing Your Database

Use the Supabase Dashboard for all data management:

1. **Table Editor**: View and edit data directly
2. **SQL Editor**: Run custom queries
3. **Database**: Monitor performance
4. **API Docs**: Auto-generated REST API reference

## Benefits of This Approach

1. **Type Safety**: Supabase queries are strongly typed with TypeScript
2. **Connection Pooling**: Built-in for Next.js serverless API routes
3. **Real-time Ready**: Easy to add live updates later
4. **Native Features**: Access to PostgreSQL features directly
5. **Simpler Queries**: Intuitive for PostgreSQL users
6. **No ORM Overhead**: Direct database access
7. **Auto-generated REST API**: Supabase provides REST endpoints as backup

## Testing the Connection

To verify everything works:

```bash
# Start dev server
npm run dev

# The app will throw clear errors if env vars are missing
# Visit http://localhost:3000 to test
```

## Troubleshooting

### "Missing Supabase environment variables"
- Ensure `.env` file exists with all three variables
- Restart your dev server after adding env vars
- Check variable names match exactly (including `NEXT_PUBLIC_` prefix)

### "Failed to fetch"
- Verify your Supabase URL is correct
- Check your anon key is valid
- Ensure your Supabase project is active
- Check that tables exist in your database

### "relation does not exist"
- Run the SCHEMA.sql script in Supabase SQL Editor
- Verify all tables were created successfully

## Next Steps

1. Replace placeholder values in `.env` with your real Supabase credentials
2. Run the SCHEMA.sql script in Supabase SQL Editor
3. Optionally run SEED.sql for sample data
4. Start the dev server with `npm run dev`

For more details, see the main [README.md](README.md).
