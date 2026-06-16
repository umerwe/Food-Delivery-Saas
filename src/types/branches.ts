export type BranchOrderType = "DELIVERY" | "TAKEAWAY" | string;

export type BranchTemporaryClosure = {
  isClosed?: boolean;
  closedAt?: string | null;
  closedUntil?: string | null;
  reason?: string | null;
  message?: string | null;
};

export type BranchScheduleTimings = {
  deliveryIntervalMinutes?: number | string | null;
  pickupIntervalMinutes?: number | string | null;
  openingHours?: BranchHours[];
  deliveryHours?: BranchHours[];
  holidayOpeningHours?: BranchHolidayHours[];
  [key: string]: unknown;
};

export type BranchAddress = {
  id?: string;
  street?: string | null;
  shopNumber?: string | null;
  houseNumber?: string | null;
  area?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  lat?: number | string | null;
  lng?: number | string | null;
};

export type BranchSettings = {
  allowedOrderTypes?: BranchOrderType[];
  deliveryConfig?: unknown;
  scheduleTimings?: BranchScheduleTimings | null;
  temporaryClosure?: BranchTemporaryClosure | null;
  tableReservationsEnabled?: boolean;
  openingHours?: BranchHours[];
  deliveryHours?: BranchHours[];
  holidayOpeningHours?: BranchHolidayHours[];
  holidayRanges?: unknown[];
  reservationDateRanges?: unknown[];
  tableReservationDateRanges?: unknown[];
  reservationBlackoutRanges?: unknown[];
  [key: string]: unknown;
};

export type BranchHours = {
  dayOfWeek?: string;
  date?: string;
  isClosed?: boolean;
  openTime?: string;
  closeTime?: string;
  breakTimes?: Array<{
    startTime?: string;
    endTime?: string;
    note?: string;
  }>;
};

export type BranchHolidayHours = Omit<BranchHours, "dayOfWeek"> & {
  date?: string;
};

export type NearbyBranch = {
  id: string;
  name: string;
  restaurantId?: string | null;
  address?: BranchAddress | null;
  settings?: BranchSettings | null;
  scheduleTimings?: BranchScheduleTimings | null;
  distanceKm?: number | null;
  availability?: {
    isAvailable?: boolean;
    isActive?: boolean;
    isTemporarilyClosed?: boolean;
    isHolidayClosed?: boolean;
    status?: string;
    reason?: string | null;
    temporaryClosure?: BranchTemporaryClosure | null;
    holidayOpeningHour?: unknown;
  } | null;
  isActive?: boolean;
};

export type NearbyBranchesParams = {
  lat: number;
  lng: number;
  page?: number;
  limit?: number;
};

export type NearbyBranchesResponse = {
  branches: NearbyBranch[];
  meta?: {
    page: number;
    limit: number;
    total?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrevious?: boolean;
  };
};
