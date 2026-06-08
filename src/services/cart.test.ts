import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  addCustomerCartItem,
  deleteCustomerCartDeal,
  fetchCustomerCart,
  normalizeCartQuote,
  quoteCustomerCart,
  updateCustomerCart,
  updateCustomerCartDealQuantity,
  updateCustomerCartItem,
} from "./cart";

const getCartMock = vi.hoisted(() => vi.fn());
const postCartMock = vi.hoisted(() => vi.fn());
const patchCartMock = vi.hoisted(() => vi.fn());
const deleteCartMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/domain-api", () => ({
  createDomainApiService: () => ({
    get: getCartMock,
    post: postCartMock,
    patch: patchCartMock,
    del: deleteCartMock,
  }),
}));

describe("cart service", () => {
  beforeEach(() => {
    getCartMock.mockReset();
    postCartMock.mockReset();
    patchCartMock.mockReset();
    deleteCartMock.mockReset();
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

  it("adds customer cart item with grouped modifier selections", async () => {
    postCartMock.mockResolvedValue({ success: true });

    await addCustomerCartItem({
      customerId: "customer-1",
      payload: {
        branchId: "branch-1",
        menuItemId: "burger-id",
        quantity: 1,
        modifierSelections: [
          {
            modifierGroupId: "group-sauces",
            modifiers: [{ modifierId: "modifier-garlic", quantity: 1 }],
          },
        ],
      },
    });

    expect(postCartMock).toHaveBeenCalledWith(
      "/v1/cart/items?customerId=customer-1",
      {
        branchId: "branch-1",
        menuItemId: "burger-id",
        quantity: 1,
        modifierSelections: [
          {
            modifierGroupId: "group-sauces",
            modifiers: [{ modifierId: "modifier-garlic", quantity: 1 }],
          },
        ],
      },
      undefined
    );
    expect(postCartMock.mock.calls[0][1]).not.toHaveProperty("modifiers");
  });

  it("cleans ready-made deal cart payloads before posting", async () => {
    postCartMock.mockResolvedValue({ success: true });

    await addCustomerCartItem({
      customerId: "customer-1",
      payload: {
        branchId: "branch-1",
        menuItemId: "deal-item-1",
        dealId: "deal-1",
        variationId: "large",
        quantity: 1,
        modifiers: [{ modifierId: "modifier-1", quantity: 1 }],
        modifierSelections: undefined,
        sections: [{ slot: "LEFT", menuItemId: "pizza-left" }],
      },
    });

    expect(postCartMock.mock.calls[0][1]).toEqual({
      branchId: "branch-1",
      menuItemId: "deal-item-1",
      dealId: "deal-1",
      quantity: 1,
    });
  });

  it("keeps grouped modifierSelections for customizable deal payloads", async () => {
    postCartMock.mockResolvedValue({ success: true });

    await addCustomerCartItem({
      customerId: "customer-1",
      payload: {
        branchId: "branch-1",
        menuItemId: "deal-item-2",
        dealId: "deal-1",
        variationId: "large",
        quantity: 1,
        modifiers: [{ modifierId: "legacy-modifier", quantity: 1 }],
        modifierSelections: [
          {
            modifierGroupId: "group-1",
            modifiers: [{ modifierId: "modifier-1", quantity: 1 }],
          },
        ],
      },
    });

    expect(postCartMock.mock.calls[0][1]).toEqual({
      branchId: "branch-1",
      menuItemId: "deal-item-2",
      dealId: "deal-1",
      quantity: 1,
      modifierSelections: [
        {
          modifierGroupId: "group-1",
          modifiers: [{ modifierId: "modifier-1", quantity: 1 }],
        },
      ],
    });
  });

  it("updates customer cart item with grouped modifier selections", async () => {
    patchCartMock.mockResolvedValue({ success: true });

    await updateCustomerCartItem({
      cartItemId: "cart-item-1",
      payload: {
        quantity: 2,
        modifierSelections: [
          {
            modifierGroupId: "group-sauces",
            modifiers: [{ modifierId: "modifier-garlic", quantity: 1 }],
          },
        ],
      },
    });

    expect(patchCartMock).toHaveBeenCalledWith(
      "/v1/cart/items/cart-item-1",
      {
        quantity: 2,
        modifierSelections: [
          {
            modifierGroupId: "group-sauces",
            modifiers: [{ modifierId: "modifier-garlic", quantity: 1 }],
          },
        ],
      },
      undefined
    );
    expect(patchCartMock.mock.calls[0][1]).not.toHaveProperty("modifiers");
  });

  it("updates grouped deal quantity with the deal endpoint", async () => {
    patchCartMock.mockResolvedValue({ success: true });

    await updateCustomerCartDealQuantity({
      customerId: "customer-1",
      dealId: "deal-1",
      quantity: 2,
    });

    expect(patchCartMock).toHaveBeenCalledWith(
      "/v1/cart/deals/deal-1?customerId=customer-1",
      { quantity: 2 },
      undefined
    );
  });

  it("deletes grouped deals with the deal endpoint", async () => {
    deleteCartMock.mockResolvedValue({ success: true });

    await deleteCustomerCartDeal({
      customerId: "customer-1",
      dealId: "deal-1",
    });

    expect(deleteCartMock).toHaveBeenCalledWith(
      "/v1/cart/deals/deal-1?customerId=customer-1",
      undefined
    );
  });

  it("updates customer cart schedule with scheduledDeliveryAt", async () => {
    patchCartMock.mockResolvedValue({ success: true });

    await updateCustomerCart({
      customerId: "customer-1",
      payload: {
        scheduledDeliveryAt: "2026-06-10T19:30:00.000Z",
      },
    });

    expect(patchCartMock).toHaveBeenCalledWith(
      "/v1/cart?customerId=customer-1",
      {
        scheduledDeliveryAt: "2026-06-10T19:30:00.000Z",
      },
      undefined
    );
    expect(patchCartMock.mock.calls[0][0]).not.toContain("/api/v1");
  });

  it("updates customer cart tipAmount", async () => {
    patchCartMock.mockResolvedValue({ success: true });

    await updateCustomerCart({
      customerId: "customer-1",
      payload: {
        tipAmount: 150,
      },
    });

    expect(patchCartMock).toHaveBeenCalledWith(
      "/v1/cart?customerId=customer-1",
      {
        tipAmount: 150,
      },
      undefined
    );
    expect(patchCartMock.mock.calls[0][0]).not.toContain("/api/v1");
  });

  it("clears customer cart tipAmount with zero when null is passed", async () => {
    patchCartMock.mockResolvedValue({ success: true });

    await updateCustomerCart({
      customerId: "customer-1",
      payload: {
        tipAmount: null,
      },
    });

    expect(patchCartMock).toHaveBeenCalledWith(
      "/v1/cart?customerId=customer-1",
      {
        tipAmount: 0,
      },
      undefined
    );
  });

  it("maps legacy cart orderTime update to scheduledDeliveryAt", async () => {
    patchCartMock.mockResolvedValue({ success: true });

    await updateCustomerCart({
      customerId: "customer-1",
      payload: {
        orderTime: "2026-06-10T19:30:00.000Z",
      },
    });

    expect(patchCartMock).toHaveBeenCalledWith(
      "/v1/cart?customerId=customer-1",
      {
        scheduledDeliveryAt: "2026-06-10T19:30:00.000Z",
      },
      undefined
    );
    expect(patchCartMock.mock.calls[0][1]).not.toHaveProperty("orderTime");
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

  it("normalizes customer cart quote from GET cart response", async () => {
    getCartMock.mockResolvedValue({
      data: {
        data: {
          items: [{ id: "cart-item-1" }],
          quote: {
            subtotal: "1300",
            taxAmount: "0",
            deliveryFee: "150",
            serviceChargeType: "PERCENTAGE",
            serviceChargeValue: "10",
            serviceChargeAmount: "100",
            tipAmount: "150",
            discountAmount: "301",
            totalAmount: "999",
            payableAmount: "999",
            appliedPromotion: {
              id: "deal-1",
              title: "Any 2 Burgers",
              applyMode: "SCOPED_ITEMS",
              autoApply: true,
              discountType: "FIXED_PRICE",
              discountValue: "999",
              discountAmount: "301",
            },
          },
        },
      },
    });

    const cart = await fetchCustomerCart({ customerId: "customer-1" });

    expect(getCartMock).toHaveBeenCalledWith("/v1/cart?customerId=customer-1", undefined);
    expect(cart.items).toEqual([{ id: "cart-item-1" }]);
    expect(cart.quote).toEqual({
      subtotal: 1300,
      taxAmount: 0,
      deliveryFee: 150,
      serviceChargeType: "PERCENTAGE",
      serviceChargeValue: 10,
      serviceChargeAmount: 100,
      tipAmount: 150,
      discountAmount: 301,
      totalAmount: 999,
      payableAmount: 999,
      appliedPromotion: {
        id: "deal-1",
        title: "Any 2 Burgers",
        applyMode: "SCOPED_ITEMS",
        autoApply: true,
        discountType: "FIXED_PRICE",
        discountValue: 999,
        discountAmount: 301,
      },
    });
  });

  it("normalizes standalone cart quote values", () => {
    expect(
      normalizeCartQuote({
        subtotal: 1300,
        taxAmount: 0,
        deliveryFee: 150,
        serviceChargeType: "PERCENTAGE",
        serviceChargeValue: 10,
        serviceChargeAmount: 100,
        tipAmount: 150,
        discountAmount: 301,
        totalAmount: 999,
        payableAmount: 1400,
        appliedPromotion: {
          id: "deal-1",
          title: "Any 2 Burgers",
          discountAmount: 301,
        },
      })
    ).toMatchObject({
      subtotal: 1300,
      taxAmount: 0,
      deliveryFee: 150,
      serviceChargeType: "PERCENTAGE",
      serviceChargeValue: 10,
      serviceChargeAmount: 100,
      tipAmount: 150,
      discountAmount: 301,
      totalAmount: 999,
      payableAmount: 1400,
      appliedPromotion: {
        id: "deal-1",
        title: "Any 2 Burgers",
        discountAmount: 301,
      },
    });
  });
});
