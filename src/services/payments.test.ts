import { beforeEach, describe, expect, it, vi } from "vitest";

import { createOrderPaymentAttempt } from "./payments";

const postPaymentsMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/domain-api", () => ({
  createDomainApiService: () => ({
    get: vi.fn(),
    post: postPaymentsMock,
    patch: vi.fn(),
    del: vi.fn(),
  }),
}));

describe("payments service", () => {
  beforeEach(() => {
    postPaymentsMock.mockReset();
  });

  it("starts a payment attempt for an existing order and reads paymentSession first", async () => {
    postPaymentsMock.mockResolvedValue({
      success: true,
      data: {
        id: "payment-1",
        providerData: {
          clientSecret: "provider-secret",
          publishableKey: "provider-key",
        },
      },
      paymentSession: {
        clientSecret: "session-secret",
        publishableKey: "session-key",
      },
    });

    const result = await createOrderPaymentAttempt({
      orderId: "order-1",
      payload: {
        paymentMethod: "STRIPE",
        currency: "USD",
        note: "Retry order payment",
      },
      token: "token-1",
    });

    expect(postPaymentsMock).toHaveBeenCalledWith(
      "/v1/payments/orders/order-1/attempts",
      {
        paymentMethod: "STRIPE",
        currency: "USD",
        note: "Retry order payment",
      },
      "token-1"
    );
    expect(result.clientSecret).toBe("session-secret");
    expect(result.publishableKey).toBe("session-key");
    expect(result.payment?.id).toBe("payment-1");
  });

  it("falls back to providerData when paymentSession is missing", async () => {
    postPaymentsMock.mockResolvedValue({
      success: true,
      data: {
        id: "payment-1",
        providerData: {
          clientSecret: "provider-secret",
          publishableKey: "provider-key",
        },
      },
    });

    const result = await createOrderPaymentAttempt({
      orderId: "order-1",
      payload: {
        paymentMethod: "STRIPE",
        currency: "USD",
      },
    });

    expect(result.clientSecret).toBe("provider-secret");
    expect(result.publishableKey).toBe("provider-key");
  });
});
