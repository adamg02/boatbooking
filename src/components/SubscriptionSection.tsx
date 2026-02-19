"use client";

import { useEffect, useState, useCallback } from "react";

interface SubscriptionInfo {
  tier: "free" | "paid";
  status: string | null;
  billingInterval: "month" | "year" | null;
  currentPeriodEnd: string | null;
  hasStripeCustomer: boolean;
  hasStripeSubscription: boolean;
  boatCount: number;
  freeTierLimit: number;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: "succeeded" | "failed" | "pending";
  description: string | null;
  billingInterval: "month" | "year" | null;
  periodStart: string | null;
  periodEnd: string | null;
  receiptUrl: string | null;
  hostedInvoiceUrl: string | null;
  createdAt: string;
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SubscriptionSection() {
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState<"month" | "year" | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [showPayments, setShowPayments] = useState(false);

  const loadSub = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/subscription");
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to load subscription");
        return;
      }
      setSub(await res.json());
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPayments = useCallback(async () => {
    try {
      setPaymentsLoading(true);
      const res = await fetch("/api/admin/subscription/payments");
      if (res.ok) setPayments(await res.json());
    } finally {
      setPaymentsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSub();
  }, [loadSub]);

  useEffect(() => {
    if (showPayments) loadPayments();
  }, [showPayments, loadPayments]);

  const handleCheckout = async (interval: "month" | "year") => {
    setCheckingOut(interval);
    setError(null);
    try {
      const res = await fetch("/api/admin/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to start checkout");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setCheckingOut(null);
    }
  };

  const handlePortal = async () => {
    setOpeningPortal(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/subscription/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to open billing portal");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setOpeningPortal(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-gray-500 text-sm">Loading subscription…</div>
      </div>
    );
  }

  if (!sub) return null;

  const isPaid = sub.tier === "paid";
  const isActive = sub.status === "active" || sub.status === "trialing";
  const nearLimit = !isPaid && sub.boatCount >= sub.freeTierLimit - 2;
  const atLimit = !isPaid && sub.boatCount >= sub.freeTierLimit;

  return (
    <div className="space-y-4">
      {/* Current plan card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Subscription</h3>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isPaid && isActive
                ? "bg-green-100 text-green-800"
                : isPaid && !isActive
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {isPaid && isActive
              ? "Pro"
              : isPaid && !isActive
              ? `Pro (${sub.status})`
              : "Free"}
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Free plan info */}
        {!isPaid && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              You are on the <strong>Free plan</strong> — up to {sub.freeTierLimit} boats.
            </p>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{sub.boatCount} of {sub.freeTierLimit} boats used</span>
                {atLimit && (
                  <span className="text-red-600 font-medium">Limit reached</span>
                )}
                {nearLimit && !atLimit && (
                  <span className="text-amber-600 font-medium">Approaching limit</span>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    atLimit ? "bg-red-500" : nearLimit ? "bg-amber-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${Math.min((sub.boatCount / sub.freeTierLimit) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Paid plan info */}
        {isPaid && isActive && (
          <dl className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <dt className="text-gray-500">Billing</dt>
              <dd className="text-gray-900 font-medium">
                {sub.billingInterval === "year" ? "£9.99 / month (annual)" : "£12.99 / month"}
              </dd>
            </div>
            {sub.currentPeriodEnd && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Renews</dt>
                <dd className="text-gray-900">{formatDate(sub.currentPeriodEnd)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500">Boats</dt>
              <dd className="text-gray-900">{sub.boatCount} (unlimited)</dd>
            </div>
          </dl>
        )}

        {/* Upgrade options */}
        {!isPaid && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Upgrade to Pro — unlimited boats</p>

            {/* Monthly */}
            <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Monthly</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  £12.99 <span className="text-sm font-normal text-gray-500">/ month</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Billed monthly, cancel any time</p>
              </div>
              <button
                type="button"
                onClick={() => handleCheckout("month")}
                disabled={checkingOut !== null}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
              >
                {checkingOut === "month" ? "Loading…" : "Subscribe"}
              </button>
            </div>

            {/* Yearly */}
            <div className="border-2 border-blue-500 rounded-lg p-4 flex items-center justify-between relative overflow-hidden">
              <span className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-semibold px-2 py-0.5 rounded-bl-lg">
                Save 23%
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900">Annual</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  £9.99 <span className="text-sm font-normal text-gray-500">/ month</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Billed £119.88 / year</p>
              </div>
              <button
                type="button"
                onClick={() => handleCheckout("year")}
                disabled={checkingOut !== null}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
              >
                {checkingOut === "year" ? "Loading…" : "Subscribe"}
              </button>
            </div>
          </div>
        )}

        {/* Manage billing */}
        {isPaid && sub.hasStripeCustomer && (
          <button
            type="button"
            onClick={handlePortal}
            disabled={openingPortal}
            className="mt-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {openingPortal ? "Opening…" : "Manage billing & cancel"}
          </button>
        )}
      </div>

      {/* Payment history */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
          {!showPayments && (
            <button
              type="button"
              onClick={() => setShowPayments(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View
            </button>
          )}
        </div>

        {showPayments && (
          <>
            {paymentsLoading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : payments.length === 0 ? (
              <p className="text-sm text-gray-500">No payments recorded yet.</p>
            ) : (
              <div className="overflow-x-auto -mx-2">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="py-2 px-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                      <th className="py-2 px-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                      <th className="py-2 px-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                      <th className="py-2 px-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="py-2 px-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="py-2.5 px-2 text-gray-700 whitespace-nowrap">
                          {formatDate(p.createdAt)}
                        </td>
                        <td className="py-2.5 px-2 text-gray-700">
                          {p.description ?? (p.billingInterval === "year" ? "Annual subscription" : "Monthly subscription")}
                          {p.periodStart && p.periodEnd && (
                            <span className="ml-1 text-xs text-gray-400">
                              ({formatDate(p.periodStart)} – {formatDate(p.periodEnd)})
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-right text-gray-900 font-medium whitespace-nowrap">
                          {formatAmount(p.amount, p.currency)}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              p.status === "succeeded"
                                ? "bg-green-100 text-green-700"
                                : p.status === "failed"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {p.status === "succeeded" ? "Paid" : p.status === "failed" ? "Failed" : "Pending"}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {p.hostedInvoiceUrl || p.receiptUrl ? (
                            <a
                              href={(p.hostedInvoiceUrl ?? p.receiptUrl)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Download
                            </a>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {!showPayments && (
          <p className="text-sm text-gray-500">View your invoices and download receipts.</p>
        )}
      </div>
    </div>
  );
}
