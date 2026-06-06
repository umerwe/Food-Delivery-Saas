import type { CartPayload, MenuItem, MenuVariation, ModifierSelectionMap } from "../types";
import { buildModifierSelections } from "./modifier-selections";
import type { AddCartItemPayload, CartModifierSelectionInput } from "@/types/cart";

const getId = (value: unknown) => {
  if (value === undefined || value === null) return "";
  return String(value);
};

export const buildModifiersPayload = (selectionMap: ModifierSelectionMap) =>
  Object.values(selectionMap)
    .flat()
    .map(({ id }) => ({
      modifierId: id,
      quantity: 1,
    }));

type CartPayloadBuilderInput = {
  item: MenuItem | null;
  branchId?: string | null;
  selectedVariation?: MenuVariation | null;
  qty: number;
  selectedModifiers: ModifierSelectionMap;
  modifierGroups?: CartPayloadBuilderModifierGroup[];
  instructions?: string;
  splitPizzaEnabled: boolean;
  splitPizzaItem: MenuItem | null;
  includeMenuItem: boolean;
  includeBranch: boolean;
  clearSectionsWhenEmpty: boolean;
  dealId?: string | null;
  shouldSendDealId?: boolean;
  isDealMenuItemContext?: boolean;
};

type CartPayloadBuilderModifierGroup = NonNullable<MenuItem["modifierGroups"]>[number];

const getSplitSections = ({
  splitPizzaEnabled,
  splitPizzaItem,
  item,
}: Pick<CartPayloadBuilderInput, "splitPizzaEnabled" | "splitPizzaItem" | "item">) =>
  splitPizzaEnabled && splitPizzaItem?.id
    ? [
        {
          slot: "LEFT",
          menuItemId: item?.id,
        },
        {
          slot: "RIGHT",
          menuItemId: splitPizzaItem.id,
        },
      ]
    : undefined;

const getRestaurantMenuId = (item: MenuItem | null) =>
  getId(
    item?.restaurantMenuId ||
      item?.restaurantMenu?.id ||
      item?.menuLinks?.[0]?.restaurantMenuId ||
      item?.menuLinks?.[0]?.restaurantMenu?.id ||
      item?.menuLinks?.[0]?.menuId
  );

const hasOptions = (value: unknown) => Array.isArray(value) && value.length > 0;

const supportsDealIdCartPayload = (item: MenuItem | null) =>
  item?.supportsDealIdCartPayload === true ||
  item?.supportsDealCartPayload === true ||
  item?.isDealMenuItem === true;

export const hasDealMenuItemModifierOptions = (item: MenuItem | null) =>
  hasOptions(item?.modifierGroups) ||
  hasOptions(item?.modifiers) ||
  hasOptions(item?.modifierLinks);

export const hasUnsupportedDealMenuItemCustomization = (item: MenuItem | null) =>
  hasOptions(item?.variations) || item?.supportsSplitPizza === true;

export const isDealMenuItemReadyMade = (item: MenuItem | null): boolean =>
  supportsDealIdCartPayload(item) &&
  !hasDealMenuItemModifierOptions(item) &&
  !hasUnsupportedDealMenuItemCustomization(item);

export const isDealMenuItemCustomizable = (item: MenuItem | null): boolean =>
  supportsDealIdCartPayload(item) &&
  hasDealMenuItemModifierOptions(item) &&
  !hasUnsupportedDealMenuItemCustomization(item);

export const canSendDealIdForReadyMadeItem = (
  deal: { id?: string | null },
  item: MenuItem | null
): boolean => Boolean(deal.id && item?.id && isDealMenuItemReadyMade(item));

export const canSendDealIdWithModifierSelections = (
  deal: { id?: string | null },
  item: MenuItem | null
): boolean => Boolean(deal.id && item?.id && isDealMenuItemCustomizable(item));

export const shouldIncludeDealIdInCartPayload = ({
  deal,
  item,
  isDealMenuItem,
  hasModifierSelections,
  hasVariation,
  hasSplitSelection,
}: {
  deal?: { id?: string | null } | null;
  item?: MenuItem | null;
  isDealMenuItem?: boolean;
  hasModifierSelections?: boolean;
  hasVariation?: boolean;
  hasSplitSelection?: boolean;
}) => {
  if (!deal?.id || !item?.id || !isDealMenuItem || hasVariation || hasSplitSelection) {
    return false;
  }

  if (hasModifierSelections) {
    return canSendDealIdWithModifierSelections(deal, item);
  }

  return canSendDealIdForReadyMadeItem(deal, item);
};

const getStringId = (value: unknown) => String(value ?? "").trim();

export const buildReadyMadeDealCartItemPayload = ({
  deal,
  item,
  branchId,
}: {
  deal: { id?: string | null };
  item: MenuItem;
  branchId: string;
}): AddCartItemPayload => ({
  branchId: getStringId(branchId),
  menuItemId: getStringId(item.id),
  dealId: getStringId(deal.id),
  quantity: 1,
});

export const buildCustomizableDealCartItemPayload = ({
  deal,
  item,
  branchId,
  modifierSelections,
}: {
  deal: { id?: string | null };
  item: MenuItem;
  branchId: string;
  modifierSelections: CartModifierSelectionInput[];
}): AddCartItemPayload => ({
  branchId: getStringId(branchId),
  menuItemId: getStringId(item.id),
  dealId: getStringId(deal.id),
  quantity: 1,
  modifierSelections,
});

export const buildCartPayload = ({
  item,
  branchId,
  selectedVariation,
  qty,
  selectedModifiers,
  modifierGroups = [],
  instructions,
  splitPizzaEnabled,
  splitPizzaItem,
  includeMenuItem,
  includeBranch,
  clearSectionsWhenEmpty,
  dealId,
  shouldSendDealId = false,
  isDealMenuItemContext = false,
}: CartPayloadBuilderInput): CartPayload & Record<string, unknown> => {
  const splitSections = getSplitSections({ splitPizzaEnabled, splitPizzaItem, item });
  const restaurantMenuId = getRestaurantMenuId(item);

  const payload: CartPayload & Record<string, unknown> = {
    ...(includeBranch ? { branchId } : {}),
    ...(includeMenuItem ? { menuItemId: item?.id } : {}),
    ...(restaurantMenuId ? { restaurantMenuId } : {}),
    variationId: selectedVariation?.id || null,
    quantity: qty,
    note: instructions?.trim() || "",
  };

  const groupedFlowModifierGroups = modifierGroups.filter((group) => {
    const groupId = String(group?.id || "");
    return groupId && !groupId.startsWith("item-addons-") && groupId !== "__item_addons__";
  });
  const modifierSelections = buildModifierSelections(groupedFlowModifierGroups, selectedModifiers);

  if (groupedFlowModifierGroups.length > 0) {
    payload.modifierSelections = modifierSelections;
  } else {
    payload.modifiers = buildModifiersPayload(selectedModifiers);
  }

  if (splitSections) {
    payload.sections = splitSections;
  } else if (clearSectionsWhenEmpty) {
    payload.sections = [];
  }

  const shouldUseDealPayload =
    shouldSendDealId &&
    shouldIncludeDealIdInCartPayload({
      deal: { id: dealId },
      item,
      isDealMenuItem: isDealMenuItemContext || supportsDealIdCartPayload(item),
      hasModifierSelections: modifierSelections.length > 0,
      hasVariation: Boolean(selectedVariation?.id),
      hasSplitSelection: Boolean(splitSections),
    });

  if (shouldUseDealPayload && dealId) {
    payload.dealId = dealId;
    delete payload.variationId;
    delete payload.sections;

    if (groupedFlowModifierGroups.length > 0) {
      delete payload.modifiers;
      payload.modifierSelections = modifierSelections;
    } else {
      delete payload.modifiers;
      delete payload.modifierSelections;
    }
  }

  return payload;
};

export const getApiErrorMessage = (
  res: Record<string, unknown> | null | undefined,
  fallback = "Something went wrong"
) => {
  const errorValue = res?.error;
  const dataValue = res?.data;
  const errorRecord = typeof errorValue === "object" && errorValue !== null && !Array.isArray(errorValue) ? errorValue as Record<string, unknown> : null;
  const dataRecord = typeof dataValue === "object" && dataValue !== null && !Array.isArray(dataValue) ? dataValue as Record<string, unknown> : null;
  const dataErrorValue = dataRecord?.error;
  const dataErrorRecord = typeof dataErrorValue === "object" && dataErrorValue !== null && !Array.isArray(dataErrorValue) ? dataErrorValue as Record<string, unknown> : null;

  const candidate =
    errorRecord?.message ||
    res?.message ||
    res?.error ||
    dataRecord?.message ||
    dataErrorRecord?.message;

  if (typeof candidate === "string" && candidate.trim()) {
    return candidate;
  }

  if (Array.isArray(candidate) && candidate.length) {
    return candidate.filter(Boolean).join(", ");
  }

  return fallback;
};

export const isCartBranchConflict = (res: Record<string, unknown> | null | undefined) => {
  const message = getApiErrorMessage(res, "")
    .toLowerCase()
    .trim();

  return (
    message.includes("cart already contains items from another branch") ||
    message.includes("clear it before switching branches")
  );
};
