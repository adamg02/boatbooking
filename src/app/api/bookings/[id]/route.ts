import { getSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { safeValidateRequest, uuidQuerySchema } from "@/lib/validation";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { id } = await params;
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate UUID format
    const validation = safeValidateRequest(uuidQuerySchema, { id });
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Invalid booking ID format",
          details: validation.error.errors.map(e => e.message)
        },
        { status: 400 }
      );
    }

    // Get booking to verify ownership
    const { data: booking, error: fetchError } = await supabase
      .from('Booking')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.userId !== user.id) {
      return NextResponse.json(
        { error: "You can only cancel your own bookings" },
        { status: 403 }
      );
    }

    // Update status to CANCELLED instead of deleting
    const { error: updateError } = await supabase
      .from('Booking')
      .update({ status: 'CANCELLED' })
      .eq('id', id);

    if (updateError) {
      console.error('Cancel booking error:', updateError);
      return NextResponse.json(
        { error: "Failed to cancel booking" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Booking cancelled" });
  } catch (error) {
    console.error("Cancel booking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
