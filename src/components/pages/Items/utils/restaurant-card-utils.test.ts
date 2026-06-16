import { describe, expect, it } from "vitest";

import { areBranchSchedulesIdentical, formatAddress, formatPrice, getBranchHoursDetails, getBranchHoursSummary, getImageUrl, getOperatingHours, getRestaurantAddress, getRestaurantName, getSplitPizzaPricingVariation, mergeUniqueById, resolveHasNext, resolvePromotionBadge } from "./restaurant-card-utils";

describe("restaurant card utils", () => {
  it("formats price and fallback image", () => {
    expect(formatPrice("12.5")).toBe("12.50");
    expect(getImageUrl({}, { imageUrl: "hero.jpg" })).toBe("hero.jpg");
  });

  it("formats address and operating hours", () => {
    expect(formatAddress({ street: "A", city: "B", country: "C" })).toBe("A, B, C");
    expect(
      formatAddress({
        street: "21",
        houseNumber: "House 8",
        postalCode: "46330",
        city: "Rawalpindi",
        area: "dha 5",
        state: "Punjab",
        country: "Pakistan",
        lat: "33.6135842",
        lng: "73.1321428",
      })
    ).toBe("21, House 8, 46330, Rawalpindi, dha 5, Punjab, Pakistan");
    expect(
      formatAddress({
        street: "21",
        shopNumber: "dha 5",
        postalCode: "46330",
        city: "Rawalpindi",
      })
    ).toBe("21, dha 5, 46330, Rawalpindi");
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
        value: "9:00 AM - 10:00 PM",
      },
      delivery: {
        status: "open",
        value: "11:30 AM - 9:45 PM",
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
        hoursLabel: "9:00 AM - 6:00 PM",
        breakLabels: ["3:14 PM - 3:48 PM (lunch break)"],
      }),
    ]);
  });

  it("resolves restaurant and promotion text", () => {
    expect(getRestaurantName({ restaurantName: "Demo" }, null)).toBe("Demo");
    expect(resolvePromotionBadge({ discountType: "PERCENTAGE", discountValue: 10 })).toBe("10% OFF");
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
