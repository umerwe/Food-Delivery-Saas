import {
  buildCustomizableDealCartItemPayload,
  buildReadyMadeDealCartItemPayload,
  canSendDealIdForReadyMadeItem,
  canSendDealIdWithModifierSelections,
} from "@/components/pages/Home/utils/customer-deal-cart";
import {
  buildModifierSelections,
  validateModifierSelections,
} from "@/components/pages/Items/utils/modifier-selections";
import type { AddCartItemPayload, CartModifierSelectionInput } from "@/types/cart";
import type { CustomerDeal, CustomerDealMenuItem } from "@/types/customer-deals";

export type DealChooserModifier = {
  id?: string | number | null;
  name?: string | null;
  modifierGroupId?: string | number | null;
  priceDelta?: string | number | null;
};

export type DealChooserModifierGroup = {
  id?: string | number | null;
  name?: string | null;
  selectionType?: "SINGLE" | "MULTIPLE" | string | null;
  minSelect?: string | number | null;
  maxSelect?: string | number | null;
  modifiers?: DealChooserModifier[];
};

export type DealChooserSelectedModifier = {
  id: string;
  name: string;
  selectedQuantity: number;
};

export type DealChooserItemConfiguration = {
  menuItemId: string;
  modifierSelections: CartModifierSelectionInput[];
  note?: string;
};

export type DealChooserItemValidationResult = {
  itemError?: string;
  groupErrors: Record<string, string>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const getDealChooserId = (value: unknown) => String(value ?? "").trim();

export const getDealChooserNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const getDealChooserModifierName = (modifier: DealChooserModifier) =>
  String(modifier.name || "Option").trim();

export const getDealChooserModifierGroups = (
  item: CustomerDealMenuItem | null
): DealChooserModifierGroup[] => {
  if (Array.isArray(item?.modifierGroups) && item.modifierGroups.length > 0) {
    return item.modifierGroups.filter(isRecord).map((group) => ({
      id: group.id as string | number | null | undefined,
      name: typeof group.name === "string" ? group.name : null,
      selectionType: typeof group.selectionType === "string" ? group.selectionType : null,
      minSelect: typeof group.minSelect === "string" || typeof group.minSelect === "number" ? group.minSelect : null,
      maxSelect: typeof group.maxSelect === "string" || typeof group.maxSelect === "number" ? group.maxSelect : null,
      modifiers: Array.isArray(group.modifiers)
        ? group.modifiers.filter(isRecord).map((modifier) => ({
            id: modifier.id as string | number | null | undefined,
            name: typeof modifier.name === "string" ? modifier.name : null,
            priceDelta: typeof modifier.priceDelta === "string" || typeof modifier.priceDelta === "number" ? modifier.priceDelta : null,
          }))
        : [],
    }));
  }

  const linkedGroups = new Map<string, DealChooserModifierGroup>();

  if (Array.isArray(item?.modifierLinks)) {
    item.modifierLinks.filter(isRecord).forEach((link) => {
      const groupId = getDealChooserId(link.modifierGroupId);
      const modifier = isRecord(link.modifier) ? link.modifier : null;
      const modifierId = getDealChooserId(link.modifierId || modifier?.id);

      if (!groupId || !modifierId) return;

      const currentGroup = linkedGroups.get(groupId) || {
        id: groupId,
        name: "Options",
        selectionType: "MULTIPLE",
        minSelect: 0,
        maxSelect: null,
        modifiers: [],
      };

      currentGroup.modifiers = [
        ...(currentGroup.modifiers || []),
        {
          id: modifierId,
          name: typeof modifier?.name === "string" ? modifier.name : "Option",
          modifierGroupId: groupId,
          priceDelta: typeof modifier?.priceDelta === "string" || typeof modifier?.priceDelta === "number" ? modifier.priceDelta : null,
        },
      ];
      linkedGroups.set(groupId, currentGroup);
    });
  }

  if (linkedGroups.size > 0) {
    return Array.from(linkedGroups.values());
  }

  const directModifiers = Array.isArray(item?.modifiers)
    ? item.modifiers.filter(isRecord)
    : [];
  const directModifierGroups = new Map<string, DealChooserModifierGroup>();

  directModifiers.forEach((modifier) => {
    const groupId = getDealChooserId(modifier.modifierGroupId);
    const modifierId = getDealChooserId(modifier.id);

    if (!groupId || !modifierId) return;

    const currentGroup = directModifierGroups.get(groupId) || {
      id: groupId,
      name: "Options",
      selectionType: "MULTIPLE",
      minSelect: 0,
      maxSelect: null,
      modifiers: [],
    };

    currentGroup.modifiers = [
      ...(currentGroup.modifiers || []),
      {
        id: modifierId,
        name: typeof modifier.name === "string" ? modifier.name : "Option",
        modifierGroupId: groupId,
        priceDelta: typeof modifier.priceDelta === "string" || typeof modifier.priceDelta === "number" ? modifier.priceDelta : null,
      },
    ];
    directModifierGroups.set(groupId, currentGroup);
  });

  return Array.from(directModifierGroups.values());
};

export const getSelectedModifiersByGroup = (
  groups: DealChooserModifierGroup[],
  configuration: DealChooserItemConfiguration | undefined
): Record<string, DealChooserSelectedModifier[]> => {
  const selectionsByGroup: Record<string, DealChooserSelectedModifier[]> = {};

  for (const selection of configuration?.modifierSelections ?? []) {
    const groupId = getDealChooserId(selection.modifierGroupId);
    const group = groups.find((entry) => getDealChooserId(entry.id) === groupId);
    const groupModifiers = Array.isArray(group?.modifiers) ? group.modifiers : [];

    selectionsByGroup[groupId] = selection.modifiers.map((modifier) => {
      const modifierId = getDealChooserId(modifier.modifierId);
      const matchedModifier = groupModifiers.find(
        (entry) => getDealChooserId(entry.id) === modifierId
      );

      return {
        id: modifierId,
        name: matchedModifier ? getDealChooserModifierName(matchedModifier) : "Option",
        selectedQuantity: Math.max(1, Math.floor(getDealChooserNumber(modifier.quantity, 1))),
      };
    });
  }

  return selectionsByGroup;
};

export const getDealChooserGroupHelperText = (group: DealChooserModifierGroup) => {
  const minSelect = Math.max(0, getDealChooserNumber(group.minSelect, 0));
  const modifiersCount = Array.isArray(group.modifiers) ? group.modifiers.length : 0;
  const rawMaxSelect = getDealChooserNumber(group.maxSelect, modifiersCount);
  const selectionType = group.selectionType === "SINGLE" ? "SINGLE" : "MULTIPLE";
  const maxSelect = selectionType === "SINGLE"
    ? 1
    : Math.max(minSelect, rawMaxSelect > 0 ? rawMaxSelect : modifiersCount);

  if (minSelect > 0 && maxSelect > minSelect) {
    return `Choose ${minSelect} to ${maxSelect}`;
  }

  if (minSelect > 0) {
    return `Choose ${minSelect}`;
  }

  if (maxSelect > 0 && maxSelect < modifiersCount) {
    return `Choose up to ${maxSelect}`;
  }

  return "Optional";
};

export const isDealChooserItemConfigurable = (item: CustomerDealMenuItem) =>
  getDealChooserModifierGroups(item).length > 0;

export const canUseBackendDealItemFlow = (
  deal: CustomerDeal,
  item: CustomerDealMenuItem
) => {
  if (deal.dealSelectionMode === "FLEXIBLE_ITEMS") {
    return true;
  }

  return (
    item.supportsDealIdCartPayload === true ||
    item.supportsDealCartPayload === true ||
    item.isDealMenuItem === true ||
    canSendDealIdForReadyMadeItem(deal, item) ||
    canSendDealIdWithModifierSelections(deal, item)
  );
};

export const validateDealChooserSelectedCount = ({
  selectedCount,
  requiredQuantity,
}: {
  selectedCount: number;
  requiredQuantity: number;
}) => {
  if (selectedCount < requiredQuantity) {
    return `Select ${requiredQuantity} item${requiredQuantity === 1 ? "" : "s"} for this deal.`;
  }

  if (selectedCount > requiredQuantity) {
    return `You can select only ${requiredQuantity} item${requiredQuantity === 1 ? "" : "s"} for this deal.`;
  }

  return null;
};

export const validateDealChooserItemConfiguration = ({
  deal,
  item,
  configuration,
}: {
  deal: CustomerDeal;
  item: CustomerDealMenuItem;
  configuration?: DealChooserItemConfiguration;
}): DealChooserItemValidationResult => {
  const groups = getDealChooserModifierGroups(item);
  const selectedModifiersByGroup = getSelectedModifiersByGroup(groups, configuration);
  const validation = validateModifierSelections(groups, selectedModifiersByGroup);

  return {
    itemError: validation.isValid ? undefined : undefined,
    groupErrors: validation.errors,
  };
};

export const buildDealCartItemPayload = ({
  deal,
  item,
  branchId,
  configuration,
}: {
  deal: CustomerDeal;
  item: CustomerDealMenuItem;
  branchId: string;
  configuration?: DealChooserItemConfiguration;
}): AddCartItemPayload => {
  const modifierSelections = configuration?.modifierSelections ?? [];

  if (
    modifierSelections.length > 0 &&
    (canSendDealIdWithModifierSelections(deal, item) ||
      deal.dealSelectionMode === "FLEXIBLE_ITEMS")
  ) {
    return buildCustomizableDealCartItemPayload({
      deal,
      item,
      branchId,
      modifierSelections,
    });
  }

  if (
    canSendDealIdForReadyMadeItem(deal, item) ||
    deal.dealSelectionMode === "FLEXIBLE_ITEMS"
  ) {
    return buildReadyMadeDealCartItemPayload({
      deal,
      item,
      branchId,
    });
  }

  return {
    branchId: branchId.trim(),
    menuItemId: item.id.trim(),
    dealId: deal.id.trim(),
    quantity: 1,
    ...(modifierSelections.length > 0 ? { modifierSelections } : {}),
    ...(configuration?.note ? { note: configuration.note } : {}),
  };
};
