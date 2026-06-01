import { describe, expect, it } from "vitest";

import { getMenuItemBasePrice, getModifierOverrideAmount, getVariationDisplayPrice, getVariationPickupPrice } from "./product-pricing";

describe("product pricing", () => {
  it("parses base price", () => {
    expect(getMenuItemBasePrice({ price: "12.50" })).toBe(12.5);
    expect(getMenuItemBasePrice({ basePrice: "9" })).toBe(9);
  });

  it("uses variation override price", () => {
    expect(
      getVariationDisplayPrice(
        { price: 10, variationPriceOverrides: [{ variationId: "large", price: "14" }] },
        { id: "large", name: "Large", price: 12 }
      )
    ).toBe(14);
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
