export type Branch = {
  id: string;
  name: string;
  isActive?: boolean;
  address?: {
    area?: string;
    city?: string;
    state?: string;
    country?: string;
  };
};

export type BranchApiResponse = {
  data?: Branch[];
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