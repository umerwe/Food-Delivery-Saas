import type { Branding } from "@/types/branding";
import type { BranchScheduleTimings } from "@/types/branches";
import type { HomeGiftCards } from "@/types/gift-cards";
import type { HappyHourInfo } from "@/components/pages/Items/types";

export type HomeRestaurant = {
  id?: string | null;
  name?: string | null;
  tagline?: string | null;
  bio?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  coverImage?: string | null;
  coverImageUrl?: string | null;
  heroImageUrl?: string | null;
  socialMediaLinks?: Record<string, string | null | undefined> | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  backgroundColor?: string | null;
  textColor?: string | null;
  fontFamily?: string | null;
  settings?: Record<string, unknown> | null;
};

export type HomeBranch = {
  id?: string | null;
  name?: string | null;
  restaurantId?: string | null;
  address?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  scheduleTimings?: BranchScheduleTimings | null;
  tableReservationsEnabled?: boolean;
};

export type HomeConfig = {
  currency?: string | null;
  branding?: Record<string, unknown>;
};

export type LandingPopup = {
  show?: boolean;
  type?: string;
  title?: string;
  message?: string;
  period?: {
    fromDate?: string | null;
    toDate?: string | null;
  } | null;
  temporaryClosure?: {
    isClosed?: boolean;
    closedAt?: string | null;
    closedUntil?: string | null;
    reason?: string | null;
    message?: string | null;
  } | null;
};

export type HomeCategory = {
  id: string;
  name: string;
  imageUrl?: string | null;
  happyHour?: HappyHourInfo | null;
};

export type PromotionCampaign = {
  id: string;
  title?: string;
  description?: string;
  applyMode?: "ORDER_TOTAL" | "SCOPED_ITEMS" | string;
  discountType?: "FLAT" | "PERCENTAGE" | string;
  discountValue?: number | string;
  maxDiscountAmount?: number | string;
  minOrderAmount?: number | string;
  startsAt?: string;
  expiresAt?: string;
  branch?: {
    id?: string;
    name?: string;
  } | null;
  restaurant?: {
    id?: string;
    name?: string;
    slug?: string;
    logoUrl?: string | null;
    coverImage?: string | null;
  } | null;
  scopeMenuItems?: {
    id?: string;
    name?: string;
    imageUrl?: string | null;
  }[];
  scopeCategories?: {
    id?: string;
    name?: string;
    imageUrl?: string | null;
  }[];
};

export type CustomerHomeData = {
  restaurant?: HomeRestaurant | null;
  config?: HomeConfig | null;
  branch?: HomeBranch | null;
  landingPopup?: LandingPopup | null;
  cuisines: HomeCategory[];
  promotionalItems: PromotionCampaign[];
  giftCards?: HomeGiftCards | null;
  faqs: Record<string, unknown>[];
  branding: Branding;
};

export type CustomerHomeResponse = {
  data: CustomerHomeData;
};
