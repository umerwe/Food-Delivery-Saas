import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchCustomerLoyaltyPoints,
  normalizeLoyaltyRedeemResult,
  normalizeLoyaltySummary,
  redeemCustomerLoyaltyPoints,
} from "./loyalty";

const getLoyaltyMock = vi.hoisted(() => vi.fn());
const postLoyaltyMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/domain-api", () => ({
  createDomainApiService: () => ({
    get: getLoyaltyMock,
    post: postLoyaltyMock,
    patch: vi.fn(),
    del: vi.fn(),
  }),
}));

describe("loyalty service", () => {
  beforeEach(() => {
    getLoyaltyMock.mockReset();
    postLoyaltyMock.mockReset();
  });

  it("fetches customer loyalty without customerId", async () => {
    getLoyaltyMock.mockResolvedValue({
      data: {
        availablePoints: 850,
        minimumRedeemPoints: 50,
        history: [],
      },
    });

    await fetchCustomerLoyaltyPoints("token-1");

    expect(getLoyaltyMock).toHaveBeenCalledWith("/customer-app/loyalty-points", "token-1");
    expect(getLoyaltyMock.mock.calls[0][0]).not.toContain("customerId");
  });

  it("normalizes loyalty balance and history", () => {
    const loyalty = normalizeLoyaltySummary({
      data: {
        customerId: "customer-1",
        availablePoints: "850",
        redeemedPoints: 200,
        earnedPoints: 1050,
        minimumRedeemPoints: 50,
        redemptionValuePerPoint: "1",
        history: [
          {
            id: "txn-1",
            type: "EARN",
            points: 250,
            balanceAfter: 850,
            note: "Earned",
            createdAt: "2026-06-10T09:30:00.000Z",
          },
        ],
      },
    });

    expect(loyalty).toMatchObject({
      customerId: "customer-1",
      availablePoints: 850,
      redeemedPoints: 200,
      earnedPoints: 1050,
      minimumRedeemPoints: 50,
      redemptionValuePerPoint: 1,
    });
    expect(loyalty.history[0]).toMatchObject({ id: "txn-1", points: 250 });
  });

  it("redeems loyalty points to wallet", async () => {
    postLoyaltyMock.mockResolvedValue({
      data: {
        redeemedPoints: 100,
        redeemedAmount: 100,
        remainingPoints: 750,
        walletBalance: 1250,
        currency: "PKR",
      },
    });

    await redeemCustomerLoyaltyPoints({
      payload: {
        points: 100,
        target: "WALLET",
        note: "Redeemed from test",
      },
      token: "token-1",
    });

    expect(postLoyaltyMock).toHaveBeenCalledWith(
      "/customer-app/loyalty-points/redeem",
      {
        points: 100,
        target: "WALLET",
        note: "Redeemed from test",
      },
      "token-1"
    );
  });

  it("normalizes loyalty wallet redemption result", () => {
    expect(
      normalizeLoyaltyRedeemResult({
        data: {
          customerId: "customer-1",
          redeemedPoints: "100",
          redeemedAmount: "100",
          remainingPoints: "750",
          walletBalance: "1250",
          currency: "PKR",
        },
      })
    ).toMatchObject({
      customerId: "customer-1",
      redeemedPoints: 100,
      redeemedAmount: 100,
      remainingPoints: 750,
      walletBalance: 1250,
      currency: "PKR",
    });
  });
});
