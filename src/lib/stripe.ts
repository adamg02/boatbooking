import Stripe from "stripe";
import type { Locale } from "@/lib/locales";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("Missing STRIPE_SECRET_KEY environment variable");
    }
    _stripe = new Stripe(key, { apiVersion: "2026-01-28.clover" });
  }
  return _stripe;
}

// Convenience re-export for callers that need a named reference
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as any)[prop];
  },
});

export const FREE_TIER_BOAT_LIMIT = 9;

/** Stripe price IDs for GBP (UK) – set in .env */
export const STRIPE_PRICES_GBP = {
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID!,
  yearly: process.env.STRIPE_YEARLY_PRICE_ID!,
} as const;

/** Stripe price IDs for USD (US) – set in .env; falls back to GBP IDs if unset */
export const STRIPE_PRICES_USD = {
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID_US ?? process.env.STRIPE_MONTHLY_PRICE_ID!,
  yearly: process.env.STRIPE_YEARLY_PRICE_ID_US ?? process.env.STRIPE_YEARLY_PRICE_ID!,
} as const;

/** @deprecated Use getStripePrices(locale) */
export const STRIPE_PRICES = STRIPE_PRICES_GBP;

/** Return the correct Stripe price IDs for the given locale */
export function getStripePrices(locale: Locale | string | undefined) {
  return locale === "en-US" ? STRIPE_PRICES_USD : STRIPE_PRICES_GBP;
}

export type BillingInterval = "month" | "year";

export const PLAN_PRICES: Record<BillingInterval, { amount: number; label: string }> = {
  month: { amount: 1299, label: "£12.99 / month" },
  year: { amount: 11988, label: "£9.99 / month (billed £119.88 / year)" },
};
