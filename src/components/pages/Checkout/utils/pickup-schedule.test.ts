import { afterEach, describe, expect, it, vi } from "vitest";

import {
  addPreparationMinutesToScheduledDelivery,
  buildDeliveryTimeSlots,
  buildPickupTimeSlots,
  buildScheduledDeliveryEstimate,
  buildScheduleBreakLabels,
  getBranchScheduleForDate,
  getBranchScheduleTimeZone,
  getPickupScheduleForDate,
  getScheduleOrderTimeIso,
  isImmediateScheduleAvailable,
  isScheduleTimeAvailable,
} from "@/components/pages/Checkout/utils/pickup-schedule";
import type { BranchRecord } from "@/types/branch-selector";

describe("pickup schedule helpers", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

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
        dateValue: "2030-06-17",
      })
    ).toEqual([
      { value: "10:00", label: "10:00" },
      { value: "11:00", label: "11:00" },
      { value: "11:30", label: "11:30" },
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
        dateValue: "2030-06-17",
      })
    ).toEqual([]);
  });

  it("does not create fallback slots when branch opening hours are not configured", () => {
    expect(
      getPickupScheduleForDate({
        branch: null,
        dateValue: "2030-06-10",
      })
    ).toMatchObject({
      hasOpeningHours: false,
      schedule: null,
    });
    expect(
      buildPickupTimeSlots({
        branch: null,
        dateValue: "2030-06-10",
      })
    ).toEqual([]);
  });

  it("builds delivery slots from delivery hours and skips delivery breaks", () => {
    const branch: BranchRecord = {
      id: "branch-1",
      name: "Main",
      settings: {
        openingHours: [
          {
            dayOfWeek: "MONDAY",
            openTime: "09:00",
            closeTime: "18:00",
          },
        ],
        deliveryHours: [
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
      buildDeliveryTimeSlots({
        branch,
        dateValue: "2030-06-17",
      })
    ).toEqual([
      { value: "10:00", label: "10:00" },
      { value: "11:00", label: "11:00" },
      { value: "11:30", label: "11:30" },
    ]);
    expect(
      buildScheduleBreakLabels(branch.settings?.deliveryHours?.[0])
    ).toEqual([
      { label: "10:30 - 11:00" },
    ]);
  });

  it("keeps scheduled slots outside a temporary closure while blocking immediate checkout", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T11:52:00Z"));

    const branch: BranchRecord = {
      id: "branch-1",
      name: "American Corner",
      availability: {
        temporaryClosure: {
          isClosed: true,
          closedAt: "2026-07-01T11:50:00Z",
          closedUntil: "2026-07-01T11:55:00Z",
          reason: "Busy kitchen",
        },
      },
      scheduleTimings: {
        openingHours: [
          { dayOfWeek: "WEDNESDAY", openTime: "11:00", closeTime: "12:30" },
        ],
        deliveryHours: [
          { dayOfWeek: "WEDNESDAY", openTime: "11:00", closeTime: "12:30" },
        ],
        deliveryIntervalMinutes: 30,
      },
    };

    expect(getBranchScheduleForDate({
      branch,
      dateValue: "2026-07-01",
      scheduleType: "delivery",
    })).toMatchObject({
      source: "delivery",
      schedule: { openTime: "11:00", closeTime: "12:30" },
    });
    expect(buildDeliveryTimeSlots({ branch, dateValue: "2026-07-01" })).toEqual([
      { value: "12:00", label: "12:00" },
    ]);
    expect(isImmediateScheduleAvailable({ branch, scheduleType: "delivery" })).toBe(false);
  });

  it("falls back to opening hours for delivery when delivery hours are not configured", () => {
    const branch: BranchRecord = {
      id: "branch-1",
      name: "Main",
      settings: {
        openingHours: [
          {
            dayOfWeek: "MONDAY",
            openTime: "10:00",
            closeTime: "11:00",
          },
        ],
      },
    };

    expect(
      buildDeliveryTimeSlots({
        branch,
        dateValue: "2030-06-17",
      })
    ).toEqual([
      { value: "10:00", label: "10:00" },
      { value: "10:30", label: "10:30" },
    ]);
  });

  it("falls back to opening hours for delivery when selected delivery day is closed", () => {
    const branch: BranchRecord = {
      id: "branch-1",
      name: "Main",
      settings: {
        openingHours: [
          {
            dayOfWeek: "MONDAY",
            openTime: "09:00",
            closeTime: "10:00",
          },
        ],
        deliveryHours: [
          {
            dayOfWeek: "MONDAY",
            isClosed: true,
            openTime: undefined,
            closeTime: undefined,
          },
        ],
      },
    };

    expect(
      getBranchScheduleForDate({
        branch,
        dateValue: "2030-06-17",
        scheduleType: "delivery",
      })
    ).toMatchObject({
      source: "opening",
    });
    expect(
      buildDeliveryTimeSlots({
        branch,
        dateValue: "2030-06-17",
      })
    ).toEqual([
      { value: "09:00", label: "09:00" },
      { value: "09:30", label: "09:30" },
    ]);
  });

  it("uses holiday opening hours before regular pickup and delivery hours", () => {
    const branch: BranchRecord = {
      id: "branch-1",
      name: "Main",
      scheduleTimings: {
        deliveryIntervalMinutes: 15,
        pickupIntervalMinutes: 20,
        openingHours: [
          {
            dayOfWeek: "MONDAY",
            openTime: "09:00",
            closeTime: "18:00",
          },
        ],
        deliveryHours: [
          {
            dayOfWeek: "MONDAY",
            isClosed: true,
          },
        ],
        holidayOpeningHours: [
          {
            date: "2030-06-17",
            openTime: "10:00",
            closeTime: "11:00",
          },
        ],
      },
    };

    expect(
      buildPickupTimeSlots({
        branch,
        dateValue: "2030-06-17",
      })
    ).toEqual([
      { value: "10:00", label: "10:00" },
      { value: "10:20", label: "10:20" },
      { value: "10:40", label: "10:40" },
    ]);
    expect(
      buildDeliveryTimeSlots({
        branch,
        dateValue: "2030-06-17",
      })
    ).toEqual([
      { value: "10:00", label: "10:00" },
      { value: "10:15", label: "10:15" },
      { value: "10:30", label: "10:30" },
      { value: "10:45", label: "10:45" },
    ]);
  });

  it("uses branch delivery interval minutes for scheduled delivery slots", () => {
    const branch: BranchRecord = {
      id: "branch-1",
      name: "Main",
      scheduleTimings: {
        deliveryIntervalMinutes: 15,
        pickupIntervalMinutes: 45,
      },
      settings: {
        deliveryHours: [
          {
            dayOfWeek: "MONDAY",
            openTime: "10:00",
            closeTime: "11:00",
          },
        ],
      },
    };

    expect(
      buildDeliveryTimeSlots({
        branch,
        dateValue: "2030-06-17",
      })
    ).toEqual([
      { value: "10:00", label: "10:00" },
      { value: "10:15", label: "10:15" },
      { value: "10:30", label: "10:30" },
      { value: "10:45", label: "10:45" },
    ]);
  });

  it("uses branch pickup interval minutes for scheduled pickup slots", () => {
    const branch: BranchRecord = {
      id: "branch-1",
      name: "Main",
      scheduleTimings: {
        deliveryIntervalMinutes: 15,
        pickupIntervalMinutes: 45,
      },
      settings: {
        openingHours: [
          {
            dayOfWeek: "MONDAY",
            openTime: "10:00",
            closeTime: "12:00",
          },
        ],
      },
    };

    expect(
      buildPickupTimeSlots({
        branch,
        dateValue: "2030-06-17",
      })
    ).toEqual([
      { value: "10:00", label: "10:00" },
      { value: "10:45", label: "10:45" },
    ]);
  });

  it("uses home branch scheduleTimings for hours and separate delivery/pickup intervals", () => {
    const branch: BranchRecord = {
      id: "branch-1",
      name: "Main",
      scheduleTimings: {
        deliveryIntervalMinutes: 15,
        pickupIntervalMinutes: 20,
        openingHours: [
          {
            dayOfWeek: "MONDAY",
            openTime: "09:00",
            closeTime: "10:00",
          },
        ],
        deliveryHours: [
          {
            dayOfWeek: "MONDAY",
            openTime: "10:00",
            closeTime: "11:00",
          },
        ],
      },
    };

    expect(
      buildPickupTimeSlots({
        branch,
        dateValue: "2030-06-17",
      })
    ).toEqual([
      { value: "09:00", label: "09:00" },
      { value: "09:20", label: "09:20" },
      { value: "09:40", label: "09:40" },
    ]);
    expect(
      buildDeliveryTimeSlots({
        branch,
        dateValue: "2030-06-17",
      })
    ).toEqual([
      { value: "10:00", label: "10:00" },
      { value: "10:15", label: "10:15" },
      { value: "10:30", label: "10:30" },
      { value: "10:45", label: "10:45" },
    ]);
  });

  it("falls back to 30 minute slots when backend interval is null", () => {
    const branch: BranchRecord = {
      id: "branch-1",
      name: "Main",
      scheduleTimings: {
        deliveryIntervalMinutes: null,
        pickupIntervalMinutes: null,
      },
      settings: {
        openingHours: [
          {
            dayOfWeek: "MONDAY",
            openTime: "10:00",
            closeTime: "11:00",
          },
        ],
      },
    };

    expect(
      buildPickupTimeSlots({
        branch,
        dateValue: "2030-06-17",
      })
    ).toEqual([
      { value: "10:00", label: "10:00" },
      { value: "10:30", label: "10:30" },
    ]);
  });

  it("converts branch local scheduled times to backend UTC orderTime", () => {
    expect(
      getScheduleOrderTimeIso({
        dateValue: "2026-07-01",
        timeValue: "13:30",
        timeZone: "Europe/Berlin",
      })
    ).toBe("2026-07-01T11:30:00.000Z");
    expect(
      getScheduleOrderTimeIso({
        dateValue: "2026-07-01",
        timeValue: "13:30",
        preparationMinutes: 20,
        timeZone: "Europe/Berlin",
      })
    ).toBe("2026-07-01T11:50:00.000Z");
  });

  it("uses Europe/Berlin as the default schedule timezone unless branch overrides it", () => {
    expect(getBranchScheduleTimeZone(null)).toBe("Europe/Berlin");
    expect(
      getBranchScheduleTimeZone({
        id: "branch-1",
        name: "Main",
        settings: { timezone: "Asia/Karachi" },
      })
    ).toBe("Asia/Karachi");
  });

  it("adds preparation minutes to a selected scheduled delivery time", () => {
    const scheduledAt = addPreparationMinutesToScheduledDelivery({
      scheduledDeliveryValue: "2030-06-17T09:30",
      preparationMinutes: 20,
    });

    expect(scheduledAt?.getHours()).toBe(9);
    expect(scheduledAt?.getMinutes()).toBe(50);

    expect(
      buildScheduledDeliveryEstimate({
        scheduledDeliveryValue: "2030-06-17T09:30",
        preparationMinutes: 20,
      })
    ).toMatchObject({
      selectedLabel: "09:30",
      readyLabel: "09:50",
      preparationMinutes: 20,
    });
  });

  it("rejects scheduled times outside branch pickup and delivery hours", () => {
    const branch: BranchRecord = {
      id: "american-corner",
      name: "American Corner",
      settings: {
        openingHours: [
          {
            dayOfWeek: "WEDNESDAY",
            openTime: "11:00",
            closeTime: "22:30",
          },
        ],
        deliveryHours: [
          {
            dayOfWeek: "WEDNESDAY",
            openTime: "11:00",
            closeTime: "22:30",
            breakTimes: [{ startTime: "15:00", endTime: "17:00" }],
          },
        ],
      },
    };

    expect(
      isScheduleTimeAvailable({
        branch,
        dateValue: "2026-07-01",
        timeValue: "09:30",
        scheduleType: "delivery",
      })
    ).toBe(false);
    expect(
      isScheduleTimeAvailable({
        branch,
        dateValue: "2026-07-01",
        timeValue: "13:30",
        scheduleType: "delivery",
      })
    ).toBe(true);
    expect(
      isScheduleTimeAvailable({
        branch,
        dateValue: "2026-07-01",
        timeValue: "15:30",
        scheduleType: "delivery",
      })
    ).toBe(false);
    expect(
      isScheduleTimeAvailable({
        branch,
        dateValue: "2026-07-01",
        timeValue: "09:30",
        scheduleType: "pickup",
      })
    ).toBe(false);
    expect(
      isScheduleTimeAvailable({
        branch,
        dateValue: "2026-07-01",
        timeValue: "13:30",
        scheduleType: "pickup",
      })
    ).toBe(true);
  });

  it("validates scheduled pickup and delivery times against available branch slots", () => {
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
        deliveryHours: [
          {
            dayOfWeek: "MONDAY",
            openTime: "13:00",
            closeTime: "14:00",
          },
        ],
      },
    };

    expect(
      isScheduleTimeAvailable({
        branch,
        dateValue: "2030-06-17",
        timeValue: "10:00",
        scheduleType: "pickup",
      })
    ).toBe(true);
    expect(
      isScheduleTimeAvailable({
        branch,
        dateValue: "2030-06-17",
        timeValue: "10:30",
        scheduleType: "pickup",
      })
    ).toBe(false);
    expect(
      isScheduleTimeAvailable({
        branch,
        dateValue: "2030-06-17",
        timeValue: "13:00",
        scheduleType: "delivery",
      })
    ).toBe(true);
    expect(
      isScheduleTimeAvailable({
        branch,
        dateValue: "2030-06-17",
        timeValue: "12:00",
        scheduleType: "delivery",
      })
    ).toBe(false);
  });

  it("requires scheduling later when immediate ordering has no available slot today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-06-17T15:00:00"));

    const branch: BranchRecord = {
      id: "branch-1",
      name: "Main",
      settings: {
        openingHours: [
          {
            dayOfWeek: "MONDAY",
            openTime: "10:00",
            closeTime: "12:00",
          },
        ],
      },
    };

    expect(
      isImmediateScheduleAvailable({
        branch,
        scheduleType: "pickup",
      })
    ).toBe(false);
    expect(
      isScheduleTimeAvailable({
        branch,
        dateValue: "2030-06-24",
        timeValue: "10:00",
        scheduleType: "pickup",
      })
    ).toBe(true);
  });
});
