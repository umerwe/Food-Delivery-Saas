import { beforeEach, describe, expect, it, vi } from "vitest";

import { checkoutCustomerCart, normalizeCheckoutPayload, normalizeCheckoutPaymentMethod } from "./checkout";

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

  it("sends orderTime in checkout payload when scheduledDeliveryAt is provided", async () => {
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
        orderTime: "2026-06-10T19:30:00.000Z",
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

  it("sends loyaltyPoints in cart checkout payload", async () => {
    postCheckoutMock.mockResolvedValue({ success: true });

    await checkoutCustomerCart({
      customerId: "customer-1",
      payload: {
        paymentMethod: "COD",
        loyaltyPoints: 100,
      },
    });

    expect(postCheckoutMock).toHaveBeenCalledWith(
      "/v1/cart/checkout?customerId=customer-1",
      {
        paymentMethod: "COD",
        loyaltyPoints: 100,
      },
      undefined
    );
  });

  it("normalizes supported checkout payment methods", () => {
    expect(normalizeCheckoutPaymentMethod("cod")).toBe("COD");
    expect(normalizeCheckoutPaymentMethod("paypal")).toBe("PAYPAL");
    expect(normalizeCheckoutPaymentMethod("stripe")).toBe("STRIPE");
    expect(normalizeCheckoutPaymentMethod("wallet")).toBe("WALLET");
    expect(normalizeCheckoutPaymentMethod("card")).toBe("STRIPE");
    expect(normalizeCheckoutPaymentMethod("CARD_ON_DELIVERY")).toBe("STRIPE");
  });

  it("sends wallet as a checkout payment method", async () => {
    postCheckoutMock.mockResolvedValue({ success: true });

    await checkoutCustomerCart({
      customerId: "customer-1",
      payload: {
        paymentMethod: "wallet",
      },
    });

    expect(postCheckoutMock).toHaveBeenCalledWith(
      "/v1/cart/checkout?customerId=customer-1",
      {
        paymentMethod: "WALLET",
      },
      undefined
    );
  });

  it("does not send legacy card on delivery in cart checkout payload", async () => {
    postCheckoutMock.mockResolvedValue({ success: true });

    await checkoutCustomerCart({
      customerId: "customer-1",
      payload: {
        paymentMethod: "CARD_ON_DELIVERY",
      },
    });

    expect(postCheckoutMock).toHaveBeenCalledWith(
      "/v1/cart/checkout?customerId=customer-1",
      {
        paymentMethod: "STRIPE",
      },
      undefined
    );
  });

  it("does not send orderType in cart checkout payload", async () => {
    postCheckoutMock.mockResolvedValue({ success: true });

    await checkoutCustomerCart({
      customerId: "customer-1",
      payload: {
        paymentMethod: "COD",
        orderType: "TAKEAWAY",
      },
    });

    expect(postCheckoutMock).toHaveBeenCalledWith(
      "/v1/cart/checkout?customerId=customer-1",
      {
        paymentMethod: "COD",
      },
      undefined
    );
    expect(postCheckoutMock.mock.calls[0][1]).not.toHaveProperty("orderType");
  });

  it("sends guest contact and inline guest delivery address in checkout payload", async () => {
    postCheckoutMock.mockResolvedValue({ success: true });

    await checkoutCustomerCart({
      customerId: "guest-1",
      payload: {
        paymentMethod: "COD",
        guestContact: {
          email: "guest@example.com",
          phone: "+923001234567",
          privacyPolicyAccepted: true,
        },
        guestDeliveryAddress: {
          street: "Street 12",
          area: "DHA",
          postalCode: "54000",
          city: "Lahore",
          state: "Punjab",
          country: "Pakistan",
          lat: "31.5204",
          lng: "74.3587",
        },
      },
    });

    expect(postCheckoutMock).toHaveBeenCalledWith(
      "/v1/cart/checkout?customerId=guest-1",
      {
        paymentMethod: "COD",
        guestContact: {
          email: "guest@example.com",
          phone: "+923001234567",
          privacyPolicyAccepted: true,
        },
        guestDeliveryAddress: {
          street: "Street 12",
          area: "DHA",
          postalCode: "54000",
          city: "Lahore",
          state: "Punjab",
          country: "Pakistan",
          lat: "31.5204",
          lng: "74.3587",
        },
      },
      undefined
    );
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

  it("keeps orderTime in checkout payload", () => {
    expect(
      normalizeCheckoutPayload({
        orderTime: "2026-06-10T19:30:00.000Z",
        paymentMethod: "COD",
      })
    ).toEqual({
      orderTime: "2026-06-10T19:30:00.000Z",
      paymentMethod: "COD",
    });
  });
});
