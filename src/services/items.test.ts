import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchMenuItemDetailsByIds,
  fetchMenuItemsPage,
  fetchSplitPizzaMenuItems,
} from "./items";

const getItemsMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/domain-api", () => ({
  createDomainApiService: () => ({
    get: getItemsMock,
    post: vi.fn(),
    patch: vi.fn(),
    del: vi.fn(),
  }),
}));

describe("fetchMenuItemDetailsByIds", () => {
  beforeEach(() => {
    getItemsMock.mockReset();
  });

  it("falls back to scoped item slug when id search does not return the item", async () => {
    getItemsMock
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({
        data: [
          {
            id: "pizza-id",
            slug: "pizza-tse",
            name: "Pizza Tse",
            modifierGroups: [{ id: "group-1", minSelect: 1 }],
          },
        ],
      });

    const details = await fetchMenuItemDetailsByIds({
      itemIds: ["pizza-id"],
      itemSearchTermsById: {
        "pizza-id": ["pizza-tse", "Pizza Tse"],
      },
      token: "token-1",
    });

    expect(getItemsMock).toHaveBeenNthCalledWith(
      1,
      "/v1/menu/items?search=pizza-id",
      "token-1"
    );
    expect(getItemsMock).toHaveBeenNthCalledWith(
      2,
      "/v1/menu/items?search=pizza-tse",
      "token-1"
    );
    expect(details["pizza-id"]?.modifierGroups).toEqual([
      { id: "group-1", minSelect: 1 },
    ]);
  });

  it("falls back to scoped item name when id and slug searches miss", async () => {
    getItemsMock
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({
        data: [{ id: "simple-id", name: "No Add-Ons", modifiers: [] }],
      });

    const details = await fetchMenuItemDetailsByIds({
      itemIds: ["simple-id"],
      itemSearchTermsById: {
        "simple-id": ["no-add-ons", "No Add-Ons"],
      },
    });

    expect(getItemsMock).toHaveBeenNthCalledWith(
      3,
      "/v1/menu/items?search=No+Add-Ons",
      undefined
    );
    expect(details["simple-id"]?.name).toBe("No Add-Ons");
  });

  it("passes branchId through every fallback item details search", async () => {
    getItemsMock
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [{ id: "pizza-id", slug: "pizza-tse" }] });

    await fetchMenuItemDetailsByIds({
      itemIds: ["pizza-id"],
      itemSearchTermsById: { "pizza-id": ["pizza-tse"] },
      branchId: "branch-1",
      token: "token-1",
    });

    expect(getItemsMock).toHaveBeenNthCalledWith(
      1,
      "/v1/menu/items?search=pizza-id&branchId=branch-1",
      "token-1"
    );
    expect(getItemsMock).toHaveBeenNthCalledWith(
      2,
      "/v1/menu/items?search=pizza-tse&branchId=branch-1",
      "token-1"
    );
  });

  it("passes branchId when fetching paginated menu items", async () => {
    getItemsMock.mockResolvedValueOnce({ data: [], meta: { page: 1 } });

    await fetchMenuItemsPage({
      restaurantId: "restaurant-1",
      branchId: "branch-1",
      categoryId: "category-1",
      page: 2,
      limit: 12,
      token: "token-1",
    });

    expect(getItemsMock).toHaveBeenCalledWith(
      "/v1/menu/items?restaurantId=restaurant-1&page=2&limit=12&sortBy=sortOrder&sortOrder=ASC&categoryId=category-1&branchId=branch-1",
      "token-1"
    );
  });

  it("passes branchId when fetching split-pizza menu items", async () => {
    getItemsMock.mockResolvedValueOnce({ data: [], meta: { page: 1 } });

    await fetchSplitPizzaMenuItems({
      restaurantId: "restaurant-1",
      branchId: "branch-1",
      search: "pizza",
      page: 3,
      token: "token-1",
    });

    expect(getItemsMock).toHaveBeenCalledWith(
      "/v1/menu/items?page=3&supportsSplitPizza=true&restaurantId=restaurant-1&branchId=branch-1&search=pizza",
      "token-1"
    );
  });
});
