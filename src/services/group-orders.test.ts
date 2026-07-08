import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ApiResult } from "@/services/http";
import { createGroupOrder, fetchGroupOrderById, normalizeCreateGroupOrderPayload, normalizeGroupOrderDetail, updateMyGroupOrderParticipantStatus } from "./group-orders";

const getGroupOrdersMock = vi.hoisted(() => vi.fn());
const postGroupOrdersMock = vi.hoisted(() => vi.fn());
const patchGroupOrdersMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/domain-api", () => ({
  createDomainApiService: () => ({
    get: getGroupOrdersMock,
    post: postGroupOrdersMock,
    patch: patchGroupOrdersMock,
    del: vi.fn(),
  }),
}));

describe("group orders service", () => {
  beforeEach(() => {
    getGroupOrdersMock.mockReset();
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

  it("normalizes direct group order detail responses", () => {
    expect(normalizeGroupOrderDetail({ data: { id: "group-1", inviteCode: "ABC123" } } as ApiResult)).toMatchObject({
      id: "group-1",
      inviteCode: "ABC123",
    });
    expect(normalizeGroupOrderDetail({ data: { data: { id: "group-2" } } } as ApiResult)).toMatchObject({
      id: "group-2",
    });
  });

  it("fetches a group order by direct id endpoint", async () => {
    getGroupOrdersMock.mockResolvedValue({ data: { id: "group-1" } });

    const result = await fetchGroupOrderById({ orderId: "group-1", token: "token-1" });

    expect(getGroupOrdersMock).toHaveBeenCalledWith("/v1/group-orders/group-1", "token-1");
    expect(result.groupOrder).toMatchObject({ id: "group-1" });
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
