import { beforeEach, describe, expect, it, vi } from "vitest";

import { addCustomerCartItem, quoteCustomerCart } from "./cart";

const postCartMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/domain-api", () => ({
  createDomainApiService: () => ({
    get: vi.fn(),
    post: postCartMock,
    patch: vi.fn(),
    del: vi.fn(),
  }),
}));

describe("cart service", () => {
  beforeEach(() => {
    postCartMock.mockReset();
  });

  it("adds customer cart item with the normal cart item endpoint", async () => {
    postCartMock.mockResolvedValue({ success: true });

    await addCustomerCartItem({
      customerId: "customer-1",
      payload: {
        branchId: "branch-1",
        menuItemId: "burger-id",
        quantity: 1,
      },
    });

    expect(postCartMock).toHaveBeenCalledWith(
      "/v1/cart/items?customerId=customer-1",
      {
        branchId: "branch-1",
        menuItemId: "burger-id",
        quantity: 1,
      },
      undefined
    );
  });

  it("refreshes customer cart quote", async () => {
    postCartMock.mockResolvedValue({
      data: {
        appliedPromotion: {
          id: "deal-1",
          title: "Burger Combo",
          discountAmount: 301,
        },
      },
    });

    const response = await quoteCustomerCart({ customerId: "customer-1" });

    expect(postCartMock).toHaveBeenCalledWith(
      "/v1/cart/quote?customerId=customer-1",
      {},
      undefined
    );
    expect(response).toMatchObject({
      data: {
        appliedPromotion: {
          id: "deal-1",
          discountAmount: 301,
        },
      },
    });
  });
});
