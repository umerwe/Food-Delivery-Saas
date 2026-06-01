"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/config/query-keys";
import { getHomeCategories, getHomePromotions } from "@/services/home";

export const useHomeCategories = (restaurantId?: string | null, enabled = true) =>
  useQuery({
    queryKey: queryKeys.home.categories(restaurantId),
    queryFn: () => getHomeCategories(restaurantId ?? ""),
    enabled: enabled && Boolean(restaurantId),
  });

export const useHomePromotions = (
  restaurantId?: string | null,
  branchId?: string | null,
  enabled = true
) =>
  useQuery({
    queryKey: queryKeys.home.promotions(restaurantId, branchId),
    queryFn: () => getHomePromotions(restaurantId ?? "", branchId),
    enabled: enabled && Boolean(restaurantId),
  });
