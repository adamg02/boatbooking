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

export default function ManagementClubsPage() {
  const [clubs, setClubs] = useState<ClubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

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

  const filtered = clubs.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

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
          <div className="overflow-x-auto rounded-lg border border-gray-800">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-800 text-gray-400 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Club</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                  <th className="px-4 py-3 text-right">Users</th>
                  <th className="px-4 py-3 text-right">Bookings</th>
                  <th className="px-4 py-3 text-right">Open</th>
                  <th className="px-4 py-3 text-left">Plan</th>
                  <th className="px-4 py-3 text-left">Sub Status</th>
                  <th className="px-4 py-3 text-left">Sub Started</th>
                  <th className="px-4 py-3 text-left">Period Ends</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
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
        )}
      </div>
    </ManagementLayout>
  );
}
