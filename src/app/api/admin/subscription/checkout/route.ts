import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin";
import { stripe, STRIPE_PRICES } from "@/lib/stripe";

// POST /api/admin/subscription/checkout
// Body: { interval: 'month' | 'year' }
export async function POST(request: Request) {
  try {
    const adminUser = await requireAdmin();
    const supabase = await getSupabaseClient();
    const { interval } = await request.json();

    if (interval !== "month" && interval !== "year") {
      return NextResponse.json({ error: "interval must be 'month' or 'year'" }, { status: 400 });
    }

    const priceId = interval === "year" ? STRIPE_PRICES.yearly : STRIPE_PRICES.monthly;

    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe price not configured. Set STRIPE_MONTHLY_PRICE_ID / STRIPE_YEARLY_PRICE_ID env vars." },
        { status: 500 }
      );
    }

    // Load club info including existing Stripe customer
    const { data: club } = await supabase
      .from("Club")
      .select("id, name, stripeCustomerId, stripeSubscriptionId, subscriptionTier")
      .eq("id", adminUser.clubId)
      .single();

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    // If already paid, redirect to customer portal instead
    if (club.subscriptionTier === "paid" && club.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "Already on paid plan. Use the billing portal to manage your subscription." },
        { status: 409 }
      );
    }

    // Load admin user email
    const { data: userData } = await supabase
      .from("User")
      .select("email, name")
      .eq("id", adminUser.id)
      .single();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Reuse or create a Stripe customer — verify it still exists first
    let stripeCustomerId = club.stripeCustomerId;
    if (stripeCustomerId) {
      try {
        const existing = await stripe.customers.retrieve(stripeCustomerId);
        if ((existing as any).deleted) {
          stripeCustomerId = null; // treat deleted customer as missing
        }
      } catch {
        stripeCustomerId = null; // customer not found in this Stripe account
        // Clear stale IDs from DB
        await supabase
          .from("Club")
          .update({ stripeCustomerId: null, stripeSubscriptionId: null, subscriptionTier: "free", subscriptionStatus: null, updatedAt: new Date().toISOString() })
          .eq("id", club.id);
      }
    }

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        name: club.name,
        email: userData?.email ?? undefined,
        metadata: { clubId: club.id },
      });
      stripeCustomerId = customer.id;

      await supabase
        .from("Club")
        .update({ stripeCustomerId, updatedAt: new Date().toISOString() })
        .eq("id", club.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/admin/subscription?subscription=success`,
      cancel_url: `${appUrl}/admin/subscription?subscription=cancelled`,
      metadata: { clubId: club.id },
      subscription_data: {
        metadata: { clubId: club.id },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
