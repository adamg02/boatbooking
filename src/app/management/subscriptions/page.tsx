"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ManagementLayout from "@/components/ManagementLayout";

interface SubscriptionRow {
  clubId: string;
  clubName: string;
  joinCode: string;
  clubCreatedAt: string;
  subscriptionTier: string;
  subscriptionStatus: string | null;
  billingInterval: string | null;
  subscriptionCurrentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  activeUsers: number;
  paymentCount: number;
  totalPaidPence: number;
  currency: string;
  startedAt: string | null;
  lastPaymentAt: string | null;
  lastPaymentPence: number | null;
  lastActivityAt: string | null;
}

type SortKey = keyof SubscriptionRow;
type SortDir = "asc" | "desc";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 365) {
    const months = Math.floor(days / 30.44);
    if (months < 1) return `${days}d ago`;
    return `${months}mo ago`;
  }
  return `${Math.floor(days / 365.25)}y ago`;
}

function formatCurrency(pence: number | null, currency = "gbp"): string {
  if (pence === null) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(pence / 100);
}

const tierBadge: Record<string, string> = {
  free: "bg-gray-700 text-gray-200",
  pro: "bg-indigo-700 text-indigo-100",
  enterprise: "bg-purple-700 text-purple-100",
};

const statusBadge: Record<string, string> = {
  active: "bg-green-800 text-green-200",
  trialing: "bg-yellow-800 text-yellow-200",
  past_due: "bg-red-900 text-red-200",
  canceled: "bg-gray-700 text-gray-300",
};

const intervalLabel: Record<string, string> = {
  month: "Monthly",
  year: "Yearly",
};

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="ml-1 opacity-30">↕</span>;
  return <span className="ml-1">{dir === "asc" ? "↑" : "↓"}</span>;
}

export default function ManagementSubscriptionsPage() {
  const [subs, setSubs] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("subscriptionCurrentPeriodEnd");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    fetch("/api/management/subscriptions")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load subscriptions");
        return res.json();
      })
      .then(setSubs)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const statuses = Array.from(
    new Set(subs.map((s) => s.subscriptionStatus).filter(Boolean))
  ) as string[];

  const filtered = subs
    .filter((s) => s.clubName.toLowerCase().includes(search.toLowerCase()))
    .filter((s) => statusFilter === "all" || s.subscriptionStatus === statusFilter)
    .sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === null || av === undefined) return sortDir === "asc" ? 1 : -1;
      if (bv === null || bv === undefined) return sortDir === "asc" ? -1 : 1;
      let cmp = 0;
      if (typeof av === "number" && typeof bv === "number") {
        cmp = av - bv;
      } else {
        cmp = String(av).localeCompare(String(bv));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

  function thProps(key: SortKey, className = "") {
    return {
      className: `px-4 py-3 cursor-pointer select-none hover:text-white transition-colors ${className}`,
      onClick: () => handleSort(key),
    };
  }

  const totalRevenue = filtered.reduce((sum, s) => sum + s.totalPaidPence, 0);
  const activeCount = filtered.filter((s) => s.subscriptionStatus === "active").length;

  return (
    <ManagementLayout>
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white">Subscriptions</h2>
            <p className="mt-1 text-gray-400">
              All subscriptions across the platform with billing details.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Search clubs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {loading && (
          <div className="text-gray-400 text-center py-16">Loading subscriptions…</div>
        )}

        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-4 mb-8">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Subscriptions
              </p>
              <p className="text-2xl font-bold text-white mt-1">{filtered.length}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Active</p>
              <p className="text-2xl font-bold text-white mt-1">{activeCount}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Total Revenue
              </p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-gray-500 text-center py-16">No subscriptions found.</div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            {/* Mobile card layout */}
            <div className="flex flex-col gap-4 md:hidden">
              {filtered.map((sub) => (
                <div
                  key={sub.clubId}
                  className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/management/clubs/${sub.clubId}`}
                        className="text-white font-semibold hover:text-indigo-400 hover:underline transition-colors"
                      >
                        {sub.clubName}
                      </Link>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">{sub.joinCode}</p>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                          tierBadge[sub.subscriptionTier] ?? "bg-gray-700 text-gray-200"
                        }`}
                      >
                        {sub.subscriptionTier}
                      </span>
                      {sub.subscriptionStatus && (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                            statusBadge[sub.subscriptionStatus] ?? "bg-gray-700 text-gray-200"
                          }`}
                        >
                          {sub.subscriptionStatus}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <span className="text-gray-500">Billing</span>
                    <span className="text-gray-300 text-right">
                      {sub.billingInterval ? intervalLabel[sub.billingInterval] ?? sub.billingInterval : "—"}
                    </span>
                    <span className="text-gray-500">Started</span>
                    <span className="text-gray-300 text-right">{formatDate(sub.startedAt)}</span>
                    <span className="text-gray-500">Renews</span>
                    <span className="text-gray-300 text-right">
                      {formatDate(sub.subscriptionCurrentPeriodEnd)}
                    </span>
                    <span className="text-gray-500">Last Payment</span>
                    <span className="text-gray-300 text-right">
                      {sub.lastPaymentAt
                        ? `${formatCurrency(sub.lastPaymentPence, sub.currency)} · ${formatDate(sub.lastPaymentAt)}`
                        : "—"}
                    </span>
                    <span className="text-gray-500">Payments</span>
                    <span className="text-gray-300 text-right">{sub.paymentCount}</span>
                    <span className="text-gray-500">Total Paid</span>
                    <span className="text-gray-300 text-right">
                      {formatCurrency(sub.totalPaidPence, sub.currency)}
                    </span>
                    <span className="text-gray-500">Users</span>
                    <span className="text-gray-300 text-right">{sub.activeUsers}</span>
                    <span className="text-gray-500">Last Activity</span>
                    <span className="text-gray-300 text-right">{timeAgo(sub.lastActivityAt)}</span>
                  </div>
                  {sub.stripeSubscriptionId && (
                    <p className="text-xs text-gray-600 font-mono truncate">
                      {sub.stripeSubscriptionId}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-800">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-800 text-gray-400 uppercase text-xs tracking-wider">
                  <tr>
                    <th {...thProps("clubName", "text-left")}>
                      Club <SortIcon active={sortKey === "clubName"} dir={sortDir} />
                    </th>
                    <th {...thProps("subscriptionTier", "text-left")}>
                      Plan <SortIcon active={sortKey === "subscriptionTier"} dir={sortDir} />
                    </th>
                    <th {...thProps("subscriptionStatus", "text-left")}>
                      Status <SortIcon active={sortKey === "subscriptionStatus"} dir={sortDir} />
                    </th>
                    <th {...thProps("billingInterval", "text-left")}>
                      Billing <SortIcon active={sortKey === "billingInterval"} dir={sortDir} />
                    </th>
                    <th {...thProps("startedAt", "text-left")}>
                      Started <SortIcon active={sortKey === "startedAt"} dir={sortDir} />
                    </th>
                    <th {...thProps("subscriptionCurrentPeriodEnd", "text-left")}>
                      Renews{" "}
                      <SortIcon
                        active={sortKey === "subscriptionCurrentPeriodEnd"}
                        dir={sortDir}
                      />
                    </th>
                    <th {...thProps("lastPaymentAt", "text-left")}>
                      Last Payment <SortIcon active={sortKey === "lastPaymentAt"} dir={sortDir} />
                    </th>
                    <th {...thProps("paymentCount", "text-right")}>
                      Payments <SortIcon active={sortKey === "paymentCount"} dir={sortDir} />
                    </th>
                    <th {...thProps("totalPaidPence", "text-right")}>
                      Total Paid <SortIcon active={sortKey === "totalPaidPence"} dir={sortDir} />
                    </th>
                    <th {...thProps("activeUsers", "text-right")}>
                      Users <SortIcon active={sortKey === "activeUsers"} dir={sortDir} />
                    </th>
                    <th {...thProps("lastActivityAt", "text-left")}>
                      Last Activity <SortIcon active={sortKey === "lastActivityAt"} dir={sortDir} />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 bg-gray-900">
                  {filtered.map((sub) => (
                    <tr key={sub.clubId} className="hover:bg-gray-800/60 transition-colors">
                      <td className="px-4 py-3 text-white font-medium whitespace-nowrap">
                        <Link
                          href={`/management/clubs/${sub.clubId}`}
                          className="hover:text-indigo-400 hover:underline transition-colors"
                        >
                          {sub.clubName}
                        </Link>
                        {sub.stripeSubscriptionId && (
                          <span
                            className="ml-2 text-xs text-gray-600 font-mono"
                            title={sub.stripeSubscriptionId}
                          >
                            {sub.stripeSubscriptionId.slice(0, 14)}…
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                            tierBadge[sub.subscriptionTier] ?? "bg-gray-700 text-gray-200"
                          }`}
                        >
                          {sub.subscriptionTier}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {sub.subscriptionStatus ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                              statusBadge[sub.subscriptionStatus] ?? "bg-gray-700 text-gray-200"
                            }`}
                          >
                            {sub.subscriptionStatus}
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                        {sub.billingInterval
                          ? intervalLabel[sub.billingInterval] ?? sub.billingInterval
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {formatDate(sub.startedAt)}
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {formatDate(sub.subscriptionCurrentPeriodEnd)}
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {sub.lastPaymentAt ? (
                          <>
                            <span className="text-gray-200">
                              {formatCurrency(sub.lastPaymentPence, sub.currency)}
                            </span>{" "}
                            <span className="text-xs">{formatDate(sub.lastPaymentAt)}</span>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-200">{sub.paymentCount}</td>
                      <td className="px-4 py-3 text-right text-gray-200">
                        {formatCurrency(sub.totalPaidPence, sub.currency)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-200">{sub.activeUsers}</td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {timeAgo(sub.lastActivityAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </ManagementLayout>
  );
}
