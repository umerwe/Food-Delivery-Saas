import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchMenuItemDetailsByIds } from "./items";

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
      "/v1/menu/items?search=No%20Add-Ons",
      undefined
    );
    expect(details["simple-id"]?.name).toBe("No Add-Ons");
  });
});
