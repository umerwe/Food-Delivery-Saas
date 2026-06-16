import { describe, expect, it } from "vitest";

import { resolveTableReservationsEnabled } from "@/lib/home";

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
});
