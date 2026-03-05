"use client";

import { useEffect, useState } from "react";
import ManagementLayout from "@/components/ManagementLayout";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

interface PlatformStats {
  totalClubs: number;
  totalActiveUsers: number;
  totalRevenuePence: number;
  activeSubscriptions: number;
  bookings7: number;
  bookingsPrev7: number;
  bookings28: number;
  bookingsPrev28: number;
  logins7: number;
  loginsPrev7: number;
  logins28: number;
  loginsPrev28: number;
}

interface SystemOwner {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

function formatCurrency(pence: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(pence / 100);
}

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null;
  const diff = current - previous;
  const pct = previous === 0 ? null : Math.round((diff / previous) * 100);
  const up = diff >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded ${
        up ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"
      }`}
    >
      {up ? "▲" : "▼"}
      {pct !== null ? `${Math.abs(pct)}%` : `${Math.abs(diff)}`}
    </span>
  );
}

function MetricBlock({
  label,
  current,
  previous,
  prevLabel,
}: {
  label: string;
  current: number;
  previous: number;
  prevLabel: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <div className="flex items-baseline gap-2 flex-wrap">
        <p className="text-3xl font-bold text-white">{current}</p>
        <TrendBadge current={current} previous={previous} />
      </div>
      <p className="text-xs text-gray-500 mt-1">{prevLabel}: {previous}</p>
    </div>
  );
}

function CombinedCard({
  title,
  icon,
  iconColor,
  metric7,
  metric28,
}: {
  title: string;
  icon: string;
  iconColor: string;
  metric7: { current: number; previous: number };
  metric28: { current: number; previous: number };
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`${iconColor} text-white text-2xl w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0`}
        >
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <div className="grid grid-cols-2 divide-x divide-gray-800">
        <div className="pr-4">
          <MetricBlock
            label="Last 7 Days"
            current={metric7.current}
            previous={metric7.previous}
            prevLabel="prev 7 days"
          />
        </div>
        <div className="pl-4">
          <MetricBlock
            label="Last 28 Days"
            current={metric28.current}
            previous={metric28.previous}
            prevLabel="prev 28 days"
          />
        </div>
      </div>
    </div>
  );
}

export default function ManagementDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // System owners panel
  const [showOwners, setShowOwners] = useState(false);
  const [owners, setOwners] = useState<SystemOwner[]>([]);
  const [ownersLoading, setOwnersLoading] = useState(false);
  const [ownersError, setOwnersError] = useState<string | null>(null);
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [addingOwner, setAddingOwner] = useState(false);

  const loadOwners = () => {
    setOwnersLoading(true);
    fetch("/api/management/system-owners")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load system owners");
        return res.json();
      })
      .then((data) => { setOwners(data); setOwnersError(null); })
      .catch((err) => setOwnersError(err.message))
      .finally(() => setOwnersLoading(false));
  };

  const handleAddOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newOwnerEmail.trim();
    if (!email) return;
    setAddingOwner(true);
    try {
      const res = await fetch("/api/management/system-owners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, isSystemOwner: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to add system owner");
      } else {
        toast.success(`${data.name || data.email} marked as system owner`);
        setNewOwnerEmail("");
        loadOwners();
      }
    } catch {
      toast.error("Network error");
    } finally {
      setAddingOwner(false);
    }
  };

  const handleRemoveOwner = async (owner: SystemOwner) => {
    if (!confirm(`Remove system owner flag from ${owner.email}?`)) return;
    try {
      const res = await fetch("/api/management/system-owners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: owner.email, isSystemOwner: false }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to remove system owner");
      } else {
        toast.success(`${owner.name || owner.email} is no longer a system owner`);
        loadOwners();
      }
    } catch {
      toast.error("Network error");
    }
  };

  useEffect(() => {
    fetch("/api/management/stats")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load stats");
        return res.json();
      })
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats
    ? [
        {
          label: "Total Clubs",
          value: stats.totalClubs,
          icon: "🏛️",
          color: "bg-indigo-600",
          href: "/management/clubs",
          trend: null,
        },
        {
          label: "Active Users",
          value: stats.totalActiveUsers,
          icon: "👥",
          color: "bg-blue-600",
          href: "/management/clubs",
          trend: null,
        },
        {
          label: "Active Subscriptions",
          value: stats.activeSubscriptions,
          icon: "💳",
          color: "bg-purple-600",
          href: "/management/clubs",
          trend: null,
        },
        {
          label: "Total Revenue",
          value: formatCurrency(stats.totalRevenuePence),
          icon: "💰",
          color: "bg-yellow-600",
          href: "/management/clubs",
          trend: null,
        },
      ]
    : [];

  return (
    <ManagementLayout>
      <Toaster position="top-right" />
      <div>
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white">Platform Dashboard</h2>
          <p className="mt-1 text-gray-400">Overview of all clubs and activity across the platform.</p>
        </div>

        {loading && (
          <div className="text-gray-400 text-center py-16">Loading stats…</div>
        )}

        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-4 mb-8">
            {error}
          </div>
        )}

        {stats && (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {statCards.map((card) => (
                <Link
                  key={card.label}
                  href={card.href}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-indigo-500 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-400">{card.label}</p>
                      <div className="flex items-baseline gap-2 mt-2 flex-wrap">
                        <p className="text-3xl font-bold text-white">{card.value}</p>
                      </div>
                    </div>
                    <div
                      className={`${card.color} text-white text-3xl w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ml-4`}
                    >
                      {card.icon}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Bookings & Logins combined cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <CombinedCard
                title="Bookings"
                icon="📋"
                iconColor="bg-teal-600"
                metric7={{ current: stats.bookings7, previous: stats.bookingsPrev7 }}
                metric28={{ current: stats.bookings28, previous: stats.bookingsPrev28 }}
              />
              <CombinedCard
                title="Logins"
                icon="🔑"
                iconColor="bg-sky-600"
                metric7={{ current: stats.logins7, previous: stats.loginsPrev7 }}
                metric28={{ current: stats.logins28, previous: stats.loginsPrev28 }}
              />
            </div>

            {/* Quick actions */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="/management/clubs"
                  className="border border-gray-700 rounded-lg p-4 hover:border-indigo-500 hover:bg-indigo-900/20 transition-all"
                >
                  <h4 className="font-semibold text-white">Monitor Clubs</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    View all clubs, their users, bookings and subscription status.
                  </p>
                </Link>
                <Link
                  href="/management/ip-allowlist"
                  className="border border-gray-700 rounded-lg p-4 hover:border-indigo-500 hover:bg-indigo-900/20 transition-all"
                >
                  <h4 className="font-semibold text-white">IP Allowlist</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    Control which IP addresses can access this management console.
                  </p>
                </Link>
                <button
                  onClick={() => {
                    setShowOwners((v) => {
                      if (!v) loadOwners();
                      return !v;
                    });
                  }}
                  className="text-left border border-gray-700 rounded-lg p-4 hover:border-indigo-500 hover:bg-indigo-900/20 transition-all"
                >
                  <h4 className="font-semibold text-white">System Owners</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    Designate accounts that can access this console. Their activity is excluded from platform statistics.
                  </p>
                </button>
              </div>
            </div>

            {/* System owners panel */}
            {showOwners && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">System Owner Accounts</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Accounts with system owner status can access this management console and are
                      excluded from active-user and login statistics.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowOwners(false)}
                    className="text-gray-500 hover:text-gray-300 text-xl leading-none ml-4"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                {/* Add by email */}
                <form onSubmit={handleAddOwner} className="flex flex-col sm:flex-row gap-3 mb-6">
                  <input
                    type="email"
                    placeholder="Email address of the account to promote"
                    value={newOwnerEmail}
                    onChange={(e) => setNewOwnerEmail(e.target.value)}
                    required
                    className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={addingOwner || !newOwnerEmail.trim()}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {addingOwner ? "Adding…" : "Add System Owner"}
                  </button>
                </form>

                {ownersError && (
                  <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-3 mb-4 text-sm">
                    {ownersError}
                  </div>
                )}

                {ownersLoading ? (
                  <p className="text-gray-400 text-sm">Loading…</p>
                ) : owners.length === 0 ? (
                  <p className="text-gray-500 text-sm">No system owner accounts configured yet.</p>
                ) : (
                  <div className="divide-y divide-gray-800">
                    {owners.map((owner) => (
                      <div key={owner.id} className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium text-white">{owner.name}</p>
                          <p className="text-xs text-gray-400">{owner.email}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveOwner(owner)}
                          className="text-xs text-red-400 hover:text-red-300 border border-red-800 hover:border-red-600 rounded px-3 py-1 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </ManagementLayout>
  );
}

