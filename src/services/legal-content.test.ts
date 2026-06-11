import { describe, expect, it } from "vitest";

import { normalizePrivacyPolicyContent } from "./legal-content";

describe("legal content service", () => {
  it("normalizes privacy policy legal profile fields", () => {
    expect(
      normalizePrivacyPolicyContent({
        restaurantId: "restaurant-1",
        title: "Privacy Policy",
        content: "Policy text",
        legalProfile: {
          legalBusinessName: "DeliveryWays Kitchen LLC",
          taxNumber: "VAT-123456789",
          businessAddress: {
            street: "Street 12",
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
      legalProfile: {
        legalBusinessName: "DeliveryWays Kitchen LLC",
        taxNumber: "VAT-123456789",
        businessAddress: {
          street: "Street 12",
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
      title: "Privacy Policy",
      content: "",
      legalProfile: null,
      policyLink: undefined,
    });
  });
});
