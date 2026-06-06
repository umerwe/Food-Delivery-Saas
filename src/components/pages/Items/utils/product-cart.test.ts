import { describe, expect, it } from "vitest";

import {
  buildCartPayload,
  buildCustomizableDealCartItemPayload,
  buildModifiersPayload,
  buildReadyMadeDealCartItemPayload,
  canSendDealIdForReadyMadeItem,
  canSendDealIdWithModifierSelections,
  getApiErrorMessage,
  isCartBranchConflict,
  isDealMenuItemCustomizable,
  isDealMenuItemReadyMade,
  shouldIncludeDealIdInCartPayload,
} from "./product-cart";

describe("product cart helpers", () => {
  it("builds modifier payloads from grouped selections", () => {
    expect(
      buildModifiersPayload({
        groupA: [{ id: "m1", name: "Cheese", selectedQuantity: 2 }],
        groupB: [{ id: "m2", name: "Olives", selectedQuantity: 1 }],
      })
    ).toEqual([
      { modifierId: "m1", quantity: 1 },
      { modifierId: "m2", quantity: 1 },
    ]);
  });

  it("builds create cart payload with split sections", () => {
    const payload = buildCartPayload({
      item: { id: "left", menuLinks: [{ restaurantMenuId: "menu-1" }] },
      branchId: "branch-1",
      selectedVariation: { id: "large", name: "Large" },
      qty: 2,
      selectedModifiers: {},
      instructions: "  no onion ",
      splitPizzaEnabled: true,
      splitPizzaItem: { id: "right" },
      includeMenuItem: true,
      includeBranch: true,
      clearSectionsWhenEmpty: false,
    });

    expect(payload).toMatchObject({
      branchId: "branch-1",
      menuItemId: "left",
      restaurantMenuId: "menu-1",
      variationId: "large",
      quantity: 2,
      note: "no onion",
      sections: [
        { slot: "LEFT", menuItemId: "left" },
        { slot: "RIGHT", menuItemId: "right" },
      ],
    });

    expect(payload.sections).toEqual([
      { slot: "LEFT", menuItemId: "left" },
      { slot: "RIGHT", menuItemId: "right" },
    ]);
  });

  it("preserves variationId and grouped modifierSelections", () => {
    const payload = buildCartPayload({
      item: { id: "burger-1" },
      branchId: "branch-1",
      selectedVariation: { id: "large-variation-id", name: "Large" },
      qty: 1,
      selectedModifiers: {
        group_sauces: [{ id: "modifier_garlic_sauce", name: "Garlic", selectedQuantity: 1 }],
      },
      modifierGroups: [
        {
          id: "group_sauces",
          name: "Sauces",
          selectionType: "MULTIPLE",
          minSelect: 0,
          maxSelect: 2,
          modifiers: [{ id: "modifier_garlic_sauce", name: "Garlic" }],
        },
      ],
      splitPizzaEnabled: false,
      splitPizzaItem: null,
      includeMenuItem: true,
      includeBranch: true,
      clearSectionsWhenEmpty: false,
      dealId: "flexible-deal-id",
    });

    expect(payload.variationId).toBe("large-variation-id");
    expect(payload.modifierSelections).toEqual([
      {
        modifierGroupId: "group_sauces",
        modifiers: [{ modifierId: "modifier_garlic_sauce", quantity: 1 }],
      },
    ]);
    expect(payload).not.toHaveProperty("modifiers");
    expect(payload).not.toHaveProperty("dealId");
  });

  it("does not include query dealId unless explicitly allowed", () => {
    const payload = buildCartPayload({
      item: { id: "burger-1" },
      branchId: "branch-1",
      selectedVariation: null,
      qty: 1,
      selectedModifiers: {},
      splitPizzaEnabled: false,
      splitPizzaItem: null,
      includeMenuItem: true,
      includeBranch: true,
      clearSectionsWhenEmpty: false,
      dealId: "query-deal-id",
      shouldSendDealId: false,
    });

    expect(payload).not.toHaveProperty("dealId");
  });

  it("includes dealId only when helper explicitly marks payload safe", () => {
    const payload = buildCartPayload({
      item: { id: "ready-made-combo", supportsDealIdCartPayload: true },
      branchId: "branch-1",
      selectedVariation: null,
      qty: 1,
      selectedModifiers: {},
      splitPizzaEnabled: false,
      splitPizzaItem: null,
      includeMenuItem: true,
      includeBranch: true,
      clearSectionsWhenEmpty: false,
      dealId: "safe-fixed-deal",
      shouldSendDealId: true,
    });

    expect(payload.dealId).toBe("safe-fixed-deal");
  });

  it("ready-made deal item payload includes dealId only", () => {
    const item = {
      id: "ready-made-combo",
      supportsDealIdCartPayload: true,
      variations: [],
      modifierGroups: [],
      modifiers: [],
      modifierLinks: [],
    };

    expect(isDealMenuItemReadyMade(item)).toBe(true);
    expect(canSendDealIdForReadyMadeItem({ id: "deal-1" }, item)).toBe(true);
    expect(buildReadyMadeDealCartItemPayload({
      deal: { id: "deal-1" },
      item,
      branchId: "branch-1",
    })).toEqual({
      branchId: "branch-1",
      menuItemId: "ready-made-combo",
      dealId: "deal-1",
      quantity: 1,
    });
  });

  it("deal create payload includes ready-made dealId only without customization", () => {
    const payload = buildCartPayload({
      item: { id: "ready-made-combo", supportsDealIdCartPayload: true },
      branchId: "branch-1",
      selectedVariation: null,
      qty: 1,
      selectedModifiers: {
        legacy: [{ id: "extra_cheese", name: "Extra cheese", selectedQuantity: 1 }],
      },
      splitPizzaEnabled: false,
      splitPizzaItem: null,
      includeMenuItem: true,
      includeBranch: true,
      clearSectionsWhenEmpty: false,
      dealId: "deal-1",
      shouldSendDealId: true,
    });

    expect(payload).toMatchObject({
      branchId: "branch-1",
      menuItemId: "ready-made-combo",
      dealId: "deal-1",
      quantity: 1,
    });
    expect(payload).not.toHaveProperty("variationId");
    expect(payload).not.toHaveProperty("modifiers");
    expect(payload).not.toHaveProperty("modifierSelections");
  });

  it("URL/query dealId is not automatically added to normal or variation payloads", () => {
    expect(shouldIncludeDealIdInCartPayload({
      deal: { id: "query-deal-id" },
      item: { id: "normal-item" },
      isDealMenuItem: false,
    })).toBe(false);

    expect(shouldIncludeDealIdInCartPayload({
      deal: { id: "query-deal-id" },
      item: { id: "ready-made-combo", supportsDealIdCartPayload: true },
      isDealMenuItem: true,
      hasVariation: true,
    })).toBe(false);
  });

  it("customizable deal payload includes modifierSelections and strips variation plus flat modifiers", () => {
    const item = {
      id: "custom-combo",
      supportsDealIdCartPayload: true,
      variations: [],
      modifierGroups: [
        {
          id: "group_sauces",
          name: "Sauces",
          selectionType: "MULTIPLE" as const,
          minSelect: 0,
          maxSelect: 2,
          modifiers: [{ id: "modifier_garlic_sauce", name: "Garlic" }],
        },
      ],
      modifiers: [{ id: "legacy-modifier", name: "Legacy" }],
      modifierLinks: [],
    };
    const modifierSelections = [
      {
        modifierGroupId: "group_sauces",
        modifiers: [{ modifierId: "modifier_garlic_sauce", quantity: 1 }],
      },
    ];

    expect(isDealMenuItemCustomizable(item)).toBe(true);
    expect(canSendDealIdWithModifierSelections({ id: "deal-1" }, item)).toBe(true);
    expect(buildCustomizableDealCartItemPayload({
      deal: { id: "deal-1" },
      item,
      branchId: "branch-1",
      modifierSelections,
    })).toEqual({
      branchId: "branch-1",
      menuItemId: "custom-combo",
      dealId: "deal-1",
      quantity: 1,
      modifierSelections,
    });

    const payload = buildCartPayload({
      item,
      branchId: "branch-1",
      selectedVariation: null,
      qty: 1,
      selectedModifiers: {
        group_sauces: [{ id: "modifier_garlic_sauce", name: "Garlic", selectedQuantity: 1 }],
      },
      modifierGroups: item.modifierGroups,
      splitPizzaEnabled: false,
      splitPizzaItem: null,
      includeMenuItem: true,
      includeBranch: true,
      clearSectionsWhenEmpty: false,
      dealId: "deal-1",
      shouldSendDealId: true,
    });

    expect(payload.dealId).toBe("deal-1");
    expect(payload.modifierSelections).toEqual(modifierSelections);
    expect(payload).not.toHaveProperty("variationId");
    expect(payload).not.toHaveProperty("modifiers");
  });

  it("does not include dealId for customizable deal item when variation is selected", () => {
    const payload = buildCartPayload({
      item: {
        id: "custom-combo",
        supportsDealIdCartPayload: true,
        variations: [{ id: "large", name: "Large" }],
        modifierGroups: [
          {
            id: "group_sauces",
            name: "Sauces",
            selectionType: "MULTIPLE",
            minSelect: 1,
            maxSelect: 2,
            modifiers: [{ id: "modifier_garlic_sauce", name: "Garlic" }],
          },
        ],
      },
      branchId: "branch-1",
      selectedVariation: { id: "large", name: "Large" },
      qty: 1,
      selectedModifiers: {
        group_sauces: [{ id: "modifier_garlic_sauce", name: "Garlic", selectedQuantity: 1 }],
      },
      modifierGroups: [
        {
          id: "group_sauces",
          name: "Sauces",
          selectionType: "MULTIPLE",
          minSelect: 1,
          maxSelect: 2,
          modifiers: [{ id: "modifier_garlic_sauce", name: "Garlic" }],
        },
      ],
      splitPizzaEnabled: false,
      splitPizzaItem: null,
      includeMenuItem: true,
      includeBranch: true,
      clearSectionsWhenEmpty: false,
      dealId: "deal-1",
      shouldSendDealId: true,
      isDealMenuItemContext: true,
    });

    expect(payload).not.toHaveProperty("dealId");
    expect(payload.variationId).toBe("large");
  });

  it("deal item with variations is not supported", () => {
    const item = {
      id: "sized-combo",
      supportsDealIdCartPayload: true,
      variations: [{ id: "large", name: "Large" }],
      modifierGroups: [],
      modifiers: [],
      modifierLinks: [],
    };

    expect(isDealMenuItemReadyMade(item)).toBe(false);
    expect(isDealMenuItemCustomizable(item)).toBe(false);
  });

  it("preserves legacy flat modifiers when grouped flow is inactive", () => {
    const payload = buildCartPayload({
      item: { id: "burger-1" },
      branchId: "branch-1",
      selectedVariation: null,
      qty: 1,
      selectedModifiers: {
        legacy: [{ id: "extra_cheese", name: "Extra cheese", selectedQuantity: 1 }],
      },
      splitPizzaEnabled: false,
      splitPizzaItem: null,
      includeMenuItem: true,
      includeBranch: true,
      clearSectionsWhenEmpty: false,
      dealId: "flexible-deal-id",
    });

    expect(payload.modifiers).toEqual([{ modifierId: "extra_cheese", quantity: 1 }]);
    expect(payload).not.toHaveProperty("modifierSelections");
    expect(payload).not.toHaveProperty("dealId");
  });

  it("clears patch sections when split pizza is off", () => {
    expect(
      buildCartPayload({
        item: { id: "item-1" },
        selectedVariation: null,
        qty: 1,
        selectedModifiers: {},
        splitPizzaEnabled: false,
        splitPizzaItem: null,
        includeMenuItem: false,
        includeBranch: false,
        clearSectionsWhenEmpty: true,
      }).sections
    ).toEqual([]);
  });

  it("extracts API error messages and detects branch conflicts", () => {
    expect(getApiErrorMessage({ data: { error: { message: "Nested" } } })).toBe("Nested");
    expect(getApiErrorMessage({ error: { message: "1. Basic Pizza Copy requires at least 1 modifier selection(s)" } })).toBe("1. Basic Pizza Copy requires at least 1 modifier selection(s)");
    expect(isCartBranchConflict({ error: "Cart already contains items from another branch" })).toBe(true);
  });
});
