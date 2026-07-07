import { describe, expect, it } from "vitest";

import {
  getMenuItemBasePrice,
  getMenuItemFinalPrice,
} from "@/components/pages/Cuisines/components/cuisine-display";
import type { MenuItem } from "@/components/pages/Items/types";

describe("cuisine item price display", () => {
  it("falls back to the default variation price when the item base price is zero", () => {
    const item: MenuItem = {
      id: "pizza",
      name: "Pizza",
      basePrice: 0,
      price: 0,
      variations: [
        { id: "small", name: "Small", price: 8.5, isDefault: true },
        { id: "large", name: "Large", price: 12 },
      ],
    };

    expect(getMenuItemBasePrice(item)).toBe(8.5);
    expect(getMenuItemFinalPrice(item)).toBe(8.5);
  });

  it("uses the first variation price when no default variation is marked", () => {
    const item: MenuItem = {
      id: "pasta",
      name: "Pasta",
      basePrice: "0",
      price: null,
      variations: [
        { id: "regular", name: "Regular", price: "9.25" },
        { id: "family", name: "Family", price: "18.5" },
      ],
    };

    expect(getMenuItemBasePrice(item)).toBe(9.25);
    expect(getMenuItemFinalPrice(item)).toBe(9.25);
  });

  it("uses item variation price overrides instead of showing a false zero", () => {
    const item: MenuItem = {
      id: "calzone",
      name: "Calzone",
      basePrice: 0,
      variations: [{ id: "regular", name: "Regular", price: 0, isDefault: true }],
      variationPriceOverrides: [{ variationId: "regular", price: "10.75" }],
    };

    expect(getMenuItemBasePrice(item)).toBe(10.75);
    expect(getMenuItemFinalPrice(item)).toBe(10.75);
  });

  it("keeps a real zero price when no base or variation price is available", () => {
    const item: MenuItem = {
      id: "sample",
      name: "Sample",
      basePrice: 0,
      variations: [{ id: "default", name: "Default", price: 0, isDefault: true }],
    };

    expect(getMenuItemBasePrice(item)).toBe(0);
    expect(getMenuItemFinalPrice(item)).toBe(0);
  });
});
