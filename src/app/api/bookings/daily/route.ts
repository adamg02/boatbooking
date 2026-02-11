import { NextResponse } from "next/server";
import { addDays, parseISO, startOfDay } from "date-fns";
import { getSupabaseClient } from "@/lib/supabase";

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

    const dayStart = startOfDay(parseISO(dateParam));
    const dayEnd = addDays(dayStart, 1);

    if (Number.isNaN(dayStart.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const { data: bookings, error } = await supabase
      .from("Booking")
      .select(
        "*, user:User(id, name, email), boat:Boat(id, name)"
      )
      .eq("status", "CONFIRMED")
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
