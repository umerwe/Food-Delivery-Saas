import { beforeEach, describe, expect, it, vi } from "vitest";

import { getHome, getHomeCategories } from "./home";

const getRequestMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/http", () => ({
  getRequest: getRequestMock,
}));

describe("getHome", () => {
  beforeEach(() => {
    getRequestMock.mockReset();
  });

  it("calls customer-app home with only present restaurantId param", async () => {
    getRequestMock.mockResolvedValue({
      data: {
        restaurant: { name: "Demo" },
        config: { currency: "USD", branding: { theme: { primaryColor: "#111111" } } },
        giftCards: {
          isEnabled: true,
          items: [
            {
              id: "gift-card-1",
              title: "Dinner for two",
              amount: "2500",
            },
          ],
        },
        cuisines: [{ id: "c1" }],
        promotionalItems: [{ id: "p1" }],
        faqs: [{ id: "f1" }],
      },
    });

    const response = await getHome("restaurant-1", null);

    expect(getRequestMock).toHaveBeenCalledWith("/customer-app/home?restaurantId=restaurant-1");
    expect(response.data.restaurant?.name).toBe("Demo");
    expect(response.data.config?.currency).toBe("USD");
    expect(response.data.branding.primaryColor).toBe("#111111");
    expect(response.data.giftCards?.isEnabled).toBe(true);
    expect(response.data.giftCards?.items[0].amount).toBe(2500);
    expect(response.data.cuisines).toHaveLength(1);
  });

  it("passes restaurantId and branchId params only when present", async () => {
    getRequestMock.mockResolvedValue({ data: {} });

    await getHome("restaurant-1", "branch-1");
    await getHome(null, "branch-1");

    expect(getRequestMock).toHaveBeenNthCalledWith(1,
      "/customer-app/home?restaurantId=restaurant-1&branchId=branch-1"
    );
    expect(getRequestMock).toHaveBeenNthCalledWith(2, "/customer-app/home?branchId=branch-1");
  });

  it("does not duplicate api or v1 segments", async () => {
    getRequestMock.mockResolvedValue({ data: {} });

    await getHome();

    expect(getRequestMock).toHaveBeenCalledWith("/customer-app/home");
    expect(getRequestMock.mock.calls[0][0]).not.toContain("/api/v1");
  });
});

describe("getHomeCategories", () => {
  beforeEach(() => {
    getRequestMock.mockReset();
  });

  it("fetches all paginated category pages", async () => {
    getRequestMock
      .mockResolvedValueOnce({
        data: {
          data: [
            { id: "c1", name: "Pizza", imageUrl: "pizza.png" },
            { id: "c2", name: "Pasta", imageUrl: "pasta.png" },
          ],
          pagination: { page: 1, totalPages: 2 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [
            { id: "c3", name: "Dessert", imageUrl: "dessert.png" },
          ],
          pagination: { page: 2, totalPages: 2 },
        },
      });

    const categories = await getHomeCategories("restaurant-1");

    expect(categories.map((category) => category.id)).toEqual(["c1", "c2", "c3"]);
    expect(getRequestMock).toHaveBeenNthCalledWith(
      1,
      "/v1/menu/categories?restaurantId=restaurant-1&page=1&limit=50&sortBy=sortOrder&sortOrder=ASC"
    );
    expect(getRequestMock).toHaveBeenNthCalledWith(
      2,
      "/v1/menu/categories?restaurantId=restaurant-1&page=2&limit=50&sortBy=sortOrder&sortOrder=ASC"
    );
  });

  it("deduplicates categories across pages", async () => {
    getRequestMock.mockResolvedValue({
      data: {
        data: [
          { id: "c1", name: "Pizza" },
          { id: "c1", name: "Pizza" },
        ],
        pagination: { page: 1, totalPages: 1 },
      },
    });

    const categories = await getHomeCategories("restaurant-1");

    expect(categories).toHaveLength(1);
    expect(categories[0].id).toBe("c1");
  });
});
