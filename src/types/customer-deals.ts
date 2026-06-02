export type CustomerDealDiscountType =
  | "FIXED_PRICE"
  | "PERCENTAGE"
  | "FLAT"
  | string;

export type CustomerDealApplyMode =
  | "SCOPED_ITEMS"
  | "SCOPED_CATEGORIES"
  | "ALL_ITEMS"
  | string;

export type CustomerDealMenuItem = {
  id: string;
  name: string;
  imageUrl?: string | null;
  basePrice?: string | number | null;
  discountedBasePrice?: string | number | null;
};

export type CustomerDealCategory = {
  id: string;
  name: string;
  imageUrl?: string | null;
};

export type CustomerDealRestaurant = {
  id?: string;
  name?: string;
  logoUrl?: string | null;
};

export type CustomerDealBranch = {
  id?: string;
  name?: string;
};

export type CustomerDeal = {
  id: string;
  title: string;
  description?: string | null;
  applyMode: CustomerDealApplyMode;
  discountType: CustomerDealDiscountType;
  discountValue: number;
  startsAt?: string | null;
  expiresAt?: string | null;
  restaurant?: CustomerDealRestaurant | null;
  branch?: CustomerDealBranch | null;
  scopeMenuItems: CustomerDealMenuItem[];
  scopeCategories: CustomerDealCategory[];
};

export type CustomerDealsParams = {
  restaurantId?: string | null;
  branchId?: string | null;
  limit?: number;
};

export type CustomerDealsResponse = {
  deals: CustomerDeal[];
  message?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getString = (value: unknown) => (typeof value === "string" ? value : undefined);

const getNullableString = (value: unknown) => getString(value) ?? null;

const getNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getStringOrNumber = (value: unknown) => {
  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  return null;
};

const normalizeMenuItems = (value: unknown): CustomerDealMenuItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((item) => ({
      id: getString(item.id) ?? "",
      name: getString(item.name) ?? "",
      imageUrl: getNullableString(item.imageUrl),
      basePrice: getStringOrNumber(item.basePrice),
      discountedBasePrice: getStringOrNumber(item.discountedBasePrice),
    }))
    .filter((item) => item.id);
};

const normalizeCategories = (value: unknown): CustomerDealCategory[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((category) => ({
      id: getString(category.id) ?? "",
      name: getString(category.name) ?? "",
      imageUrl: getNullableString(category.imageUrl),
    }))
    .filter((category) => category.id);
};

const normalizeRestaurant = (value: unknown): CustomerDealRestaurant | null => {
  if (!isRecord(value)) {
    return null;
  }

  return {
    id: getString(value.id),
    name: getString(value.name),
    logoUrl: getNullableString(value.logoUrl),
  };
};

const normalizeBranch = (value: unknown): CustomerDealBranch | null => {
  if (!isRecord(value)) {
    return null;
  }

  return {
    id: getString(value.id),
    name: getString(value.name),
  };
};

export const normalizeCustomerDeal = (input: unknown): CustomerDeal | null => {
  if (!isRecord(input)) {
    return null;
  }

  const id = getString(input.id);

  if (!id) {
    return null;
  }

  return {
    id,
    title: getString(input.title) ?? "Deal",
    description: getNullableString(input.description),
    applyMode: getString(input.applyMode) ?? "ALL_ITEMS",
    discountType: getString(input.discountType) ?? "FIXED_PRICE",
    discountValue: getNumber(input.discountValue, 0),
    startsAt: getNullableString(input.startsAt),
    expiresAt: getNullableString(input.expiresAt),
    restaurant: normalizeRestaurant(input.restaurant),
    branch: normalizeBranch(input.branch),
    scopeMenuItems: normalizeMenuItems(input.scopeMenuItems),
    scopeCategories: normalizeCategories(input.scopeCategories),
  };
};

const findDealsArray = (response: unknown): unknown[] => {
  const candidates = [
    response,
    isRecord(response) ? response.data : undefined,
    isRecord(response) && isRecord(response.data) ? response.data.data : undefined,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }

    if (!isRecord(candidate)) {
      continue;
    }

    for (const key of ["deals", "items", "results", "records", "rows"]) {
      const value = candidate[key];

      if (Array.isArray(value)) {
        return value;
      }
    }
  }

  return [];
};

const findMessage = (response: unknown) => {
  if (isRecord(response) && typeof response.message === "string") {
    return response.message;
  }

  const data = isRecord(response) ? response.data : undefined;

  if (isRecord(data) && typeof data.message === "string") {
    return data.message;
  }

  return undefined;
};

export const normalizeCustomerDealsResponse = (response: unknown): CustomerDealsResponse => ({
  deals: findDealsArray(response)
    .map(normalizeCustomerDeal)
    .filter((deal): deal is CustomerDeal => deal !== null),
  message: findMessage(response),
});
