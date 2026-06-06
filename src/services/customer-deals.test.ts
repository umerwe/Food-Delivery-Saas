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
            dealSelectionMode: "FLEXIBLE_ITEMS",
            dealRequiredQuantity: 2,
            discountValue: 799,
            thumbnailUrl: "https://example.com/thumb.png",
            scopeMenuItems: [{ id: "item-1", name: "Burger" }],
            scopeCategories: [{ id: "cat-1", name: "Burgers" }],
          },
        ],
      },
    });

    expect(response.message).toBe("ok");
    expect(response.deals).toHaveLength(1);
    expect(response.deals[0].title).toBe("Burger Combo");
    expect(response.deals[0].dealSelectionMode).toBe("FLEXIBLE_ITEMS");
    expect(response.deals[0].dealRequiredQuantity).toBe(2);
    expect(response.deals[0].thumbnailUrl).toBe("https://example.com/thumb.png");
    expect(response.deals[0].scopeMenuItems[0].name).toBe("Burger");
    expect(response.deals[0].scopeCategories[0].name).toBe("Burgers");
  });

  it("handles direct array response", () => {
    const response = normalizeCustomerDealsResponse([
      { id: "deal-1", discountValue: 799 },
    ]);

    expect(response.deals).toHaveLength(1);
    expect(response.deals[0].title).toBe("Deal");
    expect(response.deals[0].dealSelectionMode).toBe("FIXED_ITEMS");
    expect(response.deals[0].dealRequiredQuantity).toBeNull();
    expect(response.deals[0].discountValue).toBe(799);
  });

  it("normalizes old scoped item response as fixed items", () => {
    const response = normalizeCustomerDealsResponse([
      {
        id: "legacy-deal",
        applyMode: "SCOPED_ITEMS",
        discountType: "FIXED_PRICE",
        discountValue: 20,
        scopeMenuItems: [
          { id: "item-1", name: "Burger", slug: "burger" },
          { id: "item-2", name: "Drink" },
        ],
        scopeCategories: [],
      },
    ]);

    expect(response.deals[0].dealSelectionMode).toBe("FIXED_ITEMS");
    expect(response.deals[0].dealRequiredQuantity).toBeNull();
  });

  it("normalizes flexible item response with required quantity", () => {
    const response = normalizeCustomerDealsResponse([
      {
        id: "flexible-items",
        dealSelectionMode: "FLEXIBLE_ITEMS",
        dealRequiredQuantity: 2,
        discountValue: 20,
        scopeMenuItems: [
          { id: "item-1", name: "Burger", slug: "burger" },
          { id: "item-2", name: "Drink" },
          {
            id: "item-3",
            name: "Fries",
            description: "Crispy fries",
            basePrice: 20,
            category: { id: "cat-1", name: "Sides", imageUrl: null },
          },
        ],
      },
    ]);

    expect(response.deals[0].dealSelectionMode).toBe("FLEXIBLE_ITEMS");
    expect(response.deals[0].dealRequiredQuantity).toBe(2);
    expect(response.deals[0].scopeMenuItems).toHaveLength(3);
    expect(response.deals[0].scopeMenuItems[0].slug).toBe("burger");
    expect(response.deals[0].scopeMenuItems[0].variations).toEqual([]);
    expect(response.deals[0].scopeMenuItems[0].modifierGroups).toEqual([]);
    expect(response.deals[0].scopeMenuItems[0].modifiers).toEqual([]);
    expect(response.deals[0].scopeMenuItems[0].modifierLinks).toEqual([]);
    expect(response.deals[0].scopeMenuItems[2].description).toBe("Crispy fries");
    expect(response.deals[0].scopeMenuItems[2].category?.name).toBe("Sides");
  });

  it("normalizes deal item customization fields", () => {
    const response = normalizeCustomerDealsResponse([
      {
        id: "customizable-deal",
        dealSelectionMode: "FLEXIBLE_ITEMS",
        dealRequiredQuantity: 1,
        discountValue: 20,
        scopeMenuItems: [
          {
            id: "item-1",
            name: "Burger",
            variations: [{ id: "large" }],
            modifierGroups: [{ id: "sauces" }],
            modifiers: [{ id: "extra-cheese" }],
            modifierLinks: [{ id: "link-1" }],
            hasConfigurableOptions: true,
          },
        ],
      },
    ]);

    expect(response.deals[0].scopeMenuItems[0].variations).toHaveLength(1);
    expect(response.deals[0].scopeMenuItems[0].modifierGroups).toHaveLength(1);
    expect(response.deals[0].scopeMenuItems[0].modifiers).toHaveLength(1);
    expect(response.deals[0].scopeMenuItems[0].modifierLinks).toHaveLength(1);
    expect(response.deals[0].scopeMenuItems[0].hasConfigurableOptions).toBe(true);
  });

  it("normalizes category ids into minimal category records", () => {
    const response = normalizeCustomerDealsResponse([
      {
        id: "category-deal",
        dealSelectionMode: "FLEXIBLE_ITEMS",
        dealRequiredQuantity: 3,
        discountValue: 20,
        scopeCategoryIds: ["cat-1", "cat-2"],
      },
    ]);

    expect(response.deals[0].scopeCategoryIds).toEqual(["cat-1", "cat-2"]);
    expect(response.deals[0].scopeCategories).toEqual([
      { id: "cat-1", name: "Category" },
      { id: "cat-2", name: "Category" },
    ]);
  });

  it("handles missing data safely", () => {
    const response = normalizeCustomerDealsResponse({ success: true, data: {} });

    expect(response.deals).toEqual([]);
  });
});
