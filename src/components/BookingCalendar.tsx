"use client";

import { useState } from "react";
import { format, addDays, startOfDay, setHours, setMinutes } from "date-fns";

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
}

export default function BookingCalendar({ boat, userId }: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isBooking, setIsBooking] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Generate time slots (2-hour blocks from 6 AM to 8 PM)
  const generateTimeSlots = (date: Date) => {
    const slots = [];
    const baseDate = startOfDay(date);
    
    for (let hour = 6; hour < 20; hour += 2) {
      const start = setMinutes(setHours(baseDate, hour), 0);
      const end = setMinutes(setHours(baseDate, hour + 2), 0);
      slots.push({ start, end });
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots(selectedDate);

  const isSlotBooked = (slotStart: Date, slotEnd: Date) => {
    return boat.bookings.some((booking) => {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);
      return (
        (slotStart >= bookingStart && slotStart < bookingEnd) ||
        (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
        (slotStart <= bookingStart && slotEnd >= bookingEnd)
      );
    });
  };

  const isSlotPast = (slotStart: Date) => {
    return slotStart < new Date();
  };

  const getUserBooking = (slotStart: Date, slotEnd: Date) => {
    return boat.bookings.find((booking) => {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);
      return (
        booking.userId === userId &&
        bookingStart.getTime() === slotStart.getTime() &&
        bookingEnd.getTime() === slotEnd.getTime()
      );
    });
  };

  const handleBooking = async (startTime: Date, endTime: Date) => {
    setIsBooking(true);
    setMessage(null);

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
        setMessage({ type: "success", text: "Booking confirmed!" });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMessage({ type: "error", text: data.error || "Booking failed" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    setIsBooking(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Booking cancelled!" });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const data = await response.json();
        setMessage({ type: "error", text: data.error || "Cancellation failed" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setIsBooking(false);
    }
  };

  const nextDays = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Select a Date</h2>
      
      {/* Date selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {nextDays.map((date) => (
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
        ))}
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-lg ${
            message.type === "success"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

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
              className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                userBooking
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : isBooked
                  ? "border-red-300 bg-red-50 dark:bg-red-900/20"
                  : isPast
                  ? "border-gray-200 bg-gray-50 dark:bg-gray-900"
                  : "border-blue-200 bg-blue-50 dark:bg-blue-900/20"
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
