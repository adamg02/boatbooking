"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { getSupabaseClientComponent } from "@/lib/supabase-client";
import MobileNavBar from "@/components/MobileNavBar";

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface Boat {
  id: string;
  name: string;
}

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
  user: User;
  boat: Boat;
}

export default function DailyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [dailyCounts, setDailyCounts] = useState<Record<string, number>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = getSupabaseClientComponent();

  const BOOKING_WINDOW_DAYS = 28;
  const nextDays = useMemo(
    () => Array.from({ length: BOOKING_WINDOW_DAYS }, (_, i) => addDays(new Date(), i)),
    []
  );

  useEffect(() => {
    loadBookings(format(selectedDate, "yyyy-MM-dd"));
  }, [selectedDate]);

  useEffect(() => {
    loadDailySummary();
  }, []);

  useEffect(() => {
    loadAdminStatus();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };

    fetchUser();
  }, [supabase]);

  const loadBookings = async (date: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/bookings/daily?date=${date}`);
      if (res.status === 401) {
        window.location.href = "/auth/signin";
        return;
      }
      if (!res.ok) {
        setError("Failed to load bookings.");
        return;
      }
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error("Failed to load bookings:", err);
      setError("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  const loadDailySummary = async () => {
    try {
      const startDate = format(new Date(), "yyyy-MM-dd");
      const res = await fetch(
        `/api/bookings/daily-summary?start=${startDate}&days=${BOOKING_WINDOW_DAYS}`
      );
      if (res.ok) {
        const data = await res.json();
        setDailyCounts(data.counts || {});
      }
    } catch (err) {
      console.error("Failed to load daily summary:", err);
    }
  };

  const loadAdminStatus = async () => {
    try {
      const res = await fetch("/api/admin/status");
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      setIsAdmin(Boolean(data.isAdmin));
    } catch (err) {
      console.error("Failed to load admin status:", err);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Cancel this booking?")) {
      return;
    }

    setCancellingId(bookingId);
    try {
      const endpoint = isAdmin
        ? `/api/admin/bookings?id=${bookingId}`
        : `/api/bookings/${bookingId}`;
      const res = await fetch(endpoint, { method: "DELETE" });

      if (res.ok) {
        await loadBookings(format(selectedDate, "yyyy-MM-dd"));
        await loadDailySummary();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to cancel booking");
      }
    } catch (err) {
      console.error("Failed to cancel booking:", err);
      alert("Failed to cancel booking");
    } finally {
      setCancellingId(null);
    }
  };

  const canCancelBooking = (booking: Booking) =>
    Boolean(currentUserId && booking.user.id === currentUserId) || isAdmin;

  const groupedBookings = useMemo(() => {
    const sorted = [...bookings].sort(
      (a, b) =>
        parseISO(a.startTime).getTime() -
        parseISO(b.startTime).getTime()
    );

    const groups = new Map<string, { label: string; start: Date; bookings: Booking[] }>();

    sorted.forEach((booking) => {
      const start = parseISO(booking.startTime);
      const end = parseISO(booking.endTime);
      const label = `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`;

      if (!groups.has(label)) {
        groups.set(label, { label, start, bookings: [booking] });
      } else {
        groups.get(label)!.bookings.push(booking);
      }
    });

    return Array.from(groups.values()).sort(
      (a, b) => a.start.getTime() - b.start.getTime()
    );
  }, [bookings]);

  const totalBookings = useMemo(
    () => groupedBookings.reduce((count, group) => count + group.bookings.length, 0),
    [groupedBookings]
  );

  const getStatusBadge = (status: string) => {
    if (status === "CONFIRMED") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200">
          Confirmed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
        Cancelled
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MobileNavBar 
        title="Daily Bookings" 
        subtitle={format(selectedDate, "MMM d, yyyy")}
        isAdmin={isAdmin}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                Bookings for the day
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {totalBookings} booking
                {totalBookings === 1
                  ? ""
                  : "s"} scheduled
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Select a Date
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {(() => {
                const items: React.ReactNode[] = [];

                const renderButton = (date: Date) => (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={`px-4 py-3 rounded-lg min-w-[100px] transition-colors ${
                      format(selectedDate, "yyyy-MM-dd") ===
                      format(date, "yyyy-MM-dd")
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    <div className="text-sm font-medium">
                      {format(date, "EEE")}
                    </div>
                    <div className="text-lg font-bold">{format(date, "d")}</div>
                    <div className="text-xs flex items-center justify-center gap-2">
                      {format(date, "MMM")}
                      <span
                        aria-label={
                          (dailyCounts[format(date, "yyyy-MM-dd")] || 0) > 0
                            ? "Has bookings"
                            : "No bookings"
                        }
                        className={`inline-block h-2.5 w-2.5 rounded-full ${
                          (dailyCounts[format(date, "yyyy-MM-dd")] || 0) > 0
                            ? "bg-emerald-400"
                            : "bg-gray-400 dark:bg-gray-500"
                        }`}
                      />
                    </div>
                  </button>
                );

                for (let index = 0; index < nextDays.length; index += 1) {
                  const date = nextDays[index];
                  const dayOfWeek = date.getDay();

                  if (dayOfWeek === 6) {
                    const sunday = nextDays[index + 1];
                    const hasSunday = sunday && sunday.getDay() === 0;
                    items.push(
                      <div
                        key={`weekend-${date.toISOString()}`}
                        className="flex gap-2 rounded-xl border border-rose-200/80 dark:border-rose-400/30 p-1"
                      >
                        {renderButton(date)}
                        {hasSunday ? renderButton(sunday) : null}
                      </div>
                    );
                    if (hasSunday) {
                      index += 1;
                    }
                    continue;
                  }

                  if (dayOfWeek === 0) {
                    items.push(
                      <div
                        key={`weekend-${date.toISOString()}`}
                        className="flex gap-2 rounded-xl border border-rose-200/80 dark:border-rose-400/30 p-1"
                      >
                        {renderButton(date)}
                      </div>
                    );
                    continue;
                  }

                  items.push(renderButton(date));
                }

                return items;
              })()}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading bookings...</p>
            </div>
          ) : (
            <>
              {/* Mobile: Card View */}
              <div className="sm:hidden space-y-3">
                {groupedBookings.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
                    No bookings found for this day
                  </div>
                ) : (
                  groupedBookings.map((group) => (
                    <div
                      key={group.label}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {group.label}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {group.bookings.length} booking
                            {group.bookings.length === 1 ? "" : "s"}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {group.bookings.map((booking) => (
                          <div
                            key={booking.id}
                            className="border-t border-gray-100 dark:border-gray-700 pt-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                  {booking.boat.name}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                  {booking.user.name || "No name"} • {booking.user.email}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  Booked {format(parseISO(booking.createdAt), "MMM d, yyyy h:mm a")}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                {getStatusBadge(booking.status)}
                                {canCancelBooking(booking) && (
                                  <button
                                    type="button"
                                    onClick={() => handleCancelBooking(booking.id)}
                                    disabled={cancellingId === booking.id}
                                    className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                                  >
                                    {cancellingId === booking.id ? "Cancelling..." : "Cancel"}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop: Table View */}
              <div className="hidden sm:block">
                {groupedBookings.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center text-gray-500 dark:text-gray-400">
                    No bookings found for this day
                  </div>
                ) : (
                  <div className="space-y-6">
                    {groupedBookings.map((group) => (
                      <div
                        key={group.label}
                        className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden"
                      >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {group.label}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {group.bookings.length} booking
                              {group.bookings.length === 1 ? "" : "s"}
                            </p>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900/40">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Boat
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Booked
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                              {group.bookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {booking.boat.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                    <div className="font-medium text-gray-900 dark:text-gray-100">
                                      {booking.user.name || "No name"}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {booking.user.email}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                    {format(parseISO(booking.createdAt), "MMM d, yyyy h:mm a")}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {getStatusBadge(booking.status)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    {canCancelBooking(booking) ? (
                                      <button
                                        type="button"
                                        onClick={() => handleCancelBooking(booking.id)}
                                        disabled={cancellingId === booking.id}
                                        className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                                      >
                                        {cancellingId === booking.id
                                          ? "Cancelling..."
                                          : "Cancel"}
                                      </button>
                                    ) : (
                                      <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
