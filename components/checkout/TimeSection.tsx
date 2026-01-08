"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function SelectPickupTimeSection() {
  const [selectedDate, setSelectedDate] = useState(1)
  const [selectedTime, setSelectedTime] = useState("7:00 AM")

  const timeSlots = [
    { time: "ASAP", available: true, isSpecial: true },
    { time: "7:00 AM", available: true },
    { time: "7:00 AM", available: false },
    { time: "7:00 AM", available: false },
    { time: "7:00 AM", available: false },
    { time: "7:00 AM", available: false },
    { time: "7:00 AM", available: false },
    { time: "7:00 AM", available: true },
  ]

  const weekDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
  const paddedDates = [
    ...Array(0).fill(null), // Adjust padding based on the month start day
    ...Array.from({ length: 31 }, (_, i) => i + 1)
  ]

  return (
    <section className="space-y-[22px] max-w-[420px]">
      <h2 className="text-[24px] font-semibold text-gray-900">
        Select Pickup Time
      </h2>

      {/* Choose Date Section */}
      <div className="space-y-[14px]">
        <h3 className="text-xl font-medium text-gray-900">Choose date</h3>

        <div className="bg-white px-[29px]">
          <div className="flex items-center justify-between border-b-2 border-gray-200 pb-[21px] mb-[16px]">
            <span className="text-sm text-gray-600">January 2022</span>
            <div className="flex gap-6">
              <button className="text-gray-600 hover:text-gray-900 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button className="text-gray-600 hover:text-gray-900 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday Headers */}
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

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-y-4">
            {paddedDates.map((date, index) => (
              <div key={index} className="flex justify-center items-center">
                {date ? (
                  <button
                    onClick={() => setSelectedDate(date)}
                    className={`w-9 h-9 rounded-full text-sm font-medium transition-all ${date === selectedDate
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "text-gray-600 hover:bg-gray-50"
                      }`}
                  >
                    {date}
                  </button>
                ) : (
                  <div className="w-9 h-9" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Choose Pickup Time Section */}
      <div className="space-y-[16px] mt-[52px]">
        <h3 className="text-xl font-medium text-gray-900">Choose Pickup Time</h3>

        <div className="grid grid-cols-4 gap-3">
          {timeSlots.map((slot, index) => (
            <button
              key={index}
              onClick={() => slot.available && setSelectedTime(slot.time)}
              className={`h-[48px] rounded-[10px] text-sm font-medium transition-all border-2 ${slot.available
                ? "border-blue text-blue bg-white hover:bg-blue/5"
                : "border-primary/40 text-primary bg-white opacity-80"
                }`}
            >
              {slot.time}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}