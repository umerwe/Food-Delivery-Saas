import { normalizeApiArray, normalizeApiMeta } from "@/components/pages/Items/utils/restaurant-card-utils";
import type { ApiMeta, MenuItem } from "@/components/pages/Items/types";
import { getRequest } from "@/services/http";
import type { HappyHourInfo, PromotionInfo } from "@/components/pages/Items/types";

export type CustomerCuisine = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  coverImage?: string | null;
  bannerUrl?: string | null;
  slug?: string | null;
  happyHour?: HappyHourInfo | null;
  promotion?: PromotionInfo | null;
  itemCount?: number | null;
};

export type FetchCuisinesParams = {
  restaurantId?: string | null;
  branchId?: string | number | null;
  page?: number;
  limit?: number;
  locale?: string | null;
  search?: string | null;
  sortBy?: string | null;
  sortOrder?: "ASC" | "DESC" | null;
};

export type FetchCuisineItemsParams = FetchCuisinesParams & {
  cuisineId: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getString = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const getNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const appendCuisineParams = (params: URLSearchParams, values: FetchCuisinesParams) => {
  if (values.restaurantId) params.set("restaurantId", String(values.restaurantId));
  if (values.branchId) params.set("branchId", String(values.branchId));
  if (values.page) params.set("page", String(values.page));
  if (values.limit) params.set("limit", String(values.limit));
  if (values.locale) params.set("locale", String(values.locale));
  if (values.search?.trim()) params.set("search", values.search.trim());
  if (values.sortBy?.trim()) params.set("sortBy", values.sortBy.trim());
  if (values.sortOrder) params.set("sortOrder", values.sortOrder);
};

export const normalizeCuisine = (value: unknown): CustomerCuisine | null => {
  if (!isRecord(value)) return null;

  const id = getString(value.id) ?? getString(value.cuisineId);
  if (!id) return null;

  return {
    id,
    name: getString(value.name) ?? getString(value.title) ?? "Cuisine",
    description: getString(value.description),
    imageUrl: getString(value.imageUrl) ?? getString(value.image),
    coverImage: getString(value.coverImage),
    bannerUrl: getString(value.bannerUrl),
    slug: getString(value.slug),
    happyHour: isRecord(value.happyHour) ? value.happyHour as HappyHourInfo : null,
    promotion: isRecord(value.promotion) ? value.promotion as PromotionInfo : null,
    itemCount: getNumber(value.itemCount ?? value.itemsCount ?? value.menuItemsCount),
  };
};

export const normalizeCuisines = (value: unknown): CustomerCuisine[] =>
  normalizeApiArray<unknown>(value)
    .map(normalizeCuisine)
    .filter((cuisine): cuisine is CustomerCuisine => Boolean(cuisine));

export const fetchCustomerCuisines = async (params: FetchCuisinesParams) => {
  const queryParams = new URLSearchParams();
  appendCuisineParams(queryParams, {
    page: 1,
    limit: 12,
    sortBy: "sortOrder",
    sortOrder: "ASC",
    ...params,
  });

  const response = await getRequest(`/customer-app/cuisines?${queryParams.toString()}`);

  return {
    response,
    cuisines: normalizeCuisines(response),
    meta: normalizeApiMeta(response),
  };
};

export const fetchCustomerCuisineItems = async ({ cuisineId, ...params }: FetchCuisineItemsParams) => {
  const queryParams = new URLSearchParams();
  appendCuisineParams(queryParams, {
    page: 1,
    limit: 12,
    sortBy: "sortOrder",
    sortOrder: "ASC",
    ...params,
  });

  const response = await getRequest(
    `/customer-app/cuisines/${encodeURIComponent(cuisineId)}/items?${queryParams.toString()}`,
  );

  return {
    response,
    items: normalizeApiArray<MenuItem>(response),
    meta: normalizeApiMeta(response),
  };
};

export const fetchPromotionalCuisines = async (params: FetchCuisinesParams) => {
  const queryParams = new URLSearchParams();
  appendCuisineParams(queryParams, {
    page: 1,
    limit: 8,
    sortBy: "sortOrder",
    sortOrder: "ASC",
    ...params,
  });

  const response = await getRequest(`/customer-app/promotional-cuisines?${queryParams.toString()}`);

  return {
    response,
    cuisines: normalizeCuisines(response),
    meta: normalizeApiMeta(response),
  };
};
