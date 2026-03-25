"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  pickupDate: Date | null;
  setPickupDate: (value: Date) => void;
  pickupTime: string | null;
  setPickupTime: (value: string) => void;
}

export default function SelectPickupTimeSection({
  pickupDate,
  setPickupDate,
  pickupTime,
  setPickupTime,
}: Props) {
  const timeSlots = [
    { time: "ASAP", available: true },
    { time: "7:00 AM", available: true },
    { time: "8:00 AM", available: false },
    { time: "9:00 AM", available: false },
    { time: "10:00 AM", available: false },
    { time: "11:00 AM", available: false },
    { time: "12:00 PM", available: false },
    { time: "1:00 PM", available: true },
  ];

  const weekDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  // ✅ Dynamic current month/year
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <section className="space-y-[22px] max-w-[420px]">
      <h2 className="text-[24px] font-semibold text-gray-900">
        Select Pickup Time
      </h2>

      {/* DATE */}
      <div className="space-y-[14px]">
        <h3 className="text-xl font-medium text-gray-900">
          Choose date
        </h3>

        <div className="bg-white px-[29px] py-4 rounded-xl shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-gray-200 pb-[21px] mb-[16px]">
            <span className="text-sm text-gray-600">
              {today.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </span>

            <div className="flex gap-6">
              <button className="text-gray-600 hover:text-gray-900">
                <ChevronLeft size={16} />
              </button>
              <button className="text-gray-600 hover:text-gray-900">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-[10px] font-semibold text-gray-400"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-7 gap-y-4">
            {dates.map((date) => {
              const fullDate = new Date(currentYear, currentMonth, date);

              return (
                <div key={date} className="flex justify-center items-center">
                  <button
                    onClick={() => setPickupDate(fullDate)}
                    className={`w-9 h-9 rounded-full text-sm font-medium transition-all ${
                      pickupDate?.getDate() === date &&
                      pickupDate?.getMonth() === currentMonth &&
                      pickupDate?.getFullYear() === currentYear
                        ? "bg-orange-500 text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {date}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* TIME */}
      <div className="space-y-[16px] mt-[52px]">
        <h3 className="text-xl font-medium text-gray-900">
          Choose Pickup Time
        </h3>

        <div className="grid grid-cols-4 gap-3">
          {timeSlots.map((slot) => (
            <button
              key={slot.time}
              onClick={() => {
                if (!slot.available) return;
                setPickupTime(slot.time);
              }}
              className={`h-[48px] rounded-[10px] text-sm font-medium transition-all border-2 ${
                slot.available
                  ? pickupTime === slot.time
                    ? "border-orange-500 bg-orange-500 text-white shadow-md"
                    : "border-gray-200 text-gray-700 bg-white hover:border-orange-400 hover:text-orange-500"
                  : "border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed"
              }`}
            >
              {slot.time}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}