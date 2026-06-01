export type BrandLogo = {
  light?: string | null;
  dark?: string | null;
  default?: string | null;
};

export type BrandAssets = {
  coverImage?: string | null;
  heroImage?: string | null;
  bannerImage?: string | null;
};

export type CheckoutBranding = {
  accentColor?: string | null;
};

export type Branding = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  radius: string;
  fontFamily: string;
  headingFontFamily: string;
  logo: BrandLogo;
  assets: BrandAssets;
  checkout: CheckoutBranding;
  restaurantName: string;
  tagline: string;
  showCategories: boolean;
  showPopularItems: boolean;
  showHeroBanner: boolean;
};

export type BrandingContextValue = {
  branding: Branding;
  isLoading: boolean;
};
