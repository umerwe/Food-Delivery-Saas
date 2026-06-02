import { describe, expect, it } from "vitest";

import { buildDealCartItemsInput } from "./customer-deal-cart";
import type { CustomerDeal } from "@/types/customer-deals";

const deal: CustomerDeal = {
  id: "deal-1",
  title: "Combo",
  applyMode: "SCOPED_ITEMS",
  discountType: "FIXED_PRICE",
  discountValue: 799,
  scopeMenuItems: [
    { id: "burger-id", name: "Burger" },
    { id: "", name: "Invalid" },
    { id: "drink-id", name: "Drink" },
  ],
  scopeCategories: [],
};

describe("buildDealCartItemsInput", () => {
  it("returns one payload per scope menu item", () => {
    expect(buildDealCartItemsInput(deal, "branch-1")).toEqual([
      { branchId: "branch-1", menuItemId: "burger-id", quantity: 1 },
      { branchId: "branch-1", menuItemId: "drink-id", quantity: 1 },
    ]);
  });

  it("skips item without id", () => {
    const payloads = buildDealCartItemsInput(deal, "branch-1");

    expect(payloads).toHaveLength(2);
    expect(payloads.some(({ menuItemId }) => !menuItemId)).toBe(false);
  });

  it("returns empty if branchId is missing", () => {
    expect(buildDealCartItemsInput(deal, "")).toEqual([]);
    expect(buildDealCartItemsInput(deal, "   ")).toEqual([]);
  });

  it("does not include dealId, coupon, applyMode, or discountType", () => {
    const [payload] = buildDealCartItemsInput(deal, "branch-1");

    expect(Object.keys(payload)).toEqual(["branchId", "menuItemId", "quantity"]);
    expect(payload).not.toHaveProperty("dealId");
    expect(payload).not.toHaveProperty("coupon");
    expect(payload).not.toHaveProperty("applyMode");
    expect(payload).not.toHaveProperty("discountType");
  });
});
