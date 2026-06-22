export type CustomerCouponDiscountType = "PERCENTAGE" | "FLAT" | string;

export type CustomerCouponRestaurant = {
  id?: string;
  name?: string;
};

export type CustomerCouponBranch = {
  id?: string;
  name?: string;
};

export type CustomerCoupon = {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  discountType?: CustomerCouponDiscountType | null;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number | null;
  maxUses?: number | null;
  maxUsesPerCustomer?: number | null;
  usedCount?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  restaurant?: CustomerCouponRestaurant | null;
  branch?: CustomerCouponBranch | null;
};

export type CustomerCouponsParams = {
  restaurantId?: string | null;
  branchId?: string | null;
};

export type CustomerCouponsResponse = {
  coupons: CustomerCoupon[];
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

const getBoolean = (value: unknown) => (typeof value === "boolean" ? value : undefined);

const normalizeRestaurant = (value: unknown): CustomerCouponRestaurant | null => {
  if (!isRecord(value)) {
    return null;
  }

  return {
    id: getString(value.id),
    name: getString(value.name),
  };
};

const normalizeBranch = (value: unknown): CustomerCouponBranch | null => {
  if (!isRecord(value)) {
    return null;
  }

  return {
    id: getString(value.id),
    name: getString(value.name),
  };
};

const parseDate = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const hasActiveDateWindow = (startsAt?: string | null, expiresAt?: string | null) => {
  const now = Date.now();
  const startDate = parseDate(startsAt);
  const expiryDate = parseDate(expiresAt);

  if (startDate && startDate.getTime() > now) {
    return false;
  }

  if (expiryDate && expiryDate.getTime() < now) {
    return false;
  }

  return true;
};

const isGloballyExhausted = (maxUses?: number | null, usedCount?: number | null) =>
  maxUses !== null &&
  maxUses !== undefined &&
  maxUses > 0 &&
  usedCount !== null &&
  usedCount !== undefined &&
  usedCount >= maxUses;

export const normalizeCustomerCoupon = (input: unknown): CustomerCoupon | null => {
  if (!isRecord(input)) {
    return null;
  }

  const code = getString(input.code)?.trim();

  if (!code) {
    return null;
  }

  const discountType = getNullableString(input.discountType);
  const startsAt = getNullableString(input.startsAt);
  const expiresAt = getNullableString(input.expiresAt);
  const maxUses = getNullableNumber(input.maxUses);
  const usedCount = getNullableNumber(input.usedCount);

  if (getBoolean(input.autoApply) === true) {
    return null;
  }

  if (discountType === "FIXED_PRICE") {
    return null;
  }

  if (!hasActiveDateWindow(startsAt, expiresAt) || isGloballyExhausted(maxUses, usedCount)) {
    return null;
  }

  return {
    id: getString(input.id) ?? code,
    code,
    title: getString(input.title) ?? code,
    description: getNullableString(input.description),
    imageUrl: getNullableString(input.imageUrl),
    thumbnailUrl: getNullableString(input.thumbnailUrl),
    discountType,
    discountValue: getNumber(input.discountValue, 0),
    maxDiscountAmount: getNullableNumber(input.maxDiscountAmount),
    minOrderAmount: getNullableNumber(input.minOrderAmount),
    maxUses,
    maxUsesPerCustomer: getNullableNumber(input.maxUsesPerCustomer),
    usedCount,
    startsAt,
    expiresAt,
    restaurant: normalizeRestaurant(input.restaurant),
    branch: normalizeBranch(input.branch),
  };
};

const findCouponsArray = (response: unknown): unknown[] => {
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

    for (const key of ["coupons", "items", "results", "records", "rows"]) {
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

export const normalizeCustomerCouponsResponse = (
  response: unknown
): CustomerCouponsResponse => ({
  coupons: findCouponsArray(response)
    .map(normalizeCustomerCoupon)
    .filter((coupon): coupon is CustomerCoupon => coupon !== null),
  message: findMessage(response),
});
