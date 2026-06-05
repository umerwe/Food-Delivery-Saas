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

export type CustomerDealSelectionMode = "FIXED_ITEMS" | "FLEXIBLE_ITEMS";

export type CustomerDealMenuItemCategory = {
  id?: string;
  name?: string;
  imageUrl?: string | null;
};

export type CustomerDealMenuItemOption = Record<string, unknown>;

export type CustomerDealMenuItem = {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  basePrice?: string | number | null;
  discountedBasePrice?: string | number | null;
  category?: CustomerDealMenuItemCategory | null;
  variations?: CustomerDealMenuItemOption[];
  modifierGroups?: CustomerDealMenuItemOption[];
  modifiers?: CustomerDealMenuItemOption[];
  modifierLinks?: CustomerDealMenuItemOption[];
  supportsSplitPizza?: boolean | null;
  supportsDealIdCartPayload?: boolean;
  supportsDealCartPayload?: boolean;
  isDealMenuItem?: boolean;
  requiresCustomization?: boolean;
  hasConfigurableOptions?: boolean;
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
  thumbnailUrl?: string | null;
  imageUrl?: string | null;
  applyMode?: CustomerDealApplyMode | null;
  discountType?: CustomerDealDiscountType | null;
  discountValue: number;
  dealSelectionMode: CustomerDealSelectionMode;
  dealRequiredQuantity?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  restaurant?: CustomerDealRestaurant | null;
  branch?: CustomerDealBranch | null;
  scopeMenuItems: CustomerDealMenuItem[];
  scopeCategories: CustomerDealCategory[];
  scopeCategoryIds?: string[];
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

const getNullableNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeSelectionMode = (
  value: unknown,
  scopeCategories: CustomerDealCategory[],
  dealRequiredQuantity: number | null
): CustomerDealSelectionMode => {
  if (value === "FIXED_ITEMS" || value === "FLEXIBLE_ITEMS") {
    return value;
  }

  if (scopeCategories.length > 0 && dealRequiredQuantity !== null) {
    return "FLEXIBLE_ITEMS";
  }

  if (dealRequiredQuantity !== null && dealRequiredQuantity > 0) {
    return "FLEXIBLE_ITEMS";
  }

  return "FIXED_ITEMS";
};

const getStringOrNumber = (value: unknown) => {
  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  return null;
};

const normalizeMenuItemCategory = (value: unknown): CustomerDealMenuItemCategory | null => {
  if (!isRecord(value)) {
    return null;
  }

  return {
    id: getString(value.id),
    name: getString(value.name),
    imageUrl: getNullableString(value.imageUrl),
  };
};

const normalizeUnknownArray = (value: unknown): CustomerDealMenuItemOption[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.filter(isRecord);
};

const getBoolean = (value: unknown) => (typeof value === "boolean" ? value : undefined);

const normalizeMenuItems = (value: unknown): CustomerDealMenuItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((item) => ({
      id: getString(item.id) ?? "",
      name: getString(item.name) ?? "",
      slug: getNullableString(item.slug),
      description: getNullableString(item.description),
      imageUrl: getNullableString(item.imageUrl),
      basePrice: getStringOrNumber(item.basePrice),
      discountedBasePrice: getStringOrNumber(item.discountedBasePrice),
      category: normalizeMenuItemCategory(item.category),
      variations: normalizeUnknownArray(item.variations),
      modifierGroups: normalizeUnknownArray(item.modifierGroups),
      modifiers: normalizeUnknownArray(item.modifiers),
      modifierLinks: normalizeUnknownArray(item.modifierLinks),
      supportsSplitPizza: typeof item.supportsSplitPizza === "boolean" ? item.supportsSplitPizza : null,
      supportsDealIdCartPayload: getBoolean(item.supportsDealIdCartPayload),
      supportsDealCartPayload: getBoolean(item.supportsDealCartPayload),
      isDealMenuItem: getBoolean(item.isDealMenuItem),
      requiresCustomization: getBoolean(item.requiresCustomization),
      hasConfigurableOptions: getBoolean(item.hasConfigurableOptions),
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

const normalizeCategoryIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((id): id is string => typeof id === "string" && id.trim().length > 0);
};

const normalizeDealCategories = (categories: unknown, categoryIds: string[]) => {
  const normalizedCategories = normalizeCategories(categories);

  if (normalizedCategories.length > 0) {
    return normalizedCategories;
  }

  return categoryIds.map((id) => ({
    id,
    name: "Category",
  }));
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

  const dealRequiredQuantity = getNullableNumber(input.dealRequiredQuantity);
  const scopeCategoryIds = normalizeCategoryIds(input.scopeCategoryIds);
  const scopeCategories = normalizeDealCategories(input.scopeCategories, scopeCategoryIds);
  const dealSelectionMode = normalizeSelectionMode(
    input.dealSelectionMode,
    scopeCategories,
    dealRequiredQuantity
  );

  if (
    process.env.NODE_ENV === "development" &&
    input.discountType === "FIXED_PRICE" &&
    input.applyMode === "SCOPED_ITEMS" &&
    input.dealSelectionMode === undefined
  ) {
    console.warn(
      "Deal is using legacy response shape; flexible UI requires dealSelectionMode/dealRequiredQuantity from backend."
    );
  }

  return {
    id,
    title: getString(input.title) ?? "Deal",
    description: getNullableString(input.description),
    dealSelectionMode,
    dealRequiredQuantity,
    applyMode: getString(input.applyMode) ?? "ALL_ITEMS",
    discountType: getString(input.discountType) ?? "FIXED_PRICE",
    discountValue: getNumber(input.discountValue, 0),
    thumbnailUrl: getNullableString(input.thumbnailUrl),
    imageUrl: getNullableString(input.imageUrl),
    startsAt: getNullableString(input.startsAt),
    expiresAt: getNullableString(input.expiresAt),
    restaurant: normalizeRestaurant(input.restaurant),
    branch: normalizeBranch(input.branch),
    scopeMenuItems: normalizeMenuItems(input.scopeMenuItems),
    scopeCategories,
    scopeCategoryIds,
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
