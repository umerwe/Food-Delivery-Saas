import { describe, expect, it } from "vitest";

import {
  getItemPricing,
  getScopedItemDiscountDisplays,
  getServiceChargeAmountFromQuote,
  getTotalBeforeDiscount,
  type CartItem,
} from "./CartSummarySection";

const getPricingEntry = (item: CartItem) => ({
  item,
  pricing: getItemPricing(item, "delivery"),
});

describe("getTotalBeforeDiscount", () => {
  it("excludes inclusive tax and service charge from the pre-discount display total", () => {
    expect(
      getTotalBeforeDiscount({
        subtotal: 1000,
        orderFee: 0,
        tipAmount: 0,
      })
    ).toBe(1000);
  });

  it("includes only subtotal, order fee, and tip before discount", () => {
    expect(
      getTotalBeforeDiscount({
        subtotal: 1000,
        orderFee: 50,
        tipAmount: 25,
      })
    ).toBe(1075);
  });
});

describe("getServiceChargeAmountFromQuote", () => {
  it("reads service charge amount from direct and charge breakdown quote fields", () => {
    expect(getServiceChargeAmountFromQuote({ serviceChargeAmount: 1.5 })).toBe(1.5);
    expect(
      getServiceChargeAmountFromQuote({
        chargeBreakdown: {
          totalServiceChargeAmount: 2.5,
          serviceCharges: [{ label: "Service", amount: 1 }],
        },
      })
    ).toBe(2.5);
    expect(
      getServiceChargeAmountFromQuote({
        chargeBreakdown: {
          serviceCharges: [
            { label: "Service", amount: 1 },
            { label: "Packaging", amount: 0.5 },
          ],
        },
      })
    ).toBe(1.5);
  });
});

describe("getScopedItemDiscountDisplays", () => {
  it("uses per-item promotion and happy-hour contract fields first", () => {
    const discountedItem: CartItem = {
      id: "cart-item-1",
      name: "Happy item",
      price: 10,
      unitPrice: 10,
      unitPriceWithModifiers: 10,
      lineTotal: 10,
      quantity: 1,
      promotion: null,
      happyHour: { id: "happy-hour-1", title: "Happy hour" },
      promotionDiscountAmount: 3,
      discountedUnitPrice: 7,
      discountedLineTotal: 7,
    };
    const regularItem: CartItem = {
      id: "cart-item-2",
      name: "Regular item",
      price: 8,
      unitPrice: 8,
      unitPriceWithModifiers: 8,
      lineTotal: 8,
      quantity: 1,
      promotion: null,
      happyHour: null,
      promotionDiscountAmount: 0,
      discountedUnitPrice: null,
      discountedLineTotal: null,
    };

    const discounts = getScopedItemDiscountDisplays([
      getPricingEntry(discountedItem),
      getPricingEntry(regularItem),
    ], {
      discountAmount: 3,
      appliedPromotion: {
        id: "happy-hour-1",
        title: "Happy hour",
        applyMode: "SCOPED_ITEMS",
        discountAmount: 3,
      },
    });

    expect(discounts.get("cart-item-1")).toEqual({
      lineDiscount: 3,
      discountedLineTotal: 7,
      discountedUnitPriceWithModifiers: 7,
    });
    expect(discounts.has("cart-item-2")).toBe(false);
  });

  it("uses quote discount instead of invalid fixed-price per-line zero totals", () => {
    const tuna: CartItem = {
      id: "cart-item-tuna",
      name: "38. TUNA",
      price: 8.9,
      unitPrice: 8.9,
      unitPriceWithModifiers: 8.9,
      lineTotal: 8.9,
      quantity: 1,
      promotion: { id: "deal-1", title: "Angebot 2", discountType: "FIXED_PRICE", discountAmount: 8.9 },
      happyHour: null,
      promotionDiscountAmount: 8.9,
      discountedUnitPrice: 0,
      discountedLineTotal: 0,
    };
    const spicyTom: CartItem = {
      id: "cart-item-spicy",
      name: "31. SPICY TOM",
      price: 7.5,
      unitPrice: 7.5,
      unitPriceWithModifiers: 7.5,
      lineTotal: 7.5,
      quantity: 1,
      promotion: { id: "deal-1", title: "Angebot 2", discountType: "FIXED_PRICE", discountAmount: 7.5 },
      happyHour: null,
      promotionDiscountAmount: 7.5,
      discountedUnitPrice: 0,
      discountedLineTotal: 0,
    };
    const garlive: CartItem = {
      id: "cart-item-garlive",
      name: "30. GARLIVE",
      price: 9.55,
      unitPrice: 7,
      unitPriceWithModifiers: 9.55,
      lineTotal: 9.55,
      quantity: 1,
      promotion: { id: "deal-1", title: "Angebot 2", discountType: "FIXED_PRICE", discountAmount: 9.55 },
      happyHour: null,
      promotionDiscountAmount: 9.55,
      discountedUnitPrice: 0,
      discountedLineTotal: 0,
    };

    const discounts = getScopedItemDiscountDisplays([
      getPricingEntry(tuna),
      getPricingEntry(spicyTom),
      getPricingEntry(garlive),
    ], {
      discountAmount: 3.45,
      appliedPromotion: {
        id: "deal-1",
        title: "Angebot 2",
        applyMode: "SCOPED_ITEMS",
        discountType: "FIXED_PRICE",
        discountAmount: 3.45,
      },
    });

    expect(discounts.get("cart-item-tuna")?.discountedLineTotal).toBeCloseTo(7.72, 2);
    expect(discounts.get("cart-item-spicy")?.discountedLineTotal).toBeCloseTo(6.5, 2);
    expect(discounts.get("cart-item-garlive")?.discountedLineTotal).toBeCloseTo(8.28, 2);
  });

  it("does not treat null discount contract fields as zero-price discounts", () => {
    const regularItem: CartItem = {
      id: "cart-item-regular",
      name: "Regular item",
      price: 8.9,
      unitPrice: 8.9,
      unitPriceWithModifiers: 8.9,
      lineTotal: 8.9,
      quantity: 1,
      promotion: null,
      happyHour: null,
      promotionDiscountAmount: 0,
      discountedUnitPrice: null,
      discountedLineTotal: null,
    };

    const discounts = getScopedItemDiscountDisplays([getPricingEntry(regularItem)]);

    expect(discounts.size).toBe(0);
  });

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
