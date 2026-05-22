"use client";

import Image from "next/image";
import { Clock, Info, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import useApi from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import ReservationSuccess from "./ReservationSuccess";
import AsyncSelect from "@/components/ui/AsyncSelect";

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

const normalizeArray = (value: any): any[] => {
  return Array.isArray(value) ? value : [];
};

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

const getDateRangeRules = (branch: any): DateRangeRule[] => {
  const settings = branch?.settings || {};

  return [
    ...normalizeArray(settings?.holidayRanges),
    ...normalizeArray(settings?.reservationDateRanges),
    ...normalizeArray(settings?.tableReservationDateRanges),
    ...normalizeArray(settings?.reservationBlackoutRanges),
  ];
};

const isSlotInsideBreak = ({
  slotStart,
  slotEnd,
  breakTime,
}: {
  slotStart: number;
  slotEnd: number;
  breakTime: any;
}) => {
  const breakStart = timeToMinutes(breakTime?.startTime);
  const breakEnd = timeToMinutes(breakTime?.endTime);

  if (breakStart === null || breakEnd === null) return false;

  return slotStart < breakEnd && slotEnd > breakStart;
};

const getOpeningHoursForDate = ({
  branch,
  dateValue,
}: {
  branch: any;
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

  const openingHours = normalizeArray(branch?.settings?.openingHours);
  const selectedDay = getDayOfWeek(dateValue);

  const weeklySchedule =
    openingHours.find((hour: any) => {
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
  branch: any;
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

export default function ReserveTablePage() {
  const { token, user } = useAuth();
  const { post, get, loading } = useApi(token);

  const [success, setSuccess] = useState(false);
  const [reservationData, setReservationData] = useState<any>(null);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guestCount, setGuestCount] = useState(2);
  const [note, setNote] = useState("");

  const [selectedBranch, setSelectedBranch] = useState<any>(null);

  const customerId = user?.id;
  const todayDate = useMemo(() => getTodayDateValue(), []);

  useEffect(() => {
    const prefillSelectedBranch = async () => {
      if (!user?.branchId) return;

      try {
        const res = await get(`/v1/branches/${user.branchId}`);
        const branch = res?.data?.data || res?.data;

        if (branch) {
          setSelectedBranch(branch);
        }
      } catch (error) {
        console.error("Failed to prefill selected branch:", error);
      }
    };

    prefillSelectedBranch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.branchId]);

  /* ---------------- FETCH ---------------- */
  const fetchBranches = async ({ search = "", page = 1 }) => {
    return await get(
      `/v1/branches?restaurantId=${user?.restaurantId}&search=${search}&page=${page}`
    );
  };

  const handleBranchSelect = (branch: any) => {
    setSelectedBranch(branch);
    setDate("");
    setTime("");
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
      setTime("");
    }
  }, [availableTimeSlots, time]);

  const hasOpeningHours = normalizeArray(selectedBranch?.settings?.openingHours).length > 0;
  const dateRangeRules = getDateRangeRules(selectedBranch);

  const dateError = useMemo(() => {
    if (!date) return "";
    if (isPastDateValue(date)) return "Past dates are not available for reservation.";
    if (!selectedBranch?.id) return "Please select a branch first.";
    if (!hasOpeningHours && !selectedDateRule) {
      return "Opening hours are not configured for this branch.";
    }
    if (!todaysHours) return "Opening hours are not available for selected day.";
    if (isClosed) {
      return selectedDateRule
        ? "Reservations are closed for the selected date range."
        : "This branch is closed on selected day.";
    }

    return "";
  }, [
    date,
    selectedBranch?.id,
    hasOpeningHours,
    selectedDateRule,
    todaysHours,
    isClosed,
  ]);

  const timeError = useMemo(() => {
    if (!date || !time) return "";
    if (dateError) return dateError;
    if (!availableTimeSlots.includes(time)) {
      return "Please select a valid reservation time from opening hours.";
    }

    return "";
  }, [date, time, dateError, availableTimeSlots]);

  const timeSelectPlaceholder = useMemo(() => {
    if (!selectedBranch?.id) return "Select branch first";
    if (!date) return "Select date first";
    if (dateError) return "No available time";
    if (!availableTimeSlots.length) return "No future slots available";

    return "Select reservation time";
  }, [selectedBranch?.id, date, dateError, availableTimeSlots.length]);

  const openingHoursLabel = useMemo(() => {
    if (!date || !todaysHours) return "";

    if (todaysHours?.isClosed) {
      return "Closed";
    }

    return `${todaysHours?.openTime || "--:--"} - ${
      todaysHours?.closeTime || "--:--"
    }`;
  }, [date, todaysHours]);

  /* ---------------- SUBMIT ---------------- */
  async function handleSubmit() {
    try {
      if (!customerId) return toast.error("User not found");

      if (!selectedBranch?.id) {
        return toast.error("Please select a branch");
      }

      if (!date || !time) {
        return toast.error("Select date & time");
      }

      if (dateError) {
        return toast.error(dateError);
      }

      if (timeError) {
        return toast.error(timeError);
      }

      if (!availableTimeSlots.includes(time)) {
        return toast.error("Selected time is no longer available");
      }

      const reservationDate = new Date(`${date}T${time}:00`).toISOString();

      const res = await post(
        `/v1/customer-app/table-reservations?customerId=${customerId}`,
        {
          branchId: selectedBranch.id,
          reservationDate,
          guestCount,
          note,
        }
      );

      if (!res || res.error) {
        return toast.error(res?.error || "Failed");
      }

      toast.success("Reservation confirmed 🎉");

      setSuccess(true);
      setReservationData(res.data);

      setDate("");
      setTime("");
      setGuestCount(2);
      setNote("");
      setSelectedBranch(null);
    } catch {
      toast.error("Something went wrong");
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
            Taste The <span className="block text-primary">Extraordinary</span>
          </h1>

          <p className="text-gray-600">
            Book your perfect dining experience effortlessly.
          </p>

          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            <span>4.9</span>
            <span className="text-gray-500">(2.7k reviews)</span>
          </div>
        </div>

        {/* RIGHT */}
        <div className="rounded-2xl bg-white p-10 shadow-xl">
          <div className="mb-[27px] space-y-[2px]">
            <h2 className="text-[23px] font-semibold text-gray-900">
              Reserve a Table
            </h2>
            <p className="text-sm text-gray-500">
              Choose a branch, date, and available time slot from opening hours.
            </p>
          </div>

          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            {/* BRANCH */}
            <div>
              <label className="text-sm font-medium">Select Branch</label>

              <div className="mt-2 flex items-center gap-2">
                <AsyncSelect
                  value={selectedBranch}
                  onChange={handleBranchSelect}
                  placeholder="Choose branch"
                  fetchOptions={fetchBranches}
                />

                {/* INFO TOOLTIP */}
                {selectedBranch?.settings ? (
                  <div className="group relative">
                    <Info className="h-4 w-4 cursor-pointer text-gray-500" />

                    <div className="absolute left-0 top-6 z-50 hidden w-[280px] rounded-xl border bg-white p-3 text-xs shadow-xl group-hover:block">
                      <p className="mb-2 font-semibold">Opening Hours</p>

                      {hasOpeningHours ? (
                        <div className="space-y-1">
                          {selectedBranch.settings.openingHours.map((h: any) => (
                            <div
                              key={h.dayOfWeek}
                              className="flex justify-between gap-3"
                            >
                              <span>{String(h.dayOfWeek || "").slice(0, 3)}</span>
                              <span className="text-right">
                                {h.isClosed
                                  ? "Closed"
                                  : `${h.openTime} - ${h.closeTime}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">
                          Opening hours are not configured.
                        </p>
                      )}

                      {dateRangeRules.length > 0 ? (
                        <div className="mt-3 border-t pt-2">
                          <p className="mb-1 font-semibold">Date range rules</p>
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
                                      ? "Closed"
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
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={date}
                  min={todayDate}
                  disabled={!selectedBranch?.id}
                  onChange={(e) => {
                    const nextDate = e.target.value;

                    setDate(nextDate);
                    setTime("");

                    if (nextDate && isPastDateValue(nextDate)) {
                      toast.error("Past dates are not available for reservation.");
                    }
                  }}
                  className="mt-2 rounded-full bg-[#FAFAF9] pr-11"
                />

                {dateError ? (
                  <p className="mt-1 text-xs text-red-500">{dateError}</p>
                ) : date && openingHoursLabel ? (
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                    <Clock size={12} />
                    Available hours: {openingHoursLabel}
                    {selectedDateRule ? " (date range rule)" : ""}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="text-sm font-medium">Time</label>

                <select
                  value={time}
                  disabled={!selectedBranch?.id || !date || Boolean(dateError)}
                  onChange={(e) => setTime(e.target.value)}
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
                    Only future slots inside opening hours are shown.
                  </p>
                ) : null}
              </div>
            </div>

            {/* GUEST */}
            <div>
              <label className="text-sm font-medium">Guests</label>

              <div className="mt-2 grid grid-cols-4 gap-2">
                {[2, 3, 4, 5].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGuestCount(g)}
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
              <label className="text-sm font-medium">Special Request</label>

              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Birthday, allergies, window seat..."
                className="mt-2 rounded-xl border border-gray-200 bg-[#FAFAF9] focus:border-primary focus:ring-1 focus:ring-primary"
              />

              <p className="mt-1 text-xs text-gray-500">
                Tip: Add occasion details for better experience
              </p>
            </div>

            {/* SUBMIT */}
            <Button
              className="w-full py-4 text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading || !canSubmit}
            >
              {loading ? "Reserving..." : "Confirm Reservation"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
