import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getSupabaseAdminClient } from "@/lib/supabase";
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

  const supabase = getSupabaseAdminClient();

  try {
    switch (event.type) {
      // ── Subscription created or updated ──────────────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const clubId = sub.metadata?.clubId;
        const item = sub.items.data[0];
        const interval = (item?.price?.recurring?.interval ?? "month") as "month" | "year";
        // current_period_end is present at item level and/or root depending on API version
        const periodEndTimestamp: number | undefined =
          (item as any)?.current_period_end ?? (sub as any).current_period_end;
        const periodEnd = periodEndTimestamp
          ? new Date(periodEndTimestamp * 1000).toISOString()
          : null;
        const tier = sub.status === "active" || sub.status === "trialing" ? "paid" : "free";

        const updatePayload = {
          subscriptionTier: tier,
          subscriptionStatus: sub.status,
          billingInterval: interval,
          stripeCustomerId: customerId,
          stripeSubscriptionId: sub.id,
          subscriptionCurrentPeriodEnd: periodEnd,
          updatedAt: new Date().toISOString(),
        };

        if (clubId) {
          // Preferred: match by clubId stored in subscription metadata
          await supabase.from("Club").update(updatePayload).eq("id", clubId);
        } else {
          // Fallback: match by Stripe customer ID
          await supabase.from("Club").update(updatePayload).eq("stripeCustomerId", customerId);
        }

        break;
      }

      // ── Subscription cancelled ────────────────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const clubId = sub.metadata?.clubId;

        const cancelPayload = {
          subscriptionTier: "free",
          subscriptionStatus: "canceled",
          billingInterval: null,
          stripeSubscriptionId: null,
          subscriptionCurrentPeriodEnd: null,
          updatedAt: new Date().toISOString(),
        };

        if (clubId) {
          await supabase.from("Club").update(cancelPayload).eq("id", clubId);
        } else {
          await supabase.from("Club").update(cancelPayload).eq("stripeCustomerId", customerId);
        }

        break;
      }

      // ── Invoice paid (record payment) ─────────────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice & Record<string, any>;
        const customerId = invoice.customer as string;

        const sub = invoice.subscription
          ? await stripe.subscriptions.retrieve(invoice.subscription as string)
          : null;

        // Resolve clubId: prefer subscription metadata, fall back to DB lookup
        let clubId: string | null = sub?.metadata?.clubId ?? null;
        let billingIntervalFromDb: string | null = null;

        if (!clubId) {
          const { data: club } = await supabase
            .from("Club")
            .select("id, billingInterval")
            .eq("stripeCustomerId", customerId)
            .single();
          clubId = club?.id ?? null;
          billingIntervalFromDb = club?.billingInterval ?? null;
        }

        if (!clubId) break;

        const interval = (sub?.items.data[0]?.price?.recurring?.interval ?? billingIntervalFromDb ?? "month") as "month" | "year";

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
          clubId,
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

        const sub = invoice.subscription
          ? await stripe.subscriptions.retrieve(invoice.subscription as string)
          : null;

        let clubId: string | null = sub?.metadata?.clubId ?? null;
        let billingIntervalFromDb: string | null = null;

        if (!clubId) {
          const { data: club } = await supabase
            .from("Club")
            .select("id, billingInterval")
            .eq("stripeCustomerId", customerId)
            .single();
          clubId = club?.id ?? null;
          billingIntervalFromDb = club?.billingInterval ?? null;
        }

        if (!clubId) break;

        await supabase.from("Payment").insert({
          clubId,
          stripeInvoiceId: invoice.id,
          stripePaymentIntentId:
            typeof invoice.payment_intent === "string" ? invoice.payment_intent : null,
          amount: invoice.amount_due,
          currency: invoice.currency,
          status: "failed",
          description: "Subscription payment failed",
          billingInterval: sub?.items.data[0]?.price?.recurring?.interval ?? billingIntervalFromDb ?? "month",
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
