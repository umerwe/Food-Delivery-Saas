import { describe, expect, it, vi, afterEach } from "vitest";

import { buildRuntimeClosedPopup } from "./BranchOpeningHours";

const t = (key: string, values?: { time?: string }) => `${key}${values?.time ? `:${values.time}` : ""}`;

describe("buildRuntimeClosedPopup", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses the same opening-hours closed state shown by the restaurant header before opening", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 30, 12, 0));

    const popup = buildRuntimeClosedPopup({
      t,
      branch: {
        id: "branch-1",
        name: "Test Branch",
        settings: {
          openingHours: [
            { dayOfWeek: "TUESDAY", openTime: "13:00", closeTime: "22:00" },
          ],
          deliveryHours: [
            { dayOfWeek: "TUESDAY", openTime: "10:00", closeTime: "23:00" },
          ],
        },
      },
    });

    expect(popup).toMatchObject({
      show: true,
      title: "closedTitle",
      message: "closedBeforeOpen:13:00",
    });
  });

  it("shows the preorder popup when home branch API marks isOpen false", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 2, 13, 2));

    const popup = buildRuntimeClosedPopup({
      t,
      branch: {
        id: "cmp0t09h30025t7ilzikwi8qu",
        name: "American Corner",
        isOpen: false,
        scheduleTimings: {
          timezone: "Europe/Berlin",
          openingHours: [
            { dayOfWeek: "THURSDAY", isClosed: false, openTime: "13:30", closeTime: "22:30" },
          ],
          deliveryHours: [
            { dayOfWeek: "THURSDAY", isClosed: false, openTime: "11:00", closeTime: "22:30" },
          ],
        },
      },
    });

    expect(popup).toMatchObject({
      show: true,
      title: "closedTitle",
    });
  });
});
