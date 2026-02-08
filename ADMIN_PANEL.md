# Admin Panel Documentation

The boat booking application now includes a complete admin panel for managing users, boats, and bookings.

## Access

Only users in the **Admin** group can access the admin panel. To make a user an admin:

1. Go to Supabase Dashboard → Table Editor → `Group` table
2. Find the "Admin" group (should already exist from SEED.sql)
3. Go to the `UserGroup` table
4. Insert a new row:
   - `userId`: The user's ID from the `User` table
   - `groupId`: The Admin group's ID

## Admin Panel Features

### Dashboard (`/admin`)

Overview page showing:
- Total users count
- Total boats count
- Active bookings count
- Quick action links to management pages

### User Management (`/admin/users`)

**Features:**
- View all registered users
- See what groups each user belongs to
- Assign/remove users from groups
- View user join date

**How to manage user groups:**
1. Click "Edit Groups" on any user
2. Check/uncheck groups to assign/remove
3. Click "Save"

### Boat Management (`/admin/boats`)

**Features:**
- View all boats
- Create new boats
- Edit boat details (name, description, capacity, image)
- Assign boats to groups (for access control)

**How to create a boat:**
1. Click "+ Add Boat"
2. Fill in boat details:
   - Name (required)
   - Description (optional)
   - Capacity (number of people)
   - Image URL (optional)
3. Click "Create Boat"

**How to edit a boat:**
1. Click "Edit Boat" on any boat card
2. Update details
3. Select which groups can access this boat (empty = all users)
4. Click "Save Changes"

**Access Control:**
- If a boat has **no groups assigned**: All users can book it
- If a boat has **groups assigned**: Only users in those groups can book it

### Booking Management (`/admin/bookings`)

**Features:**
- View all bookings across all boats
- Filter by upcoming, past, or all bookings
- Cancel any booking (admin override)
- See booking details: date, time, boat, user

**How to cancel a booking:**
1. Find the booking in the list
2. Click "Cancel"
3. Confirm the cancellation

**Filters:**
- **All**: Shows every booking regardless of status
- **Upcoming**: Shows confirmed bookings in the future
- **Past/Cancelled**: Shows past bookings and cancelled ones

## Navigation

The admin panel has a consistent header with navigation:
- Dashboard
- Users
- Boats
- Bookings
- Back to Boats (returns to main app)
- Sign Out

Users with admin access will see an "Admin Panel" button in the boats page header.

## API Endpoints

All admin endpoints require authentication and admin group membership:

### User Management
- `GET /api/admin/users` - Get all users with their groups
- `POST /api/admin/users` - Update user groups
- `GET /api/admin/groups` - Get all groups

### Boat Management
- `GET /api/admin/boats` - Get all boats with their groups
- `POST /api/admin/boats` - Update boat details and groups
- `PUT /api/admin/boats` - Create new boat

### Booking Management
- `GET /api/admin/bookings` - Get all bookings
- `DELETE /api/admin/bookings?id={bookingId}` - Cancel any booking

## Security

**Access Control:**
- All admin pages check for authentication
- Admin group membership is verified on every request
- Non-admin users are redirected to `/boats`
- API routes return 403 Forbidden for non-admin users

**Permission Check Function:**
```typescript
import { requireAdmin } from "@/lib/admin";

// In API route or server component
const user = await requireAdmin(); // Throws if not admin
```

## Setup Instructions

1. **Create Admin Group** (if not exists):
   ```sql
   INSERT INTO "Group" (id, name) VALUES (gen_random_uuid(), 'Admin');
   ```

2. **Make yourself admin**:
   ```sql
   INSERT INTO "UserGroup" (id, "userId", "groupId")
   VALUES (
     gen_random_uuid(),
     'your-user-id-here',
     (SELECT id FROM "Group" WHERE name = 'Admin')
   );
   ```

3. **Access admin panel**:
   - Sign in to the app
   - You'll see "Admin Panel" button in the boats page
   - Or navigate directly to `/admin`

## Common Tasks

### Create a new user group
1. Go to Supabase Dashboard → Table Editor → `Group`
2. Insert new row with a name (e.g., "Senior Members")
3. Go to Admin Panel → Users to assign users to the new group

### Restrict a boat to specific users
1. Admin Panel → Boats
2. Click "Edit Boat" on the boat
3. Select the groups that should have access
4. Click "Save Changes"

### View all bookings for a boat
1. Admin Panel → Bookings
2. Use browser search (Ctrl+F) to find the boat name
3. Or filter by upcoming/past

### Cancel a user's booking
1. Admin Panel → Bookings
2. Find the booking
3. Click "Cancel"

## Mobile Responsive

The admin panel is fully responsive and works on mobile devices:
- Navigation collapses to horizontal scroll on small screens
- Tables scroll horizontally on narrow screens
- Modals are mobile-friendly

## Troubleshooting

### "Forbidden - admin access required"
- Make sure your user is in the Admin group
- Check the `UserGroup` table in Supabase
- Sign out and sign in again

### Can't see admin button on boats page
- Verify you're in the Admin group
- Clear browser cache
- Check browser console for errors

### Changes not saving
- Check browser console for errors
- Verify database permissions in Supabase
- Check that tables don't have restrictive RLS policies

## Future Enhancements

Possible additions to the admin panel:
- User activity logs
- Booking statistics and reports
- Bulk operations (cancel multiple bookings)
- Email notifications to users
- Boat availability reports
- Custom group permissions (beyond just boat access)
- Booking conflicts resolution
