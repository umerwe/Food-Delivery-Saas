import type { BranchRecord } from "@/types/branch-selector";

const DEFAULT_SLOT_INTERVAL_MINUTES = 30;

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
  source: "opening" | "delivery" | "holiday" | null;
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

    if (!isDuringBreak) {
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
