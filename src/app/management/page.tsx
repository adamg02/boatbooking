"use client";

import { useEffect, useState } from "react";
import ManagementLayout from "@/components/ManagementLayout";
import Link from "next/link";

interface PlatformStats {
  totalClubs: number;
  totalActiveUsers: number;
  totalBookings: number;
  openBookings: number;
  totalRevenuePence: number;
  activeSubscriptions: number;
}

function formatCurrency(pence: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(pence / 100);
}

export default function ManagementDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        },
        {
          label: "Active Users",
          value: stats.totalActiveUsers,
          icon: "👥",
          color: "bg-blue-600",
          href: "/management/clubs",
        },
        {
          label: "Total Bookings",
          value: stats.totalBookings,
          icon: "📋",
          color: "bg-teal-600",
          href: "/management/clubs",
        },
        {
          label: "Open Bookings",
          value: stats.openBookings,
          icon: "📅",
          color: "bg-green-600",
          href: "/management/clubs",
        },
        {
          label: "Active Subscriptions",
          value: stats.activeSubscriptions,
          icon: "💳",
          color: "bg-purple-600",
          href: "/management/clubs",
        },
        {
          label: "Total Revenue",
          value: formatCurrency(stats.totalRevenuePence),
          icon: "💰",
          color: "bg-yellow-600",
          href: "/management/clubs",
        },
      ]
    : [];

  return (
    <ManagementLayout>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {statCards.map((card) => (
                <Link
                  key={card.label}
                  href={card.href}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-indigo-500 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">{card.label}</p>
                      <p className="text-3xl font-bold text-white mt-2">{card.value}</p>
                    </div>
                    <div
                      className={`${card.color} text-white text-3xl w-14 h-14 rounded-full flex items-center justify-center`}
                    >
                      {card.icon}
                    </div>
                  </div>
                </Link>
              ))}
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
              </div>
            </div>
          </>
        )}
      </div>
    </ManagementLayout>
  );
}
