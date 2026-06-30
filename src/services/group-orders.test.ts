import { beforeEach, describe, expect, it, vi } from "vitest";

import { createGroupOrder, normalizeCreateGroupOrderPayload, updateMyGroupOrderParticipantStatus } from "./group-orders";

const postGroupOrdersMock = vi.hoisted(() => vi.fn());
const patchGroupOrdersMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/domain-api", () => ({
  createDomainApiService: () => ({
    get: vi.fn(),
    post: postGroupOrdersMock,
    patch: patchGroupOrdersMock,
    del: vi.fn(),
  }),
}));

describe("group orders service", () => {
  beforeEach(() => {
    postGroupOrdersMock.mockReset();
    patchGroupOrdersMock.mockReset();
  });

  it("strips restaurantMenuId from create group order payloads", () => {
    expect(
      normalizeCreateGroupOrderPayload({
        branchId: "branch-1",
        orderType: "DELIVERY",
        deliveryAddressId: "address-1",
        restaurantMenuId: "menu-1",
        orderTime: "2026-06-13T06:04:00.000Z",
        hostNote: null,
      })
    ).toEqual({
      branchId: "branch-1",
      orderType: "DELIVERY",
      deliveryAddressId: "address-1",
      orderTime: "2026-06-13T06:04:00.000Z",
      hostNote: null,
    });
  });

  it("posts group order creation without restaurantMenuId", async () => {
    postGroupOrdersMock.mockResolvedValue({ success: true });

    await createGroupOrder({
      payload: {
        branchId: "branch-1",
        orderType: "DELIVERY",
        deliveryAddressId: "address-1",
        restaurantMenuId: "menu-1",
        orderTime: "2026-06-13T06:04:00.000Z",
        hostNote: null,
      },
      token: "token-1",
    });

    expect(postGroupOrdersMock).toHaveBeenCalledWith(
      "/v1/group-orders",
      {
        branchId: "branch-1",
        orderType: "DELIVERY",
        deliveryAddressId: "address-1",
        orderTime: "2026-06-13T06:04:00.000Z",
        hostNote: null,
      },
      "token-1"
    );
  });

  it("patches the current participant status", async () => {
    patchGroupOrdersMock.mockResolvedValue({ success: true });

    await updateMyGroupOrderParticipantStatus({
      orderId: "group-1",
      status: "COMPLETED",
      token: "token-1",
    });

    expect(patchGroupOrdersMock).toHaveBeenCalledWith(
      "/v1/group-orders/group-1/participants/me/status",
      { status: "COMPLETED" },
      "token-1"
    );
  });
});
