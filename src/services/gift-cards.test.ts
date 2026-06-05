import { beforeEach, describe, expect, it, vi } from "vitest";

import { normalizeGiftCardPurchaseResponse, normalizeGiftCardRedeemResponse } from "@/types/gift-cards";

import { purchaseGiftCard, redeemGiftCard } from "./gift-cards";

const httpClientPostMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/axios", () => ({
  httpClient: {
    post: httpClientPostMock,
  },
}));

describe("gift card service", () => {
  beforeEach(() => {
    httpClientPostMock.mockReset();
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
});
