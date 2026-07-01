"use client";

import { useCallback, useMemo } from "react";

import { queryKeys } from "@/config/query-keys";
import { useDomainApi } from "@/hooks/useDomainApi";
import { deleteMenu, fetchSignatureMenus, fetchSignatureSplitPizzaItems, getMenu, patchMenu, postMenu } from "@/services/menu";

const service = {
  get: getMenu,
  post: postMenu,
  patch: patchMenu,
  del: deleteMenu,
};

export const useMenu = (token: string | null) => {
  const api = useDomainApi(token, { service, requestKey: queryKeys.menu.request });

  const getSignatureMenus = useCallback(
    ({ restaurantId }: { restaurantId: string }) => fetchSignatureMenus({ restaurantId, token }),
    [token]
  );

  const getSignatureSplitPizzaItems = useCallback(
    ({
      restaurantId,
      branchId,
      search,
      page,
    }: {
      restaurantId?: string | null;
      branchId?: string | number | null;
      search: string;
      page: number;
    }) => fetchSignatureSplitPizzaItems({ restaurantId, branchId, search, page, token }),
    [token]
  );

  return useMemo(
    () => ({
      ...api,
      fetchSignatureMenus: getSignatureMenus,
      fetchSignatureSplitPizzaItems: getSignatureSplitPizzaItems,
    }),
    [api, getSignatureMenus, getSignatureSplitPizzaItems]
  );
};

export default useMenu;
