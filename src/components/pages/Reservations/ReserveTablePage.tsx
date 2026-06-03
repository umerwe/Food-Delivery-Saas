"use client";

import Image from "next/image";
import { Clock, Info, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import useReservations from "@/hooks/useReservations";
import { useAuth } from "@/hooks/useAuth";
import ReservationSuccess from "@/components/pages/Reservations/components/ReservationSuccess";
import { AsyncSelect } from "@/components/ui/AsyncSelect";
import { createReservationSchema, type ReservationFormValues } from "@/validations/reservations";
import type { Reservation, ReservationPayload } from "@/services/reservations";
import type { BranchRecord } from "@/types/branch-selector";

const SLOT_INTERVAL_MINUTES = 30;

type OpeningHours = {
  dayOfWeek?: string;
  isClosed?: boolean;
  openTime?: string;
  closeTime?: string;
  breakTimes?: {
    startTime?: string;
    endTime?: string;
    note?: string;
  }[];
  note?: string;
};

type DateRangeRule = {
  fromDate?: string;
  toDate?: string;
  startDate?: string;
  endDate?: string;
  dateFrom?: string;
  dateTo?: string;
  date?: string;
  isClosed?: boolean;
  openTime?: string;
  closeTime?: string;
  note?: string;
};

const normalizeArray = <T = unknown,>(value: unknown): T[] => {
  return Array.isArray(value) ? value as T[] : [];
};

const getRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const getTodayDateValue = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDateFromValue = (value: string) => {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
};

const getDayOfWeek = (dateValue: string) => {
  const date = getDateFromValue(dateValue);

  if (!date) return "";

  return date
    .toLocaleDateString("en-US", { weekday: "long" })
    .toUpperCase();
};

const isPastDateValue = (value: string) => {
  if (!value) return false;

  return value < getTodayDateValue();
};

const timeToMinutes = (value?: string | null) => {
  if (!value) return null;

  const [hours, minutes] = String(value).split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

  return hours * 60 + minutes;
};

const minutesToTime = (value: number) => {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const formatTimeLabel = (value: string) => {
  const minutes = timeToMinutes(value);

  if (minutes === null) return value;

  const date = new Date();
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

const roundUpToInterval = (minutes: number, interval: number) => {
  return Math.ceil(minutes / interval) * interval;
};

const getCurrentMinutes = () => {
  const now = new Date();

  return now.getHours() * 60 + now.getMinutes();
};

const normalizeDateValue = (value: unknown) => {
  const text = String(value || "").trim();

  if (!text) return "";

  return text.slice(0, 10);
};

const getDateRangeDates = (rule: DateRangeRule) => {
  const fromDate = normalizeDateValue(
    rule?.fromDate || rule?.startDate || rule?.dateFrom || rule?.date
  );

  const toDate = normalizeDateValue(
    rule?.toDate || rule?.endDate || rule?.dateTo || rule?.date || fromDate
  );

  return {
    fromDate,
    toDate,
  };
};

const isDateInsideRange = (dateValue: string, rule: DateRangeRule) => {
  const { fromDate, toDate } = getDateRangeDates(rule);

  if (!dateValue || !fromDate || !toDate) return false;

  return dateValue >= fromDate && dateValue <= toDate;
};

const getDateRangeRules = (branch?: BranchRecord | null): DateRangeRule[] => {
  const settings = branch?.settings || {};

  return [
    ...normalizeArray<DateRangeRule>(settings?.holidayRanges),
    ...normalizeArray<DateRangeRule>(settings?.reservationDateRanges),
    ...normalizeArray<DateRangeRule>(settings?.tableReservationDateRanges),
    ...normalizeArray<DateRangeRule>(settings?.reservationBlackoutRanges),
  ];
};

const isSlotInsideBreak = ({
  slotStart,
  slotEnd,
  breakTime,
}: {
  slotStart: number;
  slotEnd: number;
  breakTime: unknown;
}) => {
  const breakRecord = getRecord(breakTime);
  const breakStart = timeToMinutes(typeof breakRecord?.startTime === "string" ? breakRecord.startTime : null);
  const breakEnd = timeToMinutes(typeof breakRecord?.endTime === "string" ? breakRecord.endTime : null);

  if (breakStart === null || breakEnd === null) return false;

  return slotStart < breakEnd && slotEnd > breakStart;
};

const getOpeningHoursForDate = ({
  branch,
  dateValue,
}: {
  branch?: BranchRecord | null;
  dateValue: string;
}) => {
  if (!branch || !dateValue) {
    return {
      schedule: null as OpeningHours | null,
      dateRule: null as DateRangeRule | null,
      reason: "",
    };
  }

  const rangeRule =
    getDateRangeRules(branch).find((rule) => isDateInsideRange(dateValue, rule)) ||
    null;

  if (rangeRule) {
    const closed = Boolean(rangeRule?.isClosed);

    return {
      schedule: {
        dayOfWeek: getDayOfWeek(dateValue),
        isClosed: closed,
        openTime: rangeRule?.openTime || "09:00",
        closeTime: rangeRule?.closeTime || "18:00",
        breakTimes: [],
        note: rangeRule?.note || "",
      },
      dateRule: rangeRule,
      reason: rangeRule?.note || "",
    };
  }

  const openingHours = normalizeArray<OpeningHours>(branch?.settings?.openingHours);
  const selectedDay = getDayOfWeek(dateValue);

  const weeklySchedule =
    openingHours.find((hour) => {
      return String(hour?.dayOfWeek || "").trim().toUpperCase() === selectedDay;
    }) || null;

  return {
    schedule: weeklySchedule,
    dateRule: null,
    reason: "",
  };
};

const buildAvailableTimeSlots = ({
  branch,
  dateValue,
}: {
  branch?: BranchRecord | null;
  dateValue: string;
}) => {
  if (!branch || !dateValue || isPastDateValue(dateValue)) return [];

  const { schedule } = getOpeningHoursForDate({
    branch,
    dateValue,
  });

  if (!schedule || schedule?.isClosed) return [];

  const open = timeToMinutes(schedule?.openTime);
  const close = timeToMinutes(schedule?.closeTime);

  if (open === null || close === null || open >= close) return [];

  const isToday = dateValue === getTodayDateValue();
  const earliestTodayMinutes = isToday
    ? roundUpToInterval(getCurrentMinutes(), SLOT_INTERVAL_MINUTES)
    : open;

  const startAt = Math.max(open, earliestTodayMinutes);
  const slots: string[] = [];

  for (
    let slotStart = startAt;
    slotStart + SLOT_INTERVAL_MINUTES <= close;
    slotStart += SLOT_INTERVAL_MINUTES
  ) {
    const slotEnd = slotStart + SLOT_INTERVAL_MINUTES;

    const isDuringBreak = normalizeArray(schedule?.breakTimes).some(
      (breakTime) =>
        isSlotInsideBreak({
          slotStart,
          slotEnd,
          breakTime,
        })
    );

    if (!isDuringBreak) {
      slots.push(minutesToTime(slotStart));
    }
  }

  return slots;
};

export function ReserveTablePage() {
  const t = useTranslations("reserveTable");
  const validationT = useTranslations("validation");
  const errorsT = useTranslations("errors");
  const { token, user } = useAuth();
  const { createReservation, fetchReservationBranch, fetchReservationBranches, loading } = useReservations(token);

  const [success, setSuccess] = useState(false);
  const [reservationData, setReservationData] = useState<Reservation | null>(null);

  const reservationSchema = useMemo(() => createReservationSchema({
    branchRequired: validationT("reservationBranchRequired"),
    dateTimeRequired: validationT("reservationDateTimeRequired"),
    pastDate: validationT("reservationPastDate"),
    guestWholeNumber: validationT("reservationGuestWholeNumber"),
    guestMin: validationT("reservationGuestMin"),
    guestMax: validationT("reservationGuestMax"),
    noteMax: validationT("reservationNoteMax"),
  }), [validationT]);

  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      branchId: "",
      date: "",
      time: "",
      guestCount: 2,
      note: "",
    },
  });

  const { handleSubmit: handleFormSubmit, setValue, watch, reset } = form;
  const date = watch("date");
  const time = watch("time");
  const guestCount = watch("guestCount");
  const note = watch("note") || "";

  const [selectedBranch, setSelectedBranch] = useState<BranchRecord | null>(null);

  const customerId = user?.id;
  const todayDate = useMemo(() => getTodayDateValue(), []);

  useEffect(() => {
    const prefillSelectedBranch = async () => {
      if (!user?.branchId) return;

      try {
        const { branch } = await fetchReservationBranch({ branchId: String(user.branchId) });

        if (branch) {
          setSelectedBranch(branch);
          setValue("branchId", String(branch.id), { shouldValidate: true });
        }
      } catch (error) {
      }
    };

    prefillSelectedBranch();
  }, [fetchReservationBranch, setValue, user?.branchId]);

  /* ---------------- FETCH ---------------- */
  const fetchBranches = async ({ search = "", page = 1 }) => {
    return await fetchReservationBranches({
      restaurantId: user?.restaurantId,
      search,
      page,
    });
  };

  const handleBranchSelect = (branch: BranchRecord | null) => {
    setSelectedBranch(branch);
    setValue("branchId", branch?.id ? String(branch.id) : "", { shouldValidate: true });
    setValue("date", "", { shouldValidate: true });
    setValue("time", "", { shouldValidate: true });
  };

  /* ---------------- DAY + OPENING HOURS ---------------- */
  const selectedDay = useMemo(() => {
    return date ? getDayOfWeek(date) : null;
  }, [date]);

  const selectedScheduleState = useMemo(() => {
    return getOpeningHoursForDate({
      branch: selectedBranch,
      dateValue: date,
    });
  }, [selectedBranch, date]);

  const todaysHours = selectedScheduleState.schedule;
  const selectedDateRule = selectedScheduleState.dateRule;
  const isClosed = Boolean(todaysHours?.isClosed);

  const availableTimeSlots = useMemo(() => {
    return buildAvailableTimeSlots({
      branch: selectedBranch,
      dateValue: date,
    });
  }, [selectedBranch, date]);

  useEffect(() => {
    if (!time) return;

    if (!availableTimeSlots.includes(time)) {
      setValue("time", "", { shouldValidate: true });
    }
  }, [availableTimeSlots, time]);

  const hasOpeningHours = normalizeArray(selectedBranch?.settings?.openingHours).length > 0;
  const dateRangeRules = getDateRangeRules(selectedBranch);

  const dateError = useMemo(() => {
    if (!date) return "";
    if (isPastDateValue(date)) return t("errors.pastDate");
    if (!selectedBranch?.id) return t("errors.selectBranchFirst");
    if (!hasOpeningHours && !selectedDateRule) {
      return t("errors.openingHoursNotConfigured");
    }
    if (!todaysHours) return t("errors.openingHoursUnavailable");
    if (isClosed) {
      return selectedDateRule
        ? t("errors.closedDateRange")
        : t("errors.closedSelectedDay");
    }

    return "";
  }, [
    date,
    selectedBranch?.id,
    hasOpeningHours,
    selectedDateRule,
    todaysHours,
    isClosed,
    t,
  ]);

  const timeError = useMemo(() => {
    if (!date || !time) return "";
    if (dateError) return dateError;
    if (!availableTimeSlots.includes(time)) {
      return t("errors.invalidReservationTime");
    }

    return "";
  }, [date, time, dateError, availableTimeSlots, t]);

  const timeSelectPlaceholder = useMemo(() => {
    if (!selectedBranch?.id) return t("selectBranchFirst");
    if (!date) return t("selectDateFirst");
    if (dateError) return t("noAvailableTime");
    if (!availableTimeSlots.length) return t("noFutureSlots");

    return t("selectReservationTime");
  }, [selectedBranch?.id, date, dateError, availableTimeSlots.length, t]);

  const openingHoursLabel = useMemo(() => {
    if (!date || !todaysHours) return "";

    if (todaysHours?.isClosed) {
      return t("closed");
    }

    return `${todaysHours?.openTime || "--:--"} - ${
      todaysHours?.closeTime || "--:--"
    }`;
  }, [date, todaysHours, t]);

  /* ---------------- SUBMIT ---------------- */
  async function handleSubmit(values: ReservationFormValues) {
    try {
      if (!customerId) return toast.error(t("userNotFound"));

      if (!selectedBranch?.id) {
        return toast.error(t("selectBranchToast"));
      }

      if (!date || !time) {
        return toast.error(t("selectDateTime"));
      }

      if (dateError) {
        return toast.error(dateError);
      }

      if (timeError) {
        return toast.error(timeError);
      }

      if (!availableTimeSlots.includes(time)) {
        return toast.error(t("selectedTimeUnavailable"));
      }

      const reservationDate = new Date(`${values.date}T${values.time}:00`).toISOString();

      const payload: ReservationPayload = {
        branchId: selectedBranch.id,
        reservationDate,
        guestCount: values.guestCount,
        note: values.note || "",
      };

      const res = await createReservation({ customerId, payload });

      if (!res || res.error) {
        return toast.error(res?.error || t("failedFallback"));
      }

      toast.success(t("reservationConfirmedToast"));

      setSuccess(true);
      setReservationData(res.data as Reservation);

      reset({ branchId: "", date: "", time: "", guestCount: 2, note: "" });
      setSelectedBranch(null);
    } catch {
      toast.error(errorsT("somethingWentWrong"));
    }
  }

  if (success) return <ReservationSuccess data={reservationData} />;

  const canSubmit =
    Boolean(selectedBranch?.id) &&
    Boolean(date) &&
    Boolean(time) &&
    !dateError &&
    !timeError &&
    availableTimeSlots.includes(time);

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
      {/* BG */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/reserve-table-bg.jpg"
          alt="bg"
          fill
          className="object-cover opacity-10"
        />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-[1200px] gap-12 px-6 py-12 lg:grid-cols-2">
        {/* LEFT */}
        <div className="mt-10 space-y-3">
          <h1 className="text-[60px] font-bold">
            {t("heroTitlePrefix")} <span className="block text-primary">{t("heroTitleHighlight")}</span>
          </h1>

          <p className="text-gray-600">
            {t("heroDescription")}
          </p>

          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            <span>4.9</span>
            <span className="text-gray-500">{t("reviews")}</span>
          </div>
        </div>

        {/* RIGHT */}
        <div className="rounded-2xl bg-white p-10 shadow-xl">
          <div className="mb-[27px] space-y-[2px]">
            <h2 className="text-[23px] font-semibold text-gray-900">
              {t("title")}
            </h2>
            <p className="text-sm text-gray-500">
              {t("subtitle")}
            </p>
          </div>

          <form
            noValidate
            className="space-y-6"
            onSubmit={handleFormSubmit(handleSubmit)}
          >
            {/* BRANCH */}
            <div>
              <label className="text-sm font-medium">{t("selectBranch")}</label>

              <div className="mt-2 flex items-center gap-2">
                <AsyncSelect
                  value={selectedBranch}
                  onChange={handleBranchSelect}
                  placeholder={t("chooseBranch")}
                  fetchOptions={fetchBranches}
                />

                {/* INFO TOOLTIP */}
                {selectedBranch?.settings ? (
                  <div className="group relative">
                    <Info className="h-4 w-4 cursor-pointer text-gray-500" />

                    <div className="absolute left-0 top-6 z-50 hidden w-[280px] rounded-xl border bg-white p-3 text-xs shadow-xl group-hover:block">
                      <p className="mb-2 font-semibold">{t("openingHours")}</p>

                      {hasOpeningHours ? (
                        <div className="space-y-1">
                          {normalizeArray<OpeningHours>(selectedBranch.settings.openingHours).map((h) => (
                            <div
                              key={h.dayOfWeek}
                              className="flex justify-between gap-3"
                            >
                              <span>{String(h.dayOfWeek || "").slice(0, 3)}</span>
                              <span className="text-right">
                                {h.isClosed
                                  ? t("closed")
                                  : `${h.openTime} - ${h.closeTime}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">
                          {t("openingHoursNotConfigured")}
                        </p>
                      )}

                      {dateRangeRules.length > 0 ? (
                        <div className="mt-3 border-t pt-2">
                          <p className="mb-1 font-semibold">{t("dateRangeRules")}</p>
                          <div className="space-y-1">
                            {dateRangeRules.slice(0, 5).map((rule, index) => {
                              const { fromDate, toDate } = getDateRangeDates(rule);

                              return (
                                <div
                                  key={`date-rule-${index}`}
                                  className="flex justify-between gap-3"
                                >
                                  <span>
                                    {fromDate}
                                    {toDate && toDate !== fromDate
                                      ? ` → ${toDate}`
                                      : ""}
                                  </span>
                                  <span className="text-right">
                                    {rule?.isClosed
                                      ? t("closed")
                                      : `${rule?.openTime || "--:--"} - ${
                                          rule?.closeTime || "--:--"
                                        }`}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* DATE + TIME */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">{t("date")}</label>
                <Input
                  type="date"
                  value={date}
                  min={todayDate}
                  disabled={!selectedBranch?.id}
                  onChange={(e) => {
                    const nextDate = e.target.value;

                    setValue("date", nextDate, { shouldValidate: true });
                    setValue("time", "", { shouldValidate: true });

                    if (nextDate && isPastDateValue(nextDate)) {
                      toast.error(t("errors.pastDate"));
                    }
                  }}
                  className="mt-2 rounded-full bg-[#FAFAF9] pr-11"
                />

                {dateError ? (
                  <p className="mt-1 text-xs text-red-500">{dateError}</p>
                ) : date && openingHoursLabel ? (
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                    <Clock size={12} />
                    {t("availableHours", { hours: openingHoursLabel })}
                    {selectedDateRule ? t("dateRangeRuleSuffix") : ""}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="text-sm font-medium">{t("time")}</label>

                <select
                  value={time}
                  disabled={!selectedBranch?.id || !date || Boolean(dateError)}
                  onChange={(e) => setValue("time", e.target.value, { shouldValidate: true })}
                  className="mt-2 h-10 w-full rounded-full border border-input bg-[#FAFAF9] px-4 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">{timeSelectPlaceholder}</option>

                  {availableTimeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {formatTimeLabel(slot)}
                    </option>
                  ))}
                </select>

                {timeError ? (
                  <p className="mt-1 text-xs text-red-500">{timeError}</p>
                ) : date && availableTimeSlots.length > 0 ? (
                  <p className="mt-1 text-xs text-gray-500">
                    {t("futureSlotsOnly")}
                  </p>
                ) : null}
              </div>
            </div>

            {/* GUEST */}
            <div>
              <label className="text-sm font-medium">{t("guests")}</label>

              <div className="mt-2 grid grid-cols-4 gap-2">
                {[2, 3, 4, 5].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setValue("guestCount", g, { shouldValidate: true })}
                    className={`rounded-full py-2 ${
                      guestCount === g ? "bg-primary text-white" : "bg-gray-100"
                    }`}
                  >
                    {g === 5 ? "5+" : g}
                  </button>
                ))}
              </div>
            </div>

            {/* NOTE */}
            <div>
              <label className="text-sm font-medium">{t("specialRequest")}</label>

              <Textarea
  value={note}
  onChange={(e) => setValue("note", e.target.value, { shouldValidate: true })}
  placeholder={t("specialRequestPlaceholder")}
  className="mt-2 rounded-xl border border-gray-200 bg-[#FAFAF9] placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
/>
              <p className="mt-1 text-xs text-gray-500">
                {t("specialRequestTip")}
              </p>
            </div>

            {/* SUBMIT */}
            <Button
              className="w-full py-4 text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading || !canSubmit}
            >
              {loading ? t("reserving") : t("confirmReservation")}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
