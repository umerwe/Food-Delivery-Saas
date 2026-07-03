import { describe, expect, it } from "vitest";

import { isPaymentPendingStripeOrder, isPlacedPaidOrder } from "./payment-state";

describe("order payment state", () => {
  it("treats PAYMENT_PENDING Stripe orders as not placed", () => {
    const order = { paymentMethod: "STRIPE", paymentStatus: "PENDING", status: "PAYMENT_PENDING" };

    expect(isPaymentPendingStripeOrder(order)).toBe(true);
    expect(isPlacedPaidOrder(order)).toBe(false);
  });

  it("requires Stripe orders to be PLACED and PAID before placed UI", () => {
    expect(isPlacedPaidOrder({ paymentMethod: "STRIPE", paymentStatus: "PAID", status: "PAYMENT_PENDING" })).toBe(false);
    expect(isPlacedPaidOrder({ paymentMethod: "STRIPE", paymentStatus: "PENDING", status: "PLACED" })).toBe(false);
    expect(isPlacedPaidOrder({ paymentMethod: "STRIPE", paymentStatus: "PAID", status: "PLACED" })).toBe(true);
  });

  it("keeps non-Stripe placed semantics unchanged", () => {
    expect(isPlacedPaidOrder({ paymentMethod: "COD", paymentStatus: "PENDING", status: "PLACED" })).toBe(true);
  });
});
