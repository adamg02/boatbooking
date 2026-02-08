import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin";

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
    await requireAdmin();
    const supabase = await getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('id');

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID required" },
        { status: 400 }
      );
    }

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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Cancel booking error:", error);
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes('Unauthorized') ? 401 : 403 }
    );
  }
}
