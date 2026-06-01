"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/config/query-keys";
import { getHome } from "@/services/home";

export const useHome = (restaurantId?: string | null, branchId?: string | null, enabled = true) =>
  useQuery({
    queryKey: queryKeys.home.detail(restaurantId, branchId),
    queryFn: () => getHome(restaurantId, branchId),
    enabled,
  });
