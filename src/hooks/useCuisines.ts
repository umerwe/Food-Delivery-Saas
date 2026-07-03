"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/config/query-keys";
import {
  fetchCustomerCuisineItems,
  fetchCustomerCuisines,
  fetchPromotionalCuisines,
  type FetchCuisineItemsParams,
  type FetchCuisinesParams,
} from "@/services/cuisines";

export const useCustomerCuisines = (params: FetchCuisinesParams & { enabled?: boolean }) => {
  const { enabled = true, ...queryParams } = params;

  return useQuery({
    queryKey: queryKeys.cuisines.list(queryParams),
    queryFn: () => fetchCustomerCuisines(queryParams),
    enabled: enabled && Boolean(queryParams.restaurantId),
  });
};

export const useCustomerCuisineItems = (params: FetchCuisineItemsParams & { enabled?: boolean }) => {
  const { enabled = true, ...queryParams } = params;

  return useQuery({
    queryKey: queryKeys.cuisines.items(queryParams),
    queryFn: () => fetchCustomerCuisineItems(queryParams),
    enabled: enabled && Boolean(queryParams.restaurantId && queryParams.cuisineId),
  });
};

export const usePromotionalCuisines = (params: FetchCuisinesParams & { enabled?: boolean }) => {
  const { enabled = true, ...queryParams } = params;

  return useQuery({
    queryKey: queryKeys.cuisines.promotional(queryParams),
    queryFn: () => fetchPromotionalCuisines(queryParams),
    enabled: enabled && Boolean(queryParams.restaurantId),
  });
};
