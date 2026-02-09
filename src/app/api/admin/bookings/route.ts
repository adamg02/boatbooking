import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin";
import { format } from "date-fns";

// GET all bookings
export async function GET() {
  try {
    await requireAdmin();
    const supabase = await getSupabaseClient();

    const { data: bookings, error } = await supabase
      .from('Booking')
      .select(`
        *,
        user:User(id, name, email),
        boat:Boat(id, name)
      `)
      .order('startTime', { ascending: false });

    if (error) {
      console.error('Fetch bookings error:', error);
      return NextResponse.json(
        { error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    return NextResponse.json(bookings || []);
  } catch (error: any) {
    console.error("Admin bookings error:", error);
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes('Unauthorized') ? 401 : 403 }
    );
  }
}

// DELETE any booking (admin override)
export async function DELETE(request: Request) {
  try {
    const adminUser = await requireAdmin();
    const supabase = await getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('id');

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID required" },
        { status: 400 }
      );
    }

    // Get booking details before cancelling (for email notification)
    const { data: booking, error: fetchError } = await supabase
      .from('Booking')
      .select(`
        *,
        user:User(id, name, email),
        boat:Boat(id, name)
      `)
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      console.error('Fetch booking error:', fetchError);
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Get admin user details
    const { data: adminUserData } = await supabase
      .from('User')
      .select('name, email')
      .eq('id', adminUser.id)
      .single();

    // Cancel the booking
    const { error } = await supabase
      .from('Booking')
      .update({ status: 'CANCELLED' })
      .eq('id', bookingId);

    if (error) {
      console.error('Cancel booking error:', error);
      return NextResponse.json(
        { error: "Failed to cancel booking" },
        { status: 500 }
      );
    }

    // Send email notification to the user
    const cancelledByName = adminUserData?.name || adminUserData?.email || 'Administrator';
    
    // Dynamically import email function to avoid build-time requirement
    try {
      const { sendBookingCancellationEmail } = await import('@/lib/email');
      await sendBookingCancellationEmail({
        userName: booking.user.name || '',
        userEmail: booking.user.email,
        boatName: booking.boat.name,
        startTime: booking.startTime,
        endTime: booking.endTime,
        cancelledBy: cancelledByName,
      });
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Cancel booking error:", error);
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes('Unauthorized') ? 401 : 403 }
    );
  }
}
