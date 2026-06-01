"use client";

import Image from "next/image";
import { ReactNode, useMemo } from "react";
import {
  FaCheck,
  FaRegCalendarAlt,
  FaClock,
  FaUsers,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import type { Reservation, ReservationBranch } from "@/services/reservations";

const toFiniteNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const buildAddressText = (address: unknown) => {
  const record = getRecord(address);

  return [
    record?.street,
    record?.area,
    record?.city,
    record?.state,
    record?.country,
  ]
    .filter(Boolean)
    .join(", ");
};

const getCoordinatesFromCandidates = (candidates: unknown[]) => {
  for (const candidate of candidates) {
    const record = getRecord(candidate);
    const lat = toFiniteNumber(record?.lat);
    const lng = toFiniteNumber(record?.lng);

    if (lat !== null && lng !== null) {
      return { lat, lng };
    }
  }

  return null;
};

export default function ReservationSuccess({ data }: { data: Reservation | null }) {
  const { user } = useAuth();

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

  const branch = useMemo<Partial<ReservationBranch> | Record<string, unknown>>(() => {
    return (
      data?.branch ||
      getRecord(data)?.branchData ||
      getRecord(data)?.reservationBranch ||
      user?.branch ||
      {}
    );
  }, [data, user]);

  const branchAddress = useMemo(() => {
    return (
      user?.branch?.address ||
      data?.branch?.address ||
      getRecord(data)?.branchAddress ||
      getRecord(data)?.address ||
      branch?.address ||
      branch ||
      {}
    );
  }, [branch, data, user]);

  const branchName = String(
    branch?.name || getRecord(data)?.branchName || getRecord(getRecord(data)?.restaurant)?.name || "Restaurant"
  );

  const addressText = buildAddressText(branchAddress);

  const coordinates = useMemo(() => {
    return getCoordinatesFromCandidates([
      user?.branch?.address,
      data?.branch?.address,
      getRecord(data)?.branchAddress,
      getRecord(data)?.address,
      data?.branch,
      branchAddress,
      data,
    ]);
  }, [branchAddress, data, user]);

  const mapQuery = coordinates
    ? `${coordinates.lat},${coordinates.lng}`
    : String(addressText || branchName);

  const iframeMapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(
    mapQuery
  )}&z=16&output=embed`;

  const directionsUrl = coordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        `${coordinates.lat},${coordinates.lng}`
      )}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        mapQuery
      )}`;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-[760px]">
        {/* HEADER */}
        <div className="mb-8 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-2">
              <div className="flex items-center justify-center rounded-full bg-green-600 p-3">
                <FaCheck className="text-sm text-white" />
              </div>
            </div>
          </div>

          <h1 className="mt-5 text-[30px] font-semibold text-gray-900">
            Reservation Confirmed
          </h1>

          <p className="mx-auto mt-2 max-w-[520px] text-[15px] text-gray-500">
            We look forward to welcoming you. Your reservation has been
            successfully created.
          </p>
        </div>

        {/* CARD */}
        <div className="overflow-hidden rounded-[22px] bg-white shadow-md">
          <div className="relative h-[230px] w-full">
            <Image
              src="/items/table.png"
              alt="Restaurant"
              fill
              className="object-cover"
            />

            <div className="absolute inset-0 bg-black/50" />

            <div className="absolute bottom-5 left-6 text-white">
              <p className="text-sm font-medium text-orange-400">
                Upcoming Dining experience
              </p>

              <h2 className="mt-1 text-[22px] font-semibold">
                Your Reservation
              </h2>

              <p className="mt-1 text-sm text-gray-200">
                Status: {data?.status || "CONFIRMED"}
              </p>
            </div>
          </div>

          {/* DETAILS */}
          <div className="grid grid-cols-2 gap-y-6 px-6 py-6 text-sm">
            <Detail
              icon={<FaRegCalendarAlt />}
              label="Date"
              value={formattedDate}
            />
            <Detail icon={<FaClock />} label="Time" value={formattedTime} />
            <Detail
              icon={<FaUsers />}
              label="Guests"
              value={`${data?.guestCount || 0} People`}
            />
            <Detail
              icon={<FaMapMarkerAlt />}
              label="Seating"
              value={String(data?.note || "Standard Seating")}
            />
          </div>

          {/* CONFIRMATION */}
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between rounded-xl border-l-4 border-orange-500 bg-gray-100 px-5 py-4">
              <div>
                <p className="text-xs text-gray-400">Confirmation ID</p>
                <p className="mt-1 text-lg font-semibold text-orange-600">
                  #{data?.id ? String(data.id).slice(0, 8).toUpperCase() : "N/A"}
                </p>
              </div>

              <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">
                {data?.status || "Booked"}
              </span>
            </div>
          </div>

          {/* MAP */}
          <div className="px-6 pb-8">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
              <div className="flex flex-col gap-1 border-b border-gray-200 bg-white px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">
                  {branchName}
                </p>
                <p className="text-xs text-gray-500">
                  {addressText || "Branch address not available"}
                </p>
              </div>

              <div className="relative h-[220px] w-full">
                <iframe
                  title="Reservation branch location"
                  src={iframeMapSrc}
                  className="h-full w-full border-0"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />

                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute bottom-3 left-3 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-gray-900 shadow transition hover:bg-gray-50"
                >
                  Get Direction
                </a>
              </div>

              <div className="border-t border-gray-200 bg-white px-4 py-3 text-xs text-gray-500">
                {coordinates ? (
                  <span>
                    Location: {coordinates.lat}, {coordinates.lng}
                  </span>
                ) : (
                  <span>
                    Map is using branch address because latitude/longitude are
                    not available.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

type DetailProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

function Detail({ icon, label, value }: DetailProps) {
  return (
    <div className="flex gap-3 border-l-2 border-orange-500 pl-3">
      <div className="mt-0.5 text-[14px] text-gray-400">{icon}</div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="font-medium text-gray-800">{value}</p>
      </div>
    </div>
  );
}
