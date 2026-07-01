import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchSignatureSplitPizzaItems } from "./menu";

const getMenuMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/domain-api", () => ({
  createDomainApiService: () => ({
    get: getMenuMock,
    post: vi.fn(),
    patch: vi.fn(),
    del: vi.fn(),
  }),
}));

describe("fetchSignatureSplitPizzaItems", () => {
  beforeEach(() => {
    getMenuMock.mockReset();
  });

  it("passes branchId so branch-scoped happy hour metadata resolves", async () => {
    getMenuMock.mockResolvedValueOnce({ data: [], meta: { page: 1 } });

    await fetchSignatureSplitPizzaItems({
      restaurantId: "restaurant-1",
      branchId: "branch-1",
      search: "pizza",
      page: 2,
      token: "token-1",
    });

    expect(getMenuMock).toHaveBeenCalledWith(
      "/v1/menu/items?page=2&supportsSplitPizza=true&restaurantId=restaurant-1&branchId=branch-1&search=pizza",
      "token-1"
    );
  });
});
