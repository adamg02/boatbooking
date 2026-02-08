"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { format, parseISO } from "date-fns";

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

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const res = await fetch("/api/admin/bookings");
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (error) {
      console.error("Failed to load bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    setCancelling(bookingId);
    try {
      const res = await fetch(`/api/admin/bookings?id=${bookingId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadBookings();
      } else {
        alert("Failed to cancel booking");
      }
    } catch (error) {
      console.error("Failed to cancel:", error);
      alert("Failed to cancel booking");
    } finally {
      setCancelling(null);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const now = new Date();
    const startTime = parseISO(booking.startTime);

    if (filter === "upcoming") {
      return startTime >= now && booking.status === "CONFIRMED";
    } else if (filter === "past") {
      return startTime < now || booking.status === "CANCELLED";
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    if (status === "CONFIRMED") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Confirmed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Cancelled
      </span>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bookings...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Booking Management</h2>

          {/* Filter Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All ({bookings.length})
            </button>
            <button
              onClick={() => setFilter("upcoming")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === "upcoming"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Upcoming (
              {
                bookings.filter(
                  (b) =>
                    parseISO(b.startTime) >= new Date() &&
                    b.status === "CONFIRMED"
                ).length
              }
              )
            </button>
            <button
              onClick={() => setFilter("past")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === "past"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Past/Cancelled (
              {
                bookings.filter(
                  (b) =>
                    parseISO(b.startTime) < new Date() ||
                    b.status === "CANCELLED"
                ).length
              }
              )
            </button>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Boat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booked
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => {
                    const isPast = parseISO(booking.startTime) < new Date();
                    return (
                      <tr key={booking.id} className={isPast ? "bg-gray-50" : ""}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {format(parseISO(booking.startTime), "MMM d, yyyy")}
                          </div>
                          <div className="text-sm text-gray-600">
                            {format(parseISO(booking.startTime), "h:mm a")} -{" "}
                            {format(parseISO(booking.endTime), "h:mm a")}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.boat.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.user.name || "No name"}
                          </div>
                          <div className="text-sm text-gray-600">
                            {booking.user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(booking.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {format(parseISO(booking.createdAt), "MMM d, h:mm a")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          {booking.status === "CONFIRMED" && (
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              disabled={cancelling === booking.id}
                              className="text-red-600 hover:text-red-900 font-medium disabled:opacity-50"
                            >
                              {cancelling === booking.id ? "Cancelling..." : "Cancel"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
