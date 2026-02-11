import { NextResponse } from "next/server";
import { addDays, format, parseISO, startOfDay } from "date-fns";
import { getSupabaseClient } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get("start");
    const daysParam = searchParams.get("days");

    if (!startParam || !daysParam) {
      return NextResponse.json(
        { error: "Start date and days are required" },
        { status: 400 }
      );
    }

    const startDate = startOfDay(parseISO(startParam));
    const days = Number(daysParam);

    if (Number.isNaN(startDate.getTime()) || !Number.isFinite(days) || days <= 0) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const endDate = addDays(startDate, days);

    const { data: bookings, error } = await supabase
      .from("Booking")
      .select("startTime")
      .eq("status", "CONFIRMED")
      .gte("startTime", startDate.toISOString())
      .lt("startTime", endDate.toISOString());

    if (error) {
      console.error("Fetch daily summary error:", error);
      return NextResponse.json(
        { error: "Failed to fetch summary" },
        { status: 500 }
      );
    }

    const counts: Record<string, number> = {};
    for (const booking of bookings || []) {
      const dayKey = format(parseISO(booking.startTime), "yyyy-MM-dd");
      counts[dayKey] = (counts[dayKey] || 0) + 1;
    }

    return NextResponse.json({ counts });
  } catch (error) {
    console.error("Fetch daily summary error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
