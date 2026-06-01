import { describe, expect, it } from "vitest";

import { formatAddress, formatPrice, getImageUrl, getOperatingHours, getRestaurantName, getSplitPizzaPricingVariation, mergeUniqueById, resolveHasNext, resolvePromotionBadge } from "./restaurant-card-utils";

describe("restaurant card utils", () => {
  it("formats price and fallback image", () => {
    expect(formatPrice("12.5")).toBe("12.50");
    expect(getImageUrl({}, { imageUrl: "hero.jpg" })).toBe("hero.jpg");
  });

  it("formats address and operating hours", () => {
    expect(formatAddress({ street: "A", city: "B", country: "C" })).toBe("A, B, C");
    expect(getOperatingHours({ restaurant: { openingTime: "9", closingTime: "5" } }, null)).toBe("9 - 5");
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
