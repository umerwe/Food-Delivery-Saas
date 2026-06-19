import { describe, expect, it } from "vitest";

import { normalizePrivacyPolicyContent } from "./legal-content";

describe("legal content service", () => {
  it("normalizes privacy policy legal profile fields", () => {
    expect(
      normalizePrivacyPolicyContent({
        restaurantId: "restaurant-1",
        title: "Privacy Policy",
        content: "Policy text",
        restaurantCoverImage: "https://example.com/cover.jpg",
        legalProfile: {
          ownerName: "Badar",
          legalBusinessName: "DeliveryWays Kitchen LLC",
          taxNumber: "VAT-123456789",
          businessAddress: {
            street: "Street 12",
            shopNumber: "Shop 4",
            postalCode: "54000",
            city: "Lahore",
            state: "Punjab",
            country: "Pakistan",
          },
          contractText: "Restaurant legal contract.",
        },
        policyLink: "/api/v1/public-content/privacy-policy?restaurantId=restaurant-1",
      })
    ).toEqual({
      restaurantId: "restaurant-1",
      title: "Privacy Policy",
      content: "Policy text",
      restaurantCoverImage: "https://example.com/cover.jpg",
      legalProfile: {
        ownerName: "Badar",
        legalBusinessName: "DeliveryWays Kitchen LLC",
        taxNumber: "VAT-123456789",
        businessAddress: {
          street: "Street 12",
          shopNumber: "Shop 4",
          postalCode: "54000",
          city: "Lahore",
          state: "Punjab",
          country: "Pakistan",
        },
        contractText: "Restaurant legal contract.",
      },
      policyLink: "/api/v1/public-content/privacy-policy?restaurantId=restaurant-1",
    });
  });

  it("falls back safely when legal profile is missing", () => {
    expect(normalizePrivacyPolicyContent({})).toEqual({
      restaurantId: undefined,
      restaurantCoverImage: undefined,
      title: "Privacy Policy",
      content: "",
      legalProfile: null,
      policyLink: undefined,
    });
  });

  it("uses a numeric legal address state as postal code when postal code is missing", () => {
    expect(
      normalizePrivacyPolicyContent({
        legalProfile: {
          businessAddress: {
            street: "Katernberger Straße",
            shopNumber: "7-9",
            city: "Essen",
            state: "45327",
            country: "Deutschland",
          },
        },
      }).legalProfile?.businessAddress
    ).toEqual({
      street: "Katernberger Straße",
      shopNumber: "7-9",
      postalCode: "45327",
      city: "Essen",
      state: undefined,
      country: "Deutschland",
    });
  });
});
