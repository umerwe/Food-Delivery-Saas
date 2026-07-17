import { describe, expect, it } from "vitest";

import { normalizePrivacyPolicyContent, sanitizeLegalHtml } from "./legal-content";

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

  it("preserves supported legal markup and secures links", () => {
    expect(sanitizeLegalHtml('<h2>Agreement</h2><a href="https://example.com">Read more</a>')).toBe(
      '<h2>Agreement</h2><a href="https://example.com" target="_blank" rel="noopener noreferrer">Read more</a>',
    );
  });

  it("preserves safe rich-editor font sizes", () => {
    expect(sanitizeLegalHtml('<font size="5">Large policy text</font>')).toBe(
      '<font size="5">Large policy text</font>',
    );
    expect(sanitizeLegalHtml('<font size="99">Unsafe size</font>')).toBe(
      "<font>Unsafe size</font>",
    );
  });

  it("preserves rich-editor block lines instead of collapsing their content", () => {
    expect(
      sanitizeLegalHtml(
        "<div>- <strong>Account information:</strong> Account details</div><div>- <strong>Order information:</strong> Order details</div>",
      ),
    ).toBe(
      "<div>- <strong>Account information:</strong> Account details</div><div>- <strong>Order information:</strong> Order details</div>",
    );
  });

  it("removes executable legal markup and event handlers", () => {
    expect(
      sanitizeLegalHtml('<p onclick="alert(1)">Safe</p><script>alert(1)</script>'),
    ).toBe("<p>Safe</p>");
  });
});
