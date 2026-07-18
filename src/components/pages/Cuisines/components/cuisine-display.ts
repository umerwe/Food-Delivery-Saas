import { formatMoney } from "@/lib/money";
import type { MenuItem, PromotionInfo } from "@/components/pages/Items/types";
import type { CustomerCuisine } from "@/services/cuisines";
import { toNumber } from "@/components/pages/Items/utils/restaurant-card-utils";

export const CUISINE_FALLBACK_IMAGE = "/categories/cuisine-fallback-v1.webp";

export const getCuisineRemoteImage = (cuisine?: CustomerCuisine | null) => {
  const image = cuisine?.imageUrl || cuisine?.coverImage || cuisine?.bannerUrl || "";

  return image.startsWith("https://") ? image : null;
};

export const getCuisinePromotion = (cuisine: CustomerCuisine): PromotionInfo | null =>
  cuisine.happyHour ?? cuisine.promotion ?? null;

export const getCuisineBadge = (cuisine: CustomerCuisine, fallback: string) => {
  const promotion = getCuisinePromotion(cuisine);
  const discountValue = toNumber(promotion?.discountValue, 0);

  if (promotion?.title?.trim()) return promotion.title;
  if (promotion?.discountType === "PERCENTAGE" && discountValue > 0) return `${discountValue}% off`;
  if (promotion?.discountType === "FLAT" && discountValue > 0) return "Special offer";
  if (cuisine.happyHour) return "Happy hour";

  return fallback;
};

const firstPositiveNumber = (...values: unknown[]) => {
  for (const value of values) {
    const parsed = toNumber(value, Number.NaN);

    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  return null;
};

const getVariationOverridePrice = (item: MenuItem, variationId?: string | number | null) => {
  if (!variationId) return null;

  const override = item.variationPriceOverrides?.find((entry) => {
    const overrideVariationId = entry.variationId ?? entry.variation?.id;

    return overrideVariationId ? String(overrideVariationId) === String(variationId) : false;
  });

  return firstPositiveNumber(override?.price, override?.variation?.price);
};

const getDefaultVariation = (item: MenuItem) => {
  const variations = item.variations?.filter((variation) => variation.isActive !== false) ?? [];

  if (!variations.length) return null;

  return variations.find((variation) => variation.isDefault) ?? variations[0];
};

const getVariationBasePrice = (item: MenuItem) => {
  const variation = getDefaultVariation(item);

  if (!variation) return null;

  return firstPositiveNumber(
    variation.happyHour?.originalPrice,
    variation.promotion?.originalPrice,
    getVariationOverridePrice(item, variation.id ?? variation.variationId),
    variation.itemPriceOverrides?.[0]?.price,
    variation.price,
  );
};

export const getMenuItemPromotion = (item: MenuItem): PromotionInfo | null => {
  const variation = getDefaultVariation(item);

  return item.happyHour ?? item.promotion ?? variation?.happyHour ?? variation?.promotion ?? null;
};

export const getMenuItemBasePrice = (item: MenuItem) =>
  firstPositiveNumber(
    item.happyHour?.originalPrice,
    item.promotion?.originalPrice,
    item.basePrice,
    item.price,
  ) ?? getVariationBasePrice(item) ?? 0;

export const getMenuItemFinalPrice = (item: MenuItem) => {
  const basePrice = getMenuItemBasePrice(item);
  const promotion = getMenuItemPromotion(item);
  const discountValue = toNumber(promotion?.discountValue, 0);
  const backendDiscountAmount = toNumber(promotion?.discountAmount, 0);
  const maxDiscountAmount = toNumber(promotion?.maxDiscountAmount, 0);
  let discountAmount = 0;

  if (backendDiscountAmount > 0) {
    discountAmount = backendDiscountAmount;
  } else if (promotion?.discountType === "PERCENTAGE") {
    discountAmount = (basePrice * discountValue) / 100;
  } else if (promotion?.discountType === "FLAT") {
    discountAmount = discountValue;
  }

  if (maxDiscountAmount > 0) {
    discountAmount = Math.min(discountAmount, maxDiscountAmount);
  }

  return Math.max(0, basePrice - Math.min(Math.max(discountAmount, 0), basePrice));
};

export const getMenuItemPromotionBadge = (
  item: MenuItem,
  fallback: string,
  currency?: string | null,
) => {
  const promotion = getMenuItemPromotion(item);
  const discountValue = toNumber(promotion?.discountValue, 0);

  if (!promotion) return "";
  if (promotion.title?.trim()) return promotion.title;
  if (promotion.discountType === "PERCENTAGE" && discountValue > 0) return `${discountValue}% off`;
  if (promotion.discountType === "FLAT" && discountValue > 0) return `${formatMoney(discountValue, currency)} off`;

  return fallback;
};
