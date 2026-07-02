import { describe, expect, it } from "vitest";

import { resolveHomeBranchId, resolveHomeRestaurantId, resolveTableReservationsEnabled } from "@/lib/home";
import type { AuthUser } from "@/types/auth";

const baseUser: AuthUser = {
  id: "customer-1",
  email: "customer@example.com",
  role: "CUSTOMER",
  tenantId: "tenant-1",
};

describe("home helpers", () => {
  it("uses the live home reservation flag before stale session data", () => {
    expect(
      resolveTableReservationsEnabled(
        { tableReservationsEnabled: false },
        { id: "branch-1", name: "Branch", tableReservationsEnabled: true }
      )
    ).toBe(false);
  });

  it("supports nested home reservation settings", () => {
    expect(
      resolveTableReservationsEnabled(
        { settings: { tableReservationsEnabled: true } },
        { id: "branch-1", name: "Branch", tableReservationsEnabled: false }
      )
    ).toBe(true);
  });

  it("falls back to session branch only when home has no explicit flag", () => {
    expect(
      resolveTableReservationsEnabled(
        null,
        { id: "branch-1", name: "Branch", tableReservationsEnabled: true }
      )
    ).toBe(true);
  });

  it("resolves restaurant id from the selected branch when the user is branch scoped", () => {
    expect(
      resolveHomeRestaurantId({
        ...baseUser,
        restaurantId: null,
        branch: {
          id: "branch-1",
          name: "Main",
          restaurantId: "restaurant-from-branch",
        },
      })
    ).toBe("restaurant-from-branch");
  });

  it("resolves branch id from nested branch when branchId is missing", () => {
    expect(
      resolveHomeBranchId({
        ...baseUser,
        branch: {
          id: "branch-1",
          name: "Main",
        },
      })
    ).toBe("branch-1");
  });
});
