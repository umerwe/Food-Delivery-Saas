import { describe, expect, it } from "vitest";

import { getBackendErrorMessage, getSelectedModifiers, getSelectedSections, normalizeCartItem, normalizeCartResponse, recalculateCartItemQuantity } from "./checkout-normalizers";

describe("checkout normalizers", () => {
  it("normalizes backend errors", () => {
    expect(getBackendErrorMessage({ data: { error: { message: "No stock" } } })).toBe("No stock");
  });

  it("prefers API error messages over generic request failures", () => {
    expect(
      getBackendErrorMessage({
        error: "Request failed with status code 400",
        status: 400,
        data: {
          success: false,
          message: "deliveryAddressId is required for delivery orders",
          error: {
            code: "Bad Request",
            message: "deliveryAddressId is required for delivery orders",
          },
        },
      })
    ).toBe("deliveryAddressId is required for delivery orders");
  });

  it("normalizes selected modifiers", () => {
    expect(getSelectedModifiers({ selectedModifiers: [{ modifierId: "m1", name: "Cheese", quantity: 2, unitPrice: 1.5 }] })).toEqual([
      { modifierId: "m1", name: "Cheese", quantity: 2, unitPrice: 1.5, total: 3 },
    ]);
  });

  it("normalizes selected sections", () => {
    expect(
      getSelectedSections({
        menuItem: { id: "pizza", name: "Pizza", splitPizza: { allowedFlavors: [{ id: "right", name: "Right Pizza" }] } },
        sections: [{ slot: "RIGHT", menuItemId: "right", unitPrice: "12" }],
      })
    ).toEqual([{ slot: "RIGHT", label: "Right half", menuItemId: "right", menuItemName: "Right Pizza", unitPrice: 12 }]);
  });

  it("normalizes cart response and cart item quantity recalculation", () => {
    const { items } = normalizeCartResponse({ data: { items: [{ id: "1", quantity: 1, price: 5, menuItem: { name: "Burger" } }] } });
    const normalized = normalizeCartItem(items[0]);
    expect(normalized.name).toBe("Burger");
    expect(recalculateCartItemQuantity(normalized, 3).lineTotal).toBe(15);
  });

  it("preserves applied promotion on cart quote", () => {
    const { quote } = normalizeCartResponse({
      data: {
        quote: {
          appliedPromotion: {
            id: "deal-1",
            title: "Burger Combo",
            discountAmount: 301,
          },
        },
      },
    });

    expect(quote?.appliedPromotion).toMatchObject({
      id: "deal-1",
      title: "Burger Combo",
      discountAmount: 301,
    });
  });
});
