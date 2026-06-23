"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/config/query-keys";
import { getHomeCategories, getHomePromotions, getPromotionalItems } from "@/services/home";

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

export const useHomePromotionalItems = ({
  restaurantId,
  branchId,
  locale,
  limit = 8,
  enabled = true,
}: {
  restaurantId?: string | null;
  branchId?: string | null;
  locale?: string | null;
  limit?: number;
  enabled?: boolean;
}) => {
  const params = {
    restaurantId: restaurantId ?? null,
    branchId: branchId ?? null,
    locale: locale ?? null,
    limit,
  };

  return useQuery({
    queryKey: queryKeys.home.promotionalItems(params),
    queryFn: () => getPromotionalItems(params),
    enabled: enabled && Boolean(restaurantId),
  });
};
