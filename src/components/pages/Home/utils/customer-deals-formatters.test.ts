import { describe, expect, it } from "vitest";

import {
  formatDealDateRange,
  formatDealPrice,
  getDealCategoryRequirementHighlights,
  getDealForcedVariationBadges,
  getDealImage,
  getDealItemNames,
} from "./customer-deals-formatters";
import type { CustomerDeal } from "@/types/customer-deals";

const deal: CustomerDeal = {
  id: "deal-1",
  title: "Deal",
  dealSelectionMode: "FIXED_ITEMS",
  dealRequiredQuantity: null,
  applyMode: "SCOPED_ITEMS",
  discountType: "FIXED_PRICE",
  discountValue: 799,
  scopeMenuItems: [],
  scopeCategories: [],
};

describe("customer deals formatters", () => {
  it("formats fixed price", () => {
    expect(formatDealPrice(799)).toBe("€799.00");
    expect(formatDealPrice("12.5", "USD")).toBe("$12.50");
  });

  it("formats invalid date fallback", () => {
    expect(formatDealDateRange("invalid", null)).toBe("");
  });

  it("gets first item image", () => {
    expect(
      getDealImage({
        ...deal,
        scopeMenuItems: [
          { id: "item-1", name: "No image", imageUrl: null },
          { id: "item-2", name: "Burger", imageUrl: "https://example.com/burger.png" },
        ],
      })
    ).toBe("https://example.com/burger.png");
  });

  it("returns item names", () => {
    expect(
      getDealItemNames([
        { id: "item-1", name: "Burger" },
        { id: "item-2", name: "Drink" },
      ])
    ).toBe("Burger, Drink");
  });

  it("handles missing items", () => {
    expect(getDealItemNames([])).toBe("");
    expect(getDealImage(deal)).toBeNull();
  });

  it("formats a single forced variation as a compact size badge", () => {
    expect(
      getDealForcedVariationBadges({
        ...deal,
        scopeCategories: [{ id: "cat-pizza", name: "Pizza" }],
        scopeCategoryRules: [
          {
            menuCategoryId: "cat-pizza",
            itemLimit: 1,
            variationId: "large",
            variation: { id: "large", name: "Large" },
          },
        ],
      })
    ).toEqual([{ id: "cat-pizza-large", label: "Size: Large" }]);
  });

  it("includes category names when only one of multiple category requirements forces a variation", () => {
    expect(
      getDealForcedVariationBadges({
        ...deal,
        scopeCategories: [
          { id: "cat-noodles", name: "Nudeln" },
          { id: "cat-drinks", name: "Getränke" },
        ],
        scopeCategoryRules: [
          { menuCategoryId: "cat-noodles", itemLimit: 1 },
          {
            menuCategoryId: "cat-drinks",
            itemLimit: 1,
            variationId: "large",
            variation: { id: "large", name: "Large" },
          },
        ],
      })
    ).toEqual([{ id: "cat-drinks-large", label: "Getränke: Large" }]);
  });

  it("includes category names when a deal forces multiple variations", () => {
    expect(
      getDealForcedVariationBadges({
        ...deal,
        scopeCategories: [
          { id: "cat-pizza", name: "Pizza Bianca" },
          { id: "cat-side", name: "Side" },
        ],
        scopeCategoryRules: [
          {
            menuCategoryId: "cat-pizza",
            itemLimit: 1,
            variationId: "large",
            variation: { id: "large", name: "Large" },
          },
          {
            menuCategoryId: "cat-side",
            itemLimit: 1,
            variationId: "regular",
            variation: { id: "regular", displayText: "Regular" },
          },
        ],
      })
    ).toEqual([
      { id: "cat-pizza-large", label: "Pizza Bianca: Large" },
      { id: "cat-side-regular", label: "Side: Regular" },
    ]);
  });

  it("formats category requirement highlights with category-specific variation labels", () => {
    expect(
      getDealCategoryRequirementHighlights({
        ...deal,
        scopeCategories: [
          { id: "cat-noodles", name: "Nudeln" },
          { id: "cat-drinks", name: "Getränke" },
        ],
        scopeCategoryRules: [
          { menuCategoryId: "cat-noodles", itemLimit: 1 },
          {
            menuCategoryId: "cat-drinks",
            itemLimit: 1,
            variationId: "large",
            variation: { id: "large", name: "Large" },
          },
        ],
      })
    ).toEqual([
      { id: "cat-noodles", label: "1 Nudeln", variationLabel: undefined },
      { id: "cat-drinks", label: "1 Getränke", variationLabel: "Large" },
    ]);
  });

  it("ignores category rules without a usable forced variation label", () => {
    expect(
      getDealForcedVariationBadges({
        ...deal,
        scopeCategories: [{ id: "cat-pizza", name: "Pizza" }],
        scopeCategoryRules: [
          { menuCategoryId: "cat-pizza", itemLimit: 1, variationId: "large" },
        ],
      })
    ).toEqual([]);
  });
});
