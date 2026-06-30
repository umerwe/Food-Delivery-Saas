import { describe, expect, it } from "vitest";

import {
  buildDealCartItemPayload,
  getDealChooserSelectedModifiersTotal,
  getSelectedModifiersByGroup,
  validateDealChooserItemConfiguration,
  validateDealChooserSelectedCount,
  type DealChooserItemConfiguration,
} from "./deal-chooser-validation";
import type { CustomerDeal, CustomerDealMenuItem } from "@/types/customer-deals";

const flexibleDeal: CustomerDeal = {
  id: "deal-1",
  title: "Deal",
  dealSelectionMode: "FLEXIBLE_ITEMS",
  dealRequiredQuantity: 1,
  discountValue: 100,
  scopeMenuItems: [],
  scopeCategories: [],
};

const requiredModifierItem: CustomerDealMenuItem = {
  id: "pizza",
  name: "Pizza",
  variations: [],
  modifiers: [],
  modifierLinks: [],
  modifierGroups: [
    {
      id: "size",
      name: "Size",
      selectionType: "SINGLE",
      minSelect: 1,
      maxSelect: 1,
      modifiers: [
        { id: "small", name: "Small" },
        { id: "large", name: "Large" },
      ],
    },
  ],
};

describe("deal chooser validation", () => {
  it("blocks required modifier items without modifier selections", () => {
    const validation = validateDealChooserItemConfiguration({
      deal: flexibleDeal,
      item: requiredModifierItem,
      configuration: { menuItemId: "pizza", modifierSelections: [] },
    });

    expect(validation.groupErrors).toEqual({
      size: "Size requires at least 1 selection.",
    });
  });

  it("builds normal flexible payload with modifierSelections after selection", () => {
    const configuration: DealChooserItemConfiguration = {
      menuItemId: "pizza",
      modifierSelections: [
        {
          modifierGroupId: "size",
          modifiers: [{ modifierId: "large", quantity: 1 }],
        },
      ],
    };

    expect(
      validateDealChooserItemConfiguration({
        deal: flexibleDeal,
        item: requiredModifierItem,
        configuration,
      }).groupErrors
    ).toEqual({});
    expect(
      buildDealCartItemPayload({
        deal: flexibleDeal,
        item: requiredModifierItem,
        branchId: "branch-1",
        configuration,
      })
    ).toEqual({
      branchId: "branch-1",
      menuItemId: "pizza",
      dealId: "deal-1",
      quantity: 1,
      modifierSelections: configuration.modifierSelections,
    });
  });

  it("allows optional modifier group to remain empty", () => {
    const optionalItem: CustomerDealMenuItem = {
      ...requiredModifierItem,
      modifierGroups: [
        {
          id: "sauces",
          name: "Sauces",
          selectionType: "MULTIPLE",
          minSelect: 0,
          maxSelect: 3,
          modifiers: [{ id: "bbq", name: "BBQ" }],
        },
      ],
    };

    expect(
      validateDealChooserItemConfiguration({
        deal: flexibleDeal,
        item: optionalItem,
        configuration: { menuItemId: "pizza", modifierSelections: [] },
      }).groupErrors
    ).toEqual({});
  });

  it("keeps only one modifier for SINGLE groups", () => {
    const configuration: DealChooserItemConfiguration = {
      menuItemId: "pizza",
      modifierSelections: [
        {
          modifierGroupId: "size",
          modifiers: [{ modifierId: "large", quantity: 1 }],
        },
      ],
    };

    const selectedByGroup = getSelectedModifiersByGroup(
      [
        {
          id: "size",
          name: "Size",
          selectionType: "SINGLE",
          minSelect: 1,
          maxSelect: 1,
          modifiers: [{ id: "large", name: "Large" }],
        },
      ],
      configuration
    );

    expect(selectedByGroup.size).toEqual([
      {
        id: "large",
        name: "Large",
        selectedQuantity: 1,
      },
    ]);
  });

  it("calculates selected paid modifier total for deal display", () => {
    const item: CustomerDealMenuItem = {
      ...requiredModifierItem,
      modifierGroups: [
        {
          id: "toppings",
          name: "Toppings",
          selectionType: "MULTIPLE",
          minSelect: 0,
          maxSelect: 4,
          modifiers: [
            { id: "cheese", name: "Cheese", priceDelta: 2 },
            { id: "sauce", name: "Sauce", priceDelta: "0.5" },
          ],
        },
      ],
    };

    expect(
      getDealChooserSelectedModifiersTotal({
        item,
        configuration: {
          menuItemId: "pizza",
          modifierSelections: [
            {
              modifierGroupId: "toppings",
              modifiers: [
                { modifierId: "cheese", quantity: 2 },
                { modifierId: "sauce", quantity: 1 },
              ],
            },
          ],
        },
      })
    ).toBe(4.5);
  });

  it("blocks MULTIPLE group selections beyond maxSelect", () => {
    const item: CustomerDealMenuItem = {
      ...requiredModifierItem,
      modifierGroups: [
        {
          id: "toppings",
          name: "Toppings",
          selectionType: "MULTIPLE",
          minSelect: 0,
          maxSelect: 1,
          modifiers: [
            { id: "onion", name: "Onion" },
            { id: "pepper", name: "Pepper" },
          ],
        },
      ],
    };

    expect(
      validateDealChooserItemConfiguration({
        deal: flexibleDeal,
        item,
        configuration: {
          menuItemId: "pizza",
          modifierSelections: [
            {
              modifierGroupId: "toppings",
              modifiers: [
                { modifierId: "onion", quantity: 1 },
                { modifierId: "pepper", quantity: 1 },
              ],
            },
          ],
        },
      }).groupErrors
    ).toEqual({
      toppings: "Toppings allows at most 1 selection.",
    });
  });

  it("blocks MULTIPLE group quantity beyond maxSelect", () => {
    const item: CustomerDealMenuItem = {
      ...requiredModifierItem,
      modifierGroups: [
        {
          id: "toppings",
          name: "Toppings",
          selectionType: "MULTIPLE",
          minSelect: 0,
          maxSelect: 2,
          modifiers: [{ id: "onion", name: "Onion" }],
        },
      ],
    };

    expect(
      validateDealChooserItemConfiguration({
        deal: flexibleDeal,
        item,
        configuration: {
          menuItemId: "pizza",
          modifierSelections: [
            {
              modifierGroupId: "toppings",
              modifiers: [{ modifierId: "onion", quantity: 3 }],
            },
          ],
        },
      }).groupErrors
    ).toEqual({
      toppings: "Toppings allows at most 2 selections.",
    });
  });

  it("selected count cannot exceed required quantity", () => {
    expect(validateDealChooserSelectedCount({ selectedCount: 3, requiredQuantity: 1 }))
      .toBe("You can select only 1 item for this deal.");
  });

  it("normal flexible auto-applied deal payload includes dealId", () => {
    expect(
      buildDealCartItemPayload({
        deal: flexibleDeal,
        item: { id: "drink", name: "Drink", variations: [], modifierGroups: [], modifiers: [], modifierLinks: [] },
        branchId: "branch-1",
      })
    ).toEqual({
      branchId: "branch-1",
      menuItemId: "drink",
      dealId: "deal-1",
      quantity: 1,
    });
  });

  it("ready-made backend deal item payload includes only dealId", () => {
    expect(
      buildDealCartItemPayload({
        deal: flexibleDeal,
        item: {
          id: "deal-drink",
          name: "Drink",
          variations: [],
          modifierGroups: [],
          modifiers: [],
          modifierLinks: [],
          supportsDealIdCartPayload: true,
        },
        branchId: "branch-1",
      })
    ).toEqual({
      branchId: "branch-1",
      menuItemId: "deal-drink",
      dealId: "deal-1",
      quantity: 1,
    });
  });

  it("customizable backend deal item payload includes dealId and modifierSelections", () => {
    const configuration: DealChooserItemConfiguration = {
      menuItemId: "pizza",
      modifierSelections: [
        {
          modifierGroupId: "size",
          modifiers: [{ modifierId: "large", quantity: 1 }],
        },
      ],
    };

    expect(
      buildDealCartItemPayload({
        deal: flexibleDeal,
        item: {
          ...requiredModifierItem,
          supportsDealIdCartPayload: true,
        },
        branchId: "branch-1",
        configuration,
      })
    ).toEqual({
      branchId: "branch-1",
      menuItemId: "pizza",
      dealId: "deal-1",
      quantity: 1,
      modifierSelections: configuration.modifierSelections,
    });
  });

  it("ignores flexible deal item variation selection for backend dealId payload", () => {
    const item: CustomerDealMenuItem = {
      id: "pizza",
      name: "Pizza",
      variations: [{ id: "large", name: "Large" }],
      modifierGroups: [],
      modifiers: [],
      modifierLinks: [],
      supportsDealIdCartPayload: true,
    };
    const configuration: DealChooserItemConfiguration = {
      menuItemId: "pizza",
      modifierSelections: [],
    };

    const validation = validateDealChooserItemConfiguration({
      deal: flexibleDeal,
      item,
      configuration,
    });

    expect(validation.itemError).toBeUndefined();
    expect(
      buildDealCartItemPayload({
        deal: flexibleDeal,
        item,
        branchId: "branch-1",
        configuration,
      })
    ).toEqual({
      branchId: "branch-1",
      menuItemId: "pizza",
      dealId: "deal-1",
      quantity: 1,
    });
  });

  it("sends flexible variation item modifiers with dealId and no variation", () => {
    const configuration: DealChooserItemConfiguration = {
      menuItemId: "pizza",
      modifierSelections: [
        {
          modifierGroupId: "size",
          modifiers: [{ modifierId: "large", quantity: 1 }],
        },
      ],
    };

    expect(
      buildDealCartItemPayload({
        deal: flexibleDeal,
        item: {
          ...requiredModifierItem,
          variations: [{ id: "small", name: "Small" }],
          supportsDealIdCartPayload: true,
        },
        branchId: "branch-1",
        configuration,
      })
    ).toEqual({
      branchId: "branch-1",
      menuItemId: "pizza",
      dealId: "deal-1",
      quantity: 1,
      modifierSelections: configuration.modifierSelections,
    });
  });

  it("allows split-capable flexible items when modifier choices are selected", () => {
    const configuration: DealChooserItemConfiguration = {
      menuItemId: "pizza",
      modifierSelections: [
        {
          modifierGroupId: "size",
          modifiers: [{ modifierId: "large", quantity: 1 }],
        },
      ],
    };

    const item: CustomerDealMenuItem = {
      ...requiredModifierItem,
      variations: [{ id: "small", name: "Small" }],
      supportsSplitPizza: true,
    };

    const validation = validateDealChooserItemConfiguration({
      deal: flexibleDeal,
      item,
      configuration,
    });

    expect(validation.itemError).toBeUndefined();
    expect(validation.groupErrors).toEqual({});
    expect(
      buildDealCartItemPayload({
        deal: flexibleDeal,
        item,
        branchId: "branch-1",
        configuration,
      })
    ).toEqual({
      branchId: "branch-1",
      menuItemId: "pizza",
      dealId: "deal-1",
      quantity: 1,
      modifierSelections: configuration.modifierSelections,
    });
  });
});
