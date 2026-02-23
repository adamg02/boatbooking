import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

// GET /api/management/clubs – list all clubs with per-club stats
export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();
    const now = new Date().toISOString();

    const { data: clubs, error } = await supabase
      .from("Club")
      .select(
        "id, name, joinCode, subscriptionTier, subscriptionStatus, billingInterval, subscriptionCurrentPeriodEnd, stripeCustomerId, createdAt"
      )
      .order("createdAt", { ascending: false });

    if (error || !clubs) {
      return NextResponse.json({ error: "Failed to fetch clubs" }, { status: 500 });
    }

    // For each club, gather user count, total bookings, open bookings, and revenue
    const enriched = await Promise.all(
      clubs.map(async (club) => {
        const [usersRes, boatsRes, paymentsRes] = await Promise.all([
          supabase
            .from("User")
            .select("id", { count: "exact", head: true })
            .eq("clubId", club.id)
            .eq("isActive", true),
          supabase
            .from("Boat")
            .select("id")
            .eq("clubId", club.id),
          supabase
            .from("Payment")
            .select("amount, createdAt")
            .eq("clubId", club.id)
            .eq("status", "succeeded")
            .order("createdAt", { ascending: true }),
        ]);

        const boatIds = (boatsRes.data ?? []).map((b: any) => b.id);

        const [totalBookingsRes, openBookingsRes, lastBookingRes] = await Promise.all([
          boatIds.length > 0
            ? supabase
                .from("Booking")
                .select("id", { count: "exact", head: true })
                .in("boatId", boatIds)
            : Promise.resolve({ count: 0 }),
          boatIds.length > 0
            ? supabase
                .from("Booking")
                .select("id", { count: "exact", head: true })
                .in("boatId", boatIds)
                .eq("status", "CONFIRMED")
                .gte("endTime", now)
            : Promise.resolve({ count: 0 }),
          boatIds.length > 0
            ? supabase
                .from("Booking")
                .select("createdAt")
                .in("boatId", boatIds)
                .order("createdAt", { ascending: false })
                .limit(1)
            : Promise.resolve({ data: [] }),
        ]);

        const payments = paymentsRes.data ?? [];
        const totalPaidPence = payments.reduce(
          (sum: number, p: any) => sum + (p.amount ?? 0),
          0
        );
        const firstPaymentAt =
          payments.length > 0 ? payments[0].createdAt : null;

        const lastBookingData = (lastBookingRes as any).data ?? [];
        const lastBookingAt = lastBookingData.length > 0 ? lastBookingData[0].createdAt : null;

        return {
          id: club.id,
          name: club.name,
          joinCode: club.joinCode,
          createdAt: club.createdAt,
          subscriptionTier: club.subscriptionTier ?? "free",
          subscriptionStatus: club.subscriptionStatus ?? null,
          billingInterval: club.billingInterval ?? null,
          subscriptionCurrentPeriodEnd: club.subscriptionCurrentPeriodEnd ?? null,
          hasStripe: !!club.stripeCustomerId,
          activeUsers: usersRes.count ?? 0,
          totalBookings: totalBookingsRes.count ?? 0,
          openBookings: openBookingsRes.count ?? 0,
          totalPaidPence,
          firstPaymentAt,
          lastBookingAt,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error: any) {
    console.error("Management clubs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
