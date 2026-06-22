import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCustomerCoupons } from "./customer-coupons";
import { normalizeCustomerCouponsResponse } from "@/types/customer-coupons";

const httpClientGetMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/axios", () => ({
  httpClient: {
    get: httpClientGetMock,
  },
}));

describe("getCustomerCoupons", () => {
  beforeEach(() => {
    httpClientGetMock.mockReset();
  });

  it("calls customer coupons endpoint with present params", async () => {
    httpClientGetMock.mockResolvedValue({
      data: { data: [{ id: "coupon-1", code: "TASTE20", discountValue: 20 }] },
    });

    await getCustomerCoupons({
      restaurantId: "rest-1",
      branchId: "branch-1",
    });

    expect(httpClientGetMock).toHaveBeenCalledWith("/customer-app/coupons", {
      params: {
        restaurantId: "rest-1",
        branchId: "branch-1",
      },
    });
  });

  it("removes empty params", async () => {
    httpClientGetMock.mockResolvedValue({ data: [] });

    await getCustomerCoupons({
      restaurantId: "",
      branchId: null,
    });

    expect(httpClientGetMock).toHaveBeenCalledWith("/customer-app/coupons", {
      params: {},
    });
  });

  it("does not duplicate api v1 in endpoint", async () => {
    httpClientGetMock.mockResolvedValue({ data: [] });

    await getCustomerCoupons({ restaurantId: "rest-1" });

    const endpoint = httpClientGetMock.mock.calls[0][0];
    expect(endpoint).toBe("/customer-app/coupons");
    expect(endpoint).not.toContain("/api/v1");
  });

  it("normalizes active manual coupon responses", () => {
    const response = normalizeCustomerCouponsResponse({
      success: true,
      message: "ok",
      data: {
        coupons: [
          {
            id: "coupon-1",
            code: "TASTE20",
            title: "Save 20%",
            description: "First online order",
            imageUrl: "https://example.com/coupon.png",
            thumbnailUrl: "https://example.com/thumb.png",
            discountType: "PERCENTAGE",
            discountValue: "20",
            maxDiscountAmount: "15",
            minOrderAmount: "25",
            maxUses: 100,
            maxUsesPerCustomer: 1,
            usedCount: 12,
            startsAt: "2020-01-01T00:00:00.000Z",
            expiresAt: "2099-12-31T23:59:59.000Z",
            restaurant: { id: "rest-1", name: "Restaurant" },
            branch: { id: "branch-1", name: "Branch" },
          },
        ],
      },
    });

    expect(response.message).toBe("ok");
    expect(response.coupons).toHaveLength(1);
    expect(response.coupons[0]).toMatchObject({
      id: "coupon-1",
      code: "TASTE20",
      title: "Save 20%",
      discountType: "PERCENTAGE",
      discountValue: 20,
      maxDiscountAmount: 15,
      minOrderAmount: 25,
      maxUses: 100,
      maxUsesPerCustomer: 1,
      usedCount: 12,
      restaurant: { id: "rest-1", name: "Restaurant" },
      branch: { id: "branch-1", name: "Branch" },
    });
  });

  it("hides expired auto apply fixed price and exhausted coupons", () => {
    const response = normalizeCustomerCouponsResponse([
      {
        id: "expired",
        code: "OLD",
        discountValue: 10,
        expiresAt: "2020-01-01T00:00:00.000Z",
      },
      {
        id: "auto",
        code: "AUTO",
        discountValue: 10,
        autoApply: true,
      },
      {
        id: "fixed",
        code: "FIXED",
        discountType: "FIXED_PRICE",
        discountValue: 10,
      },
      {
        id: "exhausted",
        code: "DONE",
        discountValue: 10,
        maxUses: 10,
        usedCount: 10,
      },
      {
        id: "active",
        code: "LIVE",
        discountValue: 10,
        maxUses: 10,
        usedCount: 9,
      },
    ]);

    expect(response.coupons.map((coupon) => coupon.code)).toEqual(["LIVE"]);
  });

  it("handles missing data safely", () => {
    const response = normalizeCustomerCouponsResponse({ success: true, data: {} });

    expect(response.coupons).toEqual([]);
  });
});
