"use client";

import Image from "next/image";
import { AlertTriangle, CalendarX, Clock, LoaderCircle, Star, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OpeningHoursDialog } from "@/components/common/popups/OpeningHoursDialog";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import useReservations from "@/hooks/useReservations";
import { useAuth } from "@/hooks/useAuth";
import { ReservationSuccess } from "@/components/pages/Reservations/components/ReservationSuccess";
import { AsyncSelect } from "@/components/ui/AsyncSelect";
import { getApiErrorMessage } from "@/lib/errors";
import { createReservationSchema, type ReservationFormValues } from "@/validations/reservations";
import {
  getReservationStatusLabelKey,
  normalizeReservationResponse,
  type Reservation,
  type ReservationPayload,
} from "@/services/reservations";
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

type ReservationBlockReason = "temporaryClosure" | "holiday" | "unavailable";

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
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
};

const formatHoursRangeLabel = (openTime?: string, closeTime?: string) => {
  const open = openTime ? formatTimeLabel(openTime) : "";
  const close = closeTime ? formatTimeLabel(closeTime) : "";

  return open && close ? `${open} - ${close}` : "--:-- - --:--";
};

const formatDayShortLabel = (value?: string) => {
  const text = String(value || "").trim().toLowerCase();

  if (!text) return "Day";

  return `${text.slice(0, 1).toUpperCase()}${text.slice(1, 3)}`;
};

const formatBreakTimeLabel = (breakTime: NonNullable<OpeningHours["breakTimes"]>[number]) => {
  const range = formatHoursRangeLabel(breakTime.startTime, breakTime.endTime);
  const note = String(breakTime.note || "").trim();

  return note ? `${range} (${note})` : range;
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

const getTemporaryClosure = (branch?: BranchRecord | null) =>
  branch?.availability?.temporaryClosure || branch?.settings?.temporaryClosure || null;

const getDateTimeFromDateAndMinutes = (dateValue: string, minutes: number) => {
  const date = getDateFromValue(dateValue);

  if (!date) return null;

  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date;
};

const getTimestamp = (value?: string | null) => {
  if (!value) return null;

  const date = new Date(value);
  const timestamp = date.getTime();

  return Number.isFinite(timestamp) ? timestamp : null;
};

const isTemporaryClosureActiveForDate = (branch: BranchRecord | null, dateValue: string) => {
  const closure = getTemporaryClosure(branch);

  if (!branch || !dateValue || (!closure?.isClosed && !branch.availability?.isTemporarilyClosed)) {
    return false;
  }

  const from = getTimestamp(closure?.closedAt);
  const to = getTimestamp(closure?.closedUntil);

  if (from === null && to === null) {
    return true;
  }

  const dayStart = getDateFromValue(dateValue);

  if (!dayStart) return true;

  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 59, 999);

  const closureStart = from ?? Number.NEGATIVE_INFINITY;
  const closureEnd = to ?? Number.POSITIVE_INFINITY;

  return closureStart <= dayEnd.getTime() && closureEnd >= dayStart.getTime();
};

const isSlotInsideTemporaryClosure = ({
  branch,
  dateValue,
  slotStart,
  slotEnd,
}: {
  branch?: BranchRecord | null;
  dateValue: string;
  slotStart: number;
  slotEnd: number;
}) => {
  const closure = getTemporaryClosure(branch);

  if (!branch || !dateValue || (!closure?.isClosed && !branch.availability?.isTemporarilyClosed)) {
    return false;
  }

  const from = getTimestamp(closure?.closedAt);
  const to = getTimestamp(closure?.closedUntil);

  if (from === null && to === null) {
    return true;
  }

  const slotStartDate = getDateTimeFromDateAndMinutes(dateValue, slotStart);
  const slotEndDate = getDateTimeFromDateAndMinutes(dateValue, slotEnd);

  if (!slotStartDate || !slotEndDate) return true;

  const closureStart = from ?? Number.NEGATIVE_INFINITY;
  const closureEnd = to ?? Number.POSITIVE_INFINITY;

  return slotStartDate.getTime() < closureEnd && slotEndDate.getTime() > closureStart;
};

const getHolidayOpeningHoursForDate = ({
  branch,
  dateValue,
}: {
  branch?: BranchRecord | null;
  dateValue: string;
}): OpeningHours | null => {
  const holidayOpeningHour = getRecord(branch?.availability?.holidayOpeningHour);

  if (!holidayOpeningHour || !dateValue) {
    return null;
  }

  const holidayDate = typeof holidayOpeningHour.date === "string"
    ? normalizeDateValue(holidayOpeningHour.date)
    : "";

  if (holidayDate && holidayDate !== dateValue) {
    return null;
  }

  if (!holidayDate && dateValue !== getTodayDateValue()) {
    return null;
  }

  return {
    dayOfWeek: getDayOfWeek(dateValue),
    isClosed: Boolean(holidayOpeningHour.isClosed),
    openTime: typeof holidayOpeningHour.openTime === "string" ? holidayOpeningHour.openTime : undefined,
    closeTime: typeof holidayOpeningHour.closeTime === "string" ? holidayOpeningHour.closeTime : undefined,
    breakTimes: [],
    note: typeof holidayOpeningHour.note === "string" ? holidayOpeningHour.note : "",
  };
};

const getBranchAvailabilityBlock = ({
  branch,
  dateValue,
}: {
  branch?: BranchRecord | null;
  dateValue: string;
}) => {
  if (!branch || !dateValue) {
    return null;
  }

  if (branch.isActive === false || branch.availability?.isActive === false) {
    return {
      reason: "unavailable" as ReservationBlockReason,
      message: branch.availability?.reason || "",
    };
  }

  if (branch.availability?.isHolidayClosed && dateValue === getTodayDateValue()) {
    return {
      reason: "holiday" as ReservationBlockReason,
      message: branch.availability?.reason || "",
    };
  }

  if (isTemporaryClosureActiveForDate(branch, dateValue)) {
    const closure = getTemporaryClosure(branch);

    return {
      reason: "temporaryClosure" as ReservationBlockReason,
      message: closure?.message || closure?.reason || branch.availability?.reason || "",
    };
  }

  if (
    branch.availability?.isAvailable === false &&
    !branch.availability?.isTemporarilyClosed &&
    !branch.availability?.isHolidayClosed
  ) {
    return {
      reason: "unavailable" as ReservationBlockReason,
      message: branch.availability?.reason || "",
    };
  }

  return null;
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

  const holidayOpeningHours = getHolidayOpeningHoursForDate({ branch, dateValue });

  if (holidayOpeningHours) {
    return {
      schedule: holidayOpeningHours,
      dateRule: null,
      reason: holidayOpeningHours.note || "",
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

  const availabilityBlock = getBranchAvailabilityBlock({ branch, dateValue });

  if (availabilityBlock?.reason === "unavailable" || availabilityBlock?.reason === "holiday") {
    return [];
  }

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

    const isDuringTemporaryClosure = isSlotInsideTemporaryClosure({
      branch,
      dateValue,
      slotStart,
      slotEnd,
    });

    if (!isDuringBreak && !isDuringTemporaryClosure) {
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

  const {
    formState: { isSubmitting },
    handleSubmit: handleFormSubmit,
    setValue,
    watch,
    reset,
  } = form;
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

    if (!branch?.id) return;

    fetchReservationBranch({ branchId: String(branch.id) })
      .then(({ branch: branchDetails }) => {
        if (branchDetails) {
          setSelectedBranch(branchDetails);
        }
      })
      .catch(() => {
        setSelectedBranch(branch);
      });
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
  const reservationsEnabled = selectedBranch?.settings?.tableReservationsEnabled === true;
  const selectedAvailabilityBlock = useMemo(() => {
    return getBranchAvailabilityBlock({
      branch: selectedBranch,
      dateValue: date,
    });
  }, [selectedBranch, date]);

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
  const openingHoursRows = normalizeArray<OpeningHours>(selectedBranch?.settings?.openingHours);

  const dateError = useMemo(() => {
    if (!date) return "";
    if (isPastDateValue(date)) return t("errors.pastDate");
    if (!selectedBranch?.id) return t("errors.selectBranchFirst");
    if (!reservationsEnabled) return t("errors.branchUnavailable");
    if (selectedAvailabilityBlock?.reason === "unavailable") {
      return selectedAvailabilityBlock.message || t("errors.branchUnavailable");
    }
    if (selectedAvailabilityBlock?.reason === "holiday") {
      return selectedAvailabilityBlock.message || t("errors.holidayClosed");
    }
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
    reservationsEnabled,
    hasOpeningHours,
    selectedDateRule,
    selectedAvailabilityBlock,
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

  const reservationNotice = useMemo(() => {
    if (!selectedBranch?.id) {
      return null;
    }

    const closure = getTemporaryClosure(selectedBranch);
    const closureUntil = closure?.closedUntil ? new Date(closure.closedUntil) : null;
    const formattedClosureUntil = closureUntil && !Number.isNaN(closureUntil.getTime())
      ? closureUntil.toLocaleString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        })
      : "";

    if (date && selectedAvailabilityBlock?.reason === "temporaryClosure") {
      return {
        tone: "warning" as const,
        icon: AlertTriangle,
        title: t("temporaryClosureTitle"),
        message: selectedAvailabilityBlock.message || t("temporaryClosureDescription"),
        meta: formattedClosureUntil ? t("temporaryClosureUntil", { date: formattedClosureUntil }) : "",
      };
    }

    if (date && selectedAvailabilityBlock?.reason === "holiday") {
      return {
        tone: "danger" as const,
        icon: CalendarX,
        title: t("holidayClosureTitle"),
        message: selectedAvailabilityBlock.message || t("holidayClosureDescription"),
        meta: "",
      };
    }

    if (date && selectedAvailabilityBlock?.reason === "unavailable") {
      return {
        tone: "danger" as const,
        icon: CalendarX,
        title: t("branchUnavailableTitle"),
        message: selectedAvailabilityBlock.message || t("branchUnavailableDescription"),
        meta: "",
      };
    }

    if (date && isClosed) {
      return {
        tone: "danger" as const,
        icon: CalendarX,
        title: t("closedDayTitle"),
        message: dateError || t("errors.closedSelectedDay"),
        meta: "",
      };
    }

    if (date && availableTimeSlots.length === 0 && !dateError) {
      return {
        tone: "warning" as const,
        icon: Clock,
        title: t("noSlotsTitle"),
        message: t("noSlotsDescription"),
        meta: "",
      };
    }

    if (date && openingHoursLabel) {
      return {
        tone: "success" as const,
        icon: Clock,
        title: t("availableTodayTitle"),
        message: t("availableHours", { hours: openingHoursLabel }),
        meta: selectedDateRule ? t("dateRangeRuleSuffix") : "",
      };
    }

    return null;
  }, [
    availableTimeSlots.length,
    date,
    dateError,
    isClosed,
    openingHoursLabel,
    selectedAvailabilityBlock,
    selectedBranch,
    selectedDateRule,
    t,
  ]);

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
        return toast.error(getApiErrorMessage(res, t("failedFallback")));
      }

      const reservation = normalizeReservationResponse(res);
      const statusKey = getReservationStatusLabelKey(reservation?.status);
      const toastMessage =
        statusKey === "confirmed"
          ? t("reservationConfirmedToast")
          : statusKey === "requested"
            ? t("reservationRequestedToast")
            : t("reservationCreatedToast");

      toast.success(toastMessage);

      setSuccess(true);
      setReservationData(reservation);

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
  const ReservationNoticeIcon = reservationNotice?.icon;

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

                {/* INFO POPUP */}
                {selectedBranch?.settings ? (
                  <OpeningHoursDialog
                    triggerLabel={t("openingHours")}
                    badgeLabel={t("openingHours")}
                    title={t("hoursPopupTitle")}
                    description=""
                    branchPill={selectedBranch?.name || undefined}
                    stats={[]}
                    sections={[
                      {
                        id: "opening-hours",
                        title: t("openingHours"),
                        icon: Store,
                        rows: openingHoursRows.map((hour, index) => ({
                          id: String(hour.dayOfWeek || `opening-hour-${index}`),
                          title: formatDayShortLabel(hour.dayOfWeek),
                          subtitle: t("openingHours"),
                          statusLabel: hour.isClosed ? t("closed") : t("open"),
                          isClosed: Boolean(hour.isClosed),
                          hoursLabel: formatHoursRangeLabel(hour.openTime, hour.closeTime),
                          breakLabels: normalizeArray<NonNullable<OpeningHours["breakTimes"]>[number]>(hour.breakTimes).map(formatBreakTimeLabel),
                          closedTitle: t("closed"),
                          closedDescription: t("openingHoursNotConfigured"),
                          breakPrefix: t("breakTime", { time: "" }).trim(),
                        })),
                        emptyTitle: t("openingHoursNotConfigured"),
                      },
                      ...(dateRangeRules.length > 0
                        ? [{
                            id: "date-range-rules",
                            title: t("dateRangeRules"),
                            icon: CalendarX,
                            rows: dateRangeRules.slice(0, 5).map((rule, index) => {
                              const { fromDate, toDate } = getDateRangeDates(rule);

                              return {
                                id: `date-rule-${index}`,
                                title: `${fromDate}${toDate && toDate !== fromDate ? ` - ${toDate}` : ""}`,
                                subtitle: t("dateRangeRules"),
                                statusLabel: rule?.isClosed ? t("closed") : t("open"),
                                isClosed: Boolean(rule?.isClosed),
                                hoursLabel: formatHoursRangeLabel(rule?.openTime, rule?.closeTime),
                                breakLabels: [],
                                closedTitle: t("closed"),
                                closedDescription: rule?.note || t("errors.closedDateRange"),
                                breakPrefix: t("breakTime", { time: "" }).trim(),
                              };
                            }),
                            emptyTitle: t("dateRangeRules"),
                          }]
                        : []),
                    ]}
                    closeLabel={t("closeModal")}
                  />
                ) : null}
              </div>
            </div>

            {reservationNotice ? (
              <div
                className={`rounded-2xl border p-4 shadow-sm ${
                  reservationNotice.tone === "success"
                    ? "border-emerald-200 bg-emerald-50/80 text-emerald-950"
                    : reservationNotice.tone === "warning"
                      ? "border-amber-200 bg-amber-50/90 text-amber-950"
                      : "border-red-200 bg-red-50/90 text-red-950"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      reservationNotice.tone === "success"
                        ? "bg-emerald-100 text-emerald-700"
                        : reservationNotice.tone === "warning"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {ReservationNoticeIcon ? <ReservationNoticeIcon className="h-5 w-5" /> : null}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {reservationNotice.title}
                    </p>
                    <p className="mt-1 text-sm leading-5 opacity-80">
                      {reservationNotice.message}
                      {reservationNotice.meta ? ` ${reservationNotice.meta}` : ""}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

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

                    if (nextDate && isPastDateValue(nextDate)) {
                      toast.error(t("errors.pastDate"));
                      setValue("date", todayDate, { shouldValidate: true });
                      setValue("time", "", { shouldValidate: true });
                      return;
                    }

                    setValue("date", nextDate, { shouldValidate: true });
                    setValue("time", "", { shouldValidate: true });
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
              disabled={loading || isSubmitting || !canSubmit}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  {t("reserving")}
                </>
              ) : (
                t("confirmReservation")
              )}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
