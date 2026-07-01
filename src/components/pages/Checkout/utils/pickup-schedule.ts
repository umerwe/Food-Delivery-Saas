import type { BranchRecord } from "@/types/branch-selector";

const DEFAULT_SLOT_INTERVAL_MINUTES = 30;
const DEFAULT_SCHEDULE_TIME_ZONE = "Europe/Berlin";

type OpeningHours = {
  dayOfWeek?: string;
  date?: string;
  isClosed?: boolean;
  openTime?: string;
  closeTime?: string;
  breakTimes?: {
    startTime?: string;
    endTime?: string;
    note?: string;
  }[];
};

type PickupSchedule = {
  schedule: OpeningHours | null;
  hasOpeningHours: boolean;
  source: "temporaryClosure" | "opening" | "delivery" | "holiday" | null;
};

export type PickupTimeSlot = {
  value: string;
  label: string;
};

export type ScheduleBreakLabel = {
  label: string;
  note?: string;
};

export type ScheduledDeliveryEstimate = {
  selectedLabel: string;
  readyLabel: string;
  preparationMinutes: number;
  scheduledAt: Date;
};

export const normalizeArray = <T = unknown,>(value: unknown): T[] =>
  Array.isArray(value) ? value as T[] : [];

export const getDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const getTodayDateValue = () => getDateValue(new Date());

export const getDateFromValue = (value: string) => {
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

export const isPastDateValue = (value: string) => {
  if (!value) return false;

  return value < getTodayDateValue();
};

export const timeToMinutes = (value?: string | null) => {
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

const formatEstimateTimeLabel = (date: Date) =>
  date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

const formatEstimateDateTimeLabel = (date: Date, baseDate: Date) => {
  const timeLabel = formatEstimateTimeLabel(date);

  if (getDateValue(date) === getDateValue(baseDate)) {
    return timeLabel;
  }

  return `${timeLabel}, ${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;
};

export const formatPickupTimeLabel = (value: string) => {
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

export const buildScheduleBreakLabels = (
  schedule?: OpeningHours | null
): ScheduleBreakLabel[] =>
  normalizeArray(schedule?.breakTimes).reduce<ScheduleBreakLabel[]>((labels, breakTime) => {
    const breakRecord = getRecord(breakTime);
    const startTime = typeof breakRecord?.startTime === "string" ? breakRecord.startTime : "";
    const endTime = typeof breakRecord?.endTime === "string" ? breakRecord.endTime : "";
    const note = typeof breakRecord?.note === "string" ? breakRecord.note.trim() : "";

    if (!startTime || !endTime) return labels;

    labels.push({
      label: `${formatPickupTimeLabel(startTime)} - ${formatPickupTimeLabel(endTime)}`,
      ...(note ? { note } : {}),
    });

    return labels;
  }, []);

export const getScheduledDateTime = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) return null;

  const scheduledDate = new Date(trimmedValue);

  if (Number.isNaN(scheduledDate.getTime())) return null;

  return scheduledDate;
};

const getTimeZoneName = (value: unknown) => {
  const trimmedValue = typeof value === "string" ? value.trim() : "";

  return trimmedValue || null;
};

export const getBranchScheduleTimeZone = (branch: BranchRecord | null | undefined) => {
  const branchRecord = getRecord(branch);
  const settings = getRecord(branch?.settings);
  const scheduleTimings = getScheduleTimingsRecord(branch);

  return getTimeZoneName(branchRecord?.timezone) ||
    getTimeZoneName(branchRecord?.timeZone) ||
    getTimeZoneName(settings?.timezone) ||
    getTimeZoneName(settings?.timeZone) ||
    getTimeZoneName(scheduleTimings?.timezone) ||
    getTimeZoneName(scheduleTimings?.timeZone) ||
    DEFAULT_SCHEDULE_TIME_ZONE;
};

const parseLocalScheduleDateTimeParts = (value: string) => {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);

  if (!match) return null;

  const [, year, month, day, hours, minutes] = match;
  const parsed = {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hours: Number(hours),
    minutes: Number(minutes),
  };

  if (
    !Number.isFinite(parsed.year) ||
    parsed.month < 1 ||
    parsed.month > 12 ||
    parsed.day < 1 ||
    parsed.day > 31 ||
    parsed.hours < 0 ||
    parsed.hours > 23 ||
    parsed.minutes < 0 ||
    parsed.minutes > 59
  ) {
    return null;
  }

  return parsed;
};

const getTimeZoneOffsetMs = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const hour = values.hour === "24" ? "00" : values.hour;
  const localUtcMs = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(hour),
    Number(values.minute),
    Number(values.second),
  );

  return localUtcMs - date.getTime();
};

export const getScheduleOrderTimeIso = ({
  dateValue,
  timeValue,
  preparationMinutes = 0,
  timeZone = DEFAULT_SCHEDULE_TIME_ZONE,
}: {
  dateValue: string;
  timeValue: string;
  preparationMinutes?: number;
  timeZone?: string;
}) => {
  const parts = parseLocalScheduleDateTimeParts(`${dateValue}T${timeValue}`);

  if (!parts) return null;

  const safePreparationMinutes = Math.max(0, Math.floor(preparationMinutes));
  const wallClockUtcMs = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hours,
    parts.minutes + safePreparationMinutes,
    0,
    0,
  );
  try {
    const firstPass = new Date(wallClockUtcMs - getTimeZoneOffsetMs(new Date(wallClockUtcMs), timeZone));
    const secondPass = new Date(wallClockUtcMs - getTimeZoneOffsetMs(firstPass, timeZone));

    if (Number.isNaN(secondPass.getTime())) return null;

    return secondPass.toISOString();
  } catch {
    return null;
  }
};

export const addPreparationMinutesToScheduledDelivery = ({
  scheduledDeliveryValue,
  preparationMinutes,
}: {
  scheduledDeliveryValue: string;
  preparationMinutes: number;
}) => {
  const scheduledDate = getScheduledDateTime(scheduledDeliveryValue);

  if (!scheduledDate) return null;

  const safePreparationMinutes = Math.max(0, Math.floor(preparationMinutes));
  const estimatedDate = new Date(scheduledDate);

  estimatedDate.setMinutes(estimatedDate.getMinutes() + safePreparationMinutes);

  return estimatedDate;
};

export const buildScheduledDeliveryEstimate = ({
  scheduledDeliveryValue,
  preparationMinutes,
}: {
  scheduledDeliveryValue: string;
  preparationMinutes: number;
}): ScheduledDeliveryEstimate | null => {
  const selectedDate = getScheduledDateTime(scheduledDeliveryValue);

  if (!selectedDate) return null;

  const safePreparationMinutes = Math.max(0, Math.floor(preparationMinutes));

  if (safePreparationMinutes <= 0) return null;

  const scheduledAt = addPreparationMinutesToScheduledDelivery({
    scheduledDeliveryValue,
    preparationMinutes: safePreparationMinutes,
  });

  if (!scheduledAt) return null;

  return {
    selectedLabel: formatEstimateTimeLabel(selectedDate),
    readyLabel: formatEstimateDateTimeLabel(scheduledAt, selectedDate),
    preparationMinutes: safePreparationMinutes,
    scheduledAt,
  };
};

const roundUpToInterval = (minutes: number, interval: number) =>
  Math.ceil(minutes / interval) * interval;

const getCurrentMinutes = () => {
  const now = new Date();

  return now.getHours() * 60 + now.getMinutes();
};

const getRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const getScheduleTimingsRecord = (
  branch: BranchRecord | null | undefined
) => {
  const branchTimings = getRecord(branch?.scheduleTimings);
  const settingsTimings = getRecord(branch?.settings?.scheduleTimings);

  return branchTimings ?? settingsTimings;
};

const getActiveTemporaryClosure = (branch: BranchRecord | null | undefined) => {
  const candidates = [
    branch?.availability?.temporaryClosure,
    branch?.settings?.temporaryClosure,
    branch?.landingPopup?.temporaryClosure,
  ];

  return candidates.find((closure) => {
    if (!closure?.isClosed) return false;

    const closedUntil = closure.closedUntil ? new Date(closure.closedUntil) : null;
    const closedAt = closure.closedAt ? new Date(closure.closedAt) : null;
    const now = Date.now();

    if (closedAt && !Number.isNaN(closedAt.getTime()) && closedAt.getTime() > now) {
      return false;
    }

    return !closedUntil || Number.isNaN(closedUntil.getTime()) || closedUntil.getTime() > now;
  }) ?? null;
};

const getTemporaryClosureWindowForDate = ({
  branch,
  dateValue,
}: {
  branch?: BranchRecord | null;
  dateValue: string;
}) => {
  const closure = getActiveTemporaryClosure(branch);

  if (!closure) return null;

  const closedAt = closure.closedAt ? new Date(closure.closedAt) : new Date();
  const closedUntil = closure.closedUntil ? new Date(closure.closedUntil) : null;

  if (Number.isNaN(closedAt.getTime())) {
    return dateValue === getTodayDateValue()
      ? { start: 0, end: 24 * 60 }
      : null;
  }

  const startDateValue = getDateValue(closedAt);
  const endDateValue = closedUntil && !Number.isNaN(closedUntil.getTime())
    ? getDateValue(closedUntil)
    : startDateValue;

  if (dateValue < startDateValue || dateValue > endDateValue) return null;

  const start = dateValue === startDateValue
    ? closedAt.getHours() * 60 + closedAt.getMinutes()
    : 0;
  const end = closedUntil && !Number.isNaN(closedUntil.getTime()) && dateValue === endDateValue
    ? closedUntil.getHours() * 60 + closedUntil.getMinutes()
    : 24 * 60;

  return { start, end };
};

const getHolidayOpeningHours = (
  branch: BranchRecord | null | undefined
) => {
  const scheduleTimings = getScheduleTimingsRecord(branch);

  return normalizeArray<OpeningHours>(
    branch?.settings?.holidayOpeningHours ?? scheduleTimings?.holidayOpeningHours
  );
};

const getHolidayScheduleForDate = ({
  branch,
  dateValue,
}: {
  branch?: BranchRecord | null;
  dateValue: string;
}) =>
  getHolidayOpeningHours(branch).find((hour) => {
    return String(hour?.date || "").trim() === dateValue;
  }) ?? null;

const isUsableSchedule = (schedule: OpeningHours | null | undefined) =>
  Boolean(
    schedule &&
      !schedule.isClosed &&
      timeToMinutes(schedule.openTime) !== null &&
      timeToMinutes(schedule.closeTime) !== null
  );

const getScheduleIntervalMinutes = (
  branch: BranchRecord | null | undefined,
  scheduleType: "pickup" | "delivery"
) => {
  const scheduleTimings = getScheduleTimingsRecord(branch);
  const intervalValue =
    scheduleType === "delivery"
      ? scheduleTimings?.deliveryIntervalMinutes
      : scheduleTimings?.pickupIntervalMinutes;

  if (intervalValue === null || intervalValue === undefined) {
    return DEFAULT_SLOT_INTERVAL_MINUTES;
  }

  const interval =
    typeof intervalValue === "number" || typeof intervalValue === "string"
      ? Number(intervalValue)
      : Number.NaN;

  if (!Number.isFinite(interval) || interval <= 0) {
    return DEFAULT_SLOT_INTERVAL_MINUTES;
  }

  return Math.floor(interval);
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
  const closureWindow = getTemporaryClosureWindowForDate({ branch, dateValue });

  if (!closureWindow) return false;

  return slotStart < closureWindow.end && slotEnd > closureWindow.start;
};

export const getPickupScheduleForDate = ({
  branch,
  dateValue,
}: {
  branch?: BranchRecord | null;
  dateValue: string;
}): PickupSchedule => {
  return getBranchScheduleForDate({ branch, dateValue, scheduleType: "pickup" });
};

export const getBranchScheduleForDate = ({
  branch,
  dateValue,
  scheduleType,
}: {
  branch?: BranchRecord | null;
  dateValue: string;
  scheduleType: "pickup" | "delivery";
}): PickupSchedule => {
  const scheduleTimings = getScheduleTimingsRecord(branch);
  const openingHours = normalizeArray<OpeningHours>(
    branch?.settings?.openingHours ?? scheduleTimings?.openingHours
  );
  const deliveryHours = normalizeArray<OpeningHours>(
    branch?.settings?.deliveryHours ?? scheduleTimings?.deliveryHours
  );
  const holidaySchedule = getHolidayScheduleForDate({ branch, dateValue });

  if (holidaySchedule) {
    return {
      schedule: holidaySchedule,
      hasOpeningHours: true,
      source: "holiday",
    };
  }

  if (!openingHours.length && !deliveryHours.length) {
    return {
      schedule: null,
      hasOpeningHours: false,
      source: null,
    };
  }

  const selectedDay = getDayOfWeek(dateValue);
  const openingSchedule =
    openingHours.find((hour) => {
      return String(hour?.dayOfWeek || "").trim().toUpperCase() === selectedDay;
    }) || null;
  const deliverySchedule =
    deliveryHours.find((hour) => {
      return String(hour?.dayOfWeek || "").trim().toUpperCase() === selectedDay;
    }) || null;

  if (scheduleType === "delivery") {
    const schedule = isUsableSchedule(deliverySchedule)
      ? deliverySchedule
      : openingSchedule;

    return {
      schedule,
      hasOpeningHours: openingHours.length > 0 || deliveryHours.length > 0,
      source: schedule === deliverySchedule ? "delivery" : openingSchedule ? "opening" : null,
    };
  }

  return {
    schedule: openingSchedule,
    hasOpeningHours: openingHours.length > 0,
    source: openingSchedule ? "opening" : null,
  };
};

const buildTimeSlots = ({
  branch,
  dateValue,
  scheduleType,
}: {
  branch?: BranchRecord | null;
  dateValue: string;
  scheduleType: "pickup" | "delivery";
}): PickupTimeSlot[] => {
  if (!dateValue || isPastDateValue(dateValue)) return [];

  const { hasOpeningHours, schedule } = getBranchScheduleForDate({
    branch,
    dateValue,
    scheduleType,
  });

  if (!hasOpeningHours || !schedule || schedule?.isClosed) return [];

  const open = timeToMinutes(schedule?.openTime);
  const close = timeToMinutes(schedule?.closeTime);
  const slotIntervalMinutes = getScheduleIntervalMinutes(branch, scheduleType);

  if (open === null || close === null || open >= close) return [];

  const isToday = dateValue === getTodayDateValue();
  const earliestTodayMinutes = isToday
    ? roundUpToInterval(getCurrentMinutes(), slotIntervalMinutes)
    : open;

  const startAt = Math.max(open, earliestTodayMinutes);
  const slots: PickupTimeSlot[] = [];

  for (
    let slotStart = startAt;
    slotStart + slotIntervalMinutes <= close;
    slotStart += slotIntervalMinutes
  ) {
    const slotEnd = slotStart + slotIntervalMinutes;

    const isDuringBreak = normalizeArray(schedule?.breakTimes).some(
      (breakTime) => isSlotInsideBreak({ slotStart, slotEnd, breakTime })
    );

    const isDuringTemporaryClosure = isSlotInsideTemporaryClosure({
      branch,
      dateValue,
      slotStart,
      slotEnd,
    });

    if (!isDuringBreak && !isDuringTemporaryClosure) {
      const value = minutesToTime(slotStart);

      slots.push({
        value,
        label: formatPickupTimeLabel(value),
      });
    }
  }

  return slots;
};

export const buildPickupTimeSlots = ({
  branch,
  dateValue,
}: {
  branch?: BranchRecord | null;
  dateValue: string;
}): PickupTimeSlot[] => buildTimeSlots({ branch, dateValue, scheduleType: "pickup" });

export const buildDeliveryTimeSlots = ({
  branch,
  dateValue,
}: {
  branch?: BranchRecord | null;
  dateValue: string;
}): PickupTimeSlot[] => buildTimeSlots({ branch, dateValue, scheduleType: "delivery" });

export const isScheduleTimeAvailable = ({
  branch,
  dateValue,
  timeValue,
  scheduleType,
}: {
  branch?: BranchRecord | null;
  dateValue: string;
  timeValue: string;
  scheduleType: "pickup" | "delivery";
}) => {
  if (!dateValue || !timeValue || isPastDateValue(dateValue)) return false;

  const scheduleState = getBranchScheduleForDate({
    branch,
    dateValue,
    scheduleType,
  });

  if (!scheduleState.hasOpeningHours) return true;

  return buildTimeSlots({
    branch,
    dateValue,
    scheduleType,
  }).some((slot) => slot.value === timeValue);
};

export const isImmediateScheduleAvailable = ({
  branch,
  scheduleType,
}: {
  branch?: BranchRecord | null;
  scheduleType: "pickup" | "delivery";
}) => {
  if (getActiveTemporaryClosure(branch)) return false;

  const dateValue = getTodayDateValue();
  const scheduleState = getBranchScheduleForDate({
    branch,
    dateValue,
    scheduleType,
  });

  if (!scheduleState.hasOpeningHours) return true;

  return buildTimeSlots({
    branch,
    dateValue,
    scheduleType,
  }).length > 0;
};
