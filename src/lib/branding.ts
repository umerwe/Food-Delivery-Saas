import { DEFAULT_BRANDING } from "../config/default-branding";
import type { Branding } from "../types/branding";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getRecord = (value: unknown, key: string) => {
  if (!isRecord(value)) {
    return undefined;
  }

  const nextValue = value[key];
  return isRecord(nextValue) ? nextValue : undefined;
};

const getString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return undefined;
};

const getBoolean = (fallback: boolean, ...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }
  }

  return fallback;
};

const getNestedString = (value: unknown, keys: string[]) => {
  let currentValue = value;

  for (const key of keys) {
    if (!isRecord(currentValue)) {
      return undefined;
    }

    currentValue = currentValue[key];
  }

  return typeof currentValue === "string" && currentValue.trim() ? currentValue : undefined;
};

export const normalizeBrandingApiResponse = (homeData: unknown): Branding => {
  const data = (() => {
    const record = isRecord(homeData) ? homeData : {};
    const firstData = getRecord(record, "data");
    const nestedData = getRecord(firstData, "data");

    return nestedData ?? firstData ?? record;
  })();
  const restaurant = getRecord(data, "restaurant") ?? {};
  const config = getRecord(data, "config") ?? {};
  const branding = getRecord(config, "branding") ?? {};
  const theme = getRecord(branding, "theme") ?? {};
  const app = getRecord(branding, "app") ?? {};
  const logo = getRecord(branding, "logo") ?? {};
  const assets = getRecord(branding, "assets") ?? {};
  const checkout = getRecord(branding, "checkout") ?? {};

  const primaryColor = getString(
    theme.primaryColor,
    branding.primaryColor,
    data.primaryColor,
    restaurant.primaryColor,
    DEFAULT_BRANDING.primaryColor
  ) ?? DEFAULT_BRANDING.primaryColor;
  const secondaryColor = getString(
    theme.secondaryColor,
    branding.secondaryColor,
    data.secondaryColor,
    restaurant.secondaryColor,
    DEFAULT_BRANDING.secondaryColor
  ) ?? DEFAULT_BRANDING.secondaryColor;
  const accentColor = getString(
    theme.accentColor,
    checkout.accentColor,
    branding.accentColor,
    data.accentColor,
    restaurant.accentColor,
    DEFAULT_BRANDING.accentColor
  ) ?? DEFAULT_BRANDING.accentColor;
  const backgroundColor = getString(
    theme.backgroundColor,
    branding.backgroundColor,
    data.backgroundColor,
    restaurant.backgroundColor,
    DEFAULT_BRANDING.backgroundColor
  ) ?? DEFAULT_BRANDING.backgroundColor;
  const textColor = getString(
    theme.textColor,
    branding.textColor,
    data.textColor,
    restaurant.textColor,
    DEFAULT_BRANDING.textColor
  ) ?? DEFAULT_BRANDING.textColor;

  return {
    primaryColor,
    secondaryColor,
    accentColor,
    backgroundColor,
    textColor,
    radius: getString(theme.radius, branding.radius, data.radius, DEFAULT_BRANDING.radius) ?? DEFAULT_BRANDING.radius,
    fontFamily: getString(
      theme.fontFamily,
      app.fontFamily,
      branding.fontFamily,
      data.fontFamily,
      restaurant.fontFamily,
      DEFAULT_BRANDING.fontFamily
    ) ?? DEFAULT_BRANDING.fontFamily,
    headingFontFamily: getString(
      theme.headingFontFamily,
      app.headingFontFamily,
      branding.headingFontFamily,
      data.headingFontFamily,
      DEFAULT_BRANDING.headingFontFamily
    ) ?? DEFAULT_BRANDING.headingFontFamily,
    logo: {
      light: getString(logo.light, logo.lightUrl, branding.logoLight, app.logoLight, restaurant.logoUrl, DEFAULT_BRANDING.logo.light),
      dark: getString(logo.dark, logo.darkUrl, branding.logoDark, app.logoDark, restaurant.logoUrl, DEFAULT_BRANDING.logo.dark),
      default: getString(
        logo.default,
        logo.url,
        branding.logoUrl,
        app.logoUrl,
        restaurant.logoUrl,
        DEFAULT_BRANDING.logo.default
      ),
    },
    assets: {
      coverImage: getString(
        assets.coverImage,
        assets.coverImageUrl,
        assets.heroImage,
        assets.heroImageUrl,
        getNestedString(branding, ["assets", "cover", "url"]),
        data.coverImage,
        restaurant.coverImage,
        restaurant.coverImageUrl,
        DEFAULT_BRANDING.assets.coverImage
      ),
      heroImage: getString(
        assets.heroImage,
        assets.heroImageUrl,
        assets.coverImage,
        assets.coverImageUrl,
        data.heroImage,
        restaurant.heroImageUrl,
        restaurant.coverImage,
        restaurant.coverImageUrl,
        DEFAULT_BRANDING.assets.heroImage
      ),
      bannerImage: getString(
        assets.bannerImage,
        assets.bannerImageUrl,
        assets.coverImage,
        assets.coverImageUrl,
        DEFAULT_BRANDING.assets.bannerImage
      ),
    },
    checkout: {
      accentColor,
    },
    restaurantName: getString(restaurant.name, app.restaurantName, branding.restaurantName, DEFAULT_BRANDING.restaurantName) ?? DEFAULT_BRANDING.restaurantName,
    tagline: getString(
      restaurant.tagline,
      app.tagline,
      branding.tagline,
      restaurant.description,
      DEFAULT_BRANDING.tagline
    ) ?? DEFAULT_BRANDING.tagline,
    showCategories: getBoolean(DEFAULT_BRANDING.showCategories, app.showCategories, branding.showCategories),
    showPopularItems: getBoolean(DEFAULT_BRANDING.showPopularItems, app.showPopularItems, branding.showPopularItems),
    showHeroBanner: getBoolean(DEFAULT_BRANDING.showHeroBanner, app.showHeroBanner, branding.showHeroBanner),
  };
};

export const getBrandingCssVariables = (branding: Branding) => ({
  "--brand-primary": branding.primaryColor,
  "--brand-secondary": branding.secondaryColor,
  "--brand-accent": branding.accentColor,
  "--brand-background": branding.backgroundColor,
  "--brand-text": branding.textColor,
  "--brand-radius": branding.radius,
  "--brand-font-family": branding.fontFamily,
  "--brand-heading-font-family": branding.headingFontFamily,
  "--primary": branding.primaryColor,
  "--background": branding.backgroundColor,
  "--foreground": branding.textColor,
  "--ring": branding.primaryColor,
  "--radius": branding.radius,
});
