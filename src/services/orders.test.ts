import { describe, expect, it } from "vitest";

import { buildReorderCartPayloads, canReviewOrder, normalizeOrderDetail, type Order } from "./orders";

const createOrder = (order: Partial<Order>): Order => ({
  id: "order-1",
  status: "PLACED",
  orderType: "DELIVERY",
  createdAt: "2026-06-18T00:00:00.000Z",
  ...order,
});

describe("canReviewOrder", () => {
  it("allows completed delivery, takeaway, pickup, and dine-in orders", () => {
    expect(canReviewOrder(createOrder({ orderType: "DELIVERY", status: "DELIVERED" }))).toBe(true);
    expect(canReviewOrder(createOrder({ orderType: "TAKEAWAY", status: "PICKED_UP" }))).toBe(true);
    expect(canReviewOrder(createOrder({ orderType: "PICKUP", status: "PICKED_UP" }))).toBe(true);
    expect(canReviewOrder(createOrder({ orderType: "DINE_IN", status: "SERVED" }))).toBe(true);
  });

  it("blocks placed orders, unfinished orders, and orders with existing reviews", () => {
    expect(canReviewOrder(createOrder({ orderType: "DELIVERY", status: "PLACED" }))).toBe(false);
    expect(canReviewOrder(createOrder({ orderType: "TAKEAWAY", status: "PREPARING" }))).toBe(false);
    expect(
      canReviewOrder(createOrder({
        orderType: "DELIVERY",
        status: "DELIVERED",
        review: { rating: 5 },
      }))
    ).toBe(false);
  });
});

describe("buildReorderCartPayloads", () => {
  it("preserves variation and grouped modifier selections", () => {
    const payloads = buildReorderCartPayloads({
      branchId: "branch-1",
      order: createOrder({
        items: [
          {
            id: "item-1",
            menuItemId: "pizza-1",
            variationId: "large",
            quantity: 2,
            modifierSelections: [
              {
                modifierGroupId: "group-toppings",
                modifiers: [{ modifierId: "modifier-cheese", quantity: 2 }],
              },
            ],
          },
        ],
      }),
    });

    expect(payloads).toEqual([
      {
        branchId: "branch-1",
        menuItemId: "pizza-1",
        variationId: "large",
        quantity: 2,
        note: "",
        modifierSelections: [
          {
            modifierGroupId: "group-toppings",
            modifiers: [{ modifierId: "modifier-cheese", quantity: 2 }],
          },
        ],
      },
    ]);
  });

  it("falls back to flat selected modifiers when grouped selections are unavailable", () => {
    const payloads = buildReorderCartPayloads({
      branchId: "branch-1",
      order: createOrder({
        items: [
          {
            id: "item-1",
            menuItemId: "burger-1",
            quantity: 1,
            selectedModifiers: [
              { modifierId: "modifier-sauce", quantity: 1 },
              { id: "modifier-pickle", quantity: 3 },
            ],
          },
        ],
      }),
    });

    expect(payloads).toEqual([
      {
        branchId: "branch-1",
        menuItemId: "burger-1",
        quantity: 1,
        note: "",
        modifiers: [
          { modifierId: "modifier-sauce", quantity: 1 },
          { modifierId: "modifier-pickle", quantity: 3 },
        ],
      },
    ]);
  });

  it("rebuilds flexible deal included items with the parent deal id", () => {
    const payloads = buildReorderCartPayloads({
      branchId: "branch-1",
      order: createOrder({
        items: [
          {
            id: "deal-row-1",
            menuItemId: "deal-shell",
            dealId: "deal-flex",
            quantity: 1,
            includedItems: [
              {
                id: "included-1",
                menuItemId: "pizza-1",
                variationId: "large",
                quantity: 1,
                selectedModifiers: [
                  {
                    modifierGroupId: "group-toppings",
                    modifierId: "modifier-cheese",
                    quantity: 2,
                  },
                ],
              },
            ],
          },
        ],
      }),
    });

    expect(payloads).toEqual([
      {
        branchId: "branch-1",
        menuItemId: "pizza-1",
        dealId: "deal-flex",
        variationId: "large",
        quantity: 1,
        note: "",
        modifierSelections: [
          {
            modifierGroupId: "group-toppings",
            modifiers: [{ modifierId: "modifier-cheese", quantity: 2 }],
          },
        ],
      },
    ]);
  });

  it("preserves deal snapshot sections for reorder fallback payloads", () => {
    const payloads = buildReorderCartPayloads({
      branchId: "branch-1",
      order: createOrder({
        items: [
          {
            id: "item-1",
            menuItemId: "pizza-1",
            dealId: "deal-1",
            quantity: 1,
            snapshotSections: [{ sectionId: "left", menuItemId: "half-1" }],
          },
        ],
      }),
    });

    expect(payloads).toEqual([
      {
        branchId: "branch-1",
        menuItemId: "pizza-1",
        dealId: "deal-1",
        quantity: 1,
        note: "",
        sections: [{ sectionId: "left", menuItemId: "half-1" }],
      },
    ]);
  });
});

describe("normalizeOrderDetail", () => {
  it("normalizes structured pricing, payment, fulfillment, and item fields", () => {
    const order = normalizeOrderDetail({
      id: "order-1",
      displayId: "DW-10245",
      orderType: "DELIVERY",
      status: "PLACED",
      paymentStatus: "PENDING",
      paymentMethod: "PAYPAL",
      createdAt: "2026-06-24T11:12:05.602Z",
      pricing: {
        currency: "EUR",
        subtotal: 38,
        deliveryFee: 2,
        tipAmount: 23,
        totalAmount: 63,
        payableAmount: 63,
        remainingAmount: 63,
        breakdown: [
          { key: "subtotal", label: "Items subtotal", amount: 38 },
          { key: "deliveryFee", label: "Delivery fee", amount: 2 },
          { key: "tip", label: "Tip", amount: 23 },
          { key: "total", label: "Total", amount: 63 },
        ],
      },
      payment: {
        selectedMethod: "PAYPAL",
        status: "PENDING",
        transactions: [
          {
            id: "txn-1",
            paymentMethod: "PAYPAL",
            type: "CHARGE",
            status: "PENDING",
            amount: "63",
            currency: "EUR",
          },
        ],
      },
      fulfillment: {
        type: "DELIVERY",
        deliveryAddress: {
          street: "Main Street",
          houseNumber: "12",
          city: "Berlin",
          postalCode: "10115",
        },
      },
      items: [
        {
          id: "item-1",
          menuItemId: "menu-1",
          name: "Margherita pizza",
          variationName: "Small",
          quantity: 1,
          unitPrice: 34,
          lineTotal: 38,
          modifiers: [{ modifierId: "extra-patty", quantity: 1 }],
          category: { name: "Pizza" },
        },
      ],
    });

    expect(order?.displayId).toBe("DW-10245");
    expect(order?.pricing?.tipAmount).toBe(23);
    expect(order?.pricing?.breakdown?.some((line) => line.key === "tip" && line.amount === 23)).toBe(true);
    expect(order?.paymentMethod).toBe("PAYPAL");
    expect(order?.transactions?.[0]?.currency).toBe("EUR");
    expect(order?.deliveryAddress?.street).toBe("Main Street");
    expect(order?.deliveryAddress?.houseNumber).toBe("12");
    expect(order?.items?.[0]?.menuItemName).toBe("Margherita pizza");
    expect(order?.items?.[0]?.variationName).toBe("Small");
  });

  it("preserves deal coupon metadata and item count for order details", () => {
    const order = normalizeOrderDetail({
      id: "order-1",
      status: "PLACED",
      createdAt: "2026-07-06T12:34:22.085Z",
      itemCount: 3,
      couponId: "coupon-1",
      coupon: {
        id: "coupon-1",
        code: "DEAL-A7165991",
        title: "222. Single Angebot",
      },
      items: [
        {
          id: "item-1",
          menuItemName: "4. Pizza Tuna",
          quantity: 1,
          unitPrice: 15,
          lineTotal: 15,
        },
      ],
    });

    expect(order?.itemCount).toBe(3);
    expect(order?.couponId).toBe("coupon-1");
    expect(order?.coupon).toEqual({
      id: "coupon-1",
      code: "DEAL-A7165991",
      title: "222. Single Angebot",
    });
  });

  it("keeps legacy flat tip fields available for order details", () => {
    const order = normalizeOrderDetail({
      id: "order-1",
      status: "PLACED",
      createdAt: "2026-06-24T11:12:05.602Z",
      subtotal: "38",
      deliveryFee: "2",
      tipAmount: "23",
      totalAmount: "63",
      transactions: [{ id: "txn-1", amount: "63", currency: "EUR" }],
    });

    expect(order?.tipAmount).toBe("23");
    expect(order?.pricing?.tipAmount).toBe("23");
    expect(order?.pricing?.totalAmount).toBe("63");
  });

  it("normalizes grouped display items for deal-aware order details", () => {
    const order = normalizeOrderDetail({
      id: "order-1",
      status: "PLACED",
      createdAt: "2026-07-08T09:00:00.000Z",
      displayItems: [
        {
          type: "DEAL",
          dealId: "deal-1",
          items: [
            {
              id: "deal-item-1",
              menuItemName: "Burger Deal",
              quantity: 1,
              snapshotModifiers: [{ name: "Cheese", quantity: 1 }],
            },
          ],
        },
        {
          type: "ITEM",
          id: "item-2",
          dealId: null,
          menuItemName: "Fries",
          quantity: 1,
        },
      ],
    });

    expect(order?.displayItems?.[0]?.type).toBe("DEAL");
    expect(order?.displayItems?.[0]?.dealId).toBe("deal-1");
    expect(order?.displayItems?.[0]?.items?.[0]?.menuItemName).toBe("Burger Deal");
    expect(order?.displayItems?.[0]?.items?.[0]?.snapshotModifiers).toEqual([
      { name: "Cheese", quantity: 1 },
    ]);
    expect(order?.displayItems?.[1]?.menuItemName).toBe("Fries");
  });
});
