import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getSupabaseClient } from "@/lib/supabase";
import type Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Stripe webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await getSupabaseClient();

  try {
    switch (event.type) {
      // ── Subscription created or updated ──────────────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const item = sub.items.data[0];
        const interval = (item?.price?.recurring?.interval ?? "month") as "month" | "year";
        // current_period_end moved to item level in API 2024-09-30+
        const periodEndTimestamp: number | undefined =
          (item as any)?.current_period_end ?? (sub as any).current_period_end;
        const periodEnd = periodEndTimestamp
          ? new Date(periodEndTimestamp * 1000).toISOString()
          : null;
        const tier = sub.status === "active" || sub.status === "trialing" ? "paid" : "free";

        await supabase
          .from("Club")
          .update({
            subscriptionTier: tier,
            subscriptionStatus: sub.status,
            billingInterval: interval,
            stripeSubscriptionId: sub.id,
            subscriptionCurrentPeriodEnd: periodEnd,
            updatedAt: new Date().toISOString(),
          })
          .eq("stripeCustomerId", customerId);

        break;
      }

      // ── Subscription cancelled ────────────────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        await supabase
          .from("Club")
          .update({
            subscriptionTier: "free",
            subscriptionStatus: "canceled",
            billingInterval: null,
            stripeSubscriptionId: null,
            subscriptionCurrentPeriodEnd: null,
            updatedAt: new Date().toISOString(),
          })
          .eq("stripeCustomerId", customerId);

        break;
      }

      // ── Invoice paid (record payment) ─────────────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice & Record<string, any>;
        const customerId = invoice.customer as string;

        // Find the club by Stripe customer ID
        const { data: club } = await supabase
          .from("Club")
          .select("id, billingInterval")
          .eq("stripeCustomerId", customerId)
          .single();

        if (!club) break;

        const sub = (invoice as any).subscription
          ? await stripe.subscriptions.retrieve((invoice as any).subscription as string)
          : null;

        const interval = (sub?.items.data[0]?.price?.recurring?.interval ?? club.billingInterval ?? "month") as "month" | "year";

        // current_period_start/end moved to item level in API 2024-09-30+
        const subItem = sub?.items.data[0] as any;
        const periodStart = subItem?.current_period_start
          ? new Date(subItem.current_period_start * 1000).toISOString()
          : (sub as any)?.current_period_start
          ? new Date((sub as any).current_period_start * 1000).toISOString()
          : null;
        const periodEnd = subItem?.current_period_end
          ? new Date(subItem.current_period_end * 1000).toISOString()
          : (sub as any)?.current_period_end
          ? new Date((sub as any).current_period_end * 1000).toISOString()
          : null;

        await supabase.from("Payment").insert({
          clubId: club.id,
          stripeInvoiceId: invoice.id,
          stripePaymentIntentId:
            typeof invoice.payment_intent === "string" ? invoice.payment_intent : null,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: "succeeded",
          description: invoice.description ?? `${interval === "year" ? "Annual" : "Monthly"} subscription`,
          billingInterval: interval,
          periodStart,
          periodEnd,
          receiptUrl: invoice.hosted_invoice_url ?? null,
          hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
          createdAt: new Date().toISOString(),
        });

        break;
      }

      // ── Invoice payment failed ─────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & Record<string, any>;
        const customerId = invoice.customer as string;

        const { data: club } = await supabase
          .from("Club")
          .select("id, billingInterval")
          .eq("stripeCustomerId", customerId)
          .single();

        if (!club) break;

        await supabase.from("Payment").insert({
          clubId: club.id,
          stripeInvoiceId: invoice.id,
          stripePaymentIntentId:
            typeof invoice.payment_intent === "string" ? invoice.payment_intent : null,
          amount: invoice.amount_due,
          currency: invoice.currency,
          status: "failed",
          description: "Subscription payment failed",
          billingInterval: club.billingInterval ?? "month",
          createdAt: new Date().toISOString(),
        });

        break;
      }

      default:
        // Unhandled event type — ignore
        break;
    }
  } catch (err) {
    console.error("Error handling Stripe webhook event:", event.type, err);
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
