export type BranchOrderType = "DELIVERY" | "TAKEAWAY" | string;

export type BranchAddress = {
  id?: string;
  street?: string | null;
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
  openingHours?: Array<{
    dayOfWeek?: string;
    isClosed?: boolean;
    openTime?: string;
    closeTime?: string;
    breakTimes?: Array<{
      startTime?: string;
      endTime?: string;
      note?: string;
    }>;
  }>;
  holidayRanges?: unknown[];
  reservationDateRanges?: unknown[];
  tableReservationDateRanges?: unknown[];
  reservationBlackoutRanges?: unknown[];
  [key: string]: unknown;
};

export type NearbyBranch = {
  id: string;
  name: string;
  restaurantId?: string | null;
  address?: BranchAddress | null;
  settings?: BranchSettings | null;
  distanceKm?: number | null;
  availability?: {
    isAvailable?: boolean;
    isActive?: boolean;
    status?: string;
    reason?: string | null;
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
