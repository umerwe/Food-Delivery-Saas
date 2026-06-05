import { beforeEach, describe, expect, it, vi } from "vitest";

import { checkoutCustomerCart, normalizeCheckoutPayload } from "./checkout";

const postCheckoutMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/domain-api", () => ({
  createDomainApiService: () => ({
    get: vi.fn(),
    post: postCheckoutMock,
    patch: vi.fn(),
    del: vi.fn(),
  }),
}));

describe("checkout service", () => {
  beforeEach(() => {
    postCheckoutMock.mockReset();
  });

  it("sends scheduledDeliveryAt in checkout payload", async () => {
    postCheckoutMock.mockResolvedValue({ success: true });

    await checkoutCustomerCart({
      customerId: "customer-1",
      payload: {
        scheduledDeliveryAt: "2026-06-10T19:30:00.000Z",
        paymentMethod: "COD",
      },
    });

    expect(postCheckoutMock).toHaveBeenCalledWith(
      "/v1/cart/checkout?customerId=customer-1",
      {
        scheduledDeliveryAt: "2026-06-10T19:30:00.000Z",
        paymentMethod: "COD",
      },
      undefined
    );
    expect(postCheckoutMock.mock.calls[0][0]).not.toContain("/api/v1");
  });

  it("sends tipAmount in checkout payload", async () => {
    postCheckoutMock.mockResolvedValue({ success: true });

    await checkoutCustomerCart({
      customerId: "customer-1",
      payload: {
        paymentMethod: "COD",
        tipAmount: 150,
      },
    });

    expect(postCheckoutMock).toHaveBeenCalledWith(
      "/v1/cart/checkout?customerId=customer-1",
      {
        paymentMethod: "COD",
        tipAmount: 150,
      },
      undefined
    );
    expect(postCheckoutMock.mock.calls[0][0]).not.toContain("/api/v1");
  });

  it("does not require scheduledDeliveryAt for immediate checkout", () => {
    expect(
      normalizeCheckoutPayload({
        paymentMethod: "COD",
        customerNote: "",
      })
    ).toEqual({
      paymentMethod: "COD",
      customerNote: "",
    });
  });

  it("maps legacy orderTime to scheduledDeliveryAt", () => {
    expect(
      normalizeCheckoutPayload({
        orderTime: "2026-06-10T19:30:00.000Z",
        paymentMethod: "COD",
      })
    ).toEqual({
      scheduledDeliveryAt: "2026-06-10T19:30:00.000Z",
      paymentMethod: "COD",
    });
  });
});
