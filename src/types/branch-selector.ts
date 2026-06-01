export type BranchRecord = {
  id: string;
  name: string;
  isActive?: boolean;
  restaurantId?: string | null;
  address?: {
    street?: string;
    area?: string;
    city?: string;
    state?: string;
    country?: string;
    lat?: string | number | null;
    lng?: string | number | null;
  };
  settings?: {
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
  };
  coverImage?: string | null;
  description?: string | null;
};

export type BranchOption = BranchRecord;

export type Branch = BranchRecord;

export type BranchApiResponse = {
  data?: BranchRecord[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
};
