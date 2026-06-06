import type { BranchAddress, BranchOrderType, BranchSettings } from "@/types/branches";

export type BranchRecord = {
  id: string;
  name: string;
  isActive?: boolean;
  restaurantId?: string | null;
  address?: BranchAddress;
  settings?: BranchSettings;
  distanceKm?: number | null;
  availability?: {
    isAvailable?: boolean;
    isActive?: boolean;
    status?: string;
    reason?: string | null;
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
