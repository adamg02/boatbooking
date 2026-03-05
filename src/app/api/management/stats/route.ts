import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

// GET /api/management/stats – platform-wide aggregate stats
// System owner accounts (isSystemOwner = true) are excluded from all metrics.
export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();

    const now = new Date();
    const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const d14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const d28 = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString();
    const d56 = new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000).toISOString();
    const nowIso = now.toISOString();

    // Fetch system owner user IDs so they can be excluded from login metrics
    const { data: systemOwners } = await supabase
      .from("User")
      .select("id")
      .eq("isSystemOwner", true);
    const systemOwnerIds: string[] = (systemOwners ?? []).map((u: any) => u.id as string);

    const [
      clubsResult,
      usersResult,
      revenueResult,
      activeSubsResult,
      bookings7Result,
      bookingsPrev7Result,
      bookings28Result,
      bookingsPrev28Result,
      logins7Result,
      loginsPrev7Result,
      logins28Result,
      loginsPrev28Result,
    ] = await Promise.all([
      // Total clubs
      supabase.from("Club").select("id", { count: "exact", head: true }),
      // Total active users – exclude system owners
      supabase
        .from("User")
        .select("id", { count: "exact", head: true })
        .eq("isActive", true)
        .eq("isSystemOwner", false),
      // Sum of succeeded payments
      supabase.from("Payment").select("amount").eq("status", "succeeded"),
      // Active subscriptions
      supabase.from("Club").select("id", { count: "exact", head: true }).eq("subscriptionStatus", "active"),
      // Bookings in last 7 days
      supabase.from("Booking").select("id", { count: "exact", head: true }).gte("createdAt", d7).lt("createdAt", nowIso),
      // Bookings in previous 7-day period (7–14 days ago)
      supabase.from("Booking").select("id", { count: "exact", head: true }).gte("createdAt", d14).lt("createdAt", d7),
      // Bookings in last 28 days
      supabase.from("Booking").select("id", { count: "exact", head: true }).gte("createdAt", d28).lt("createdAt", nowIso),
      // Bookings in previous 28-day period (28–56 days ago)
      supabase.from("Booking").select("id", { count: "exact", head: true }).gte("createdAt", d56).lt("createdAt", d28),
      // Logins in last 7 days – exclude system owners
      systemOwnerIds.length > 0
        ? supabase.from("LoginEvent").select("id", { count: "exact", head: true }).gte("createdAt", d7).lt("createdAt", nowIso).not("userId", "in", `(${systemOwnerIds.join(",")})`)
        : supabase.from("LoginEvent").select("id", { count: "exact", head: true }).gte("createdAt", d7).lt("createdAt", nowIso),
      // Logins in previous 7-day period – exclude system owners
      systemOwnerIds.length > 0
        ? supabase.from("LoginEvent").select("id", { count: "exact", head: true }).gte("createdAt", d14).lt("createdAt", d7).not("userId", "in", `(${systemOwnerIds.join(",")})`)
        : supabase.from("LoginEvent").select("id", { count: "exact", head: true }).gte("createdAt", d14).lt("createdAt", d7),
      // Logins in last 28 days – exclude system owners
      systemOwnerIds.length > 0
        ? supabase.from("LoginEvent").select("id", { count: "exact", head: true }).gte("createdAt", d28).lt("createdAt", nowIso).not("userId", "in", `(${systemOwnerIds.join(",")})`)
        : supabase.from("LoginEvent").select("id", { count: "exact", head: true }).gte("createdAt", d28).lt("createdAt", nowIso),
      // Logins in previous 28-day period – exclude system owners
      systemOwnerIds.length > 0
        ? supabase.from("LoginEvent").select("id", { count: "exact", head: true }).gte("createdAt", d56).lt("createdAt", d28).not("userId", "in", `(${systemOwnerIds.join(",")})`)
        : supabase.from("LoginEvent").select("id", { count: "exact", head: true }).gte("createdAt", d56).lt("createdAt", d28),
    ]);

    const totalRevenue = (revenueResult.data ?? []).reduce(
      (sum: number, p: any) => sum + (p.amount ?? 0),
      0
    );

    return NextResponse.json({
      totalClubs: clubsResult.count ?? 0,
      totalActiveUsers: usersResult.count ?? 0,
      totalRevenuePence: totalRevenue,
      activeSubscriptions: activeSubsResult.count ?? 0,
      bookings7: bookings7Result.count ?? 0,
      bookingsPrev7: bookingsPrev7Result.count ?? 0,
      bookings28: bookings28Result.count ?? 0,
      bookingsPrev28: bookingsPrev28Result.count ?? 0,
      logins7: logins7Result.count ?? 0,
      loginsPrev7: loginsPrev7Result.count ?? 0,
      logins28: logins28Result.count ?? 0,
      loginsPrev28: loginsPrev28Result.count ?? 0,
    });
  } catch (error: any) {
    console.error("Management stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
