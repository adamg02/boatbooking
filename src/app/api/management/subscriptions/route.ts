import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

// GET /api/management/subscriptions – list all subscriptions with club and billing info.
// A club is considered to have a subscription when it has a Stripe subscription ID
// or a subscription status recorded.
export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();

    const { data: clubs, error } = await supabase
      .from("Club")
      .select(
        "id, name, joinCode, subscriptionTier, subscriptionStatus, billingInterval, subscriptionCurrentPeriodEnd, stripeCustomerId, stripeSubscriptionId, createdAt"
      )
      .or("stripeSubscriptionId.not.is.null,subscriptionStatus.not.is.null")
      .order("createdAt", { ascending: false });

    if (error || !clubs) {
      return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
    }

    const enriched = await Promise.all(
      clubs.map(async (club) => {
        const [usersRes, paymentsRes, lastLoginRes, boatsRes] = await Promise.all([
          supabase
            .from("User")
            .select("id", { count: "exact", head: true })
            .eq("clubId", club.id)
            .eq("isActive", true),
          supabase
            .from("Payment")
            .select("amount, currency, createdAt")
            .eq("clubId", club.id)
            .eq("status", "succeeded")
            .order("createdAt", { ascending: true }),
          supabase
            .from("User")
            .select("lastLogin")
            .eq("clubId", club.id)
            .not("lastLogin", "is", null)
            .order("lastLogin", { ascending: false })
            .limit(1),
          supabase
            .from("Boat")
            .select("id")
            .eq("clubId", club.id),
        ]);

        const boatIds = (boatsRes.data ?? []).map((b: any) => b.id);
        const lastBookingRes =
          boatIds.length > 0
            ? await supabase
                .from("Booking")
                .select("createdAt")
                .in("boatId", boatIds)
                .order("createdAt", { ascending: false })
                .limit(1)
            : { data: [] };

        const lastLoginData = lastLoginRes.data ?? [];
        const lastLoginAt: string | null =
          lastLoginData.length > 0 ? lastLoginData[0].lastLogin : null;
        const lastBookingData = (lastBookingRes as any).data ?? [];
        const lastBookingAt: string | null =
          lastBookingData.length > 0 ? lastBookingData[0].createdAt : null;

        // Most recent of last login / last booking
        const lastActivityAt =
          lastLoginAt && lastBookingAt
            ? new Date(lastLoginAt) > new Date(lastBookingAt)
              ? lastLoginAt
              : lastBookingAt
            : lastLoginAt ?? lastBookingAt;

        const payments = paymentsRes.data ?? [];
        const totalPaidPence = payments.reduce(
          (sum: number, p: any) => sum + (p.amount ?? 0),
          0
        );
        const firstPayment = payments.length > 0 ? payments[0] : null;
        const lastPayment = payments.length > 0 ? payments[payments.length - 1] : null;

        return {
          clubId: club.id,
          clubName: club.name,
          joinCode: club.joinCode,
          clubCreatedAt: club.createdAt,
          subscriptionTier: club.subscriptionTier ?? "free",
          subscriptionStatus: club.subscriptionStatus ?? null,
          billingInterval: club.billingInterval ?? null,
          subscriptionCurrentPeriodEnd: club.subscriptionCurrentPeriodEnd ?? null,
          stripeCustomerId: club.stripeCustomerId ?? null,
          stripeSubscriptionId: club.stripeSubscriptionId ?? null,
          activeUsers: usersRes.count ?? 0,
          paymentCount: payments.length,
          totalPaidPence,
          currency: lastPayment?.currency ?? "gbp",
          startedAt: firstPayment?.createdAt ?? null,
          lastPaymentAt: lastPayment?.createdAt ?? null,
          lastPaymentPence: lastPayment?.amount ?? null,
          lastActivityAt,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error: any) {
    console.error("Management subscriptions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
