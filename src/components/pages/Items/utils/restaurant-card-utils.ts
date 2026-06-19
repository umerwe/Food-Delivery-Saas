import type { ApiMeta, ApiRecord, AuthRestaurantUser, ItemsCategory, MenuItem, RestaurantInfo, StoredAuthState } from "../types";
import { formatDisplayAddress } from "@/lib/address-display";
import type { BranchSettings } from "@/types/branches";

export const FALLBACK_BANNER = "/categories/background_banner.png";
export const FALLBACK_ITEM_IMAGE = "/menu-item.jpg";

export const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const normalizeApiArray = <T = unknown,>(res: unknown): T[] => {
  const record = typeof res === "object" && res !== null ? (res as ApiRecord) : {};
  const data = record.data;
  const dataRecord = typeof data === "object" && data !== null ? (data as ApiRecord) : {};

  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(dataRecord.data)) return dataRecord.data as T[];
  if (Array.isArray(dataRecord.items)) return dataRecord.items as T[];
  if (Array.isArray(record.items)) return record.items as T[];
  return [];
};

export const normalizeApiMeta = (res: unknown): ApiMeta => {
  const record = typeof res === "object" && res !== null ? (res as ApiRecord) : {};
  const data = typeof record.data === "object" && record.data !== null ? (record.data as ApiRecord) : {};
  const nestedData = typeof data.data === "object" && data.data !== null ? (data.data as ApiRecord) : {};
  const meta = data.pagination || data.meta || nestedData.pagination || nestedData.meta || record.pagination || record.meta || {};
  return typeof meta === "object" && meta !== null && !Array.isArray(meta) ? (meta as ApiMeta) : {};
};

export const hasText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text !== "" && text.toLowerCase() !== "null";
};

export const formatPrice = (value: unknown) => toNumber(value, 0).toFixed(2);

type VariationOption = {
  id?: string | number | null;
  name?: string | null;
  displayText?: string | null;
};

const normalizeVariationText = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const variationMatches = (
  candidate: VariationOption,
  reference: VariationOption
) => {
  const candidateId = String(candidate?.id ?? "");
  const referenceId = String(reference?.id ?? "");

  if (candidateId && referenceId && candidateId === referenceId) {
    return true;
  }

  const candidateLabels = [
    normalizeVariationText(candidate?.displayText),
    normalizeVariationText(candidate?.name),
  ].filter(Boolean);

  const referenceLabels = [
    normalizeVariationText(reference?.displayText),
    normalizeVariationText(reference?.name),
  ].filter(Boolean);

  return candidateLabels.some((label) => referenceLabels.includes(label));
};

export const getSplitPizzaPricingVariation = <TVariation extends VariationOption>({
  variations,
  selectedVariation,
  fallbackVariation,
}: {
  variations: TVariation[];
  selectedVariation?: VariationOption | null;
  fallbackVariation?: TVariation | null;
}) => {
  if (!selectedVariation) {
    return fallbackVariation ?? null;
  }

  return (
    variations.find((variation) => variationMatches(variation, selectedVariation)) ??
    fallbackVariation ??
    null
  );
};

export const getImageUrl = (category: ItemsCategory | null | undefined, restaurant: RestaurantInfo | null | undefined) => {
  const candidates = [
    category?.imageUrl,
    category?.coverImage,
    category?.bannerUrl,
    restaurant?.coverImage,
    restaurant?.coverImageUrl,
    restaurant?.bannerUrl,
    restaurant?.imageUrl,
  ];

  return candidates.find((value) => hasText(value)) || FALLBACK_BANNER;
};

export const getItemImageUrl = (item: MenuItem | null | undefined) => {
  const candidates = [item?.imageUrl];
  return candidates.find((value) => hasText(value)) || FALLBACK_ITEM_IMAGE;
};

export const formatAddress = (value: unknown) => {
  if (!value) return "";
  return formatDisplayAddress(value);
};

export const getRestaurantName = (authUser: AuthRestaurantUser | null | undefined, storedAuth: StoredAuthState | null | undefined) => {
  const candidates = [
    authUser?.restaurant?.name,
    authUser?.restaurantName,
    authUser?.profile?.restaurantName,
    authUser?.tenant?.restaurant?.name,
    storedAuth?.user?.restaurant?.name,
    storedAuth?.user?.restaurantName,
    storedAuth?.user?.profile?.restaurantName,
  ];
  return candidates.find(hasText) || "Restaurant";
};

export const getRestaurantAddress = (authUser: AuthRestaurantUser | null | undefined, storedAuth: StoredAuthState | null | undefined) => {
  const candidates = [
    authUser?.branch?.address,
    authUser?.profile?.branch?.address,
    storedAuth?.user?.branch?.address,
    storedAuth?.user?.profile?.branch?.address,
    authUser?.restaurant?.address,
    authUser?.address,
    authUser?.profile?.address,
    storedAuth?.user?.restaurant?.address,
    storedAuth?.user?.address,
    storedAuth?.user?.profile?.address,
  ];

  for (const candidate of candidates) {
    const address = formatAddress(candidate);
    if (hasText(address)) return address;
  }

  return "Address not available";
};

export const getOperatingHours = (authUser: AuthRestaurantUser | null | undefined, storedAuth: StoredAuthState | null | undefined) => {
  const restaurant = authUser?.restaurant || authUser?.profile?.restaurant || storedAuth?.user?.restaurant || storedAuth?.user?.profile?.restaurant || {};
  const branch = authUser?.branch || authUser?.profile?.branch || storedAuth?.user?.branch || storedAuth?.user?.profile?.branch || {};
  const direct = [restaurant.operatingHours, restaurant.openingHours, restaurant.businessHours, branch.operatingHours, branch.openingHours, branch.businessHours].find(hasText);
  if (direct) return String(direct);
  const openingTime = restaurant.openingTime || restaurant.opensAt || branch.openingTime || branch.opensAt;
  const closingTime = restaurant.closingTime || restaurant.closesAt || branch.closingTime || branch.closesAt;
  if (hasText(openingTime) && hasText(closingTime)) return `${openingTime} - ${closingTime}`;
  return "Operating hours not specified";
};

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

const DAY_LABELS: Record<string, string> = {
  SUNDAY: "Sun",
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
};

export type BranchHoursEntry = NonNullable<BranchSettings["openingHours"]>[number];

export type BranchHoursSummary = {
  label: string;
  value: string;
  status: "open" | "closed" | "unknown";
};

export type BranchHoursDetail = BranchHoursEntry & {
  dayLabel: string;
  hoursLabel: string;
  breakLabels: string[];
};

const getRecordValue = (record: ApiRecord, keys: string[]) =>
  keys.map((key) => record[key]).find((value) => value !== undefined && value !== null);

const getBranchSettings = (branch: unknown): BranchSettings | null => {
  if (typeof branch !== "object" || branch === null || Array.isArray(branch)) {
    return null;
  }

  const branchRecord = branch as ApiRecord;
  const settings = branchRecord.settings;
  const scheduleTimings = branchRecord.scheduleTimings;
  const settingsRecord =
    typeof settings === "object" && settings !== null && !Array.isArray(settings)
      ? settings as BranchSettings
      : {};
  const scheduleRecord =
    typeof scheduleTimings === "object" && scheduleTimings !== null && !Array.isArray(scheduleTimings)
      ? scheduleTimings as ApiRecord
      : {};

  return {
    ...settingsRecord,
    openingHours: settingsRecord.openingHours ?? normalizeSchedule(scheduleRecord.openingHours),
    deliveryHours: settingsRecord.deliveryHours ?? normalizeSchedule(scheduleRecord.deliveryHours),
    holidayOpeningHours:
      settingsRecord.holidayOpeningHours ?? normalizeSchedule(scheduleRecord.holidayOpeningHours),
  };
};

const normalizeDayKey = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toUpperCase();

export const formatScheduleTime = (value: unknown) => {
  const text = String(value ?? "").trim();

  if (!text) return "";
  if (/[ap]m/i.test(text)) return text.toUpperCase();

  const match = text.match(/^(\d{1,2}):(\d{2})/);

  if (!match) return text;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return text;
  }

  const period = hours >= 12 ? "PM" : "AM";
  const normalizedHours = hours % 12 || 12;

  return `${normalizedHours}:${String(minutes).padStart(2, "0")} ${period}`;
};

export const formatHoursRange = (entry: BranchHoursEntry) => {
  const openTime = formatScheduleTime(entry.openTime);
  const closeTime = formatScheduleTime(entry.closeTime);

  return openTime && closeTime ? `${openTime} - ${closeTime}` : "";
};

const normalizeSchedule = (value: unknown): BranchHoursEntry[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is BranchHoursEntry => typeof entry === "object" && entry !== null && !Array.isArray(entry))
    : [];

const normalizeScheduleForCompare = (schedule: BranchHoursEntry[]) =>
  [...schedule]
    .map((entry) => ({
      dayOfWeek: normalizeDayKey(entry.dayOfWeek),
      date: String(entry.date || "").trim(),
      isClosed: Boolean(entry.isClosed),
      openTime: String(entry.openTime || "").trim(),
      closeTime: String(entry.closeTime || "").trim(),
      breakTimes: Array.isArray(entry.breakTimes)
        ? entry.breakTimes.map((breakTime) => ({
            startTime: String(breakTime?.startTime || "").trim(),
            endTime: String(breakTime?.endTime || "").trim(),
            note: String(breakTime?.note || "").trim(),
          }))
        : [],
    }))
    .sort((a, b) => DAYS.indexOf(a.dayOfWeek) - DAYS.indexOf(b.dayOfWeek));

export const areBranchSchedulesIdentical = (
  firstSchedule: BranchHoursEntry[],
  secondSchedule: BranchHoursEntry[],
) => {
  if (!firstSchedule.length || !secondSchedule.length) return false;

  return JSON.stringify(normalizeScheduleForCompare(firstSchedule)) ===
    JSON.stringify(normalizeScheduleForCompare(secondSchedule));
};

const formatBreakRange = (breakTime: NonNullable<BranchHoursEntry["breakTimes"]>[number]) => {
  const startTime = formatScheduleTime(breakTime?.startTime);
  const endTime = formatScheduleTime(breakTime?.endTime);

  if (!startTime || !endTime) return "";

  const note = String(breakTime?.note || "").trim();
  return note ? `${startTime} - ${endTime} (${note})` : `${startTime} - ${endTime}`;
};

export const getBranchHoursDetails = (schedule: BranchHoursEntry[]): BranchHoursDetail[] =>
  [...schedule]
    .sort((a, b) => DAYS.indexOf(normalizeDayKey(a.dayOfWeek)) - DAYS.indexOf(normalizeDayKey(b.dayOfWeek)))
    .map((entry) => {
      const dayKey = normalizeDayKey(entry.dayOfWeek);
      const isTodayHoliday = String(entry.date || "").trim() === getTodayDateValue();
      const hoursLabel = entry.isClosed ? "Closed" : formatHoursRange(entry) || "Not configured";

      return {
        ...entry,
        dayLabel: isTodayHoliday ? "Today" : DAY_LABELS[dayKey] || dayKey || "Day",
        hoursLabel,
        breakLabels: Array.isArray(entry.breakTimes)
          ? entry.breakTimes.map(formatBreakRange).filter(Boolean)
          : [],
      };
    });

export const getCurrentBranchHoursDetail = (details: BranchHoursDetail[]) => {
  if (details.length === 0) return null;

  const today = DAYS[new Date().getDay()];

  return (
    details.find((entry) => normalizeDayKey(entry.dayOfWeek) === today) ??
    details.find((entry) => !entry.isClosed && hasText(entry.hoursLabel)) ??
    details[0] ??
    null
  );
};

const areCurrentBranchHoursDetailsIdentical = (
  firstDetail: BranchHoursDetail | null,
  secondDetail: BranchHoursDetail | null,
) => {
  if (!firstDetail || !secondDetail) return false;

  return firstDetail.isClosed === secondDetail.isClosed &&
    firstDetail.hoursLabel === secondDetail.hoursLabel &&
    JSON.stringify(firstDetail.breakLabels) === JSON.stringify(secondDetail.breakLabels);
};

const getScheduleFromSettings = (settings: BranchSettings | null, keys: string[]) => {
  if (!settings) return [];

  const settingsRecord = settings as ApiRecord;
  const directSchedule = normalizeSchedule(getRecordValue(settingsRecord, keys));

  if (directSchedule.length > 0) {
    return directSchedule;
  }

  const deliveryConfig = settingsRecord.deliveryConfig;

  if (typeof deliveryConfig === "object" && deliveryConfig !== null && !Array.isArray(deliveryConfig)) {
    return normalizeSchedule(getRecordValue(deliveryConfig as ApiRecord, keys));
  }

  return [];
};

const getHolidayScheduleForDate = (
  settings: BranchSettings | null,
  dateValue = getTodayDateValue()
) => {
  const holidaySchedule = getScheduleFromSettings(settings, ["holidayOpeningHours"]);

  return holidaySchedule.find((entry) => String(entry.date || "").trim() === dateValue) ?? null;
};

const getTodayDateValue = () => {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

const getTodaySchedule = (schedule: BranchHoursEntry[]) => {
  const today = DAYS[new Date().getDay()];
  const todayDate = getTodayDateValue();
  const todayEntry = schedule.find((entry) => {
    return normalizeDayKey(entry.dayOfWeek) === today ||
      String(entry.date || "").trim() === todayDate;
  });

  return {
    today,
    entry: todayEntry ?? schedule.find((entry) => !entry.isClosed && hasText(entry.openTime) && hasText(entry.closeTime)) ?? null,
  };
};

const isUsableHoursEntry = (entry: BranchHoursEntry | null | undefined) =>
  Boolean(entry && !entry.isClosed && hasText(entry.openTime) && hasText(entry.closeTime));

const summarizeSchedule = ({
  fallback,
  schedule,
  useFallbackWhenMissing = false,
}: {
  fallback?: BranchHoursSummary | null;
  schedule: BranchHoursEntry[];
  useFallbackWhenMissing?: boolean;
}): BranchHoursSummary => {
  if (schedule.length === 0) {
    if (useFallbackWhenMissing && fallback?.status !== "unknown") {
      return {
        label: "Same as opening",
        value: fallback?.value || "Same as opening hours",
        status: fallback?.status ?? "unknown",
      };
    }

    return {
      label: "Schedule",
      value: "Not configured",
      status: "unknown",
    };
  }

  const { today, entry } = getTodaySchedule(schedule);

  if (!entry) {
    return {
      label: "Schedule",
      value: "Not configured",
      status: "unknown",
    };
  }

  const label = String(entry.date || "").trim() === getTodayDateValue() ||
    normalizeDayKey(entry.dayOfWeek) === today
    ? "Today"
    : DAY_LABELS[normalizeDayKey(entry.dayOfWeek)] || "Next open";

  if (entry.isClosed) {
    return {
      label,
      value: "Closed",
      status: "closed",
    };
  }

  const hours = formatHoursRange(entry);

  return {
    label,
    value: hours || "Not configured",
    status: hours ? "open" : "unknown",
  };
};

export const getBranchHoursSummary = (branch: unknown) => {
  const settings = getBranchSettings(branch);
  const openingSchedule = getScheduleFromSettings(settings, ["openingHours", "operatingHours", "businessHours"]);
  const deliverySchedule = getScheduleFromSettings(settings, [
    "deliveryHours",
    "deliveryOpeningHours",
    "deliverySchedule",
    "deliveryOperatingHours",
  ]);
  const holidaySchedule = getHolidayScheduleForDate(settings);
  const opening = holidaySchedule
    ? summarizeSchedule({ schedule: [holidaySchedule] })
    : summarizeSchedule({ schedule: openingSchedule });
  const rawDelivery = holidaySchedule
    ? opening
    : summarizeSchedule({
        fallback: opening,
        schedule: deliverySchedule,
        useFallbackWhenMissing: true,
      });
  const todayDeliveryEntry = getTodaySchedule(deliverySchedule).entry;
  const resolvedDelivery =
    holidaySchedule || isUsableHoursEntry(todayDeliveryEntry) ? rawDelivery : opening;
  const effectiveOpeningSchedule = holidaySchedule ? [holidaySchedule] : openingSchedule;
  const effectiveDeliverySchedule = holidaySchedule || !isUsableHoursEntry(todayDeliveryEntry)
    ? [holidaySchedule ?? getTodaySchedule(openingSchedule).entry].filter(Boolean) as BranchHoursEntry[]
    : deliverySchedule;
  const deliveryMatchesOpening = areBranchSchedulesIdentical(openingSchedule, deliverySchedule);
  const deliveryMatchesOpeningToday = areCurrentBranchHoursDetailsIdentical(
    getCurrentBranchHoursDetail(getBranchHoursDetails(effectiveOpeningSchedule)),
    getCurrentBranchHoursDetail(getBranchHoursDetails(effectiveDeliverySchedule)),
  );
  const showDeliveryHours =
    !holidaySchedule &&
    deliverySchedule.length > 0 &&
    isUsableHoursEntry(todayDeliveryEntry) &&
    !deliveryMatchesOpening;
  const showDeliveryHoursCard = showDeliveryHours && !deliveryMatchesOpeningToday;

  return {
    opening,
    delivery: resolvedDelivery,
    openingSchedule: effectiveOpeningSchedule,
    deliverySchedule: effectiveDeliverySchedule,
    regularOpeningSchedule: openingSchedule,
    regularDeliverySchedule: deliverySchedule,
    holidaySchedule: holidaySchedule ? [holidaySchedule] : [],
    showDeliveryHours,
    showDeliveryHoursCard,
    deliveryMatchesOpening,
    deliveryMatchesOpeningToday,
  };
};

export const getRatingInfo = (authUser: AuthRestaurantUser | null | undefined, storedAuth: StoredAuthState | null | undefined) => {
  const restaurant = authUser?.restaurant || authUser?.profile?.restaurant || storedAuth?.user?.restaurant || storedAuth?.user?.profile?.restaurant || {};
  const rating = toNumber(restaurant.rating ?? restaurant.averageRating ?? restaurant.stats?.averageRating, Number.NaN);
  const reviews = toNumber(restaurant.reviewCount ?? restaurant.reviewsCount ?? restaurant.stats?.reviewCount, Number.NaN);
  if (!Number.isFinite(rating) || rating <= 0) return null;
  return { rating, reviews: Number.isFinite(reviews) && reviews > 0 ? reviews : null };
};

export const resolveAvailabilityStatus = (isOpen?: boolean | null) => (isOpen === false ? "Closed" : "Open");

export const resolvePromotionBadge = (promotion?: { title?: string | null; discountType?: string | null; discountValue?: string | number | null } | null) => {
  if (!promotion) return "";
  if (hasText(promotion.title)) return String(promotion.title);
  if (promotion.discountType === "PERCENTAGE") return `${toNumber(promotion.discountValue, 0)}% OFF`;
  if (promotion.discountType === "FLAT") return `$${formatPrice(promotion.discountValue)} OFF`;
  return "OFFER";
};

export const mergeUniqueById = <T extends { id?: string | number | null }>(prev: T[], next: T[]) => {
  const map = new Map<string, T>();
  [...prev, ...next].forEach((item) => {
    const id = String(item?.id ?? "");
    if (!id) return;
    map.set(id, item);
  });
  return Array.from(map.values());
};

export const resolveHasNext = ({ meta, page, limit, receivedCount, totalLoaded }: { meta: ApiMeta; page: number; limit: number; receivedCount: number; totalLoaded: number }) => {
  if (typeof meta?.hasNext === "boolean") return meta.hasNext;
  if (typeof meta?.hasMore === "boolean") return meta.hasMore;
  const total = toNumber(meta?.total, 0);
  const totalPages = toNumber(meta?.totalPages ?? meta?.pages, 0);
  const currentPage = toNumber(meta?.page, page);
  if (totalPages > 0) return currentPage < totalPages;
  if (total > 0) return totalLoaded < total;
  return receivedCount >= limit;
};
