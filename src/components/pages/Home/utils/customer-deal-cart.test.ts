import { describe, expect, it } from "vitest";

import {
  buildFixedDealCartItemsInput,
  buildSelectedFlexibleDealCartItemsInput,
  getDealActionLabel,
  getDealImage,
  getDealRequirementText,
  getDealTypeLabel,
  requiresCustomizationForDealItem,
  shouldSendDealIdForCartItem,
  isFlexibleCategoryDeal,
} from "./customer-deal-cart";
import type { CustomerDeal } from "@/types/customer-deals";

const fixedDeal: CustomerDeal = {
  id: "deal-1",
  title: "Combo",
  dealSelectionMode: "FIXED_ITEMS",
  dealRequiredQuantity: null,
  applyMode: "SCOPED_ITEMS",
  discountType: "FIXED_PRICE",
  discountValue: 799,
  scopeMenuItems: [
    { id: "burger-id", name: "Burger", variations: [], modifierGroups: [], modifiers: [], modifierLinks: [] },
    { id: "", name: "Invalid", variations: [], modifierGroups: [], modifiers: [], modifierLinks: [] },
    { id: "drink-id", name: "Drink", variations: [], modifierGroups: [], modifiers: [], modifierLinks: [] },
  ],
  scopeCategories: [],
};

const flexibleItemDeal: CustomerDeal = {
  ...fixedDeal,
  id: "deal-2",
  dealSelectionMode: "FLEXIBLE_ITEMS",
  dealRequiredQuantity: 2,
  scopeMenuItems: [
    { id: "burger-id", name: "Burger", variations: [], modifierGroups: [], modifiers: [], modifierLinks: [] },
    { id: "fries-id", name: "Fries", variations: [], modifierGroups: [], modifiers: [], modifierLinks: [] },
    { id: "drink-id", name: "Drink", variations: [], modifierGroups: [], modifiers: [], modifierLinks: [] },
  ],
};

const flexibleCategoryDeal: CustomerDeal = {
  ...fixedDeal,
  id: "deal-3",
  dealSelectionMode: "FLEXIBLE_ITEMS",
  dealRequiredQuantity: 3,
  scopeMenuItems: [],
  scopeCategories: [
    { id: "cat-burgers", name: "Burgers" },
    { id: "cat-sides", name: "Sides" },
  ],
};

describe("customer deal cart helpers", () => {
  it("fixed deal builds payload for all scoped items", () => {
    expect(buildFixedDealCartItemsInput(fixedDeal, "branch-1")).toEqual([
      { branchId: "branch-1", menuItemId: "burger-id", quantity: 1 },
      { branchId: "branch-1", menuItemId: "drink-id", quantity: 1 },
    ]);
  });

  it("flexible item deal builds payload only for selected eligible items", () => {
    expect(
      buildSelectedFlexibleDealCartItemsInput(
        flexibleItemDeal,
        "branch-1",
        ["drink-id", "unknown-id", "burger-id", "drink-id"]
      )
    ).toEqual([
      { branchId: "branch-1", menuItemId: "drink-id", quantity: 1 },
      { branchId: "branch-1", menuItemId: "burger-id", quantity: 1 },
    ]);
  });

  it("category deal does not build automatic item payload", () => {
    expect(isFlexibleCategoryDeal(flexibleCategoryDeal)).toBe(true);
    expect(buildFixedDealCartItemsInput(flexibleCategoryDeal, "branch-1")).toEqual([]);
    expect(
      buildSelectedFlexibleDealCartItemsInput(
        flexibleCategoryDeal,
        "branch-1",
        ["burger-id"]
      )
    ).toEqual([]);
  });

  it("flexible deal cart payload does not include dealId", () => {
    const [payload] = buildSelectedFlexibleDealCartItemsInput(
      flexibleItemDeal,
      "branch-1",
      ["burger-id"]
    );

    expect(payload).toEqual({ branchId: "branch-1", menuItemId: "burger-id", quantity: 1 });
    expect(payload).not.toHaveProperty("dealId");
  });

  it("does not include dealId, coupon, discountType, or applyMode in cart payload", () => {
    const [payload] = buildFixedDealCartItemsInput(fixedDeal, "branch-1");

    expect(Object.keys(payload)).toEqual(["branchId", "menuItemId", "quantity"]);
    expect(payload).not.toHaveProperty("dealId");
    expect(payload).not.toHaveProperty("coupon");
    expect(payload).not.toHaveProperty("discountType");
    expect(payload).not.toHaveProperty("applyMode");
  });

  it("fixed scoped item helper does not include dealId unless explicitly safe", () => {
    const [payload] = buildFixedDealCartItemsInput(
      {
        ...fixedDeal,
        scopeMenuItems: [
          {
            id: "combo-id",
            name: "Combo",
            variations: [],
            modifierGroups: [],
            modifiers: [],
            modifierLinks: [],
          },
        ],
      },
      "branch-1"
    );

    expect(payload).not.toHaveProperty("dealId");
    expect(
      shouldSendDealIdForCartItem(fixedDeal, fixedDeal.scopeMenuItems[0])
    ).toBe(false);
  });

  it("customizable and unknown items are not safe for dealId cart payloads", () => {
    const customizableItem = {
      id: "burger-id",
      name: "Burger",
      variations: [{ id: "large" }],
      modifierGroups: [],
      modifiers: [],
      modifierLinks: [],
      supportsDealIdCartPayload: true,
    };
    const unknownItem = { id: "drink-id", name: "Drink" };

    expect(requiresCustomizationForDealItem(customizableItem)).toBe(true);
    expect(requiresCustomizationForDealItem(unknownItem)).toBe(true);
    expect(
      shouldSendDealIdForCartItem(
        { ...fixedDeal, scopeMenuItems: [customizableItem] },
        customizableItem
      )
    ).toBe(false);
  });

  it("deal type label works", () => {
    expect(getDealTypeLabel(fixedDeal)).toBe("Fixed Combo");
    expect(getDealTypeLabel(flexibleItemDeal)).toBe("Any 2 Items");
    expect(getDealTypeLabel(flexibleCategoryDeal)).toBe("Any 3 from Categories");
  });

  it("requirement text works", () => {
    expect(getDealRequirementText(fixedDeal)).toBe("Includes 3 selected items");
    expect(getDealRequirementText(flexibleItemDeal)).toBe("Choose any 2 from 3 items");
    expect(getDealRequirementText(flexibleCategoryDeal)).toBe("Choose any 3 from selected categories");
  });

  it("old shape without required quantity does not show choose any text", () => {
    expect(getDealTypeLabel(fixedDeal)).toBe("Fixed Combo");
    expect(getDealRequirementText(fixedDeal)).not.toContain("Choose any");
  });

  it("flexible item deal with five scoped items shows required quantity", () => {
    const deal: CustomerDeal = {
      ...flexibleItemDeal,
      dealRequiredQuantity: 2,
      scopeMenuItems: [
        { id: "item-1", name: "Item 1", variations: [], modifierGroups: [], modifiers: [], modifierLinks: [] },
        { id: "item-2", name: "Item 2", variations: [], modifierGroups: [], modifiers: [], modifierLinks: [] },
        { id: "item-3", name: "Item 3", variations: [], modifierGroups: [], modifiers: [], modifierLinks: [] },
        { id: "item-4", name: "Item 4", variations: [], modifierGroups: [], modifiers: [], modifierLinks: [] },
        { id: "item-5", name: "Item 5", variations: [], modifierGroups: [], modifiers: [], modifierLinks: [] },
      ],
    };

    expect(getDealRequirementText(deal)).toBe("Choose any 2 from 5 items");
  });

  it("flexible deal without required quantity falls back safely", () => {
    const itemDeal: CustomerDeal = {
      ...flexibleItemDeal,
      dealRequiredQuantity: null,
    };
    const categoryDeal: CustomerDeal = {
      ...flexibleCategoryDeal,
      dealRequiredQuantity: null,
    };

    expect(getDealTypeLabel(itemDeal)).toBe("Any Items");
    expect(getDealRequirementText(itemDeal)).toBe("Choose from selected items");
    expect(getDealActionLabel(itemDeal)).toBe("Choose Items");
    expect(getDealTypeLabel(categoryDeal)).toBe("Any from Categories");
    expect(getDealRequirementText(categoryDeal)).toBe("Choose from selected categories");
    expect(getDealActionLabel(categoryDeal)).toBe("Browse Items");
  });

  it("deal image prefers thumbnail over image and scoped images", () => {
    const deal: CustomerDeal = {
      ...fixedDeal,
      thumbnailUrl: "https://example.com/thumb.png",
      imageUrl: "https://example.com/image.png",
      scopeMenuItems: [
        { id: "item-1", name: "Item", imageUrl: "https://example.com/item.png", variations: [], modifierGroups: [], modifiers: [], modifierLinks: [] },
      ],
      scopeCategories: [
        { id: "cat-1", name: "Category", imageUrl: "https://example.com/cat.png" },
      ],
    };

    expect(getDealImage(deal)).toBe("https://example.com/thumb.png");
  });

  it("returns empty if branchId is missing", () => {
    expect(buildFixedDealCartItemsInput(fixedDeal, "")).toEqual([]);
    expect(buildFixedDealCartItemsInput(fixedDeal, "   ")).toEqual([]);
  });
});
