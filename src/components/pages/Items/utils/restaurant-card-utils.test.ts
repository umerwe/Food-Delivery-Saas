import { afterEach, describe, expect, it, vi } from "vitest";

import { areBranchSchedulesIdentical, formatAddress, formatPrice, getBranchHoursDetails, getBranchHoursSummary, getImageUrl, getOperatingHours, getRestaurantAddress, getRestaurantName, getSplitPizzaPricingVariation, mergeUniqueById, resolveHasNext, resolvePromotionBadge } from "./restaurant-card-utils";

describe("restaurant card utils", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats price and fallback image", () => {
    expect(formatPrice("12.5")).toBe("12.50");
    expect(getImageUrl({}, { imageUrl: "hero.jpg" })).toBe("hero.jpg");
  });

  it("formats address and operating hours", () => {
    expect(formatAddress({ street: "A", city: "B", country: "C" })).toBe("A, B");
    expect(
      formatAddress({
        street: "Teststr.",
        houseNumber: "House 8",
        postalCode: "46330",
        city: "Rawalpindi",
        area: "dha 5",
        state: "Punjab",
        country: "Pakistan",
        lat: "33.6135842",
        lng: "73.1321428",
      })
    ).toBe("Teststr. House 8, 46330 Rawalpindi");
    expect(
      formatAddress({
        street: "21",
        shopNumber: "dha 5",
        postalCode: "46330",
        city: "Rawalpindi",
      })
    ).toBe("21, dha 5, 46330 Rawalpindi");
    expect(
      getRestaurantAddress(
        {
          branch: { address: { street: "Branch", postalCode: "12345" } },
          restaurant: { address: { street: "Restaurant" } },
        },
        null
      )
    ).toBe("Branch, 12345");
    expect(getOperatingHours({ restaurant: { openingTime: "9", closingTime: "5" } }, null)).toBe("9 - 5");
  });

  it("summarizes selected branch opening and delivery hours", () => {
    const branch = {
      settings: {
        openingHours: [
          { dayOfWeek: "MONDAY", openTime: "09:00", closeTime: "22:00" },
        ],
        deliveryConfig: {
          deliveryHours: [
            { dayOfWeek: "MONDAY", openTime: "11:30", closeTime: "21:45" },
          ],
        },
      },
    };

    expect(getBranchHoursSummary(branch)).toMatchObject({
      opening: {
        status: "open",
        value: "09:00 - 22:00",
      },
      delivery: {
        status: "open",
        value: "11:30 - 21:45",
      },
      showDeliveryHours: true,
    });
  });

  it("hides delivery hours when they are identical to opening hours", () => {
    const schedule = [
      {
        dayOfWeek: "MONDAY",
        openTime: "09:00",
        closeTime: "18:00",
        breakTimes: [{ startTime: "14:00", endTime: "15:00", note: "Lunch" }],
      },
    ];

    expect(areBranchSchedulesIdentical(schedule, schedule)).toBe(true);
    const summary = getBranchHoursSummary({
        settings: {
          openingHours: schedule,
          deliveryHours: schedule,
        },
      });

    expect(summary.showDeliveryHours).toBe(false);
    expect(summary.showDeliveryHoursCard).toBe(false);
    expect(summary.deliveryMatchesOpeningToday).toBe(true);
  });

  it("hides only the delivery card when today's delivery hours match opening hours", () => {
    const dayKeys = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const today = dayKeys[new Date().getDay()];
    const anotherDay = dayKeys[(new Date().getDay() + 1) % dayKeys.length];

    const summary = getBranchHoursSummary({
      settings: {
        openingHours: [
          { dayOfWeek: today, openTime: "09:00", closeTime: "18:00" },
          { dayOfWeek: anotherDay, openTime: "09:00", closeTime: "17:00" },
        ],
        deliveryHours: [
          { dayOfWeek: today, openTime: "09:00", closeTime: "18:00" },
          { dayOfWeek: anotherDay, openTime: "10:00", closeTime: "17:00" },
        ],
      },
    });

    expect(summary.showDeliveryHours).toBe(true);
    expect(summary.showDeliveryHoursCard).toBe(false);
    expect(summary.deliveryMatchesOpeningToday).toBe(true);
  });

  it("uses opening hours when today's delivery hours are closed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 1, 12, 0));

    const dayKeys = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const today = dayKeys[new Date().getDay()];

    const summary = getBranchHoursSummary({
      settings: {
        openingHours: [
          { dayOfWeek: today, openTime: "09:00", closeTime: "18:00" },
        ],
        deliveryHours: [
          { dayOfWeek: today, isClosed: true, openTime: null, closeTime: null },
        ],
      },
    });

    expect(summary.opening).toMatchObject({
      label: "Today",
      value: "09:00 - 18:00",
    });
    expect(summary.delivery).toMatchObject({
      label: "Today",
      value: "09:00 - 18:00",
    });
    expect(summary.showDeliveryHoursCard).toBe(false);
  });

  it("uses opening hours as popup fallback for closed delivery day rows", () => {
    const summary = getBranchHoursSummary({
      scheduleTimings: {
        openingHours: [
          { dayOfWeek: "TUESDAY", openTime: "16:00", closeTime: "18:00" },
        ],
        deliveryHours: [
          { dayOfWeek: "TUESDAY", isClosed: true, openTime: null, closeTime: null },
        ],
      },
    });

    const deliveryDetails = getBranchHoursDetails(summary.regularDeliverySchedule);
    const tuesday = deliveryDetails.find((day) => day.dayLabel === "Tue");

    expect(tuesday).toMatchObject({
      hoursLabel: "16:00 - 18:00",
    });
    expect(tuesday?.hoursLabel).not.toBe("Closed");
  });

  it("uses today's holiday opening hours before regular branch hours", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 1, 12, 0));

    const todayDate = new Date();
    const todayValue = [
      todayDate.getFullYear(),
      String(todayDate.getMonth() + 1).padStart(2, "0"),
      String(todayDate.getDate()).padStart(2, "0"),
    ].join("-");

    const summary = getBranchHoursSummary({
      scheduleTimings: {
        openingHours: [
          { dayOfWeek: "MONDAY", openTime: "09:00", closeTime: "18:00" },
        ],
        deliveryHours: [
          { dayOfWeek: "MONDAY", openTime: "10:00", closeTime: "22:00" },
        ],
        holidayOpeningHours: [
          { date: todayValue, openTime: "10:00", closeTime: "14:00" },
        ],
      },
    });

    expect(summary.opening).toMatchObject({
      label: "Today",
      value: "10:00 - 14:00",
    });
    expect(summary.delivery).toMatchObject({
      label: "Today",
      value: "10:00 - 14:00",
    });
    expect(summary.regularOpeningSchedule).toEqual([
      { dayOfWeek: "MONDAY", openTime: "09:00", closeTime: "18:00" },
    ]);
    expect(summary.regularDeliverySchedule).toEqual([
      { dayOfWeek: "MONDAY", openTime: "10:00", closeTime: "22:00" },
    ]);
    expect(summary.openingSchedule).toEqual([
      { date: todayValue, openTime: "10:00", closeTime: "14:00" },
    ]);
    expect(summary.holidaySchedule).toEqual([
      { date: todayValue, openTime: "10:00", closeTime: "14:00" },
    ]);
    expect(summary.showDeliveryHoursCard).toBe(false);
  });

  it("formats branch break times for the enriched hours popup", () => {
    expect(
      getBranchHoursDetails([
        {
          dayOfWeek: "FRIDAY",
          openTime: "09:00",
          closeTime: "18:00",
          breakTimes: [{ startTime: "15:14", endTime: "15:48", note: "lunch break" }],
        },
      ])
    ).toEqual([
      expect.objectContaining({
        dayLabel: "Fri",
        hoursLabel: "09:00 - 18:00",
        breakLabels: ["15:14 - 15:48 (lunch break)"],
      }),
    ]);
  });

  it("marks today's opening hours as closed before opening time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 30, 14, 41));

    const summary = getBranchHoursSummary({
      scheduleTimings: {
        openingHours: [
          { dayOfWeek: "TUESDAY", openTime: "16:00", closeTime: "18:00" },
        ],
      },
    });

    expect(summary.opening).toMatchObject({
      status: "closed",
      reason: "before-open",
      opensAt: "16:00",
    });
  });

  it("falls back to schedule timings when empty settings hours mask today's opening time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 30, 12, 0));

    const summary = getBranchHoursSummary({
      settings: {
        openingHours: [],
      },
      scheduleTimings: {
        openingHours: [
          { dayOfWeek: "TUESDAY", openTime: "13:00", closeTime: "22:00" },
        ],
      },
    });

    expect(summary.opening).toMatchObject({
      status: "closed",
      reason: "before-open",
      opensAt: "13:00",
    });
  });

  it("marks today's opening hours as closed during break time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 1, 15, 30));

    const summary = getBranchHoursSummary({
      scheduleTimings: {
        openingHours: [
          {
            dayOfWeek: "WEDNESDAY",
            openTime: "11:00",
            closeTime: "22:30",
            breakTimes: [{ startTime: "15:00", endTime: "17:00" }],
          },
        ],
      },
    });

    expect(summary.opening).toMatchObject({
      status: "closed",
      reason: "break",
      breakUntil: "17:00",
    });
  });

  it("makes active temporary closure the top-level branch state", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 30, 14, 41));

    const summary = getBranchHoursSummary({
      availability: {
        temporaryClosure: {
          isClosed: true,
          closedUntil: new Date(2026, 5, 30, 15, 30).toISOString(),
          reason: "Busy kitchen",
        },
      },
      scheduleTimings: {
        openingHours: [
          { dayOfWeek: "TUESDAY", openTime: "11:00", closeTime: "22:30" },
        ],
      },
    });

    expect(summary.opening).toMatchObject({
      status: "closed",
      reason: "temporary-closure",
      value: "Busy kitchen",
    });
    expect(summary.temporaryClosure?.reason).toBe("Busy kitchen");
  });

  it("resolves restaurant and promotion text", () => {
    expect(getRestaurantName({ restaurantName: "Demo" }, null)).toBe("Demo");
    expect(resolvePromotionBadge({ discountType: "PERCENTAGE", discountValue: 10 })).toBe("10% OFF");
    expect(resolvePromotionBadge({ discountType: "PERCENTAGE", discountValue: 0 })).toBe("");
    expect(resolvePromotionBadge({})).toBe("");
    expect(resolvePromotionBadge({ title: "Angebot 2", applyMode: "ALL_ITEMS" })).toBe("");
    expect(resolvePromotionBadge({ title: "Angebot 2", applyMode: "SCOPED_ITEMS" })).toBe("");
    expect(resolvePromotionBadge({ title: "Angebot 2", discountType: "FIXED_PRICE", discountValue: 20 })).toBe("");
    expect(resolvePromotionBadge({ title: "Angebot 2", dealSelectionMode: "FIXED_ITEMS" })).toBe("");
  });

  it("merges stable IDs and resolves pagination", () => {
    expect(mergeUniqueById([{ id: "1", name: "old" }], [{ id: "1", name: "new" }, { id: "2" }])).toEqual([{ id: "1", name: "new" }, { id: "2" }]);
    expect(resolveHasNext({ meta: { totalPages: 2, page: 1 }, page: 1, limit: 10, receivedCount: 10, totalLoaded: 10 })).toBe(true);
  });

  it("matches split pizza variation by label before falling back", () => {
    const fallbackVariation = { id: "default", name: "Medium", price: 12 };
    const smallVariation = { id: "right-small", name: "Small", price: 9 };

    expect(
      getSplitPizzaPricingVariation({
        variations: [fallbackVariation, smallVariation],
        selectedVariation: { id: "left-small", displayText: "Small" },
        fallbackVariation,
      })
    ).toBe(smallVariation);
  });
});
