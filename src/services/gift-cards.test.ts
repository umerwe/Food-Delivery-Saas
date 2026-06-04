import { describe, expect, it, vi, beforeEach } from "vitest";

import { redeemGiftCard } from "./gift-cards";
import { normalizeGiftCardRedeemResponse } from "@/types/gift-cards";

const httpClientPostMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/axios", () => ({
  httpClient: {
    post: httpClientPostMock,
  },
}));

describe("redeemGiftCard", () => {
  beforeEach(() => {
    httpClientPostMock.mockReset();
  });

  it("calls customer gift card redeem endpoint without api v1 duplication", async () => {
    httpClientPostMock.mockResolvedValue({
      data: {
        success: true,
        data: {
          customerId: "customer-1",
          giftCardId: "gift-card-1",
          code: "GIFT-ABCD1234",
          walletTransactionId: "wallet-tx-1",
          creditedAmount: 1000,
          walletBalance: 1500,
          currency: "PKR",
        },
      },
    });

    await redeemGiftCard({ code: "gift-abcd1234" });

    const endpoint = httpClientPostMock.mock.calls[0][0];
    expect(endpoint).toBe("/customer-app/gift-cards/redeem");
    expect(endpoint).not.toContain("/api/v1");
  });

  it("sends uppercase code and omits empty branch id", async () => {
    httpClientPostMock.mockResolvedValue({ data: { data: {} } });

    await redeemGiftCard({ code: " gift-abcd1234 ", branchId: " " });

    expect(httpClientPostMock).toHaveBeenCalledWith(
      "/customer-app/gift-cards/redeem",
      { code: "GIFT-ABCD1234" },
      { params: {} }
    );
  });

  it("passes optional customer id as query", async () => {
    httpClientPostMock.mockResolvedValue({ data: { data: {} } });

    await redeemGiftCard(
      { code: "GIFT-ABCD1234", branchId: "branch-1" },
      { customerId: "customer-1" }
    );

    expect(httpClientPostMock).toHaveBeenCalledWith(
      "/customer-app/gift-cards/redeem",
      { code: "GIFT-ABCD1234", branchId: "branch-1" },
      { params: { customerId: "customer-1" } }
    );
  });

  it("normalizes redeem response", () => {
    const response = normalizeGiftCardRedeemResponse({
      success: true,
      data: {
        customerId: "customer-123",
        giftCardId: "gift-card-id",
        code: "GIFT-ABCD1234",
        walletTransactionId: "wallet-tx-id",
        creditedAmount: "1000",
        walletBalance: 1500,
        currency: "PKR",
      },
      message: "Gift card redeemed successfully",
    });

    expect(response).toEqual({
      result: {
        customerId: "customer-123",
        giftCardId: "gift-card-id",
        code: "GIFT-ABCD1234",
        walletTransactionId: "wallet-tx-id",
        creditedAmount: 1000,
        walletBalance: 1500,
        currency: "PKR",
      },
      message: "Gift card redeemed successfully",
    });
  });
});
