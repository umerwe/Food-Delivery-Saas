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

  it("preserves restaurantMenuId on normalized cart items", () => {
    expect(
      normalizeCartItem({
        id: "cart-item-1",
        restaurantMenuId: "menu-breakfast",
        menuItemId: "item-1",
        quantity: 1,
        menuItem: { name: "Omelette" },
      })
    ).toMatchObject({
      id: "cart-item-1",
      restaurantMenuId: "menu-breakfast",
      menuItemId: "item-1",
      name: "Omelette",
    });
  });

  it("normalizes cart item preparation time from backend item or menu item", () => {
    expect(
      normalizeCartItem({
        id: "cart-item-1",
        quantity: 2,
        prepTimeMinutes: 20,
        menuItem: { name: "Pizza", prepTimeMinutes: 15 },
      })
    ).toMatchObject({
      prepTimeMinutes: 20,
    });

    expect(
      normalizeCartItem({
        id: "cart-item-2",
        quantity: 1,
        menuItem: { name: "Pasta", prepTimeMinutes: 12 },
      })
    ).toMatchObject({
      prepTimeMinutes: 12,
    });
  });

  it("ready-made deal item with empty modifiers has no displayable modifiers", () => {
    expect(
      getSelectedModifiers({
        dealId: "deal-1",
        modifiers: [],
        menuItem: { name: "Ready-made Combo" },
      })
    ).toEqual([]);
  });

  it("customizable deal item renders grouped selected modifiers", () => {
    expect(
      getSelectedModifiers({
        dealId: "deal-1",
        modifierSelections: [
          {
            modifierGroupId: "group-1",
            groupName: "Sauce",
            modifiers: [
              {
                modifierId: "modifier-1",
                quantity: 1,
                modifier: {
                  id: "modifier-1",
                  name: "Garlic Sauce",
                  priceDelta: 25,
                },
              },
            ],
          },
        ],
        menuItem: { name: "Custom Combo" },
      })
    ).toEqual([
      {
        id: "",
        modifierId: "modifier-1",
        name: "Sauce: Garlic Sauce",
        quantity: 1,
        unitPrice: 25,
        priceDelta: 25,
        total: 25,
      },
    ]);
  });

  it("customizable deal item renders grouped selectedModifiers if backend returns them later", () => {
    expect(
      getSelectedModifiers({
        dealId: "deal-1",
        selectedModifiers: [
          {
            modifierGroupId: "group-1",
            groupName: "Sauce",
            modifiers: [
              {
                modifierId: "modifier-1",
                quantity: 2,
                name: "Garlic Sauce",
                priceDelta: 25,
              },
            ],
          },
        ],
        menuItem: { name: "Custom Combo" },
      })
    ).toEqual([
      {
        id: "",
        modifierId: "modifier-1",
        name: "Sauce: Garlic Sauce",
        quantity: 2,
        unitPrice: 25,
        priceDelta: 25,
        total: 50,
      },
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

  it("uses cart item fallback fields when mutation responses omit nested menu item details", () => {
    const normalized = normalizeCartItem({
      id: "cart-item-1",
      quantity: 1,
      unitPrice: 30,
      unitPriceWithModifiers: 51,
      lineTotal: 51,
      name: "Lahori Chicken Pizza",
      description: "test test test",
      imageUrl: "/pizza.avif",
      menuItemId: "menu-item-1",
    });

    expect(normalized.name).toBe("Lahori Chicken Pizza");
    expect(normalized.desc).toBe("test test test");
    expect(normalized.img).toBe("/pizza.avif");
    expect(normalized.lineTotal).toBe(51);
  });

  it("preserves per-item cart discount contract fields", () => {
    const normalized = normalizeCartItem({
      id: "cart-item-1",
      quantity: 1,
      unitPriceWithModifiers: 10,
      lineTotal: 10,
      name: "Happy hour item",
      happyHour: { id: "happy-hour-1", title: "Happy hour" },
      promotion: null,
      promotionDiscountAmount: 3,
      discountedUnitPrice: 7,
      discountedLineTotal: 7,
    });

    expect(normalized.happyHour).toEqual({ id: "happy-hour-1", title: "Happy hour" });
    expect(normalized.promotion).toBeNull();
    expect(normalized.promotionDiscountAmount).toBe(3);
    expect(normalized.discountedUnitPrice).toBe(7);
    expect(normalized.discountedLineTotal).toBe(7);
  });

  it("resolves modifier names and prices from flat menu item modifiers", () => {
    const normalized = normalizeCartItem({
      id: "cart-item-1",
      quantity: 1,
      modifiers: [{ modifierId: "modifier-1", quantity: 1 }],
      menuItem: {
        name: "Lahori Chicken Pizza",
        selectedVariation: {
          id: "small",
          name: "Small",
          displayText: "Small",
        },
        modifiers: [
          {
            id: "modifier-1",
            name: "Lahori pizza modifier",
            priceDelta: 21,
          },
        ],
      },
    });

    expect(normalized.selectedVariationName).toBe("Small");
    expect(normalized.selectedModifiers).toEqual([
      {
        id: "",
        modifierId: "modifier-1",
        name: "Lahori pizza modifier",
        quantity: 1,
        unitPrice: 21,
        priceDelta: undefined,
        total: 21,
      },
    ]);
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
    expect(normalized.selectedVariation).toBeNull();
    expect(normalized.selectedVariationName).toBe("");
    expect(normalized.variationId).toBeUndefined();
    expect(normalized.selectedModifiers[0]).toMatchObject({
      id: "selected-mod-1",
      modifierId: "extra-cheese",
      name: "Extra cheese",
      quantity: 1,
      priceDelta: "50",
    });
    expect(normalized.dealId).toBe("deal-1");
  });

  it("normalizes grouped fixed combo deal rows", () => {
    const normalized = normalizeCartItem({
      id: "deal:deal-1",
      type: "DEAL",
      dealId: "deal-1",
      cartItemIds: ["row-1", "row-2"],
      menuItemIds: ["burger-1", "drink-1"],
      quantity: 2,
      unitPrice: 100,
      unitPriceWithModifiers: 100,
      lineTotal: 200,
      deal: {
        id: "deal-1",
        code: "DEAL4",
        title: "Deal 4",
        description: "Fixed combo",
        imageUrl: "deal.png",
        fixedPrice: 100,
      },
      includedItems: [
        {
          type: "ITEM",
          menuItemId: "burger-1",
          quantity: 1,
          menuItem: { name: "Burger" },
        },
        {
          type: "ITEM",
          menuItemId: "drink-1",
          menuItem: { name: "Drink" },
        },
      ],
    });

    expect(normalized.type).toBe("DEAL");
    expect(normalized.name).toBe("Deal 4");
    expect(normalized.img).toBe("deal.png");
    expect(normalized.dealId).toBe("deal-1");
    expect(normalized.quantity).toBe(2);
    expect(normalized.lineTotal).toBe(200);
    expect(normalized.cartItemIds).toEqual(["row-1", "row-2"]);
    expect(normalized.includedItems).toEqual([
      {
        type: "ITEM",
        id: undefined,
        menuItemId: "burger-1",
        variationId: undefined,
        name: "Burger",
        quantity: 1,
        menuItem: { name: "Burger" },
        selectedModifiers: [],
      },
      {
        type: "ITEM",
        id: undefined,
        menuItemId: "drink-1",
        variationId: undefined,
        name: "Drink",
        quantity: 1,
        menuItem: { name: "Drink" },
        selectedModifiers: [],
      },
    ]);
  });

  it("preserves selected modifiers returned on flexible deal included items", () => {
    const normalized = normalizeCartItem({
      id: "deal:deal-flex",
      type: "DEAL",
      dealId: "deal-flex",
      quantity: 1,
      unitPrice: 99,
      lineTotal: 99,
      deal: {
        id: "deal-flex",
        title: "Flexible Deal",
      },
      includedItems: [
        {
          type: "ITEM",
          menuItemId: "pizza-1",
          variationId: "large",
          quantity: 1,
          menuItem: { name: "Pizza" },
          modifierSelections: [
            {
              modifierGroupId: "group-toppings",
              modifiers: [{ modifierId: "modifier-cheese", quantity: 2 }],
            },
          ],
          selectedModifiers: [
            {
              modifierId: "modifier-cheese",
              name: "Cheese",
              quantity: 2,
              unitPrice: 0,
              total: 0,
            },
          ],
        },
      ],
    });

    expect(normalized.includedItems).toEqual([
      {
        type: "ITEM",
        id: undefined,
        menuItemId: "pizza-1",
        variationId: "large",
        name: "Pizza",
        quantity: 1,
        menuItem: { name: "Pizza" },
        selectedModifiers: [
          {
            id: "",
            modifierId: "modifier-cheese",
            name: "Cheese",
            quantity: 2,
            unitPrice: 0,
            priceDelta: undefined,
            total: 0,
          },
        ],
      },
    ]);
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
          taxAmount: 0,
          deliveryFee: 150,
          serviceChargeType: "PERCENTAGE",
          serviceChargeValue: 10,
          serviceChargeAmount: 100,
          tipAmount: 150,
          discountAmount: 301,
          totalAmount: 999,
          payableAmount: 1400,
        },
      },
    });

    expect(quote).toEqual({
      subtotal: 1300,
      taxAmount: 0,
      deliveryFee: 150,
      serviceChargeType: "PERCENTAGE",
      serviceChargeValue: 10,
      serviceChargeAmount: 100,
      tipAmount: 150,
      discountAmount: 301,
      loyaltyDiscountAmount: 0,
      loyaltyPointsRedeemed: 0,
      walletAppliedAmount: 0,
      totalAmount: 999,
      payableAmount: 1400,
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

  it("does not allocate applied promotion discount per cart item", () => {
    const { items, quote } = normalizeCartResponse({
      data: {
        items: [
          {
            id: "cart-item-1",
            quantity: 1,
            unitPrice: 500,
            lineTotal: 500,
            dealId: "deal-1",
            modifiers: [],
            menuItem: { name: "Burger A" },
          },
          {
            id: "cart-item-2",
            quantity: 1,
            unitPrice: 500,
            lineTotal: 500,
            dealId: "deal-1",
            modifiers: [],
            menuItem: { name: "Burger B" },
          },
        ],
        quote: {
          subtotal: 1000,
          discountAmount: 200,
          totalAmount: 800,
          payableAmount: 800,
          appliedPromotion: {
            id: "deal-1",
            title: "Any 2 Burgers",
            discountAmount: 200,
          },
        },
      },
    });

    const normalizedItems = items.map((item) => normalizeCartItem(item));

    expect(normalizedItems.map((item) => item.lineTotal)).toEqual([500, 500]);
    expect(getAppliedPromotionDiscountLine(quote)).toEqual({
      label: "Any 2 Burgers",
      amount: 200,
      discountValue: 0,
    });
  });

  it("quote total uses backend totalAmount and payableAmount", () => {
    const { quote } = normalizeCartResponse({
      data: {
        quote: {
          subtotal: 1300,
          discountAmount: 301,
          totalAmount: 999,
          payableAmount: 899,
        },
      },
    });

    expect(quote?.totalAmount).toBe(999);
    expect(quote?.payableAmount).toBe(899);
  });

  it("does not treat quote snapshot rows as display cart items", () => {
    const { items, quote } = normalizeCartResponse({
      data: {
        subtotal: 51,
        deliveryFee: 2,
        totalAmount: 53,
        payableAmount: 53,
        items: [
          {
            menuItemId: "pizza-1",
            menuItemName: "Lahori Chicken Pizza",
            variationId: "small",
            variationName: "Small",
            quantity: 1,
            unitPrice: 51,
            lineTotal: 51,
            snapshotModifiers: [
              {
                modifierId: "modifier-1",
                name: "Lahori pizza modifier",
                quantity: 1,
                unitPrice: 21,
              },
            ],
          },
        ],
      },
    });

    expect(items).toEqual([]);
    expect(quote).toMatchObject({
      subtotal: 51,
      deliveryFee: 2,
      totalAmount: 53,
      payableAmount: 53,
    });
  });

  it("preserves saved cart coupon values from wrapped cart response", () => {
    const { quote } = normalizeCartResponse({
      data: {
        cart: {
          quote: {
            subtotal: 1300,
            discountAmount: 100,
            couponCode: "SAVE10",
            totalAmount: 1200,
            payableAmount: 1200,
          },
        },
      },
    });

    expect(quote).toMatchObject({
      couponCode: "SAVE10",
      discountAmount: 100,
      totalAmount: 1200,
      payableAmount: 1200,
    });
  });

  it("merges cart-level subtotal into partial quote for deal checkout totals", () => {
    const { quote } = normalizeCartResponse({
      data: {
        cart: {
          subtotal: 24.5,
          deliveryFee: 5,
          serviceChargeAmount: 3,
          payableAmount: 30.58,
          quote: {
            deliveryFee: 5,
            serviceChargeAmount: 3,
            payableAmount: 30.58,
          },
        },
      },
    });

    expect(quote).toMatchObject({
      subtotal: 24.5,
      deliveryFee: 5,
      serviceChargeAmount: 3,
      payableAmount: 30.58,
    });
  });

  it("quote normalizer preserves service charge tip and payable amount", () => {
    const { quote } = normalizeCartResponse({
      data: {
        quote: {
          subtotal: 1000,
          taxAmount: 0,
          deliveryFee: 150,
          serviceChargeType: "PERCENTAGE",
          serviceChargeValue: 10,
          serviceChargeAmount: 100,
          tipAmount: 150,
          discountAmount: 0,
          totalAmount: 1400,
          payableAmount: 1400,
          chargeBreakdown: {
            taxes: [{ code: "STANDARD", label: "Standard tax", percentage: 19, amount: 190 }],
            serviceCharges: [{ code: "SERVICE", label: "Service charge", percentage: 10, amount: 100 }],
            totalTaxAmount: 190,
            totalServiceChargeAmount: 100,
          },
        },
      },
    });

    expect(quote).toMatchObject({
      serviceChargeType: "PERCENTAGE",
      serviceChargeValue: 10,
      serviceChargeAmount: 100,
      tipAmount: 150,
      payableAmount: 1400,
      taxAmount: 0,
      deliveryFee: 150,
      discountAmount: 0,
      totalAmount: 1400,
      chargeBreakdown: {
        taxes: [{ code: "STANDARD", label: "Standard tax", percentage: 19, amount: 190 }],
        serviceCharges: [{ code: "SERVICE", label: "Service charge", percentage: 10, amount: 100 }],
        totalTaxAmount: 190,
        totalServiceChargeAmount: 100,
      },
    });
  });
});
