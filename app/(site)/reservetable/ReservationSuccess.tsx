"use client";

import Image from "next/image";
import { ReactNode } from "react";
import {
  FaCheck,
  FaRegCalendarAlt,
  FaClock,
  FaUsers,
  FaMapMarkerAlt,
} from "react-icons/fa";

export default function ReservationSuccess({ data }: { data: any }) {
  // ✅ Format date & time
  const reservationDate = data?.reservationDate
    ? new Date(data.reservationDate)
    : null;

  const formattedDate = reservationDate
    ? reservationDate.toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "short",
      })
    : "-";

  const formattedTime = reservationDate
    ? reservationDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[760px]">

        {/* ✅ HEADER */}
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <div className="bg-green-100 p-2 rounded-full">
              <div className="bg-green-600 p-3 rounded-full flex items-center justify-center">
                <FaCheck className="text-white text-sm" />
              </div>
            </div>
          </div>

          <h1 className="text-[30px] font-semibold text-gray-900 mt-5">
            Reservation Confirmed
          </h1>

          <p className="text-gray-500 mt-2 text-[15px] max-w-[520px] mx-auto">
            We look forward to welcoming you. Your reservation has been successfully created.
          </p>
        </div>

        {/* ✅ CARD */}
        <div className="bg-white rounded-[22px] shadow-md overflow-hidden">

          {/* IMAGE */}
          <div className="relative h-[230px] w-full">
            <Image
              src="/items/table.png"
              alt="Restaurant"
              fill
              className="object-cover"
            />

            <div className="absolute inset-0 bg-black/50" />

            <div className="absolute bottom-5 left-6 text-white">
              <p className="text-sm text-orange-400 font-medium">
                Upcoming Dining experience
              </p>

              <h2 className="text-[22px] font-semibold mt-1">
                Your Reservation
              </h2>

              <p className="text-sm mt-1 text-gray-200">
                Status: {data?.status || "CONFIRMED"}
              </p>
            </div>
          </div>

          {/* DETAILS */}
          <div className="px-6 py-6 grid grid-cols-2 gap-y-6 text-sm">
            <Detail
              icon={<FaRegCalendarAlt />}
              label="Date"
              value={formattedDate}
            />
            <Detail
              icon={<FaClock />}
              label="Time"
              value={formattedTime}
            />
            <Detail
              icon={<FaUsers />}
              label="Guests"
              value={`${data?.guestCount || 0} People`}
            />
            <Detail
              icon={<FaMapMarkerAlt />}
              label="Seating"
              value={data?.note || "Standard Seating"}
            />
          </div>

          {/* CONFIRMATION */}
          <div className="px-6 pb-6">
            <div className="bg-gray-100 rounded-xl px-5 py-4 flex items-center justify-between border-l-4 border-orange-500">
              <div>
                <p className="text-gray-400 text-xs">Confirmation ID</p>
                <p className="text-orange-600 font-semibold text-lg mt-1">
                  #{data?.id?.slice(0, 8)?.toUpperCase() || "N/A"}
                </p>
              </div>

              <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                {data?.status || "Booked"}
              </span>
            </div>
          </div>

          {/* MAP + BUTTONS */}
          <div className="px-6 pb-8">
            <div className="grid grid-cols-[1fr_180px] gap-4">

              {/* MAP */}
              <div className="relative h-[140px] rounded-xl overflow-hidden">
                <Image
                  src="/items/map.png"
                  alt="Map"
                  fill
                  className="object-cover"
                />

                <button className="absolute bottom-3 left-3 bg-white px-3 py-1 text-xs rounded-md shadow font-medium">
                  Get Direction
                </button>
              </div>

              {/* BUTTONS */}
              <div className="flex flex-col gap-3">
                <button className="bg-orange-500 text-white py-3 rounded-xl font-medium hover:bg-orange-600 transition text-sm">
                  View Menu
                </button>

                <button className="border border-gray-300 py-3 rounded-xl font-medium hover:bg-gray-50 transition text-sm">
                  Add to Calendar
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ✅ DETAIL COMPONENT */
type DetailProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

function Detail({ icon, label, value }: DetailProps) {
  return (
    <div className="flex gap-3 border-l-2 border-orange-500 pl-3">
      <div className="text-gray-400 mt-0.5 text-[14px]">{icon}</div>
      <div>
        <p className="text-gray-400 text-xs">{label}</p>
        <p className="font-medium text-gray-800">{value}</p>
      </div>
    </div>
  );
}