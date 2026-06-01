import { describe, expect, it } from "vitest";

import {
  getActiveMenuId,
  getCartItemUnitPrice,
  getPriceDisplay,
  getSelectedModifierTotal,
  groupMenuRecords,
  normalizeApiList,
  normalizeSelectedModifiers,
} from "./signature-selection-utils";

describe("signature selection utils", () => {
  it("groups active menu records and keeps stable active menu", () => {
    const menus = groupMenuRecords([
      { id: "b", name: "B", sortOrder: 2 },
      { id: "a", name: "A", sortOrder: 1 },
      { id: "c", name: "C", isActive: false },
    ]);

    expect(menus.map(({ id }) => id)).toEqual(["a", "b"]);
    expect(getActiveMenuId(menus, "b")).toBe("b");
    expect(getActiveMenuId(menus, "missing")).toBe("a");
  });

  it("normalizes API list shapes", () => {
    expect(normalizeApiList({ data: { items: [{ id: "1" }] } })).toEqual([{ id: "1" }]);
  });

  it("formats prices and selected modifiers", () => {
    expect(getPriceDisplay("12.5")).toBe("12.50");
    expect(normalizeSelectedModifiers({ group: [{ id: "m1", name: "Cheese", selectedQuantity: 2 }] })).toEqual([
      { modifierId: "m1", quantity: 2 },
    ]);
  });

  it("calculates cart item modifier totals", () => {
    expect(
      getSelectedModifierTotal({
        modifiers: [{ modifierId: "m1", quantity: 2 }],
        menuItem: { id: "item", name: "Item", modifierGroups: [{ id: "g", name: "G", modifiers: [{ id: "m1", name: "Cheese", priceDelta: "1.5" }] }] },
      })
    ).toBe(3);
    expect(getCartItemUnitPrice({ price: "7.25" })).toBe(7.25);
  });
});
