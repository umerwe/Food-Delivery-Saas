import { describe, expect, it } from "vitest";

import {
  branchSupportsDelivery,
  branchSupportsPickup,
  formatBranchAddress,
  formatBranchDistance,
  nearbyBranchToBranchRecord,
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
});
