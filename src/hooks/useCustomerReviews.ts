"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/config/query-keys";
import {
  fetchCustomerReviews,
  type CustomerReviewsParams,
} from "@/services/public-content";

export const useCustomerReviews = (params: CustomerReviewsParams) => {
  const resolvedParams = {
    restaurantId: params.restaurantId ?? null,
    branchId: params.branchId ?? null,
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    rating: params.rating ?? null,
  };

  const query = useQuery({
    queryKey: queryKeys.customerReviews.list(resolvedParams),
    queryFn: () => fetchCustomerReviews(resolvedParams),
    enabled: Boolean(resolvedParams.restaurantId),
  });

  return {
    ...query,
    reviews: query.data?.items ?? [],
    summary: query.data?.summary ?? { reviewCount: 0, averageRating: null },
    meta: query.data?.meta ?? null,
  };
};
