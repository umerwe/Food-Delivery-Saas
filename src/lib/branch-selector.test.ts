import { describe, expect, it } from "vitest";

import {
  branchSupportsDelivery,
  branchSupportsPickup,
  formatBranchAddress,
  formatBranchDistance,
  getSelectedOrderType,
  nearbyBranchToBranchRecord,
  normalizeBranch,
} from "@/lib/branch-selector";
import type { NearbyBranch } from "@/types/branches";

const nearbyBranch: NearbyBranch = {
  id: "branch-1",
  name: "Central",
  restaurantId: "restaurant-1",
  distanceKm: 1.25,
  address: {
    street: "Main Road",
    city: "Karachi",
    country: "Pakistan",
  },
  settings: {
    allowedOrderTypes: ["DELIVERY", "TAKEAWAY"],
  },
};

describe("branch selector helpers", () => {
  it("branchSupportsPickup checks TAKEAWAY", () => {
    expect(branchSupportsPickup(nearbyBranch)).toBe(true);
    expect(
      branchSupportsPickup({
        ...nearbyBranch,
        settings: { allowedOrderTypes: ["DELIVERY"] },
      })
    ).toBe(false);
  });

  it("branchSupportsDelivery checks DELIVERY", () => {
    expect(branchSupportsDelivery(nearbyBranch)).toBe(true);
    expect(
      branchSupportsDelivery({
        ...nearbyBranch,
        settings: { allowedOrderTypes: ["TAKEAWAY"] },
      })
    ).toBe(false);
  });

  it("formatBranchDistance works for metres and kilometres", () => {
    expect(formatBranchDistance(0.42)).toBe("420 m away");
    expect(formatBranchDistance(3.25)).toBe("3.3 km away");
    expect(formatBranchDistance(14.2)).toBe("14 km away");
    expect(formatBranchDistance(null)).toBe("");
  });

  it("formats branch address from known address parts", () => {
    expect(formatBranchAddress(nearbyBranch)).toBe("Main Road, Karachi, Pakistan");
  });

  it("keeps selected branch persistence shape compatible", () => {
    const branchRecord = nearbyBranchToBranchRecord(nearbyBranch);

    expect(branchRecord).toMatchObject({
      id: "branch-1",
      name: "Central",
      restaurantId: "restaurant-1",
      address: nearbyBranch.address,
      settings: nearbyBranch.settings,
      distanceKm: 1.25,
    });
  });

  it("falls back to the branch selected order type", () => {
    expect(
      getSelectedOrderType({
        branch: { id: "branch-1", name: "Central", selectedOrderType: "TAKEAWAY" },
        selectedOrderType: null,
      })
    ).toBe("TAKEAWAY");
  });

  it("preserves branch availability and temporary closure details", () => {
    const branch = normalizeBranch({
      id: "branch-closed",
      name: "Closed Branch",
      settings: {
        temporaryClosure: {
          isClosed: true,
          closedAt: "2026-06-10T09:00:00.000Z",
          closedUntil: "2026-06-10T13:00:00.000Z",
          reason: "Maintenance",
          message: "We are closed for maintenance",
        },
        openingHours: [
          {
            dayOfWeek: "WEDNESDAY",
            isClosed: false,
            openTime: "09:00",
            closeTime: "18:00",
            breakTimes: [{ startTime: "14:00", endTime: "15:00", note: "Lunch" }],
          },
        ],
        deliveryHours: [
          {
            dayOfWeek: "WEDNESDAY",
            isClosed: false,
            openTime: "10:00",
            closeTime: "20:00",
            breakTimes: [{ startTime: "16:00", endTime: "17:00", note: "Delivery pause" }],
          },
        ],
        tableReservationsEnabled: true,
      },
      availability: {
        isAvailable: false,
        isTemporarilyClosed: true,
        isHolidayClosed: false,
        temporaryClosure: {
          isClosed: true,
          closedAt: "2026-06-10T09:00:00.000Z",
          closedUntil: "2026-06-10T13:00:00.000Z",
          reason: "Maintenance",
          message: "We are closed for maintenance",
        },
      },
    });

    expect(branch?.availability?.isTemporarilyClosed).toBe(true);
    expect(branch?.availability?.temporaryClosure?.closedUntil).toBe("2026-06-10T13:00:00.000Z");
    expect(branch?.settings?.temporaryClosure?.message).toBe("We are closed for maintenance");
    expect(branch?.settings?.openingHours?.[0]?.breakTimes?.[0]?.note).toBe("Lunch");
    expect(branch?.settings?.deliveryHours?.[0]?.breakTimes?.[0]?.note).toBe("Delivery pause");
    expect(branch?.settings?.tableReservationsEnabled).toBe(true);
  });
});
