import { describe, expect, it } from "vitest";

import { getMenuItemBasePrice, getMenuItemDisplayPrice, getModifierOverrideAmount, getVariationDisplayPrice, getVariationPickupPrice } from "./product-pricing";

describe("product pricing", () => {
  it("parses base price", () => {
    expect(getMenuItemBasePrice({ price: "12.50" })).toBe(12.5);
    expect(getMenuItemBasePrice({ basePrice: "9" })).toBe(9);
  });

  it("uses happy hour discounted item price for display", () => {
    expect(
      getMenuItemDisplayPrice({
        price: "12.50",
        happyHourDiscountedBasePrice: "9.99",
        happyHour: {
          id: "happy-1",
          title: "Happy hour",
          discountType: "PERCENTAGE",
          discountValue: 20,
          isCurrentlyActive: true,
        },
      })
    ).toBe(9.99);
  });

  it("uses variation override price", () => {
    expect(
      getVariationDisplayPrice(
        { price: 10, variationPriceOverrides: [{ variationId: "large", price: "14" }] },
        { id: "large", name: "Large", price: 12 }
      )
    ).toBe(14);
  });

  it("uses happy hour discounted variation price for display", () => {
    expect(
      getVariationDisplayPrice(
        { price: 10 },
        {
          id: "large",
          name: "Large",
          price: 12,
          happyHourDiscountedPrice: "8.5",
          happyHour: {
            id: "happy-variation",
            title: "Happy hour",
            discountType: "FLAT",
            discountValue: 3.5,
            isCurrentlyActive: true,
          },
        }
      )
    ).toBe(8.5);
  });

  it("falls back for pickup price", () => {
    expect(getVariationPickupPrice({ pickupPrice: 8 }, { id: "v1", name: "Small", price: 10 })).toBe(10);
    expect(getVariationPickupPrice({ pickupPrice: 8 }, { id: "v1", name: "Small" })).toBe(8);
  });

  it("uses modifier override amounts", () => {
    expect(getModifierOverrideAmount([{ modifierId: "m1", priceDelta: "2.5" }], { id: "m1", name: "Cheese" })).toBe(2.5);
    expect(getModifierOverrideAmount([{ modifierId: "m1", price: "3" }], { id: "m1", name: "Cheese" })).toBe(3);
  });
});
