import { describe, expect, it } from "vitest";

import {
  buildPickupTimeSlots,
  getPickupScheduleForDate,
} from "@/components/pages/Checkout/utils/pickup-schedule";
import type { BranchRecord } from "@/types/branch-selector";

describe("pickup schedule helpers", () => {
  it("builds slots from branch opening hours and skips breaks", () => {
    const branch: BranchRecord = {
      id: "branch-1",
      name: "Main",
      settings: {
        openingHours: [
          {
            dayOfWeek: "MONDAY",
            openTime: "10:00",
            closeTime: "12:00",
            breakTimes: [{ startTime: "10:30", endTime: "11:00" }],
          },
        ],
      },
    };

    expect(
      buildPickupTimeSlots({
        branch,
        dateValue: "2026-06-08",
      })
    ).toEqual([
      { value: "10:00", label: "10:00 AM" },
      { value: "11:00", label: "11:00 AM" },
      { value: "11:30", label: "11:30 AM" },
    ]);
  });

  it("returns no slots when branch is closed for the selected day", () => {
    const branch: BranchRecord = {
      id: "branch-1",
      name: "Main",
      settings: {
        openingHours: [
          {
            dayOfWeek: "MONDAY",
            isClosed: true,
            openTime: "10:00",
            closeTime: "12:00",
          },
        ],
      },
    };

    expect(
      buildPickupTimeSlots({
        branch,
        dateValue: "2026-06-08",
      })
    ).toEqual([]);
  });

  it("does not create fallback slots when branch opening hours are not configured", () => {
    expect(
      getPickupScheduleForDate({
        branch: null,
        dateValue: "2026-06-08",
      })
    ).toMatchObject({
      hasOpeningHours: false,
      schedule: null,
    });
    expect(
      buildPickupTimeSlots({
        branch: null,
        dateValue: "2026-06-08",
      })
    ).toEqual([]);
  });
});
