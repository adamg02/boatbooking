import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

// GET /api/management/stats – platform-wide aggregate stats
export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();

    const now = new Date().toISOString();

    const [
      clubsResult,
      usersResult,
      totalBookingsResult,
      openBookingsResult,
      revenueResult,
      activeSubsResult,
    ] = await Promise.all([
      // Total clubs
      supabase.from("Club").select("id", { count: "exact", head: true }),
      // Total active users
      supabase.from("User").select("id", { count: "exact", head: true }).eq("isActive", true),
      // Total bookings ever
      supabase.from("Booking").select("id", { count: "exact", head: true }),
      // Open (future confirmed) bookings
      supabase
        .from("Booking")
        .select("id", { count: "exact", head: true })
        .eq("status", "CONFIRMED")
        .gte("endTime", now),
      // Sum of succeeded payments
      supabase
        .from("Payment")
        .select("amount")
        .eq("status", "succeeded"),
      // Active subscriptions
      supabase
        .from("Club")
        .select("id", { count: "exact", head: true })
        .eq("subscriptionStatus", "active"),
    ]);

    const totalRevenue = (revenueResult.data ?? []).reduce(
      (sum: number, p: any) => sum + (p.amount ?? 0),
      0
    );

    return NextResponse.json({
      totalClubs: clubsResult.count ?? 0,
      totalActiveUsers: usersResult.count ?? 0,
      totalBookings: totalBookingsResult.count ?? 0,
      openBookings: openBookingsResult.count ?? 0,
      totalRevenuePence: totalRevenue,
      activeSubscriptions: activeSubsResult.count ?? 0,
    });
  } catch (error: any) {
    console.error("Management stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
