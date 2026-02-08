import { getSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boatId, startTime, endTime } = await request.json();

    if (!boatId || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Validate 2-hour slot
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (duration !== 2) {
      return NextResponse.json(
        { error: "Booking must be exactly 2 hours" },
        { status: 400 }
      );
    }

    // Check if boat exists and is active
    const { data: boat, error: boatError } = await supabase
      .from('Boat')
      .select('*, boatGroups:BoatGroup(groupId)')
      .eq('id', boatId)
      .eq('isActive', true)
      .single();

    if (boatError || !boat) {
      return NextResponse.json({ error: "Boat not found or not available for booking" }, { status: 404 });
    }

    // Check if user has permission to book this boat
    const { data: userGroups } = await supabase
      .from('UserGroup')
      .select('groupId')
      .eq('userId', user.id);

    const userGroupIds = userGroups?.map(ug => ug.groupId) || [];
    const boatGroupIds = boat.boatGroups?.map((bg: any) => bg.groupId) || [];

    const hasAccess =
      boatGroupIds.length === 0 || // No restrictions
      boatGroupIds.some((id: string) => userGroupIds.includes(id)); // User in allowed group

    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have permission to book this boat" },
        { status: 403 }
      );
    }

    // Check for conflicts
    const { data: existingBookings } = await supabase
      .from('Booking')
      .select('*')
      .eq('boatId', boatId)
      .eq('status', 'CONFIRMED')
      .or(`startTime.lte.${start.toISOString()},endTime.gt.${start.toISOString()},startTime.lt.${end.toISOString()},endTime.gte.${end.toISOString()}`);

    if (existingBookings && existingBookings.length > 0) {
      return NextResponse.json(
        { error: "Time slot already booked" },
        { status: 409 }
      );
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('Booking')
      .insert({
        userId: user.id,
        boatId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        status: 'CONFIRMED',
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Booking error:', bookingError);
      return NextResponse.json(
        { error: "Failed to create booking" },
        { status: 500 }
      );
    }

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date().toISOString();

    const { data: bookings, error } = await supabase
      .from('Booking')
      .select('*, boat:Boat(*)')
      .eq('userId', user.id)
      .eq('status', 'CONFIRMED')
      .gte('endTime', now)
      .order('startTime', { ascending: true });

    if (error) {
      console.error('Fetch bookings error:', error);
      return NextResponse.json(
        { error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    return NextResponse.json(bookings || []);
  } catch (error) {
    console.error("Fetch bookings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
