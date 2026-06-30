import { describe, expect, it } from "vitest";

import {
  getItemPricing,
  getScopedItemDiscountDisplays,
  type CartItem,
} from "./CartSummarySection";

const getPricingEntry = (item: CartItem) => ({
  item,
  pricing: getItemPricing(item, "delivery"),
});

describe("getScopedItemDiscountDisplays", () => {
  it("returns line-through and discounted prices for scoped item promotions", () => {
    const item: CartItem = {
      id: "cart-item-1",
      name: "30. GARLIVE",
      price: 7,
      unitPrice: 7,
      unitPriceWithModifiers: 7,
      lineTotal: 7,
      quantity: 1,
    };

    const discounts = getScopedItemDiscountDisplays([getPricingEntry(item)], {
      discountAmount: 2,
      appliedPromotion: {
        id: "promo-1",
        title: "Euro 2 off",
        applyMode: "SCOPED_ITEMS",
        discountAmount: 2,
      },
    });

    expect(discounts.get("cart-item-1")).toEqual({
      lineDiscount: 2,
      discountedLineTotal: 5,
      discountedUnitPriceWithModifiers: 5,
    });
  });

  it("does not move order-total discounts onto individual item prices", () => {
    const item: CartItem = {
      id: "cart-item-1",
      name: "30. GARLIVE",
      price: 7,
      unitPrice: 7,
      unitPriceWithModifiers: 7,
      lineTotal: 7,
      quantity: 1,
    };

    const discounts = getScopedItemDiscountDisplays([getPricingEntry(item)], {
      discountAmount: 2,
      appliedPromotion: {
        id: "promo-1",
        title: "Cart discount",
        applyMode: "ORDER_TOTAL",
        discountAmount: 2,
      },
    });

    expect(discounts.size).toBe(0);
  });
});
