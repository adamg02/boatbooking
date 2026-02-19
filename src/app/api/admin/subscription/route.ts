import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin";
import { FREE_TIER_BOAT_LIMIT } from "@/lib/stripe";

// GET /api/admin/subscription – returns current subscription details for the club
export async function GET() {
  try {
    const adminUser = await requireAdmin();
    const supabase = await getSupabaseClient();

    const { data: club, error } = await supabase
      .from("Club")
      .select(
        "id, subscriptionTier, subscriptionStatus, billingInterval, subscriptionCurrentPeriodEnd, stripeCustomerId, stripeSubscriptionId"
      )
      .eq("id", adminUser.clubId)
      .single();

    if (error || !club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    // Count active boats
    const { count: boatCount } = await supabase
      .from("Boat")
      .select("id", { count: "exact", head: true })
      .eq("clubId", adminUser.clubId)
      .eq("isActive", true);

    return NextResponse.json({
      tier: club.subscriptionTier ?? "free",
      status: club.subscriptionStatus ?? null,
      billingInterval: club.billingInterval ?? null,
      currentPeriodEnd: club.subscriptionCurrentPeriodEnd ?? null,
      hasStripeCustomer: !!club.stripeCustomerId,
      hasStripeSubscription: !!club.stripeSubscriptionId,
      boatCount: boatCount ?? 0,
      freeTierLimit: FREE_TIER_BOAT_LIMIT,
    });
  } catch (error: any) {
    console.error("Get subscription error:", error);
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes("Unauthorized") ? 401 : 403 }
    );
  }
}
