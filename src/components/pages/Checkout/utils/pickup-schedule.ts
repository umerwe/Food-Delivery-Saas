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
  }[];
};

type PickupSchedule = {
  schedule: OpeningHours | null;
  hasOpeningHours: boolean;
};

export type PickupTimeSlot = {
  value: string;
  label: string;
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

export const formatPickupTimeLabel = (value: string) => {
  const minutes = timeToMinutes(value);

  if (minutes === null) return value;

  const date = new Date();
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
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
  const openingHours = normalizeArray<OpeningHours>(branch?.settings?.openingHours);

  if (!openingHours.length) {
    return {
      schedule: null,
      hasOpeningHours: false,
    };
  }

  const selectedDay = getDayOfWeek(dateValue);
  const schedule =
    openingHours.find((hour) => {
      return String(hour?.dayOfWeek || "").trim().toUpperCase() === selectedDay;
    }) || null;

  return {
    schedule,
    hasOpeningHours: true,
  };
};

export const buildPickupTimeSlots = ({
  branch,
  dateValue,
}: {
  branch?: BranchRecord | null;
  dateValue: string;
}): PickupTimeSlot[] => {
  if (!dateValue || isPastDateValue(dateValue)) return [];

  const { hasOpeningHours, schedule } = getPickupScheduleForDate({ branch, dateValue });

  if (!hasOpeningHours || !schedule || schedule?.isClosed) return [];

  const open = timeToMinutes(schedule?.openTime);
  const close = timeToMinutes(schedule?.closeTime);

  if (open === null || close === null || open >= close) return [];

  const isToday = dateValue === getTodayDateValue();
  const earliestTodayMinutes = isToday
    ? roundUpToInterval(getCurrentMinutes(), SLOT_INTERVAL_MINUTES)
    : open;

  const startAt = Math.max(open, earliestTodayMinutes);
  const slots: PickupTimeSlot[] = [];

  for (
    let slotStart = startAt;
    slotStart + SLOT_INTERVAL_MINUTES <= close;
    slotStart += SLOT_INTERVAL_MINUTES
  ) {
    const slotEnd = slotStart + SLOT_INTERVAL_MINUTES;

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
