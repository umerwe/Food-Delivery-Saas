import type { CustomerDeal, CustomerDealMenuItem } from "@/types/customer-deals";
import type { AddCartItemPayload, CartModifierSelectionInput } from "@/types/cart";

export type DealCartItemInput = AddCartItemPayload;

export type DealActionKind = "AUTO_ADD" | "OPEN_CHOOSER";

const CUSTOMIZATION_FIELDS = [
  "variations",
  "modifierGroups",
  "modifiers",
  "modifierLinks",
] as const;

const hasOptions = (value: unknown) => Array.isArray(value) && value.length > 0;

const getRequiredQuantity = (deal: CustomerDeal) => {
  const parsed = Number(deal.dealRequiredQuantity);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null;
};

const getItemsLabel = (count: number) => `Any ${count} Item${count === 1 ? "" : "s"}`;

export const isFixedItemDeal = (deal: CustomerDeal) =>
  deal.dealSelectionMode === "FIXED_ITEMS";

export const isFlexibleItemDeal = (deal: CustomerDeal) =>
  deal.dealSelectionMode === "FLEXIBLE_ITEMS" &&
  deal.scopeMenuItems.length > 0 &&
  deal.scopeCategories.length === 0;

export const isFlexibleCategoryDeal = (deal: CustomerDeal) =>
  deal.dealSelectionMode === "FLEXIBLE_ITEMS" &&
  deal.scopeCategories.length > 0;

export const isFlexibleAllItemsDeal = (deal: CustomerDeal) =>
  deal.dealSelectionMode === "FLEXIBLE_ITEMS" &&
  deal.scopeMenuItems.length === 0 &&
  deal.scopeCategories.length === 0 &&
  deal.applyMode === "ALL_ITEMS";

export const requiresCustomizationForDealItem = (item: CustomerDealMenuItem): boolean => {
  if (item.requiresCustomization === true || item.hasConfigurableOptions === true) {
    return true;
  }

  if (item.requiresCustomization === false || item.hasConfigurableOptions === false) {
    return false;
  }

  return CUSTOMIZATION_FIELDS.some((field) => {
    const value = item[field];
    return hasOptions(value);
  });
};

const supportsDealIdCartPayload = (item: CustomerDealMenuItem) =>
  item.supportsDealIdCartPayload === true ||
  item.supportsDealCartPayload === true ||
  item.isDealMenuItem === true;

export const hasDealMenuItemModifierOptions = (item: CustomerDealMenuItem) =>
  hasOptions(item.modifierGroups) || hasOptions(item.modifiers) || hasOptions(item.modifierLinks);

export const hasUnsupportedDealMenuItemCustomization = (item: CustomerDealMenuItem) =>
  hasOptions(item.variations) || item.supportsSplitPizza === true;

export const isDealMenuItemReadyMade = (item: CustomerDealMenuItem): boolean =>
  supportsDealIdCartPayload(item) &&
  !hasDealMenuItemModifierOptions(item) &&
  !hasUnsupportedDealMenuItemCustomization(item);

export const isDealMenuItemCustomizable = (item: CustomerDealMenuItem): boolean =>
  supportsDealIdCartPayload(item) &&
  hasDealMenuItemModifierOptions(item) &&
  !hasUnsupportedDealMenuItemCustomization(item);

export const canSendDealIdForReadyMadeItem = (
  deal: CustomerDeal,
  item: CustomerDealMenuItem
): boolean => Boolean(deal.id && item.id && isDealMenuItemReadyMade(item));

export const canSendDealIdWithModifierSelections = (
  deal: CustomerDeal,
  item: CustomerDealMenuItem
): boolean => Boolean(deal.id && item.id && isDealMenuItemCustomizable(item));

export const shouldSendDealIdForCartItem = (
  deal: CustomerDeal,
  item: CustomerDealMenuItem
): boolean =>
  isFixedItemDeal(deal) &&
  deal.scopeMenuItems.length === 1 &&
  canSendDealIdForReadyMadeItem(deal, item);

export const shouldIncludeDealIdInCartPayload = ({
  deal,
  item,
  hasCustomization,
}: {
  deal?: CustomerDeal | null;
  item?: CustomerDealMenuItem | null;
  hasCustomization?: boolean;
}) => {
  if (!deal || !item || hasCustomization) {
    return false;
  }

  if (isFlexibleCategoryDeal(deal)) {
    return false;
  }

  return canSendDealIdForReadyMadeItem(deal, item);
};

export const canAutoAddDealItem = (item: CustomerDealMenuItem) =>
  !requiresCustomizationForDealItem(item) || isDealMenuItemReadyMade(item);

export const canAutoAddFixedDeal = (deal: CustomerDeal) =>
  isFixedItemDeal(deal) &&
  deal.scopeMenuItems.length > 0 &&
  deal.scopeMenuItems.every(canAutoAddDealItem);

export const canUseInlineFlexibleDealSelection = (deal: CustomerDeal) =>
  isFlexibleItemDeal(deal) &&
  deal.scopeMenuItems.length > 0 &&
  deal.scopeMenuItems.every(canAutoAddDealItem);

export const getDealImage = (deal: CustomerDeal): string | null => {
  const scopedItemImage = deal.scopeMenuItems.find(({ imageUrl }) => imageUrl)?.imageUrl;
  const scopedCategoryImage = deal.scopeCategories.find(({ imageUrl }) => imageUrl)?.imageUrl;

  return deal.thumbnailUrl || deal.imageUrl || scopedItemImage || scopedCategoryImage || null;
};

export const getDealTypeLabel = (deal: CustomerDeal) => {
  const requiredQuantity = getRequiredQuantity(deal);

  if (isFlexibleCategoryDeal(deal)) {
    return requiredQuantity
      ? `Any ${requiredQuantity} from Categories`
      : "Any from Categories";
  }

  if (isFlexibleItemDeal(deal)) {
    return requiredQuantity ? getItemsLabel(requiredQuantity) : "Any Items";
  }

  if (isFlexibleAllItemsDeal(deal)) {
    return requiredQuantity ? getItemsLabel(requiredQuantity) : "Any Items";
  }

  return "Fixed Combo";
};

export const getDealRequirementText = (deal: CustomerDeal) => {
  const requiredQuantity = getRequiredQuantity(deal);

  if (isFlexibleItemDeal(deal)) {
    return requiredQuantity
      ? `Choose any ${requiredQuantity} from ${deal.scopeMenuItems.length} items`
      : "Choose from selected items";
  }

  if (isFlexibleCategoryDeal(deal)) {
    return requiredQuantity
      ? `Choose any ${requiredQuantity} from selected categories`
      : "Choose from selected categories";
  }

  if (isFlexibleAllItemsDeal(deal)) {
    return requiredQuantity
      ? `Choose any ${requiredQuantity} item${requiredQuantity === 1 ? "" : "s"}`
      : "Choose from available items";
  }

  const itemCount = deal.scopeMenuItems.length;

  return itemCount > 0 ? `Includes ${itemCount} selected items` : "";
};

export const getDealActionLabel = (deal: CustomerDeal) => {
  if (isFlexibleCategoryDeal(deal)) {
    return "Browse Items";
  }

  if (isFlexibleItemDeal(deal)) {
    return "Choose Items";
  }

  if (isFlexibleAllItemsDeal(deal)) {
    return "Choose Items";
  }

  return "Add Deal";
};

export const getDealActionKind = (deal: CustomerDeal): DealActionKind =>
  canAutoAddFixedDeal(deal) ? "AUTO_ADD" : "OPEN_CHOOSER";

const buildPayload = (branchId: string, menuItemIds: string[]): DealCartItemInput[] => {
  const resolvedBranchId = branchId.trim();

  if (!resolvedBranchId) {
    return [];
  }

  return menuItemIds
    .map((id) => id.trim())
    .filter(Boolean)
    .map((menuItemId) => ({
      branchId: resolvedBranchId,
      menuItemId,
      quantity: 1,
    }));
};

const trimId = (value: string) => value.trim();

export const buildReadyMadeDealCartItemPayload = ({
  deal,
  item,
  branchId,
}: {
  deal: CustomerDeal;
  item: CustomerDealMenuItem;
  branchId: string;
}): AddCartItemPayload => ({
  branchId: trimId(branchId),
  menuItemId: trimId(item.id),
  dealId: trimId(deal.id),
  quantity: 1,
});

export const buildCustomizableDealCartItemPayload = ({
  deal,
  item,
  branchId,
  modifierSelections,
}: {
  deal: CustomerDeal;
  item: CustomerDealMenuItem;
  branchId: string;
  modifierSelections: CartModifierSelectionInput[];
}): AddCartItemPayload => ({
  branchId: trimId(branchId),
  menuItemId: trimId(item.id),
  dealId: trimId(deal.id),
  quantity: 1,
  modifierSelections,
});

export const buildFixedDealCartItemsInput = (
  deal: CustomerDeal,
  branchId: string
): DealCartItemInput[] => {
  if (!isFixedItemDeal(deal)) {
    return [];
  }

  const resolvedBranchId = branchId.trim();

  if (!resolvedBranchId) {
    return [];
  }

  return deal.scopeMenuItems
    .filter(canAutoAddDealItem)
    .map((item) =>
      canSendDealIdForReadyMadeItem(deal, item)
        ? buildReadyMadeDealCartItemPayload({ deal, item, branchId: resolvedBranchId })
        : {
            branchId: resolvedBranchId,
            menuItemId: item.id.trim(),
            quantity: 1,
          }
    )
    .filter((payload) => payload.menuItemId);
};

export const buildSelectedFlexibleDealCartItemsInput = (
  deal: CustomerDeal,
  branchId: string,
  selectedMenuItemIds: string[],
  eligibleMenuItems: CustomerDealMenuItem[] = deal.scopeMenuItems
): DealCartItemInput[] => {
  if (deal.dealSelectionMode !== "FLEXIBLE_ITEMS") {
    return [];
  }

  const eligibleIds = new Set(
    eligibleMenuItems
      .filter(canAutoAddDealItem)
      .map(({ id }) => id.trim())
      .filter(Boolean)
  );
  const eligibleItemsById = new Map(
    eligibleMenuItems
      .filter(canAutoAddDealItem)
      .map((item) => [item.id.trim(), item])
  );
  const uniqueSelectedIds = Array.from(new Set(selectedMenuItemIds));
  const resolvedBranchId = branchId.trim();

  if (!resolvedBranchId) {
    return [];
  }

  return uniqueSelectedIds
    .map((menuItemId) => menuItemId.trim())
    .filter((menuItemId) => eligibleIds.has(menuItemId))
    .map((menuItemId) => {
      const item = eligibleItemsById.get(menuItemId);

      if (item && canSendDealIdForReadyMadeItem(deal, item)) {
        return buildReadyMadeDealCartItemPayload({
          deal,
          item,
          branchId: resolvedBranchId,
        });
      }

      return {
        branchId: resolvedBranchId,
        menuItemId,
        quantity: 1,
      };
    });
};

export const buildDealCartItemsInput = buildFixedDealCartItemsInput;
