import { NextResponse } from "next/server";
import { addDays, parseISO, startOfDay } from "date-fns";
import { getSupabaseClient } from "@/lib/supabase";
import { dateQuerySchema, safeValidateRequest } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    if (!dateParam) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    // Validate date format
    const validation = safeValidateRequest(dateQuerySchema, { date: dateParam });
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Invalid date format",
          details: validation.error.errors.map(e => e.message)
        },
        { status: 400 }
      );
    }

    const dayStart = startOfDay(parseISO(dateParam));
    const dayEnd = addDays(dayStart, 1);

    if (Number.isNaN(dayStart.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    // Get the user's club to scope the bookings
    const { data: userData } = await supabase
      .from('User')
      .select('clubId')
      .eq('id', user.id)
      .single();

    const clubId = userData?.clubId;

    // Get boat IDs for this club
    let boatIds: string[] = [];
    if (clubId) {
      const { data: clubBoats } = await supabase
        .from('Boat')
        .select('id')
        .eq('clubId', clubId);
      boatIds = clubBoats?.map((b) => b.id) ?? [];
    }

    const { data: bookings, error } = await supabase
      .from("Booking")
      .select(
        "*, user:User(id, name), boat:Boat(id, name)"
      )
      .eq("status", "CONFIRMED")
      .in("boatId", boatIds.length > 0 ? boatIds : ['__none__'])
      .gte("startTime", dayStart.toISOString())
      .lt("startTime", dayEnd.toISOString())
      .order("startTime", { ascending: true });

    if (error) {
      console.error("Fetch daily bookings error:", error);
      return NextResponse.json(
        { error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    return NextResponse.json(bookings || []);
  } catch (error) {
    console.error("Fetch daily bookings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
