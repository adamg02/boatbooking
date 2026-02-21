"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  addDays,
  format,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";
import { useRouter } from "next/navigation";
import { getSupabaseClientComponent } from "@/lib/supabase-client";
import DarkNavBar from "@/components/DarkNavBar";

// ─── types ────────────────────────────────────────────────────────────────────

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
  user: User;
  boat: Boat;
}

// ─── constants ────────────────────────────────────────────────────────────────

/** 2-hour slots, expressed as the start hour (0-based, 24h). */
const SLOT_HOURS = [6, 8, 10, 12, 14, 16, 18];

const SLOT_LABELS: Record<number, string> = {
  6: "6:00 AM",
  8: "8:00 AM",
  10: "10:00 AM",
  12: "12:00 PM",
  14: "2:00 PM",
  16: "4:00 PM",
  18: "6:00 PM",
};

// ─── helpers ──────────────────────────────────────────────────────────────────

/** The 7 days starting at `anchor`. */
function weekDays(anchor: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(anchor, i));
}

/** Which 2-hour slot does this booking start in? Returns the slot-start hour, or -1 if none. */
function slotHour(booking: Booking): number {
  const h = parseISO(booking.startTime).getHours();
  const found = SLOT_HOURS.find((s) => s === h || (h > s && h < s + 2));
  return found ?? -1;
}

// ─── pill ─────────────────────────────────────────────────────────────────────

function BookingPill({
  booking,
  onCancel,
}: {
  booking: Booking;
  onCancel?: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const displayName = booking.user.name || booking.user.email;

  if (confirming) {
    return (
      <div className="rounded-md border border-red-600 bg-red-900/80 px-2 py-1.5 text-left shadow-sm min-w-0">
        <p className="truncate text-[0.65rem] font-medium leading-tight text-red-200 mb-1">
          Cancel booking?
        </p>
        <div className="flex gap-1">
          <button
            disabled={cancelling}
            onClick={async (e) => {
              e.stopPropagation();
              setCancelling(true);
              await onCancel?.();
            }}
            className="flex-1 rounded bg-red-600 px-1.5 py-0.5 text-[0.65rem] font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
          >
            {cancelling ? "…" : "Yes"}
          </button>
          <button
            disabled={cancelling}
            onClick={(e) => {
              e.stopPropagation();
              setConfirming(false);
            }}
            className="flex-1 rounded bg-gray-700 px-1.5 py-0.5 text-[0.65rem] font-semibold text-gray-300 transition-colors hover:bg-gray-600 disabled:opacity-50"
          >
            No
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onCancel ? () => setConfirming(true) : undefined}
      className={`group relative rounded-md bg-indigo-600 px-2 py-1.5 text-left shadow-sm min-w-0 ${
        onCancel ? "cursor-pointer hover:bg-indigo-500 transition-colors" : ""
      }`}
    >
      <p className="truncate text-xs font-semibold leading-tight text-white">
        {booking.boat.name}
      </p>
      <p className="truncate text-[0.65rem] leading-tight text-indigo-200 mt-0.5">
        {displayName}
      </p>
      {onCancel && (
        <span
          aria-hidden
          className="pointer-events-none absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[0.6rem] font-bold leading-none text-white opacity-0 transition-opacity group-hover:opacity-100"
        >
          ×
        </span>
      )}
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const router = useRouter();
  const supabase = getSupabaseClientComponent();

  const [anchor, setAnchor] = useState<Date>(() => startOfDay(new Date()));
  const [bookingsByDay, setBookingsByDay] = useState<Record<string, Booking[]>>({});
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sortBy, setSortBy] = useState<"boat" | "user">("boat");
  const [isMobile, setIsMobile] = useState(false);

  // ── responsive breakpoint tracking ─────────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const dayCount = isMobile ? 2 : 7;

  // ── auth guard (any authenticated club member) ──────────────────────────────
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth/signin");
        return;
      }
      // fetch admin status in parallel — non-blocking for the calendar
      fetch("/api/admin/status")
        .then((r) => r.ok ? r.json() : null)
        .then((d) => { if (d?.isAdmin) setIsAdmin(true); })
        .catch(() => {});
      setAuthChecked(true);
    })();
  }, [router, supabase]);

  // ── fetch all bookings for the displayed window in one request ─────────────
  useEffect(() => {
    if (!authChecked) return;

    setLoading(true);

    const startStr = format(anchor, "yyyy-MM-dd");
    fetch(`/api/bookings/range?start=${startStr}&days=${dayCount}`)
      .then(async (res) => {
        if (!res.ok) return {};
        return res.json() as Promise<Record<string, Booking[]>>;
      })
      .then((data) => setBookingsByDay(data))
      .catch(() => setBookingsByDay({}))
      .finally(() => setLoading(false));
  }, [anchor, authChecked, dayCount]);

  // ── derived range info ──────────────────────────────────────────────────────
  const days = useMemo(() => weekDays(anchor), [anchor]);
  const displayDays = useMemo(() => days.slice(0, dayCount), [days, dayCount]);
  const rangeLabel = useMemo(
    () =>
      `${format(displayDays[0], "d MMM")} – ${format(
        displayDays[displayDays.length - 1],
        "d MMM yyyy"
      )}`,
    [displayDays]
  );

  // ── navigation ──────────────────────────────────────────────────────────────
  const prevWeek = () => setAnchor((a) => subDays(a, dayCount));
  const nextWeek = () => setAnchor((a) => addDays(a, dayCount));
  const goToday = () => setAnchor(startOfDay(new Date()));

  // ── cancel booking (admin only) ─────────────────────────────────────────────
  const cancelBooking = async (bookingId: string) => {
    const res = await fetch(`/api/admin/bookings?id=${bookingId}`, { method: "DELETE" });
    if (res.ok) {
      setBookingsByDay((prev) => {
        const next: Record<string, Booking[]> = {};
        for (const [k, v] of Object.entries(prev)) {
          next[k] = v.filter((b) => b.id !== bookingId);
        }
        return next;
      });
    }
  };

  const todayStr = format(new Date(), "yyyy-MM-dd");

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* ── toolbar ──────────────────────────────────────────────────────────── */}
      <DarkNavBar
        title="Bookings Calendar"
        isAdmin={isAdmin}
        topRowEnd={
          <>
            <span className="text-xs text-gray-500">Sort:</span>
            <button
              onClick={() => setSortBy("boat")}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                sortBy === "boat"
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Boat
            </button>
            <button
              onClick={() => setSortBy("user")}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                sortBy === "user"
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              User
            </button>
          </>
        }
      >
        {/* Navigation row — pushed to order 9999 (order-last) on mobile so it wraps below
            the title + sort/burger row; resets to default order on desktop */}
        <div className="flex items-center gap-2 order-last md:order-none w-full md:w-auto">
          <button
            onClick={goToday}
            className="rounded border border-gray-600 bg-gray-700 px-3 py-1 text-sm font-medium text-gray-200 hover:bg-gray-600"
          >
            Today
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={prevWeek}
              aria-label="Previous"
              className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-gray-100"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              onClick={nextWeek}
              aria-label="Next"
              className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-gray-100"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <span className="text-sm font-medium text-gray-300">{rangeLabel}</span>

          {loading && (
            <div className="ml-auto flex items-center gap-1 text-xs text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-400" />
              Loading…
            </div>
          )}
        </div>
      </DarkNavBar>

      {/* ── calendar grid ────────────────────────────────────────────────────── */}
      <div className={isMobile ? "overflow-x-hidden" : "overflow-x-auto"}>
        <div
          className={isMobile
            ? "grid grid-cols-[60px_repeat(2,minmax(0,1fr))]"
            : "grid min-w-[900px] grid-cols-[80px_repeat(7,minmax(0,1fr))]"
          }
        >
          {/* ── header row: day names ─────────────────────────────────────── */}

          {/* corner cell */}
          <div className="border-b border-r border-gray-700 bg-gray-800" />

          {displayDays.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const isToday = dateStr === todayStr;
            return (
              <div
                key={dateStr}
                className={`border-b border-r border-gray-700 px-2 py-2 text-center ${
                  isToday ? "bg-indigo-900/50" : "bg-gray-800"
                }`}
              >
                <p
                  className={`text-xs font-medium uppercase tracking-wide ${
                    isToday ? "text-indigo-400" : "text-gray-400"
                  }`}
                >
                  {format(day, "EEE")}
                </p>
                <p
                  className={`mt-0.5 text-xl font-bold leading-none ${
                    isToday ? "text-indigo-300" : "text-gray-100"
                  }`}
                >
                  {format(day, "d")}
                </p>
                <p
                  className={`text-[0.65rem] ${
                    isToday ? "text-indigo-500" : "text-gray-500"
                  }`}
                >
                  {format(day, "MMM")}
                </p>
              </div>
            );
          })}

          {/* ── time-slot rows ────────────────────────────────────────────── */}
          {SLOT_HOURS.map((slotH, rowIndex) => (
            <React.Fragment key={slotH}>
              {/* time label */}
              <div
                className={`border-b border-r border-gray-700 bg-gray-800 px-2 py-3 text-right ${
                  rowIndex === SLOT_HOURS.length - 1 ? "border-b-0" : ""
                }`}
              >
                <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
                  {SLOT_LABELS[slotH]}
                </span>
              </div>

              {/* day cells */}
              {displayDays.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const isToday = dateStr === todayStr;
                const dayBookings = bookingsByDay[dateStr] ?? [];
                const cellBookings = dayBookings
                  .filter((b) => slotHour(b) === slotH)
                  .sort((a, b) =>
                    sortBy === "boat"
                      ? a.boat.name.localeCompare(b.boat.name)
                      : (a.user.name ?? a.user.email).localeCompare(
                          b.user.name ?? b.user.email
                        )
                  );

                return (
                  <div
                    key={`${dateStr}-${slotH}`}
                    className={`min-h-[72px] border-b border-r border-gray-700 p-1.5 align-top ${
                      rowIndex === SLOT_HOURS.length - 1 ? "border-b-0" : ""
                    } ${isToday ? "bg-indigo-900/20" : "bg-gray-900"}`}
                  >
                    <div className="flex flex-col gap-1">
                      {cellBookings.map((booking) => (
                        <BookingPill
                          key={booking.id}
                          booking={booking}
                          onCancel={isAdmin ? () => cancelBooking(booking.id) : undefined}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── legend ───────────────────────────────────────────────────────────── */}
      <div className="px-6 py-3 text-xs text-gray-600">
        Each pill shows the boat name and the member who booked it. Time slots
        are 2 hours each. All times are local time.
      </div>
    </div>
  );
}
