import { createDomainApiService } from "@/services/domain-api";
import { normalizeApiList, normalizeApiMeta } from "@/components/pages/Items/components/signature-selection/signature-selection-utils";
import type { ApiRecord, MenuItem, MenuRecord } from "@/components/pages/Items/components/signature-selection/types";

const menuService = createDomainApiService();

export const getMenu = menuService.get;
export const postMenu = menuService.post;
export const patchMenu = menuService.patch;
export const deleteMenu = menuService.del;

const SIGNATURE_MENU_PAGE_LIMIT = 20;

const resolveHasNext = ({
  meta,
  page,
  limit,
  receivedCount,
  totalLoaded,
}: {
  meta: ApiRecord;
  page: number;
  limit: number;
  receivedCount: number;
  totalLoaded: number;
}) => {
  if (typeof meta?.hasNext === "boolean") return meta.hasNext;
  if (typeof meta?.hasMore === "boolean") return meta.hasMore;

  const currentPage = Number(meta?.page ?? page);
  const totalPages = Number(meta?.totalPages ?? meta?.pages ?? 0);
  const total = Number(meta?.total ?? 0);

  if (totalPages > 0) return currentPage < totalPages;
  if (total > 0) return totalLoaded < total;

  return receivedCount >= limit;
};

export const fetchSignatureMenus = async ({
  restaurantId,
  token,
}: {
  restaurantId: string;
  token?: string | null;
}) => {
  let page = 1;
  let totalLoaded = 0;
  let collected: MenuRecord[] = [];
  let shouldContinue = true;
  let error: string | undefined;

  while (shouldContinue) {
    const params = new URLSearchParams({
      restaurantId,
      page: String(page),
      limit: String(SIGNATURE_MENU_PAGE_LIMIT),
      sortBy: "sortOrder",
      sortOrder: "ASC",
    });

    const response = await getMenu(`/v1/menus?${params.toString()}`, token);

    if (!response || response.error) {
      error = response?.error || "Failed to fetch menus";
      break;
    }

    const fetchedMenus = normalizeApiList<MenuRecord>(response);
    const meta = normalizeApiMeta(response);

    collected = [...collected, ...fetchedMenus];
    totalLoaded += fetchedMenus.length;

    shouldContinue = resolveHasNext({
      meta,
      page,
      limit: SIGNATURE_MENU_PAGE_LIMIT,
      receivedCount: fetchedMenus.length,
      totalLoaded,
    });

    page += 1;

    if (page > 30) {
      shouldContinue = false;
    }
  }

  return { menus: collected, error };
};

export const fetchSignatureSplitPizzaItems = async ({
  restaurantId,
  branchId,
  search,
  page,
  token,
}: {
  restaurantId?: string | null;
  branchId?: string | number | null;
  search: string;
  page: number;
  token?: string | null;
}) => {
  const queryParams = new URLSearchParams();

  queryParams.set("page", String(page));
  queryParams.set("supportsSplitPizza", "true");

  if (restaurantId) {
    queryParams.set("restaurantId", String(restaurantId));
  }

  if (branchId) {
    queryParams.set("branchId", String(branchId));
  }

  const resolvedSearch = search?.trim();

  if (resolvedSearch) {
    queryParams.set("search", resolvedSearch);
  }

  const response = await getMenu(`/v1/menu/items?${queryParams.toString()}`, token);

  return {
    data: normalizeApiList<MenuItem>(response),
    meta: normalizeApiMeta(response),
  };
};
