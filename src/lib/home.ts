import { readAuthSession } from "./auth";
import { getArrayData } from "./response";
import type { AuthUser } from "../types/auth";
import type { HomeBranch, HomeCategory, LandingPopup, PromotionCampaign } from "../types/home";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getString = (value: unknown) => (typeof value === "string" ? value : undefined);

const getBoolean = (value: unknown) => (typeof value === "boolean" ? value : undefined);

const getNumberOrString = (value: unknown) => {
  if (typeof value === "number" || typeof value === "string") {
    return value;
  }

  return undefined;
};

const normalizePromotionScope = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecord).map((entry) => ({
    id: getString(entry.id),
    name: getString(entry.name),
    imageUrl: getString(entry.imageUrl) ?? null,
  }));
};

export const getStoredHomeAuthUser = () => readAuthSession()?.user ?? null;

export const resolveHomeRestaurantId = (user?: AuthUser | null, authRestaurantId?: string | null) => {
  const storedUser = getStoredHomeAuthUser();

  return (
    storedUser?.restaurantId ??
    authRestaurantId ??
    user?.restaurantId ??
    user?.tenantId ??
    ""
  );
};

export const resolveHomeBranchId = (user?: AuthUser | null) => {
  const storedUser = getStoredHomeAuthUser();

  return storedUser?.branchId ?? user?.branchId ?? "";
};

export const normalizeHomeCategories = (response: unknown): HomeCategory[] =>
  getArrayData<Record<string, unknown>>(response)
    .map((item) => ({
      id: getString(item.id) ?? "",
      name: getString(item.name) ?? "",
      imageUrl: getString(item.imageUrl) ?? null,
    }))
    .filter((item) => item.id);

export const normalizePromotions = (response: unknown): PromotionCampaign[] =>
  getArrayData<Record<string, unknown>>(response)
    .map((promotion) => ({
      id: getString(promotion.id) ?? "",
      title: getString(promotion.title),
      description: getString(promotion.description),
      applyMode: getString(promotion.applyMode),
      discountType: getString(promotion.discountType),
      discountValue: getNumberOrString(promotion.discountValue),
      maxDiscountAmount: getNumberOrString(promotion.maxDiscountAmount),
      minOrderAmount: getNumberOrString(promotion.minOrderAmount),
      startsAt: getString(promotion.startsAt),
      expiresAt: getString(promotion.expiresAt),
      branch: isRecord(promotion.branch)
        ? {
            id: getString(promotion.branch.id),
            name: getString(promotion.branch.name),
          }
        : null,
      restaurant: isRecord(promotion.restaurant)
        ? {
            id: getString(promotion.restaurant.id),
            name: getString(promotion.restaurant.name),
            slug: getString(promotion.restaurant.slug),
            logoUrl: getString(promotion.restaurant.logoUrl) ?? null,
            coverImage: getString(promotion.restaurant.coverImage) ?? null,
          }
        : null,
      scopeMenuItems: normalizePromotionScope(promotion.scopeMenuItems),
      scopeCategories: normalizePromotionScope(promotion.scopeCategories),
    }))
    .filter((promotion) => promotion.id);

export const isLandingPopup = (value: unknown): value is LandingPopup => isRecord(value);

export const isHomeBranch = (value: unknown): value is HomeBranch => isRecord(value);

export const resolveTableReservationsEnabled = (
  homeBranch?: HomeBranch | null,
  sessionBranch?: AuthUser["branch"] | null
) => {
  const homeFlag =
    getBoolean(homeBranch?.tableReservationsEnabled) ??
    getBoolean(homeBranch?.settings?.tableReservationsEnabled);

  if (homeFlag !== undefined) {
    return homeFlag;
  }

  return (
    getBoolean(sessionBranch?.tableReservationsEnabled) ??
    getBoolean(sessionBranch?.settings?.tableReservationsEnabled) ??
    false
  );
};
