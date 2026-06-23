import { getRequest } from "@/services/http";
import { normalizeApiArray } from "@/components/pages/Items/utils/restaurant-card-utils";
import type { MenuItem } from "@/components/pages/Items/types";
import { normalizeBrandingApiResponse } from "../lib/branding";
import { isHomeBranch, isLandingPopup, normalizeHomeCategories, normalizePromotions } from "../lib/home";
import { getMeta } from "../lib/response";
import type { CustomerHomeData, CustomerHomeResponse, HomeCategory, HomeConfig, HomeRestaurant } from "../types/home";
import { normalizeHomeGiftCards } from "../types/gift-cards";

const HOME_CATEGORIES_PAGE_LIMIT = 50;
const HOME_CATEGORIES_MAX_PAGES = 30;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const unwrapHomeData = (value: unknown) => {
  if (!isRecord(value)) {
    return {};
  }

  const firstData = value.data;

  if (isRecord(firstData) && isRecord(firstData.data)) {
    return firstData.data;
  }

  return isRecord(firstData) ? firstData : value;
};

const normalizeHomeConfig = (value: unknown): HomeConfig | null => {
  if (!isRecord(value)) {
    return null;
  }

  return {
    currency: typeof value.currency === "string" ? value.currency : null,
    branding: isRecord(value.branding) ? value.branding : undefined,
  };
};

const normalizeHomeRestaurant = (value: unknown): HomeRestaurant | null => {
  if (!isRecord(value)) {
    return null;
  }

  return value;
};

const getMetaNumber = (meta: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const parsed = Number(meta[key]);

    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
};

const hasNextCategoriesPage = (
  response: unknown,
  page: number,
  receivedCount: number
) => {
  const meta = getMeta(response);
  const currentPage = getMetaNumber(meta, ["page", "currentPage"]) ?? page;
  const totalPages = getMetaNumber(meta, ["totalPages", "pages", "pageCount"]);
  const totalItems = getMetaNumber(meta, ["total", "totalItems", "count"]);
  const hasNextPage = meta.hasNextPage ?? meta.hasNext;

  if (typeof hasNextPage === "boolean") {
    return hasNextPage;
  }

  if (totalPages !== null) {
    return currentPage < totalPages;
  }

  if (totalItems !== null) {
    return page * HOME_CATEGORIES_PAGE_LIMIT < totalItems;
  }

  return receivedCount >= HOME_CATEGORIES_PAGE_LIMIT;
};

const normalizeHomeData = (value: unknown): CustomerHomeData => {
  const data = unwrapHomeData(value);
  const record = isRecord(data) ? data : {};

  return {
    restaurant: normalizeHomeRestaurant(record.restaurant),
    config: normalizeHomeConfig(record.config),
    branch: isHomeBranch(record.branch) ? record.branch : null,
    landingPopup: isLandingPopup(record.landingPopup) ? record.landingPopup : null,
    cuisines: normalizeHomeCategories(record.cuisines),
    promotionalItems: normalizePromotions(record.promotionalItems),
    giftCards: normalizeHomeGiftCards(record.giftCards),
    faqs: Array.isArray(record.faqs) ? record.faqs.filter(isRecord) : [],
    branding: normalizeBrandingApiResponse(record),
  };
};

export const getHomeCategories = async (restaurantId: string) => {
  const categories: HomeCategory[] = [];
  const seenCategoryIds = new Set<string>();
  let page = 1;

  while (page <= HOME_CATEGORIES_MAX_PAGES) {
    const params = new URLSearchParams({
      restaurantId,
      page: String(page),
      limit: String(HOME_CATEGORIES_PAGE_LIMIT),
      sortBy: "sortOrder",
      sortOrder: "ASC",
    });

    const response = await getRequest(`/v1/menu/categories?${params.toString()}`);
    const pageCategories = normalizeHomeCategories(response);

    for (const category of pageCategories) {
      if (seenCategoryIds.has(category.id)) {
        continue;
      }

      seenCategoryIds.add(category.id);
      categories.push(category);
    }

    if (!hasNextCategoriesPage(response, page, pageCategories.length)) {
      break;
    }

    page += 1;
  }

  return categories;
};

export const getHomePromotions = async (restaurantId: string, branchId?: string | null) => {
  const params = new URLSearchParams();
  params.set("restaurantId", restaurantId);

  if (branchId) {
    params.set("branchId", branchId);
  }

  return normalizePromotions(await getRequest(`/customer-app/promotions?${params.toString()}`));
};

export const getPromotionalItems = async ({
  restaurantId,
  branchId,
  limit = 8,
  locale,
}: {
  restaurantId?: string | null;
  branchId?: string | null;
  limit?: number;
  locale?: string | null;
}) => {
  const params = new URLSearchParams();

  if (restaurantId) {
    params.set("restaurantId", restaurantId);
  }

  if (branchId) {
    params.set("branchId", branchId);
  }

  if (locale) {
    params.set("locale", locale);
  }

  params.set("limit", String(limit));

  const response = await getRequest(
    `/customer-app/promotional-items?${params.toString()}`,
  );

  return normalizeApiArray<MenuItem>(response);
};

export const getHome = async (
  restaurantId?: string | null,
  branchId?: string | null
): Promise<CustomerHomeResponse> => {
  const params = new URLSearchParams();

  if (restaurantId) {
    params.set("restaurantId", restaurantId);
  }

  if (branchId) {
    params.set("branchId", branchId);
  }

  const query = params.toString();
  const response = await getRequest(`/customer-app/home${query ? `?${query}` : ""}`);

  if (response.error) {
    throw new Error(response.error);
  }

  return {
    data: normalizeHomeData(response),
  };
};
