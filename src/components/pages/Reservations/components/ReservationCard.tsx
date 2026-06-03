"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Calendar,
  Users,
  CheckCircle,
  Star,
  Sofa,
} from "lucide-react";
import type { Reservation } from "@/services/reservations";

const getReservationStatusKey = (status?: string | null) => {
  switch (String(status || "").toUpperCase()) {
    case "PENDING":
      return "pending";
    case "CONFIRMED":
      return "confirmed";
    case "CANCELLED":
      return "cancelled";
    case "COMPLETED":
      return "completed";
    case "NO_SHOW":
      return "noShow";
    default:
      return null;
  }
};

export default function ReservationCard({
  res,
  onCancel,
}: {
  res: Reservation;
  onCancel: () => void;
}) {
  const t = useTranslations("reservations");
  const formattedDate = new Date(res.reservationDate).toLocaleString(
    "en-US",
    {
      weekday: "long",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );

  const isCancelled = res.status === "CANCELLED";
  const statusKey = getReservationStatusKey(res.status);
  const statusLabel = statusKey ? t(`statusLabels.${statusKey}`) : res.status;

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      {/* Image */}
      <div className="relative h-48 sm:h-56 w-full">
        <Image
          src={res.branch?.coverImage || "/items/reservation.png"}
          alt={res.branch?.name || "branch"}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="bg-primary text-white text-xs px-3 py-1 rounded-full font-medium">
            {statusLabel}
          </span>

          <span className="bg-white text-black text-xs px-2 py-1 rounded-full shadow flex items-center gap-1">
            <Star size={14} className="text-yellow fill-yellow" />
            4.5
          </span>
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-4 left-4 text-white">
          <h2 className="text-lg sm:text-xl font-semibold">
            {res.branch?.name}
          </h2>
          <p className="text-xs sm:text-sm opacity-90">
            {res.branch?.description || t("noDescription")}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 space-y-5">
        {/* Top row */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4 text-sm">
          <div>
            <p className="text-gray-400 text-xs">{t("dateTime")}</p>
            <div className="flex gap-2 items-center mt-2">
              <Calendar size={16} className="text-primary" />
              <span>{formattedDate}</span>
            </div>
          </div>

          <div>
            <p className="text-gray-400 text-xs">{t("partySize")}</p>
            <div className="flex gap-2 items-center mt-2">
              <Users size={16} className="text-primary" />
              <span>{t("guests", { count: res.guestCount })}</span>
            </div>
          </div>

          <div>
            <p className="text-gray-400 text-xs mb-2">
              {t("confirmationId")}
            </p>
            <span className="bg-gray-100 px-2 py-1 rounded text-primary text-sm ">
              {String(res.id).slice(0, 8)}
            </span>
          </div>
        </div>

        {/* Seating + Status */}
        <div className="flex gap-3">
          <div className="flex-1 bg-gray-100 p-3 rounded-lg flex items-center gap-3">
            <Sofa size={17} />
            <div>
              <p className="text-gray-400 text-xs">{t("seating")}</p>
              <p className="text-sm font-medium">
                {t("standardSeating")}
              </p>
            </div>
          </div>

          <div className="flex-1 bg-green-50 p-3 rounded-lg flex items-center gap-3 text-green-600">
            <CheckCircle size={16} />
            <div>
              <p className="text-xs">{t("status")}</p>
              <p className="text-sm font-medium">
                {statusLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Cancel */}
        {!isCancelled && (
          <button
            onClick={onCancel}
            className="w-full bg-primary text-white py-3 rounded-xl font-medium hover:opacity-90 transition"
          >
            {t("cancel")}
          </button>
        )}
      </div>
    </div>
  );
}
