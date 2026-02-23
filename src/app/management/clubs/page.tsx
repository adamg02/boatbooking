"use client";

import { useEffect, useState } from "react";
import ManagementLayout from "@/components/ManagementLayout";

interface ClubRow {
  id: string;
  name: string;
  joinCode: string;
  createdAt: string;
  subscriptionTier: string;
  subscriptionStatus: string | null;
  billingInterval: string | null;
  subscriptionCurrentPeriodEnd: string | null;
  hasStripe: boolean;
  activeUsers: number;
  totalBookings: number;
  openBookings: number;
  totalPaidPence: number;
  firstPaymentAt: string | null;
  lastBookingAt: string | null;
}

type SortKey = keyof ClubRow;
type SortDir = "asc" | "desc";

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

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="ml-1 opacity-30">↕</span>;
  return <span className="ml-1">{dir === "asc" ? "↑" : "↓"}</span>;
}

export default function ManagementClubsPage() {
  const [clubs, setClubs] = useState<ClubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    fetch("/api/management/clubs")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load clubs");
        return res.json();
      })
      .then(setClubs)
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

  const filtered = clubs
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
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

  return (
    <ManagementLayout>
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white">Clubs</h2>
            <p className="mt-1 text-gray-400">All registered clubs and their platform activity.</p>
          </div>
          <input
            type="text"
            placeholder="Search clubs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {loading && <div className="text-gray-400 text-center py-16">Loading clubs…</div>}

        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-4 mb-8">
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-gray-500 text-center py-16">No clubs found.</div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            {/* Mobile card layout */}
            <div className="flex flex-col gap-4 md:hidden">
              {filtered.map((club) => (
                <div
                  key={club.id}
                  className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-white font-semibold">{club.name}</p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">{club.joinCode}</p>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                          tierBadge[club.subscriptionTier] ?? "bg-gray-700 text-gray-200"
                        }`}
                      >
                        {club.subscriptionTier}
                      </span>
                      {club.subscriptionStatus && (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                            statusBadge[club.subscriptionStatus] ?? "bg-gray-700 text-gray-200"
                          }`}
                        >
                          {club.subscriptionStatus}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <span className="text-gray-500">Joined</span>
                    <span className="text-gray-300 text-right">{formatDate(club.createdAt)}</span>
                    <span className="text-gray-500">Users</span>
                    <span className="text-gray-300 text-right">{club.activeUsers}</span>
                    <span className="text-gray-500">Bookings</span>
                    <span className="text-gray-300 text-right">{club.totalBookings}</span>
                    <span className="text-gray-500">Open</span>
                    <span className="text-gray-300 text-right">{club.openBookings}</span>
                    <span className="text-gray-500">Last Booking</span>
                    <span className="text-gray-300 text-right">{timeAgo(club.lastBookingAt)}</span>
                    <span className="text-gray-500">Revenue</span>
                    <span className="text-gray-300 text-right font-mono">
                      {formatCurrency(club.totalPaidPence)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-800">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-800 text-gray-400 uppercase text-xs tracking-wider">
                  <tr>
                    <th {...thProps("name", "text-left")}>
                      Club <SortIcon active={sortKey === "name"} dir={sortDir} />
                    </th>
                    <th {...thProps("createdAt", "text-left")}>
                      Joined <SortIcon active={sortKey === "createdAt"} dir={sortDir} />
                    </th>
                    <th {...thProps("activeUsers", "text-right")}>
                      Users <SortIcon active={sortKey === "activeUsers"} dir={sortDir} />
                    </th>
                    <th {...thProps("totalBookings", "text-right")}>
                      Bookings <SortIcon active={sortKey === "totalBookings"} dir={sortDir} />
                    </th>
                    <th {...thProps("openBookings", "text-right")}>
                      Open <SortIcon active={sortKey === "openBookings"} dir={sortDir} />
                    </th>
                    <th {...thProps("lastBookingAt", "text-left")}>
                      Last Booking <SortIcon active={sortKey === "lastBookingAt"} dir={sortDir} />
                    </th>
                    <th {...thProps("subscriptionTier", "text-left")}>
                      Plan <SortIcon active={sortKey === "subscriptionTier"} dir={sortDir} />
                    </th>
                    <th {...thProps("subscriptionStatus", "text-left")}>
                      Sub Status <SortIcon active={sortKey === "subscriptionStatus"} dir={sortDir} />
                    </th>
                    <th {...thProps("firstPaymentAt", "text-left")}>
                      Sub Started <SortIcon active={sortKey === "firstPaymentAt"} dir={sortDir} />
                    </th>
                    <th {...thProps("subscriptionCurrentPeriodEnd", "text-left")}>
                      Period Ends <SortIcon active={sortKey === "subscriptionCurrentPeriodEnd"} dir={sortDir} />
                    </th>
                    <th {...thProps("totalPaidPence", "text-right")}>
                      Revenue <SortIcon active={sortKey === "totalPaidPence"} dir={sortDir} />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 bg-gray-900">
                  {filtered.map((club) => (
                    <tr key={club.id} className="hover:bg-gray-800/60 transition-colors">
                      <td className="px-4 py-3 text-white font-medium whitespace-nowrap">
                        {club.name}
                        <span className="ml-2 text-xs text-gray-500 font-mono">
                          {club.joinCode}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {formatDate(club.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-200">{club.activeUsers}</td>
                      <td className="px-4 py-3 text-right text-gray-200">{club.totalBookings}</td>
                      <td className="px-4 py-3 text-right text-gray-200">{club.openBookings}</td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {timeAgo(club.lastBookingAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                            tierBadge[club.subscriptionTier] ?? "bg-gray-700 text-gray-200"
                          }`}
                        >
                          {club.subscriptionTier}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {club.subscriptionStatus ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                              statusBadge[club.subscriptionStatus] ?? "bg-gray-700 text-gray-200"
                            }`}
                          >
                            {club.subscriptionStatus}
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {formatDate(club.firstPaymentAt)}
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {formatDate(club.subscriptionCurrentPeriodEnd)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-200 font-mono whitespace-nowrap">
                        {formatCurrency(club.totalPaidPence)}
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
