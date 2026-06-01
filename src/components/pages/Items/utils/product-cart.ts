import type { CartPayload, MenuItem, MenuVariation, ModifierSelectionMap } from "../types";

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
  instructions?: string;
  splitPizzaEnabled: boolean;
  splitPizzaItem: MenuItem | null;
  includeMenuItem: boolean;
  includeBranch: boolean;
  clearSectionsWhenEmpty: boolean;
};

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
  instructions,
  splitPizzaEnabled,
  splitPizzaItem,
  includeMenuItem,
  includeBranch,
  clearSectionsWhenEmpty,
}: CartPayloadBuilderInput): CartPayload & Record<string, unknown> => {
  const splitSections = getSplitSections({ splitPizzaEnabled, splitPizzaItem, item });
  const restaurantMenuId = getRestaurantMenuId(item);

  const payload: CartPayload & Record<string, unknown> = {
    ...(includeBranch ? { branchId } : {}),
    ...(includeMenuItem ? { menuItemId: item?.id } : {}),
    ...(restaurantMenuId ? { restaurantMenuId } : {}),
    variationId: selectedVariation?.id || null,
    quantity: qty,
    modifiers: buildModifiersPayload(selectedModifiers),
    note: instructions?.trim() || "",
  };

  if (splitSections) {
    payload.sections = splitSections;
  } else if (clearSectionsWhenEmpty) {
    payload.sections = [];
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
