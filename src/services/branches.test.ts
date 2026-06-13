import { beforeEach, describe, expect, it, vi } from "vitest";

import { getNearbyBranches } from "@/services/branches";
import type { NearbyBranchesParams } from "@/types/branches";

const getRequestMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/http", () => ({
  getRequest: getRequestMock,
  postRequest: vi.fn(),
  patchRequest: vi.fn(),
  deleteRequest: vi.fn(),
}));

describe("getNearbyBranches", () => {
  beforeEach(() => {
    getRequestMock.mockReset();
  });

  it("calls /branches with lat, lng, page, and limit", async () => {
    getRequestMock.mockResolvedValue({ data: { branches: [] } });

    await getNearbyBranches({ lat: 51.5, lng: -0.12, page: 1, limit: 20 });

    expect(getRequestMock).toHaveBeenCalledWith("/branches?lat=51.5&lng=-0.12&page=1&limit=20");
  });

  it("does not call /api/v1/branches inside the service", async () => {
    getRequestMock.mockResolvedValue([]);

    await getNearbyBranches({ lat: 24.86, lng: 67.01 });

    expect(getRequestMock).toHaveBeenCalledWith("/branches?lat=24.86&lng=67.01&page=1&limit=20");
    expect(getRequestMock.mock.calls[0][0]).not.toContain("/api/v1/branches");
  });

  it("does not send only lat or only lng", async () => {
    await expect(
      getNearbyBranches({ lat: 24.86 } as NearbyBranchesParams)
    ).rejects.toThrow("Both lat and lng are required");

    await expect(
      getNearbyBranches({ lng: 67.01 } as NearbyBranchesParams)
    ).rejects.toThrow("Both lat and lng are required");

    expect(getRequestMock).not.toHaveBeenCalled();
  });

  it("normalizes distance, address, and settings from envelope responses", async () => {
    getRequestMock.mockResolvedValue({
      success: true,
      data: {
        branches: [
          {
            id: "branch-1",
            name: "Central",
            restaurantId: "restaurant-1",
            distanceKm: "2.4",
            address: {
              street: "Main Road",
              city: "Karachi",
              lat: "24.86",
              lng: "67.01",
            },
            settings: {
              allowedOrderTypes: ["DELIVERY", "TAKEAWAY"],
              deliveryConfig: { type: "RADIUS" },
              tableReservationsEnabled: true,
              openingHours: [
                {
                  dayOfWeek: "FRIDAY",
                  openTime: "09:00",
                  closeTime: "18:00",
                },
              ],
              deliveryHours: [
                {
                  dayOfWeek: "FRIDAY",
                  openTime: "10:00",
                  closeTime: "22:00",
                  breakTimes: [{ startTime: "16:00", endTime: "17:00" }],
                },
              ],
            },
          },
        ],
        meta: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
      },
    });

    const response = await getNearbyBranches({ lat: 24.86, lng: 67.01 });

    expect(response.branches[0]).toMatchObject({
      id: "branch-1",
      name: "Central",
      restaurantId: "restaurant-1",
      distanceKm: 2.4,
      address: {
        street: "Main Road",
        city: "Karachi",
        lat: "24.86",
        lng: "67.01",
      },
      settings: {
        allowedOrderTypes: ["DELIVERY", "TAKEAWAY"],
        deliveryConfig: { type: "RADIUS" },
        tableReservationsEnabled: true,
        deliveryHours: [
          expect.objectContaining({
            dayOfWeek: "FRIDAY",
            openTime: "10:00",
            breakTimes: [expect.objectContaining({ startTime: "16:00" })],
          }),
        ],
      },
    });
    expect(response.meta).toMatchObject({ page: 1, limit: 20, total: 1 });
  });

  it("supports direct array fallback", async () => {
    getRequestMock.mockResolvedValue([{ id: "branch-2", name: "North" }]);

    const response = await getNearbyBranches({ lat: 1, lng: 2 });

    expect(response.branches).toEqual([
      expect.objectContaining({ id: "branch-2", name: "North" }),
    ]);
  });
});
