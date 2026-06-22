import { describe, expect, it } from "vitest";

import { buildReorderCartPayloads, canReviewOrder, type Order } from "./orders";

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
});
