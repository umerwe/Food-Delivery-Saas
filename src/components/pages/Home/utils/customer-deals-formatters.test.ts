import { describe, expect, it } from "vitest";

import {
  formatDealDateRange,
  formatDealPrice,
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
    expect(formatDealPrice(799)).toBe("$799.00");
    expect(formatDealPrice("12.5")).toBe("$12.50");
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
});
