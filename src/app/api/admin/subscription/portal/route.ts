import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin";
import { stripe } from "@/lib/stripe";

// POST /api/admin/subscription/portal – redirect to Stripe customer portal
export async function POST() {
  try {
    const adminUser = await requireAdmin();
    const supabase = await getSupabaseClient();

    const { data: club } = await supabase
      .from("Club")
      .select("stripeCustomerId")
      .eq("id", adminUser.clubId)
      .single();

    if (!club?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing account found. Please subscribe first." },
        { status: 404 }
      );
    }

    // Verify the customer still exists in this Stripe account
    try {
      const existing = await stripe.customers.retrieve(club.stripeCustomerId);
      if ((existing as any).deleted) throw new Error("deleted");
    } catch {
      // Stale customer ID — clear it so the user can re-subscribe
      const supabaseForUpdate = await getSupabaseClient();
      await supabaseForUpdate
        .from("Club")
        .update({ stripeCustomerId: null, stripeSubscriptionId: null, subscriptionTier: "free", subscriptionStatus: null, updatedAt: new Date().toISOString() })
        .eq("id", adminUser.clubId);
      return NextResponse.json(
        { error: "Billing account not found. Please subscribe again." },
        { status: 404 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.billingPortal.sessions.create({
      customer: club.stripeCustomerId,
      return_url: `${appUrl}/admin/subscription`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Billing portal error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to open billing portal" },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
