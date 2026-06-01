import type { Branding } from "../types/branding";

export const DEFAULT_BRANDING: Branding = {
  primaryColor: "#CE181B",
  secondaryColor: "#FDEEE9",
  accentColor: "#FF9F0D",
  backgroundColor: "#FFFFFF",
  textColor: "#171717",
  radius: "0.625rem",
  fontFamily: "inherit",
  headingFontFamily: "inherit",
  logo: {
    light: "/logo.png",
    dark: "/logo.png",
    default: "/logo.png",
  },
  assets: {
    coverImage: "/hero.png",
    heroImage: "/hero.png",
    bannerImage: "/hero.png",
  },
  checkout: {
    accentColor: "#CE181B",
  },
  restaurantName: "FoodLover.club",
  tagline: "Within a few clicks, find meals that are accessible near you",
  showCategories: true,
  showPopularItems: true,
  showHeroBanner: true,
};
