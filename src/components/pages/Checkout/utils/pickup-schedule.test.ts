import { describe, expect, it } from "vitest";

import {
  addPreparationMinutesToScheduledDelivery,
  buildDeliveryTimeSlots,
  buildPickupTimeSlots,
  buildScheduledDeliveryEstimate,
  buildScheduleBreakLabels,
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
        dateValue: "2030-06-17",
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
      { value: "10:00", label: "10:00 AM" },
      { value: "11:00", label: "11:00 AM" },
      { value: "11:30", label: "11:30 AM" },
    ]);
    expect(
      buildScheduleBreakLabels(branch.settings?.deliveryHours?.[0])
    ).toEqual([
      { label: "10:30 AM - 11:00 AM" },
    ]);
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
      { value: "10:00", label: "10:00 AM" },
      { value: "10:30", label: "10:30 AM" },
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
      { value: "10:00", label: "10:00 AM" },
      { value: "10:15", label: "10:15 AM" },
      { value: "10:30", label: "10:30 AM" },
      { value: "10:45", label: "10:45 AM" },
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
      { value: "10:00", label: "10:00 AM" },
      { value: "10:45", label: "10:45 AM" },
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
      { value: "09:00", label: "9:00 AM" },
      { value: "09:20", label: "9:20 AM" },
      { value: "09:40", label: "9:40 AM" },
    ]);
    expect(
      buildDeliveryTimeSlots({
        branch,
        dateValue: "2030-06-17",
      })
    ).toEqual([
      { value: "10:00", label: "10:00 AM" },
      { value: "10:15", label: "10:15 AM" },
      { value: "10:30", label: "10:30 AM" },
      { value: "10:45", label: "10:45 AM" },
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
      { value: "10:00", label: "10:00 AM" },
      { value: "10:30", label: "10:30 AM" },
    ]);
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
      selectedLabel: "9:30 AM",
      readyLabel: "9:50 AM",
      preparationMinutes: 20,
    });
  });
});
