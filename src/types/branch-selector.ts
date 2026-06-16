import type {
  BranchAddress,
  BranchOrderType,
  BranchScheduleTimings,
  BranchSettings,
  BranchTemporaryClosure,
} from "@/types/branches";

export type BranchRecord = {
  id: string;
  name: string;
  isActive?: boolean;
  restaurantId?: string | null;
  address?: BranchAddress;
  settings?: BranchSettings;
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
  selectedOrderType?: BranchOrderType;
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
