"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format, addDays, startOfDay, setHours, setMinutes } from "date-fns";
import toast from "react-hot-toast";

interface Booking {
  id: string;
  startTime: Date;
  endTime: Date;
  userId: string;
}

interface Boat {
  id: string;
  name: string;
  bookings: Booking[];
}

interface BookingCalendarProps {
  boat: Boat;
  userId: string;
  initialDate?: string;
  initialTime?: string;
  initialFullDay?: boolean;
}

export default function BookingCalendar({
  boat,
  userId,
  initialDate,
  initialTime,
  initialFullDay,
}: BookingCalendarProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(() => {
    if (!initialDate) {
      return new Date();
    }

    const initialDateTime = initialTime
      ? new Date(`${initialDate}T${initialTime}:00`)
      : new Date(`${initialDate}T00:00:00`);

    return isNaN(initialDateTime.getTime()) ? new Date() : initialDateTime;
  });
  const [isBooking, setIsBooking] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const BOOKING_WINDOW_DAYS = 28;
  const DAY_START_HOUR = 6;
  const DAY_END_HOUR = 20;

  // Generate time slots (2-hour blocks from 6 AM to 8 PM)
  const generateTimeSlots = (date: Date) => {
    const slots = [];
    const baseDate = startOfDay(date);
    
    for (let hour = DAY_START_HOUR; hour < DAY_END_HOUR; hour += 2) {
      const start = setMinutes(setHours(baseDate, hour), 0);
      const end = setMinutes(setHours(baseDate, hour + 2), 0);
      slots.push({ start, end });
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots(selectedDate);

  const getDayBounds = (date: Date) => {
    const baseDate = startOfDay(date);
    const start = setMinutes(setHours(baseDate, DAY_START_HOUR), 0);
    const end = setMinutes(setHours(baseDate, DAY_END_HOUR), 0);
    return { start, end };
  };

  const isRangeBooked = (rangeStart: Date, rangeEnd: Date) => {
    return boat.bookings.some((booking) => {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);
      
      // Two time ranges overlap if one starts before the other ends AND one ends after the other starts
      // Using getTime() for reliable timestamp comparison
      return (
        rangeStart.getTime() < bookingEnd.getTime() && 
        rangeEnd.getTime() > bookingStart.getTime()
      );
    });
  };

  const isSlotBooked = (slotStart: Date, slotEnd: Date) => {
    return isRangeBooked(slotStart, slotEnd);
  };

  const isSlotPast = (slotStart: Date) => {
    return slotStart < new Date();
  };

  const formatSlotId = (date: Date) => {
    return format(date, "yyyy-MM-dd-HH-mm");
  };

  const getExactUserBooking = (rangeStart: Date, rangeEnd: Date) => {
    return boat.bookings.find((booking) => {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);
      return (
        booking.userId === userId &&
        bookingStart.getTime() === rangeStart.getTime() &&
        bookingEnd.getTime() === rangeEnd.getTime()
      );
    });
  };

  const getUserBooking = (slotStart: Date, slotEnd: Date) => {
    return getExactUserBooking(slotStart, slotEnd);
  };

  const handleBooking = async (startTime: Date, endTime: Date) => {
    setIsBooking(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boatId: boat.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Booking confirmed!");
        router.refresh();
      } else {
        toast.error(data.error || "Booking failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    setIsBooking(true);

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Booking cancelled!");
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || "Cancellation failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsBooking(false);
    }
  };

  const nextDays = Array.from({ length: BOOKING_WINDOW_DAYS }, (_, i) => addDays(new Date(), i));
  const { start: dayStart, end: dayEnd } = getDayBounds(selectedDate);
  const fullDayUserBooking = getExactUserBooking(dayStart, dayEnd);
  const isFullDayBooked = isRangeBooked(dayStart, dayEnd);
  const isFullDayPast = isSlotPast(dayStart);

  useEffect(() => {
    if (!initialDate) {
      return;
    }

    if (format(selectedDate, "yyyy-MM-dd") !== initialDate) {
      return;
    }

    let targetId: string | null = null;

    if (initialFullDay) {
      targetId = `full-day-${initialDate}`;
    } else if (initialTime) {
      const initialDateTime = new Date(`${initialDate}T${initialTime}:00`);
      if (!isNaN(initialDateTime.getTime())) {
        targetId = `slot-${formatSlotId(initialDateTime)}`;
      }
    }

    if (!targetId) {
      return;
    }

    const target = document.getElementById(targetId);
    if (target) {
      setHighlightId(targetId);
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      const timeout = window.setTimeout(() => {
        setHighlightId((current) => (current === targetId ? null : current));
      }, 2500);
      return () => window.clearTimeout(timeout);
    }
  }, [initialDate, initialTime, initialFullDay, selectedDate]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Select a Date</h2>
      
      {/* Date selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(() => {
          const items: React.ReactNode[] = [];

          const renderButton = (date: Date) => (
            <button
              key={date.toISOString()}
              onClick={() => setSelectedDate(date)}
              className={`px-4 py-3 rounded-lg min-w-[100px] transition-colors ${
                format(selectedDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <div className="text-sm font-medium">{format(date, "EEE")}</div>
              <div className="text-lg font-bold">{format(date, "d")}</div>
              <div className="text-xs">{format(date, "MMM")}</div>
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

      <div
        className={`mb-6 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${
          highlightId === `full-day-${format(dayStart, "yyyy-MM-dd")}`
            ? "animate-pulse ring-2 ring-blue-300"
            : ""
        }`}
        id={`full-day-${format(dayStart, "yyyy-MM-dd")}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Full Day Booking</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {format(dayStart, "h:mm a")} - {format(dayEnd, "h:mm a")}
            </p>
          </div>
          {fullDayUserBooking ? (
            <button
              onClick={() => handleCancelBooking(fullDayUserBooking.id)}
              disabled={isBooking}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel Full Day
            </button>
          ) : (
            <button
              onClick={() => handleBooking(dayStart, dayEnd)}
              disabled={isBooking || isFullDayPast || isFullDayBooked}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Book Full Day
            </button>
          )}
        </div>
        {!fullDayUserBooking && isFullDayBooked && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">
            Full day is already booked.
          </p>
        )}
        {!fullDayUserBooking && !isFullDayBooked && isFullDayPast && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Full day booking is only available for future dates.
          </p>
        )}
      </div>

      {/* Time slots */}
      <h3 className="text-lg font-semibold mb-3">
        Available Slots for {format(selectedDate, "MMMM d, yyyy")}
      </h3>
      <div className="space-y-2">
        {timeSlots.map((slot) => {
          const isBooked = isSlotBooked(slot.start, slot.end);
          const isPast = isSlotPast(slot.start);
          const userBooking = getUserBooking(slot.start, slot.end);
          const isDisabled = isBooked || isPast || isBooking;

          return (
            <div
              key={slot.start.toISOString()}
              id={`slot-${formatSlotId(slot.start)}`}
              className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                userBooking
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : isBooked
                  ? "border-red-300 bg-red-50 dark:bg-red-900/20"
                  : isPast
                  ? "border-gray-200 bg-gray-50 dark:bg-gray-900"
                  : "border-blue-200 bg-blue-50 dark:bg-blue-900/20"
              } ${
                highlightId === `slot-${formatSlotId(slot.start)}`
                  ? "animate-pulse ring-2 ring-blue-300"
                  : ""
              }`}
            >
              <div>
                <div className="font-semibold">
                  {format(slot.start, "h:mm a")} - {format(slot.end, "h:mm a")}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {userBooking
                    ? "Your booking"
                    : isBooked
                    ? "Already booked"
                    : isPast
                    ? "Past slot"
                    : "Available"}
                </div>
              </div>
              
              {userBooking ? (
                <button
                  onClick={() => handleCancelBooking(userBooking.id)}
                  disabled={isBooking}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
              ) : (
                <button
                  onClick={() => handleBooking(slot.start, slot.end)}
                  disabled={isDisabled}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Book
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
