import { describe, expect, it } from "vitest";

import { buildCartPayload, buildModifiersPayload, getApiErrorMessage, isCartBranchConflict } from "./product-cart";

describe("product cart helpers", () => {
  it("builds modifier payloads from grouped selections", () => {
    expect(
      buildModifiersPayload({
        groupA: [{ id: "m1", name: "Cheese", selectedQuantity: 2 }],
        groupB: [{ id: "m2", name: "Olives", selectedQuantity: 1 }],
      })
    ).toEqual([
      { modifierId: "m1", quantity: 1 },
      { modifierId: "m2", quantity: 1 },
    ]);
  });

  it("builds create cart payload with split sections", () => {
    const payload = buildCartPayload({
      item: { id: "left", menuLinks: [{ restaurantMenuId: "menu-1" }] },
      branchId: "branch-1",
      selectedVariation: { id: "large", name: "Large" },
      qty: 2,
      selectedModifiers: {},
      instructions: "  no onion ",
      splitPizzaEnabled: true,
      splitPizzaItem: { id: "right" },
      includeMenuItem: true,
      includeBranch: true,
      clearSectionsWhenEmpty: false,
    });

    expect(payload).toMatchObject({
      branchId: "branch-1",
      menuItemId: "left",
      restaurantMenuId: "menu-1",
      variationId: "large",
      quantity: 2,
      note: "no onion",
      sections: [
        { slot: "LEFT", menuItemId: "left" },
        { slot: "RIGHT", menuItemId: "right" },
      ],
    });

    expect(payload.sections).toEqual([
      { slot: "LEFT", menuItemId: "left" },
      { slot: "RIGHT", menuItemId: "right" },
    ]);
  });

  it("clears patch sections when split pizza is off", () => {
    expect(
      buildCartPayload({
        item: { id: "item-1" },
        selectedVariation: null,
        qty: 1,
        selectedModifiers: {},
        splitPizzaEnabled: false,
        splitPizzaItem: null,
        includeMenuItem: false,
        includeBranch: false,
        clearSectionsWhenEmpty: true,
      }).sections
    ).toEqual([]);
  });

  it("extracts API error messages and detects branch conflicts", () => {
    expect(getApiErrorMessage({ data: { error: { message: "Nested" } } })).toBe("Nested");
    expect(isCartBranchConflict({ error: "Cart already contains items from another branch" })).toBe(true);
  });
});
