import type { Branding } from "@/types/branding";

export type HomeRestaurant = {
  id?: string | null;
  name?: string | null;
  tagline?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  heroImageUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  backgroundColor?: string | null;
  textColor?: string | null;
  fontFamily?: string | null;
};

export type HomeBranch = {
  id?: string | null;
  name?: string | null;
  restaurantId?: string | null;
  address?: Record<string, unknown>;
  settings?: Record<string, unknown>;
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
  faqs: Record<string, unknown>[];
  branding: Branding;
};

export type CustomerHomeResponse = {
  data: CustomerHomeData;
};
