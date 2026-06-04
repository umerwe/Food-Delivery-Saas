import { describe, expect, it } from "vitest";

import {
  getAppliedPromotionDiscountLine,
  getBackendErrorMessage,
  getCartItemLineTotal,
  getSelectedModifiers,
  getSelectedSections,
  normalizeCartItem,
  normalizeCartResponse,
  recalculateCartItemQuantity,
} from "./checkout-normalizers";

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
      { id: "", modifierId: "m1", name: "Cheese", quantity: 2, unitPrice: 1.5, priceDelta: undefined, total: 3 },
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

  it("preserves backend cart item pricing and selected deal fields", () => {
    const normalized = normalizeCartItem({
      id: "cart-item-1",
      menuItemId: "burger-1",
      quantity: 2,
      unitPrice: "600",
      modifiersTotal: "150",
      unitPriceWithModifiers: "750",
      lineTotal: "1500",
      dealId: "deal-1",
      selectedVariation: {
        id: "large",
        name: "Large",
        displayText: "Large",
        price: "700",
        pickupPrice: "720",
      },
      selectedModifiers: [
        {
          id: "selected-mod-1",
          modifierId: "extra-cheese",
          name: "Extra cheese",
          quantity: 1,
          unitPrice: 50,
          priceDelta: "50",
          total: 50,
        },
      ],
      menuItem: { name: "Burger" },
    });

    expect(normalized.unitPrice).toBe(600);
    expect(normalized.modifiersTotal).toBe(150);
    expect(normalized.unitPriceWithModifiers).toBe(750);
    expect(normalized.lineTotal).toBe(1500);
    expect(normalized.selectedVariation?.id).toBe("large");
    expect(normalized.selectedModifiers[0]).toMatchObject({
      id: "selected-mod-1",
      modifierId: "extra-cheese",
      name: "Extra cheese",
      quantity: 1,
      priceDelta: "50",
    });
    expect(normalized.dealId).toBe("deal-1");
  });

  it("preserves applied promotion on cart quote", () => {
    const { quote } = normalizeCartResponse({
      data: {
        quote: {
          appliedPromotion: {
            id: "deal-1",
            title: "Burger Combo",
            discountType: "FIXED_PRICE",
            discountValue: 999,
            discountAmount: 301,
          },
          subtotal: 1300,
          discountAmount: 301,
          totalAmount: 999,
        },
      },
    });

    expect(quote).toEqual({
      subtotal: 1300,
      discountAmount: 301,
      totalAmount: 999,
      appliedPromotion: {
        id: "deal-1",
        title: "Burger Combo",
        applyMode: undefined,
        autoApply: undefined,
        discountType: "FIXED_PRICE",
        discountValue: 999,
        discountAmount: 301,
      },
    });
  });

  it("cart item line display total uses lineTotal first", () => {
    expect(
      getCartItemLineTotal({
        quantity: 2,
        lineTotal: 999,
        unitPriceWithModifiers: 750,
        price: 600,
      })
    ).toBe(999);
  });

  it("cart item line display falls back to unit price with modifiers", () => {
    expect(
      getCartItemLineTotal({
        quantity: 2,
        unitPriceWithModifiers: 750,
        price: 600,
      })
    ).toBe(1500);
  });

  it("returns one applied promotion discount line without splitting by items", () => {
    expect(
      getAppliedPromotionDiscountLine({
        subtotal: 1300,
        discountAmount: 301,
        totalAmount: 999,
        appliedPromotion: {
          id: "deal-1",
          title: "Any 2 Burgers",
          discountAmount: 301,
        },
      })
    ).toEqual({
      label: "Any 2 Burgers",
      amount: 301,
      discountValue: undefined,
    });
  });

  it("quote total uses backend totalAmount", () => {
    const { quote } = normalizeCartResponse({
      data: {
        quote: {
          subtotal: 1300,
          discountAmount: 301,
          totalAmount: 999,
        },
      },
    });

    expect(quote?.totalAmount).toBe(999);
  });
});
