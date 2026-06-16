import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  normalizeGiftCardAvailabilityResponse,
  normalizeGiftCardGuestPurchaseResponse,
  normalizeGiftCardPurchaseResponse,
  normalizeGiftCardRedeemResponse,
} from "@/types/gift-cards";

import { getAvailableGiftCards, guestPurchaseGiftCard, purchaseGiftCard, redeemGiftCard } from "./gift-cards";

const httpClientPostMock = vi.hoisted(() => vi.fn());
const publicClientGetMock = vi.hoisted(() => vi.fn());
const publicClientPostMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/axios", () => ({
  API_BASE_URL: "https://api.example.com/api/v1",
  httpClient: {
    post: httpClientPostMock,
  },
}));

vi.mock("axios", () => ({
  default: {
    create: () => ({
      get: publicClientGetMock,
      post: publicClientPostMock,
    }),
  },
}));

describe("gift card service", () => {
  beforeEach(() => {
    httpClientPostMock.mockReset();
    publicClientGetMock.mockReset();
    publicClientPostMock.mockReset();
  });

  it("purchase calls customer gift card purchase endpoint without api v1 duplication", async () => {
    httpClientPostMock.mockResolvedValue({
      data: {
        data: {
          code: "GIFT-ABCDEFGHIJ",
          qrPayload: "DWGC:GIFT-ABCDEFGHIJ",
          amount: 1000,
          walletBalance: 500,
        },
      },
    });

    await purchaseGiftCard({ amount: 1000 });

    const endpoint = httpClientPostMock.mock.calls[0][0];
    expect(endpoint).toBe("/customer-app/gift-cards/purchase");
    expect(endpoint).not.toContain("/api/v1");
  });

  it("purchase sends amount title message and expiresAt", async () => {
    httpClientPostMock.mockResolvedValue({ data: { data: {} } });

    await purchaseGiftCard({
      amount: 1000,
      title: " Birthday Gift Card ",
      message: " Enjoy your meal! ",
      expiresAt: "2027-06-05T00:00",
    });

    expect(httpClientPostMock).toHaveBeenCalledWith(
      "/customer-app/gift-cards/purchase",
      {
        amount: 1000,
        title: "Birthday Gift Card",
        message: "Enjoy your meal!",
        expiresAt: new Date("2027-06-05T00:00").toISOString(),
      }
    );
  });

  it("purchase normalizes code qrPayload amount and walletBalance", () => {
    expect(
      normalizeGiftCardPurchaseResponse({
        success: true,
        data: {
          code: "GIFT-ABCDEFGHIJ",
          qrPayload: "DWGC:GIFT-ABCDEFGHIJ",
          amount: "1000",
          walletBalance: 500,
        },
        message: "Purchased",
      })
    ).toEqual({
      result: {
        code: "GIFT-ABCDEFGHIJ",
        qrPayload: "DWGC:GIFT-ABCDEFGHIJ",
        amount: 1000,
        walletBalance: 500,
      },
      message: "Purchased",
    });
  });

  it("redeem calls customer gift card redeem endpoint", async () => {
    httpClientPostMock.mockResolvedValue({
      data: {
        data: {
          code: "GIFT-ABCDEFGHIJ",
          creditedAmount: 1000,
          walletBalance: 1500,
        },
      },
    });

    await redeemGiftCard({ code: "gift-abcdefghij" });

    const endpoint = httpClientPostMock.mock.calls[0][0];
    expect(endpoint).toBe("/customer-app/gift-cards/redeem");
    expect(endpoint).not.toContain("/api/v1");
  });

  it("redeem sends uppercase normal code only", async () => {
    httpClientPostMock.mockResolvedValue({ data: { data: {} } });

    await redeemGiftCard({ code: " gift-abcdefghij " });

    expect(httpClientPostMock).toHaveBeenCalledWith(
      "/customer-app/gift-cards/redeem",
      { code: "GIFT-ABCDEFGHIJ" },
      { params: {} }
    );
  });

  it("redeem sends uppercase QR payload", async () => {
    httpClientPostMock.mockResolvedValue({ data: { data: {} } });

    await redeemGiftCard({ code: " dwgc:gift-abcdefghij " });

    expect(httpClientPostMock).toHaveBeenCalledWith(
      "/customer-app/gift-cards/redeem",
      { code: "DWGC:GIFT-ABCDEFGHIJ" },
      { params: {} }
    );
  });

  it("redeem normalizes creditedAmount and walletBalance", () => {
    expect(
      normalizeGiftCardRedeemResponse({
        success: true,
        data: {
          customerId: "customer-123",
          giftCardId: "gift-card-id",
          code: "GIFT-ABCDEFGHIJ",
          walletTransactionId: "wallet-tx-id",
          creditedAmount: "1000",
          walletBalance: 1500,
          currency: "PKR",
        },
        message: "Gift card redeemed successfully",
      })
    ).toEqual({
      result: {
        customerId: "customer-123",
        giftCardId: "gift-card-id",
        code: "GIFT-ABCDEFGHIJ",
        walletTransactionId: "wallet-tx-id",
        creditedAmount: 1000,
        walletBalance: 1500,
        currency: "PKR",
      },
      message: "Gift card redeemed successfully",
    });
  });

  it("available gift cards calls public endpoint with restaurant and branch", async () => {
    publicClientGetMock.mockResolvedValue({
      data: {
        data: {
          isEnabled: true,
          items: [{ id: "gift-card-1", title: "Dinner", amount: 2500 }],
        },
      },
    });

    const response = await getAvailableGiftCards({
      restaurantId: "restaurant-1",
      branchId: "branch-1",
    });

    expect(publicClientGetMock).toHaveBeenCalledWith(
      "/customer-app/gift-cards/available",
      { params: { restaurantId: "restaurant-1", branchId: "branch-1" } }
    );
    expect(response.items[0].amount).toBe(2500);
  });

  it("guest purchase calls public Stripe endpoint without wallet endpoint", async () => {
    publicClientPostMock.mockResolvedValue({
      data: {
        data: {
          transaction: { id: "txn-1" },
          paymentSession: {
            provider: "stripe",
            clientSecret: "secret",
            publishableKey: "pk_test",
            paymentIntentId: "pi_1",
          },
        },
      },
    });

    await guestPurchaseGiftCard(
      {
        amount: 2500,
        buyerEmail: "buyer@example.com",
        buyerName: " Buyer ",
        branchId: "branch-1",
        title: " Dinner ",
        message: " Enjoy ",
        currency: "USD",
      },
      {
        restaurantId: "restaurant-1",
        branchId: "branch-1",
      }
    );

    expect(publicClientPostMock).toHaveBeenCalledWith(
      "/customer-app/gift-cards/guest-purchase",
      {
        amount: 2500,
        buyerEmail: "buyer@example.com",
        buyerName: "Buyer",
        branchId: "branch-1",
        title: "Dinner",
        message: "Enjoy",
        currency: "USD",
      },
      { params: { restaurantId: "restaurant-1", branchId: "branch-1" } }
    );
    expect(httpClientPostMock).not.toHaveBeenCalled();
  });

  it("normalizes disabled availability and guest payment session", () => {
    expect(normalizeGiftCardAvailabilityResponse({
      data: { isEnabled: false, items: [] },
    })).toEqual({ isEnabled: false, items: [] });

    expect(normalizeGiftCardGuestPurchaseResponse({
      data: {
        transaction: { id: "txn-1" },
        paymentSession: {
          provider: "stripe",
          clientSecret: "secret",
          publishableKey: "pk_test",
          paymentIntentId: "pi_1",
        },
      },
      message: "Created",
    })).toEqual({
      data: {
        transaction: { id: "txn-1" },
        paymentSession: {
          provider: "stripe",
          clientSecret: "secret",
          publishableKey: "pk_test",
          paymentIntentId: "pi_1",
        },
      },
      message: "Created",
    });
  });
});
