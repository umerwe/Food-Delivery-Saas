"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/config/query-keys";
import { getHome } from "@/services/home";

type UseHomeOptions = {
  staleTime?: number;
  refetchInterval?: number | false;
  refetchOnMount?: boolean | "always";
  refetchOnReconnect?: boolean | "always";
  refetchOnWindowFocus?: boolean | "always";
};

export const useHome = (
  restaurantId?: string | null,
  branchId?: string | null,
  enabled = true,
  options?: UseHomeOptions
) =>
  useQuery({
    queryKey: queryKeys.home.detail(restaurantId, branchId),
    queryFn: () => getHome(restaurantId, branchId),
    enabled,
    staleTime: options?.staleTime ?? 5 * 60 * 1000,
    refetchInterval: options?.refetchInterval,
    refetchOnMount: options?.refetchOnMount,
    refetchOnReconnect: options?.refetchOnReconnect,
    refetchOnWindowFocus: options?.refetchOnWindowFocus,
  });
