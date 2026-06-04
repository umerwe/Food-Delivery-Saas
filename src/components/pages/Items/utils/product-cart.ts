import type { CartPayload, MenuItem, MenuVariation, ModifierSelectionMap } from "../types";
import { buildModifierSelections } from "./modifier-selections";

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

  if (shouldSendDealId && dealId) {
    payload.dealId = dealId;
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
