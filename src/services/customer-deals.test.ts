import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCustomerDeals } from "./customer-deals";
import { normalizeCustomerDealsResponse } from "@/types/customer-deals";

const httpClientGetMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/axios", () => ({
  httpClient: {
    get: httpClientGetMock,
  },
}));

describe("getCustomerDeals", () => {
  beforeEach(() => {
    httpClientGetMock.mockReset();
  });

  it("calls customer deals endpoint with present params", async () => {
    httpClientGetMock.mockResolvedValue({
      data: { data: [{ id: "deal-1", title: "Combo", discountValue: 799 }] },
    });

    await getCustomerDeals({
      restaurantId: "rest-1",
      branchId: "branch-1",
      limit: 10,
    });

    expect(httpClientGetMock).toHaveBeenCalledWith("/customer-app/deals", {
      params: {
        restaurantId: "rest-1",
        branchId: "branch-1",
        limit: 10,
      },
    });
  });

  it("removes empty params and defaults limit", async () => {
    httpClientGetMock.mockResolvedValue({ data: [] });

    await getCustomerDeals({
      restaurantId: "",
      branchId: null,
    });

    expect(httpClientGetMock).toHaveBeenCalledWith("/customer-app/deals", {
      params: {
        limit: 20,
      },
    });
  });

  it("does not duplicate api v1 in endpoint", async () => {
    httpClientGetMock.mockResolvedValue({ data: [] });

    await getCustomerDeals({ restaurantId: "rest-1" });

    const endpoint = httpClientGetMock.mock.calls[0][0];
    expect(endpoint).toBe("/customer-app/deals");
    expect(endpoint).not.toContain("/api/v1");
  });

  it("normalizes envelope response", () => {
    const response = normalizeCustomerDealsResponse({
      success: true,
      message: "ok",
      data: {
        deals: [
          {
            id: "deal-1",
            title: "Burger Combo",
            discountValue: 799,
            scopeMenuItems: [{ id: "item-1", name: "Burger" }],
          },
        ],
      },
    });

    expect(response.message).toBe("ok");
    expect(response.deals).toHaveLength(1);
    expect(response.deals[0].title).toBe("Burger Combo");
    expect(response.deals[0].scopeMenuItems[0].name).toBe("Burger");
  });

  it("handles direct array response", () => {
    const response = normalizeCustomerDealsResponse([
      { id: "deal-1", discountValue: 799 },
    ]);

    expect(response.deals).toHaveLength(1);
    expect(response.deals[0].title).toBe("Deal");
    expect(response.deals[0].discountValue).toBe(799);
  });

  it("handles missing data safely", () => {
    const response = normalizeCustomerDealsResponse({ success: true, data: {} });

    expect(response.deals).toEqual([]);
  });
});
