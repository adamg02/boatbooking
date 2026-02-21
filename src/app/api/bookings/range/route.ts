import { NextResponse } from "next/server";
import { addDays, format, parseISO, startOfDay } from "date-fns";
import { getSupabaseClient } from "@/lib/supabase";
import { dateQuerySchema, safeValidateRequest } from "@/lib/validation";

const MAX_DAYS = 90;

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

    if (!startParam) {
      return NextResponse.json({ error: "start date is required" }, { status: 400 });
    }

    const validation = safeValidateRequest(dateQuerySchema, { date: startParam });
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid date format",
          details: validation.error.errors.map((e) => e.message),
        },
        { status: 400 }
      );
    }

    const days = Math.min(Number(daysParam ?? 7), MAX_DAYS);
    if (!Number.isFinite(days) || days <= 0) {
      return NextResponse.json(
        { error: "days must be a positive integer" },
        { status: 400 }
      );
    }

    const rangeStart = startOfDay(parseISO(startParam));
    const rangeEnd = addDays(rangeStart, days);

    if (Number.isNaN(rangeStart.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    // Scope to the user's club ───────────────────────────────────────────────
    const { data: userData } = await supabase
      .from("User")
      .select("clubId")
      .eq("id", user.id)
      .single();

    const clubId = userData?.clubId;

    let boatIds: string[] = [];
    if (clubId) {
      const { data: clubBoats } = await supabase
        .from("Boat")
        .select("id")
        .eq("clubId", clubId);
      boatIds = clubBoats?.map((b) => b.id) ?? [];
    }

    // Single DB query for the entire range ───────────────────────────────────
    const { data: bookings, error } = await supabase
      .from("Booking")
      .select("*, user:User(id, name, email), boat:Boat(id, name)")
      .eq("status", "CONFIRMED")
      .in("boatId", boatIds.length > 0 ? boatIds : ["__none__"])
      .gte("startTime", rangeStart.toISOString())
      .lt("startTime", rangeEnd.toISOString())
      .order("startTime", { ascending: true });

    if (error) {
      console.error("Fetch range bookings error:", error);
      return NextResponse.json(
        { error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    // Group by date string (yyyy-MM-dd) ──────────────────────────────────────
    const grouped: Record<string, typeof bookings> = {};

    // Pre-populate every requested day so the client always gets a full set
    for (let i = 0; i < days; i++) {
      grouped[format(addDays(rangeStart, i), "yyyy-MM-dd")] = [];
    }

    for (const booking of bookings ?? []) {
      const dateKey = format(parseISO(booking.startTime), "yyyy-MM-dd");
      if (grouped[dateKey]) {
        grouped[dateKey].push(booking);
      }
    }

    return NextResponse.json(grouped);
  } catch (err) {
    console.error("Fetch range bookings error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
