import { describe, expect, it } from "vitest";

import {
  buildCustomizableDealCartItemPayload,
  buildFixedDealCartItemsInput,
  buildReadyMadeDealCartItemPayload,
  buildSelectedFlexibleDealCartItemsInput,
  canSelectFlexibleDealItem,
  canSendDealIdForReadyMadeItem,
  canSendDealIdWithModifierSelections,
  getDealMenuItemDefaultVariationId,
  getDealMenuItemDefaultVariationLabel,
  getDealActionLabel,
  getDealActionKind,
  getDealImage,
  getDealRequirementText,
  getDealScopedItemCustomizationState,
  getUnknownDealScopedItemIds,
  getDealTypeLabel,
  requiresCustomizationForDealItem,
  shouldIncludeDealIdInCartPayload,
  shouldSendDealIdForCartItem,
  isDealMenuItemCustomizable,
  isDealMenuItemReadyMade,
  isFlexibleCategoryDeal,
  isFlexibleAllItemsDeal,
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

const flexibleAllItemsDeal: CustomerDeal = {
  ...fixedDeal,
  id: "deal-4",
  dealSelectionMode: "FLEXIBLE_ITEMS",
  dealRequiredQuantity: 1,
  applyMode: "ALL_ITEMS",
  scopeMenuItems: [],
  scopeCategories: [],
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
    expect(getDealActionKind(flexibleCategoryDeal)).toBe("OPEN_CHOOSER");
    expect(buildFixedDealCartItemsInput(flexibleCategoryDeal, "branch-1")).toEqual([]);
    expect(
      buildSelectedFlexibleDealCartItemsInput(
        flexibleCategoryDeal,
        "branch-1",
        ["burger-id"]
      )
    ).toEqual([]);
  });

  it("category deal builds selected normal item payload from eligible category items", () => {
    expect(
      buildSelectedFlexibleDealCartItemsInput(
        flexibleCategoryDeal,
        "branch-1",
        ["pizza-id", "drink-id"],
        [
          { id: "pizza-id", name: "Pizza", variations: [], modifierGroups: [], modifiers: [], modifierLinks: [] },
          { id: "drink-id", name: "Drink", variations: [], modifierGroups: [], modifiers: [], modifierLinks: [] },
        ]
      )
    ).toEqual([
      { branchId: "branch-1", menuItemId: "pizza-id", quantity: 1 },
      { branchId: "branch-1", menuItemId: "drink-id", quantity: 1 },
    ]);
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

  it("flexible item deal opens chooser action", () => {
    expect(getDealActionKind(flexibleItemDeal)).toBe("OPEN_CHOOSER");
    expect(getDealActionLabel(flexibleItemDeal)).toBe("Choose Items");
  });

  it("flexible all-items deal opens chooser action", () => {
    expect(isFlexibleAllItemsDeal(flexibleAllItemsDeal)).toBe(true);
    expect(getDealActionKind(flexibleAllItemsDeal)).toBe("OPEN_CHOOSER");
    expect(getDealActionLabel(flexibleAllItemsDeal)).toBe("Choose Items");
    expect(getDealTypeLabel(flexibleAllItemsDeal)).toBe("Any 1 Item");
    expect(getDealRequirementText(flexibleAllItemsDeal)).toBe("Choose any 1 item");
  });

  it("fixed simple deal can auto-add only if no customization", () => {
    expect(getDealActionKind(fixedDeal)).toBe("AUTO_ADD");
    expect(
      getDealActionKind({
        ...fixedDeal,
        scopeMenuItems: [
          {
            id: "customizable",
            name: "Customizable",
            variations: [{ id: "large" }],
            modifierGroups: [],
            modifiers: [],
            modifierLinks: [],
          },
        ],
      })
    ).toBe("OPEN_CHOOSER");
  });

  it("scope item with required modifierGroups returns requires modifiers", () => {
    expect(
      getDealScopedItemCustomizationState({
        id: "pizza-id",
        name: "Pizza",
        variations: [],
        modifierGroups: [
          {
            id: "group-1",
            name: "Crust",
            minSelect: 1,
            modifiers: [{ id: "thin", name: "Thin" }],
          },
        ],
        modifiers: [],
        modifierLinks: [],
      })
    ).toBe("REQUIRES_MODIFIERS");
  });

  it("scope item with variations returns unsupported variation", () => {
    expect(
      getDealScopedItemCustomizationState({
        id: "pizza-id",
        name: "Pizza",
        variations: [{ id: "large" }],
        modifierGroups: [],
        modifiers: [],
        modifierLinks: [],
      })
    ).toBe("REQUIRES_UNSUPPORTED_VARIATION");
  });

  it("scope item with no customization returns simple", () => {
    expect(
      getDealScopedItemCustomizationState({
        id: "drink-id",
        name: "Drink",
        variations: [],
        modifierGroups: [],
        modifiers: [],
        modifierLinks: [],
      })
    ).toBe("SIMPLE");
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

  it("includes dealId only for explicitly safe ready-made fixed deal item", () => {
    const safeItem = {
      id: "combo-id",
      name: "Combo",
      variations: [],
      modifierGroups: [],
      modifiers: [],
      modifierLinks: [],
      supportsDealIdCartPayload: true,
    };
    const safeFixedDeal = {
      ...fixedDeal,
      scopeMenuItems: [safeItem],
    };

    expect(shouldIncludeDealIdInCartPayload({
      deal: flexibleItemDeal,
      item: safeItem,
      isDealMenuItem: true,
    })).toBe(true);
    expect(shouldIncludeDealIdInCartPayload({
      deal: flexibleCategoryDeal,
      item: safeItem,
      isDealMenuItem: true,
    })).toBe(false);
    expect(
      shouldIncludeDealIdInCartPayload({
        deal: safeFixedDeal,
        item: safeItem,
        isDealMenuItem: true,
        hasCustomization: true,
      })
    ).toBe(false);
    expect(shouldIncludeDealIdInCartPayload({
      deal: safeFixedDeal,
      item: safeItem,
      isDealMenuItem: true,
    })).toBe(true);
    expect(shouldIncludeDealIdInCartPayload({
      deal: safeFixedDeal,
      item: safeItem,
      isDealMenuItem: false,
    })).toBe(false);
  });

  it("customizable items are not safe for dealId cart payloads", () => {
    const customizableItem = {
      id: "burger-id",
      name: "Burger",
      variations: [{ id: "large" }],
      modifierGroups: [],
      modifiers: [],
      modifierLinks: [],
      supportsDealIdCartPayload: true,
    };

    expect(requiresCustomizationForDealItem(customizableItem)).toBe(true);
    expect(
      shouldSendDealIdForCartItem(
        { ...fixedDeal, scopeMenuItems: [customizableItem] },
        customizableItem
      )
    ).toBe(false);
  });

  it("ready-made deal item payload includes dealId only", () => {
    const readyMadeItem = {
      id: "deal-item-1",
      name: "Ready combo",
      variations: [],
      modifierGroups: [],
      modifiers: [],
      modifierLinks: [],
      supportsDealIdCartPayload: true,
    };

    expect(isDealMenuItemReadyMade(readyMadeItem)).toBe(true);
    expect(canSendDealIdForReadyMadeItem(fixedDeal, readyMadeItem)).toBe(true);
    expect(buildReadyMadeDealCartItemPayload({
      deal: fixedDeal,
      item: readyMadeItem,
      branchId: "branch-1",
    })).toEqual({
      branchId: "branch-1",
      menuItemId: "deal-item-1",
      dealId: "deal-1",
      quantity: 1,
    });
  });

  it("fixed ready-made deal item auto payload omits modifiers selections and variation", () => {
    const [payload] = buildFixedDealCartItemsInput(
      {
        ...fixedDeal,
        scopeMenuItems: [
          {
            id: "deal-item-1",
            name: "Ready combo",
            variations: [],
            modifierGroups: [],
            modifiers: [],
            modifierLinks: [],
            supportsDealIdCartPayload: true,
          },
        ],
      },
      "branch-1"
    );

    expect(payload.dealId).toBe("deal-1");
    expect(payload).not.toHaveProperty("modifiers");
    expect(payload).not.toHaveProperty("modifierSelections");
    expect(payload).not.toHaveProperty("variationId");
  });

  it("customizable deal item payload includes dealId and modifierSelections only", () => {
    const customizableItem = {
      id: "deal-item-2",
      name: "Custom combo",
      variations: [],
      modifierGroups: [
        {
          id: "group-1",
          name: "Sauce",
          minSelect: 1,
          maxSelect: 1,
          modifiers: [{ id: "modifier-1", name: "Garlic" }],
        },
      ],
      modifiers: [],
      modifierLinks: [],
      supportsDealIdCartPayload: true,
    };

    const payload = buildCustomizableDealCartItemPayload({
      deal: fixedDeal,
      item: customizableItem,
      branchId: "branch-1",
      modifierSelections: [
        {
          modifierGroupId: "group-1",
          modifiers: [{ modifierId: "modifier-1", quantity: 1 }],
        },
      ],
    });

    expect(isDealMenuItemCustomizable(customizableItem)).toBe(true);
    expect(canSendDealIdWithModifierSelections(fixedDeal, customizableItem)).toBe(true);
    expect(payload).toEqual({
      branchId: "branch-1",
      menuItemId: "deal-item-2",
      dealId: "deal-1",
      quantity: 1,
      modifierSelections: [
        {
          modifierGroupId: "group-1",
          modifiers: [{ modifierId: "modifier-1", quantity: 1 }],
        },
      ],
    });
    expect(payload).not.toHaveProperty("variationId");
    expect(payload).not.toHaveProperty("modifiers");
  });

  it("flexible deal item with variations can be selected using its default variation", () => {
    const variationDealItem = {
      id: "deal-item-3",
      name: "Sized combo",
      variations: [
        { id: "small", name: "Small" },
        { id: "large", displayText: "Large", isDefault: true },
      ],
      modifierGroups: [],
      modifiers: [],
      modifierLinks: [],
      supportsDealIdCartPayload: true,
    };

    expect(isDealMenuItemReadyMade(variationDealItem)).toBe(false);
    expect(isDealMenuItemCustomizable(variationDealItem)).toBe(false);
    expect(canSendDealIdForReadyMadeItem(fixedDeal, variationDealItem)).toBe(false);
    expect(canSelectFlexibleDealItem(variationDealItem)).toBe(true);
    expect(getDealMenuItemDefaultVariationId(variationDealItem)).toBe("large");
    expect(getDealMenuItemDefaultVariationLabel(variationDealItem)).toBe("Large");
    expect(buildSelectedFlexibleDealCartItemsInput(
      flexibleItemDeal,
      "branch-1",
      ["deal-item-3"],
      [variationDealItem]
    )).toEqual([
      {
        branchId: "branch-1",
        menuItemId: "deal-item-3",
        variationId: "large",
        quantity: 1,
      },
    ]);
  });

  it("flexible deal item with split pizza variation remains unsupported", () => {
    const splitVariationDealItem = {
      id: "deal-item-4",
      name: "Split pizza",
      variations: [{ id: "large" }],
      modifierGroups: [],
      modifiers: [],
      modifierLinks: [],
      supportsSplitPizza: true,
    };

    expect(canSelectFlexibleDealItem(splitVariationDealItem)).toBe(false);
    expect(buildSelectedFlexibleDealCartItemsInput(
      flexibleItemDeal,
      "branch-1",
      ["deal-item-4"],
      [splitVariationDealItem]
    )).toEqual([]);
  });

  it("unknown item detail triggers detail fetch path and does not auto-add", () => {
    const unknownItem = { id: "drink-id", name: "Drink" };

    expect(getDealScopedItemCustomizationState(unknownItem)).toBe("UNKNOWN");
    expect(getUnknownDealScopedItemIds({ ...fixedDeal, scopeMenuItems: [unknownItem] })).toEqual(["drink-id"]);
    expect(buildFixedDealCartItemsInput(
      { ...fixedDeal, scopeMenuItems: [unknownItem] },
      "branch-1"
    )).toEqual([]);
    expect(getDealActionKind({ ...fixedDeal, scopeMenuItems: [unknownItem] })).toBe("OPEN_CHOOSER");
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
