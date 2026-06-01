import type { ApiMeta, ApiRecord, AuthRestaurantUser, ItemsCategory, MenuItem, RestaurantInfo, StoredAuthState } from "../types";

export const FALLBACK_BANNER = "/categories/background_banner.png";
export const FALLBACK_ITEM_IMAGE = "/menu-item.jpg";

export const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const normalizeApiArray = <T = unknown,>(res: unknown): T[] => {
  const record = typeof res === "object" && res !== null ? (res as ApiRecord) : {};
  const data = record.data;
  const dataRecord = typeof data === "object" && data !== null ? (data as ApiRecord) : {};

  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(dataRecord.data)) return dataRecord.data as T[];
  if (Array.isArray(dataRecord.items)) return dataRecord.items as T[];
  if (Array.isArray(record.items)) return record.items as T[];
  return [];
};

export const normalizeApiMeta = (res: unknown): ApiMeta => {
  const record = typeof res === "object" && res !== null ? (res as ApiRecord) : {};
  const data = typeof record.data === "object" && record.data !== null ? (record.data as ApiRecord) : {};
  const nestedData = typeof data.data === "object" && data.data !== null ? (data.data as ApiRecord) : {};
  const meta = data.pagination || data.meta || nestedData.pagination || nestedData.meta || record.pagination || record.meta || {};
  return typeof meta === "object" && meta !== null && !Array.isArray(meta) ? (meta as ApiMeta) : {};
};

export const hasText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text !== "" && text.toLowerCase() !== "null";
};

export const formatPrice = (value: unknown) => toNumber(value, 0).toFixed(2);

type VariationOption = {
  id?: string | number | null;
  name?: string | null;
  displayText?: string | null;
};

const normalizeVariationText = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const variationMatches = (
  candidate: VariationOption,
  reference: VariationOption
) => {
  const candidateId = String(candidate?.id ?? "");
  const referenceId = String(reference?.id ?? "");

  if (candidateId && referenceId && candidateId === referenceId) {
    return true;
  }

  const candidateLabels = [
    normalizeVariationText(candidate?.displayText),
    normalizeVariationText(candidate?.name),
  ].filter(Boolean);

  const referenceLabels = [
    normalizeVariationText(reference?.displayText),
    normalizeVariationText(reference?.name),
  ].filter(Boolean);

  return candidateLabels.some((label) => referenceLabels.includes(label));
};

export const getSplitPizzaPricingVariation = <TVariation extends VariationOption>({
  variations,
  selectedVariation,
  fallbackVariation,
}: {
  variations: TVariation[];
  selectedVariation?: VariationOption | null;
  fallbackVariation?: TVariation | null;
}) => {
  if (!selectedVariation) {
    return fallbackVariation ?? null;
  }

  return (
    variations.find((variation) => variationMatches(variation, selectedVariation)) ??
    fallbackVariation ??
    null
  );
};

export const getImageUrl = (category: ItemsCategory | null | undefined, restaurant: RestaurantInfo | null | undefined) => {
  const candidates = [
    category?.imageUrl,
    category?.coverImage,
    category?.bannerUrl,
    restaurant?.coverImage,
    restaurant?.coverImageUrl,
    restaurant?.bannerUrl,
    restaurant?.imageUrl,
  ];

  return candidates.find((value) => hasText(value)) || FALLBACK_BANNER;
};

export const getItemImageUrl = (item: MenuItem | null | undefined) => {
  const candidates = [item?.imageUrl];
  return candidates.find((value) => hasText(value)) || FALLBACK_ITEM_IMAGE;
};

export const formatAddress = (value: unknown) => {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const address = value as ApiRecord;
    return [address.street, address.area, address.city, address.state, address.country]
      .filter(hasText)
      .join(", ");
  }
  return "";
};

export const getRestaurantName = (authUser: AuthRestaurantUser | null | undefined, storedAuth: StoredAuthState | null | undefined) => {
  const candidates = [
    authUser?.restaurant?.name,
    authUser?.restaurantName,
    authUser?.profile?.restaurantName,
    authUser?.tenant?.restaurant?.name,
    storedAuth?.user?.restaurant?.name,
    storedAuth?.user?.restaurantName,
    storedAuth?.user?.profile?.restaurantName,
  ];
  return candidates.find(hasText) || "Restaurant";
};

export const getRestaurantAddress = (authUser: AuthRestaurantUser | null | undefined, storedAuth: StoredAuthState | null | undefined) => {
  const candidates = [
    authUser?.restaurant?.address,
    authUser?.branch?.address,
    authUser?.address,
    authUser?.profile?.address,
    storedAuth?.user?.restaurant?.address,
    storedAuth?.user?.branch?.address,
    storedAuth?.user?.address,
    storedAuth?.user?.profile?.address,
  ];

  for (const candidate of candidates) {
    const address = formatAddress(candidate);
    if (hasText(address)) return address;
  }

  return "Address not available";
};

export const getOperatingHours = (authUser: AuthRestaurantUser | null | undefined, storedAuth: StoredAuthState | null | undefined) => {
  const restaurant = authUser?.restaurant || authUser?.profile?.restaurant || storedAuth?.user?.restaurant || storedAuth?.user?.profile?.restaurant || {};
  const branch = authUser?.branch || authUser?.profile?.branch || storedAuth?.user?.branch || storedAuth?.user?.profile?.branch || {};
  const direct = [restaurant.operatingHours, restaurant.openingHours, restaurant.businessHours, branch.operatingHours, branch.openingHours, branch.businessHours].find(hasText);
  if (direct) return String(direct);
  const openingTime = restaurant.openingTime || restaurant.opensAt || branch.openingTime || branch.opensAt;
  const closingTime = restaurant.closingTime || restaurant.closesAt || branch.closingTime || branch.closesAt;
  if (hasText(openingTime) && hasText(closingTime)) return `${openingTime} - ${closingTime}`;
  return "Operating hours not specified";
};

export const getRatingInfo = (authUser: AuthRestaurantUser | null | undefined, storedAuth: StoredAuthState | null | undefined) => {
  const restaurant = authUser?.restaurant || authUser?.profile?.restaurant || storedAuth?.user?.restaurant || storedAuth?.user?.profile?.restaurant || {};
  const rating = toNumber(restaurant.rating ?? restaurant.averageRating ?? restaurant.stats?.averageRating, Number.NaN);
  const reviews = toNumber(restaurant.reviewCount ?? restaurant.reviewsCount ?? restaurant.stats?.reviewCount, Number.NaN);
  if (!Number.isFinite(rating) || rating <= 0) return null;
  return { rating, reviews: Number.isFinite(reviews) && reviews > 0 ? reviews : null };
};

export const resolveAvailabilityStatus = (isOpen?: boolean | null) => (isOpen === false ? "Closed" : "Open");

export const resolvePromotionBadge = (promotion?: { title?: string | null; discountType?: string | null; discountValue?: string | number | null } | null) => {
  if (!promotion) return "";
  if (hasText(promotion.title)) return String(promotion.title);
  if (promotion.discountType === "PERCENTAGE") return `${toNumber(promotion.discountValue, 0)}% OFF`;
  if (promotion.discountType === "FLAT") return `$${formatPrice(promotion.discountValue)} OFF`;
  return "OFFER";
};

export const mergeUniqueById = <T extends { id?: string | number | null }>(prev: T[], next: T[]) => {
  const map = new Map<string, T>();
  [...prev, ...next].forEach((item) => {
    const id = String(item?.id ?? "");
    if (!id) return;
    map.set(id, item);
  });
  return Array.from(map.values());
};

export const resolveHasNext = ({ meta, page, limit, receivedCount, totalLoaded }: { meta: ApiMeta; page: number; limit: number; receivedCount: number; totalLoaded: number }) => {
  if (typeof meta?.hasNext === "boolean") return meta.hasNext;
  if (typeof meta?.hasMore === "boolean") return meta.hasMore;
  const total = toNumber(meta?.total, 0);
  const totalPages = toNumber(meta?.totalPages ?? meta?.pages, 0);
  const currentPage = toNumber(meta?.page, page);
  if (totalPages > 0) return currentPage < totalPages;
  if (total > 0) return totalLoaded < total;
  return receivedCount >= limit;
};
