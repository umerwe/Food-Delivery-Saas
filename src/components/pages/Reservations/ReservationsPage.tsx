"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import ReservationCard from "@/components/pages/Reservations/components/ReservationCard";
import { useAuth } from "@/hooks/useAuth";
import useReservations from "@/hooks/useReservations";
import type { Reservation, ReservationMeta } from "@/services/reservations";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export function ReservationsPage() {
  const t = useTranslations("reservations");
  const { token } = useAuth();
  const { cancelReservation, fetchReservations: fetchReservationList } = useReservations(token);

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<ReservationMeta | null>(null);

  const [filter, setFilter] = useState("upcoming");
  const [sort, setSort] = useState("nearest");

  const [error, setError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true); //  FIX

  const fetchReservations = async () => {
    setError(null);

    const { response: res, reservations: nextReservations, meta: nextMeta } = await fetchReservationList();

    if (res?.error) {
      setError(String(res.error));
    } else {
      setReservations(nextReservations);
      setMeta(nextMeta);
    }

    setIsInitialLoading(false); //  mark fetch done
  };

  useEffect(() => {
    if (token) fetchReservations();
  }, [token, page]);

  //  FILTER
  const filtered = reservations.filter((r) => {
    if (filter === "all") return true;
    if (filter === "cancelled") return r.status === "CANCELLED";
    if (filter === "past")
      return new Date(r.reservationDate) < new Date();

    return (
      r.status !== "CANCELLED" &&
      new Date(r.reservationDate) >= new Date()
    );
  });

  //  SORT
  const sorted = [...filtered].sort((a, b) => {
    const d1 = new Date(a.reservationDate).getTime();
    const d2 = new Date(b.reservationDate).getTime();
    return sort === "nearest" ? d1 - d2 : d2 - d1;
  });

  return (
    <div className="p-4 sm:p-6 md:px-20 lg:px-40 mx-auto bg-white min-h-screen">
      <h1 className="text-2xl sm:text-3xl font-semibold">
        {t("title")}
      </h1>

      {/* Tabs + Sort */}
      <div className="flex flex-col sm:flex-row sm:justify-between mt-6 gap-4">
        <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
          {["all", "upcoming", "past", "cancelled"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                filter === tab
                  ? "bg-white shadow text-black"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              {t(`filters.${tab}`)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">{t("sortBy")}</span>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[185px] border-none shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nearest">
                {t("sortNearest")}
              </SelectItem>
              <SelectItem value="farthest">
                {t("sortFarthest")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ========================= */}
      {/*  INITIAL LOADING (SKELETON) */}
      {/* ========================= */}
      {isInitialLoading && (
      <div className="grid md:grid-cols-2 gap-x-6 gap-y-10 mt-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-md overflow-hidden animate-pulse"
            >
              <div className="h-48 bg-gray-200" />
              <div className="p-5 space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-10 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================= */}
      {/*  ERROR STATE */}
      {/* ========================= */}
      {!isInitialLoading && error && (
        <div className="mt-12 flex flex-col items-center text-center">
          <p className="text-red-500 font-medium">{error}</p>
          <button
            onClick={fetchReservations}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
          >
            {t("retry")}
          </button>
        </div>
      )}

      {/* ========================= */}
      {/*  EMPTY STATE */}
      {/* ========================= */}
      {!isInitialLoading && !error && sorted.length === 0 && (
        <div className="mt-16 text-center">
          <h2 className="text-lg font-semibold text-gray-700">
            {t("emptyTitle")}
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            {t("emptyDescription")}
          </p>
        </div>
      )}

      {/* ========================= */}
      {/*  DATA */}
      {/* ========================= */}
      {!isInitialLoading && !error && sorted.length > 0 && (
<div className="grid md:grid-cols-2 gap-x-6 gap-y-10 mt-6">
          {sorted.map((res) => (
            <ReservationCard
              key={res.id}
              res={res}
              onCancel={async () => {
                await cancelReservation({ reservationId: String(res.id) });
                fetchReservations();
              }}
            />
          ))}
        </div>
      )}

      {/* ========================= */}
      {/*  PAGINATION */}
      {/* ========================= */}
      {!isInitialLoading &&
        !error &&
        sorted.length > 0 &&
        meta &&
        (meta.totalPages || 0) > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10 flex-wrap">
            <button
              disabled={!meta.hasPrevious}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
            >
              ←
            </button>

            {Array.from({ length: meta.totalPages || 0 }).map((_, i) => {
              const pageNumber = i + 1;
              return (
                <button
                  key={i}
                  onClick={() => setPage(pageNumber)}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    meta.page === pageNumber
                      ? "bg-primary text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              disabled={!meta.hasNext}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
            >
              →
            </button>
          </div>
        )}
    </div>
  );
}
