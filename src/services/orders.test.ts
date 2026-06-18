import { describe, expect, it } from "vitest";

import { canReviewOrder, type Order } from "./orders";

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
