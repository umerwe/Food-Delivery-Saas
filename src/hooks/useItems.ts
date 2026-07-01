"use client";

import { useCallback, useMemo } from "react";

import { queryKeys } from "@/config/query-keys";
import { useDomainApi, type DomainApiHook } from "@/hooks/useDomainApi";
import { deleteItems, fetchMenuCategoriesPage, fetchMenuItems, fetchMenuItemsPage, fetchSplitPizzaMenuItems, getItems, patchItems, postItems } from "@/services/items";
import type { ApiResult } from "@/services/http";
import type { ApiMeta, ItemsCategory, MenuItem } from "@/components/pages/Items/types";

const service = {
  get: getItems,
  post: postItems,
  patch: patchItems,
  del: deleteItems,
};

export type ItemsApi = DomainApiHook & {
  fetchMenuItems: (endpoint: string) => Promise<{ response: ApiResult; items: MenuItem[] }>;
  fetchMenuItemsPage: (args: { restaurantId: string; branchId?: string | number | null; categoryId?: string; page: number; limit: number }) => Promise<{ response: ApiResult; items: MenuItem[]; meta: ApiMeta }>;
  fetchSplitPizzaMenuItems: (args: { restaurantId?: string | number | null; branchId?: string | number | null; search: string; page: number }) => Promise<{ data: MenuItem[]; meta?: ApiMeta }>;
  fetchMenuCategoriesPage: (args: { restaurantId: string; page: number; limit: number; search?: string }) => Promise<{ response: ApiResult; categories: ItemsCategory[]; meta: ApiMeta }>;
};

export const useItems = (token: string | null): ItemsApi => {
  const api = useDomainApi(token, { service, requestKey: queryKeys.items.request });

  const fetchMenuItemList = useCallback(
    (endpoint: string) => fetchMenuItems(endpoint, token),
    [token]
  );

  const fetchMenuItemPage = useCallback(
    (args: { restaurantId: string; branchId?: string | number | null; categoryId?: string; page: number; limit: number }) =>
      fetchMenuItemsPage({ ...args, token }),
    [token]
  );

  const fetchSplitPizzaItems = useCallback(
    (args: { restaurantId?: string | number | null; branchId?: string | number | null; search: string; page: number }) =>
      fetchSplitPizzaMenuItems({ ...args, token }),
    [token]
  );

  const fetchMenuCategoryPage = useCallback(
    (args: { restaurantId: string; page: number; limit: number; search?: string }) =>
      fetchMenuCategoriesPage({ ...args, token }),
    [token]
  );

  return useMemo(
    () => ({
      ...api,
      fetchMenuItems: fetchMenuItemList,
      fetchMenuItemsPage: fetchMenuItemPage,
      fetchSplitPizzaMenuItems: fetchSplitPizzaItems,
      fetchMenuCategoriesPage: fetchMenuCategoryPage,
    }),
    [api, fetchMenuCategoryPage, fetchMenuItemList, fetchMenuItemPage, fetchSplitPizzaItems]
  );
};

export default useItems;
