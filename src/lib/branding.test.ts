import { describe, expect, it } from "vitest";

import { DEFAULT_BRANDING } from "../config/default-branding";
import { getBrandingCssVariables, normalizeBrandingApiResponse } from "./branding";

describe("branding normalization", () => {
  it("normalizes nested branding from customer home data", () => {
    const branding = normalizeBrandingApiResponse({
      restaurant: {
        name: "Demo Restaurant",
        logoUrl: "/restaurant-logo.png",
      },
      config: {
        branding: {
          theme: {
            primaryColor: "#111111",
            secondaryColor: "#222222",
            backgroundColor: "#ffffff",
            textColor: "#000000",
            radius: "12px",
          },
          app: {
            tagline: "Fresh food",
            showCategories: false,
          },
          logo: {
            light: "/light.png",
            dark: "/dark.png",
          },
          assets: {
            heroImage: "/hero-demo.png",
          },
          checkout: {
            accentColor: "#333333",
          },
        },
      },
    });

    expect(branding.primaryColor).toBe("#111111");
    expect(branding.secondaryColor).toBe("#222222");
    expect(branding.accentColor).toBe("#333333");
    expect(branding.logo.light).toBe("/light.png");
    expect(branding.logo.dark).toBe("/dark.png");
    expect(branding.assets.heroImage).toBe("/hero-demo.png");
    expect(branding.restaurantName).toBe("Demo Restaurant");
    expect(branding.tagline).toBe("Fresh food");
    expect(branding.showCategories).toBe(false);
  });

  it("normalizes customer-app home envelope restaurant and config branding", () => {
    const branding = normalizeBrandingApiResponse({
      data: {
        data: {
          restaurant: { name: "Envelope Restaurant", logoUrl: "/envelope-logo.png" },
          config: { branding: { primaryColor: "#abcdef" } },
        },
      },
    });

    expect(branding.restaurantName).toBe("Envelope Restaurant");
    expect(branding.primaryColor).toBe("#abcdef");
    expect(branding.logo.default).toBe("/envelope-logo.png");
  });

  it("uses flattened and nested fallback branding keys and defaults", () => {
    const branding = normalizeBrandingApiResponse({
      primaryColor: "#123456",
      secondaryColor: "#654321",
      fontFamily: "Inter",
    });

    expect(branding.primaryColor).toBe("#123456");
    expect(branding.secondaryColor).toBe("#654321");
    expect(branding.fontFamily).toBe("Inter");
    expect(branding.accentColor).toBe(DEFAULT_BRANDING.accentColor);

    const nested = normalizeBrandingApiResponse({
      restaurant: { primaryColor: "#111111" },
      config: { branding: { theme: { secondaryColor: "#222222" } } },
    });

    expect(nested.primaryColor).toBe("#111111");
    expect(nested.secondaryColor).toBe("#222222");
  });

  it("normalizes dark palette values", () => {
    const branding = normalizeBrandingApiResponse({
      config: {
        branding: {
          theme: {
            primaryColor: "#0f172a",
            secondaryColor: "#111827",
            backgroundColor: "#020617",
            textColor: "#f8fafc",
          },
        },
      },
    });

    expect(branding.primaryColor).toBe("#0f172a");
    expect(branding.secondaryColor).toBe("#111827");
    expect(branding.backgroundColor).toBe("#020617");
    expect(branding.textColor).toBe("#f8fafc");
  });

  it("maps branding to CSS variables", () => {
    const variables = getBrandingCssVariables({
      ...DEFAULT_BRANDING,
      primaryColor: "#111111",
      backgroundColor: "#fafafa",
      textColor: "#101010",
    });

    expect(variables["--brand-primary"]).toBe("#111111");
    expect(variables["--primary"]).toBe("#111111");
    expect(variables["--background"]).toBe("#fafafa");
    expect(variables["--foreground"]).toBe("#101010");
  });
});
