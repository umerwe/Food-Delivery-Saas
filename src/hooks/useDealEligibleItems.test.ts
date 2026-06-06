import { describe, expect, it } from "vitest";

import {
  canSubmitDealSelection,
  getDealRequiredSelectionCount,
  mergeUniqueDealEligibleItems,
  toDealEligibleMenuItem,
} from "./useDealEligibleItems";
import type { CustomerDeal } from "@/types/customer-deals";

const baseDeal: CustomerDeal = {
  id: "deal-1",
  title: "Deal",
  dealSelectionMode: "FLEXIBLE_ITEMS",
  dealRequiredQuantity: 2,
  discountValue: 100,
  scopeMenuItems: [],
  scopeCategories: [],
};

describe("deal eligible item helpers", () => {
  it("merges eligible items for multiple categories by id", () => {
    expect(
      mergeUniqueDealEligibleItems([
        [
          { id: "pizza", name: "Pizza" },
          { id: "drink", name: "Drink" },
        ],
        [
          { id: "drink", name: "Drink duplicate" },
          { id: "side", name: "Side" },
        ],
      ])
    ).toEqual([
      { id: "pizza", name: "Pizza" },
      { id: "drink", name: "Drink" },
      { id: "side", name: "Side" },
    ]);
  });

  it("normalizes fetched menu items as selectable deal candidates", () => {
    expect(
      toDealEligibleMenuItem({
        id: "pizza",
        name: "Pizza",
        slug: "pizza",
        description: "Cheese pizza",
        imageUrl: null,
        basePrice: 10,
        variations: [{ id: "large", name: "Large" }],
        modifierGroups: [{ id: "addons", name: "Add-ons", isRequired: true }],
        modifiers: [{ id: "cheese", name: "Cheese" }],
        modifierLinks: [{ id: "link-1" }],
        minSelect: 1,
        minQuantity: 1,
      })
    ).toMatchObject({
      id: "pizza",
      name: "Pizza",
      variations: [{ id: "large", name: "Large" }],
      modifierGroups: [],
      modifiers: [],
      modifierLinks: [],
      minSelect: null,
      minQuantity: null,
      isRequired: false,
    });
  });

  it("requires selected count to meet deal required quantity", () => {
    expect(canSubmitDealSelection({ selectedCount: 1, requiredCount: 2 })).toBe(false);
    expect(canSubmitDealSelection({ selectedCount: 2, requiredCount: 2 })).toBe(true);
    expect(canSubmitDealSelection({ selectedCount: 3, requiredCount: 2 })).toBe(false);
  });

  it("uses scoped fixed item count as required count for fixed chooser deals", () => {
    expect(
      getDealRequiredSelectionCount({
        ...baseDeal,
        dealSelectionMode: "FIXED_ITEMS",
        dealRequiredQuantity: null,
        scopeMenuItems: [
          { id: "pizza", name: "Pizza" },
          { id: "drink", name: "Drink" },
        ],
      })
    ).toBe(2);
  });
});
