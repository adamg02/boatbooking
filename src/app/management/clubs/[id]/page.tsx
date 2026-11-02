"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ManagementLayout from "@/components/ManagementLayout";

interface ClubDetail {
  club: {
    id: string;
    name: string;
    joinCode: string;
    createdAt: string;
    subscriptionTier: string;
    subscriptionStatus: string | null;
    billingInterval: string | null;
    subscriptionCurrentPeriodEnd: string | null;
    hasStripe: boolean;
  };
  stats: {
    activeUsers: number;
    totalUsers: number;
    boatCount: number;
    totalBookings: number;
    openBookings: number;
    lastBookingAt: string | null;
    totalPaidPence: number;
    firstPaymentAt: string | null;
  };
  users: Array<{
    id: string;
    name: string | null;
    email: string;
    provider: string | null;
    isActive: boolean;
    lastLogin: string | null;
    createdAt: string;
    groups: string[];
  }>;
  boats: Array<{
    id: string;
    name: string;
    boatType: string | null;
    capacity: number | null;
    isActive: boolean;
    createdAt: string;
    bookingCount: number;
  }>;
}

function formatCurrency(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(pence / 100);
}

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

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

export default function ManagementClubDetailPage() {
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = useState<ClubDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/management/clubs/${params.id}`)
      .then((res) => {
        if (res.status === 404) throw new Error("Club not found");
        if (!res.ok) throw new Error("Failed to load club");
        return res.json();
      })
      .then(setDetail)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params?.id]);

  return (
    <ManagementLayout>
      <div>
        <Link
          href="/management/clubs"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors mb-4"
        >
          ← Back to clubs
        </Link>

        {loading && <div className="text-gray-400 text-center py-16">Loading club…</div>}

        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-4 mb-8">
            {error}
          </div>
        )}

        {!loading && !error && detail && (
          <>
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white">{detail.club.name}</h2>
                <p className="mt-1 text-gray-400">
                  Join code{" "}
                  <span className="font-mono text-gray-300">{detail.club.joinCode}</span>
                  {" · "}Created {formatDate(detail.club.createdAt)}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-semibold uppercase ${
                    tierBadge[detail.club.subscriptionTier] ?? "bg-gray-700 text-gray-200"
                  }`}
                >
                  {detail.club.subscriptionTier}
                </span>
                {detail.club.subscriptionStatus && (
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      statusBadge[detail.club.subscriptionStatus] ?? "bg-gray-700 text-gray-200"
                    }`}
                  >
                    {detail.club.subscriptionStatus}
                  </span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <StatCard
                label="Users"
                value={detail.stats.activeUsers}
                sub={`${detail.stats.totalUsers} total`}
              />
              <StatCard label="Boats" value={detail.stats.boatCount} />
              <StatCard label="Bookings" value={detail.stats.totalBookings} />
              <StatCard label="Open" value={detail.stats.openBookings} />
              <StatCard
                label="Last Booking"
                value={timeAgo(detail.stats.lastBookingAt)}
              />
              <StatCard
                label="Revenue"
                value={formatCurrency(detail.stats.totalPaidPence)}
              />
            </div>

            {/* Subscription details */}
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-5 mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">Subscription</h3>
              <dl className="grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-gray-500">Plan</dt>
                  <dd className="text-gray-200 uppercase">{detail.club.subscriptionTier}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Billing interval</dt>
                  <dd className="text-gray-200">{detail.club.billingInterval ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Sub started</dt>
                  <dd className="text-gray-200">{formatDate(detail.stats.firstPaymentAt)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Period ends</dt>
                  <dd className="text-gray-200">
                    {formatDate(detail.club.subscriptionCurrentPeriodEnd)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Stripe customer</dt>
                  <dd className="text-gray-200">{detail.club.hasStripe ? "Yes" : "No"}</dd>
                </div>
              </dl>
            </div>

            {/* Users */}
            <h3 className="text-lg font-semibold text-white mb-3">
              Users ({detail.users.length})
            </h3>

            {/* Mobile user cards */}
            <div className="flex flex-col gap-3 md:hidden mb-8">
              {detail.users.length === 0 && (
                <p className="text-gray-500 text-sm">No users.</p>
              )}
              {detail.users.map((user) => (
                <div
                  key={user.id}
                  className="rounded-lg border border-gray-800 bg-gray-900 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-white font-medium">{user.name ?? "—"}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                        user.isActive
                          ? "bg-green-800 text-green-200"
                          : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <span className="text-gray-500">Provider</span>
                    <span className="text-gray-300 text-right capitalize">
                      {user.provider ?? "—"}
                    </span>
                    <span className="text-gray-500">Groups</span>
                    <span className="text-gray-300 text-right">
                      {user.groups.length > 0 ? user.groups.join(", ") : "—"}
                    </span>
                    <span className="text-gray-500">Last Login</span>
                    <span className="text-gray-300 text-right">{timeAgo(user.lastLogin)}</span>
                    <span className="text-gray-500">Joined</span>
                    <span className="text-gray-300 text-right">
                      {formatDate(user.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop user table */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-800 mb-8">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-800 text-gray-400 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Provider</th>
                    <th className="px-4 py-3 text-left">Groups</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Last Login</th>
                    <th className="px-4 py-3 text-left">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 bg-gray-900">
                  {detail.users.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                        No users.
                      </td>
                    </tr>
                  )}
                  {detail.users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-800/60 transition-colors">
                      <td className="px-4 py-3 text-white whitespace-nowrap">
                        {user.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {user.email}
                      </td>
                      <td className="px-4 py-3 text-gray-400 capitalize whitespace-nowrap">
                        {user.provider ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {user.groups.length > 0 ? user.groups.join(", ") : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                            user.isActive
                              ? "bg-green-800 text-green-200"
                              : "bg-gray-700 text-gray-300"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {timeAgo(user.lastLogin)}
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {formatDate(user.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Boats */}
            <h3 className="text-lg font-semibold text-white mb-3">
              Boats ({detail.boats.length})
            </h3>

            {/* Mobile boat cards */}
            <div className="flex flex-col gap-3 md:hidden">
              {detail.boats.length === 0 && (
                <p className="text-gray-500 text-sm">No boats.</p>
              )}
              {detail.boats.map((boat) => (
                <div
                  key={boat.id}
                  className="rounded-lg border border-gray-800 bg-gray-900 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-white font-medium">{boat.name}</p>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                        boat.isActive
                          ? "bg-green-800 text-green-200"
                          : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {boat.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <span className="text-gray-500">Type</span>
                    <span className="text-gray-300 text-right capitalize">
                      {boat.boatType ?? "—"}
                    </span>
                    <span className="text-gray-500">Capacity</span>
                    <span className="text-gray-300 text-right">{boat.capacity ?? "—"}</span>
                    <span className="text-gray-500">Bookings</span>
                    <span className="text-gray-300 text-right">{boat.bookingCount}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop boat table */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-800">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-800 text-gray-400 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-right">Capacity</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Bookings</th>
                    <th className="px-4 py-3 text-left">Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 bg-gray-900">
                  {detail.boats.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                        No boats.
                      </td>
                    </tr>
                  )}
                  {detail.boats.map((boat) => (
                    <tr key={boat.id} className="hover:bg-gray-800/60 transition-colors">
                      <td className="px-4 py-3 text-white whitespace-nowrap">{boat.name}</td>
                      <td className="px-4 py-3 text-gray-400 capitalize whitespace-nowrap">
                        {boat.boatType ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-200">
                        {boat.capacity ?? "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                            boat.isActive
                              ? "bg-green-800 text-green-200"
                              : "bg-gray-700 text-gray-300"
                          }`}
                        >
                          {boat.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-200">
                        {boat.bookingCount}
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {formatDate(boat.createdAt)}
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
