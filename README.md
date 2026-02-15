# Boat Booking Web App

A mobile-first web application for booking rowing boats with social authentication and group-based permissions.

## Features

- 🔐 **Social Authentication**: Login with Google, Microsoft (Hotmail), or Facebook
- 🚣 **Boat Booking System**: Each boat has its own calendar with 2-hour fixed time slots
- 👥 **User Groups & Permissions**: Control which users can book specific boats
- 📱 **Mobile-First Design**: Responsive interface optimized for mobile devices
- ⏰ **Real-time Availability**: See available slots and book instantly
- 📊 **Google Analytics**: Optional analytics tracking with configurable GA4 measurement ID

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth with OAuth
- **Database**: Supabase (PostgreSQL) with Supabase JS Client
- **Date Handling**: date-fns
- **Analytics**: Google Analytics (via @next/third-parties)

## Prerequisites

- Node.js 18+ and npm
- [Supabase account](https://supabase.com) (free tier available)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase Database

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Project Settings** → **API**
   - Copy your **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - Copy your **anon public** key (NEXT_PUBLIC_SUPABASE_ANON_KEY)

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase - Get from Project Settings -> API
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Google Analytics (Optional)
# Get your GA4 Measurement ID from Google Analytics (e.g., G-XXXXXXXXXX)
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

**That's it!** No OAuth provider credentials needed in your app - they're managed in the Supabase Dashboard.

### 4. Configure Authentication

Set up OAuth providers in Supabase Dashboard. See detailed instructions in [AUTH_SETUP.md](./AUTH_SETUP.md).

Quick summary:
1. Go to Authentication > Providers in Supabase Dashboard
2. Enable Google, Azure, and Facebook providers
3. Add your OAuth credentials from each provider
4. Configure redirect URLs

### 5. Create Database Schema

Use the Supabase SQL Editor to create the necessary tables:

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Create a new query and paste the schema from [SCHEMA.sql](SCHEMA.sql)
4. Click **Run** to create all tables

### 6. Seed Database (Optional)

Add sample data using the Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Click on **SQL Editor**
3. Create a new query and paste the content from [SEED.sql](SEED.sql)
4. Click **Run** to insert sample boats and groups

Alternatively, add data manually through the **Table Editor** in the Supabase Dashboard.

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The database uses PostgreSQL via Supabase with the following models:

### Models

- **User**: User accounts with social login
- **Account**: OAuth provider accounts
- **Session**: User sessions
- **Boat**: Rowing boats available for booking
- **Group**: User permission groups
- **UserGroup**: Users assigned to groups
- **BoatGroup**: Boats assigned to groups (access control)
- **Booking**: Boat reservations with 2-hour slots

### Permission System

- Boats with **no groups assigned**: All users can book
- Boats with **groups assigned**: Only users in those groups can book
- Users can belong to multiple groups
- Boats can be assigned to multiple groups

## Usage

### For Users

1. **Sign In**: Choose a social provider to authenticate
2. **Browse Boats**: View all boats you have permission to book
3. **Select a Boat**: Click on a boat to see its calendar
4. **Book a Slot**: Choose an available 2-hour time slot
5. **Manage Bookings**: Cancel your bookings if needed

### For Administrators

Use the Supabase Dashboard to manage:
- Add/remove boats
- Create user groups
- Assign users to groups
- Assign boats to groups (set booking permissions)

Access at [supabase.com/dashboard](https://supabase.com/dashboard) → Your Project → **Table Editor**

## Project Structure

```
boatbooking/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/          # NextAuth routes
│   │   │   └── bookings/      # Booking API endpoints
│   │   ├── auth/
│   │   │   └── signin/        # Sign in page
│   │   ├── boats/             # Boat listing and booking pages
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx           # Home page
│   ├── components/
│   │   ├── BoatCard.tsx       # Boat display card
│   │   ├── BookingCalendar.tsx # Calendar with time slots
│   │   └── SignOutButton.tsx  # Sign out component
│   └── lib/
│       ├── auth.ts            # NextAuth configuration
│       └── supabase.ts        # Supabase client
├── SCHEMA.sql                 # Database schema (run in Supabase SQL Editor)
├── SEED.sql                   # Sample data (optional)
├── .env.example               # Environment variables template
├── package.json
└── README.md
```

## API Endpoints

### Bookings

- `POST /api/bookings` - Create a new booking
- `GET /api/bookings` - Get user's bookings
- `DELETE /api/bookings/[id]` - Cancel a booking

### Authentication

- `GET/POST /api/auth/*` - NextAuth.js authentication routes

## Development

### View Database

Use the Supabase Dashboard at [supabase.com/dashboard](https://supabase.com/dashboard):
- **Table Editor**: View and edit data
- **SQL Editor**: Run custom queries
- **API Docs**: Auto-generated REST API documentation

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Deployment

### Supabase Configuration

Your Supabase database is already set up and ready for production. No additional database deployment needed!

### Environment Variables

Ensure all environment variables are set in your production environment, especially:
- Update `NEXTAUTH_URL` to your production domain
- Generate a secure `NEXTAUTH_SECRET`
- Update OAuth redirect URIs in provider consoles

### Deploy to Vercel

1. Push code to GitHub
2. Import project to Vercel
3. Configure environment variables
4. Deploy

## Security Notes

- Never commit `.env` file to version control
- Use strong secrets for `NEXTAUTH_SECRET`
- Keep OAuth credentials secure
- Implement rate limiting for production
- Add input validation and sanitization
- Enable HTTPS in production

## Why Supabase?

Supabase provides several advantages for this project:

- **Native JavaScript Client**: Direct database queries with type-safe operations
- **Instant PostgreSQL Database**: No server setup required
- **Built-in Connection Pooling**: Perfect for serverless deployments (Next.js API routes)
- **Real-time Subscriptions**: Can add live booking updates in the future
- **Auto-generated REST API**: Additional options for data access
- **Free Tier**: Generous limits for development and small projects
- **Dashboard**: Easy data management, SQL editor, and API explorer
- **Automatic Backups**: Daily backups on paid plans
- **Row Level Security**: Can add fine-grained access control at database level

## Future Enhancements

- Admin dashboard for boat/group management
- Email notifications for bookings
- Booking history and statistics
- Multi-day booking support
- Boat availability hours configuration
- User profile management
- Booking waitlist system

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
