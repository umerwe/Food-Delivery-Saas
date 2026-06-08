import { normalizeArray, toNumber } from "./product-normalizers";

type ModifierReference = {
  id?: string | number | null;
  name?: string | null;
  priceDelta?: number | string | null;
  itemPriceOverrides?: ModifierPriceSource[];
  variationPriceOverrides?: VariationPriceOverrideSource[];
  [key: string]: unknown;
};

type ModifierPriceSource = {
  id?: string | number | null;
  modifierId?: string | number | null;
  modifier?: ModifierReference | null;
  priceDelta?: number | string | null;
  price?: number | string | null;
  [key: string]: unknown;
} | null | undefined;

type VariationPriceOverrideSource = ModifierPriceSource & {
  variationId?: string | number | null;
  variation?: { id?: string | number | null } | null;
  modifierPriceOverrides?: ModifierPriceSource[];
};

type ModifierGroupSource = {
  id?: string | number | null;
  modifiers?: ModifierReference[];
  modifierGroup?: ModifierGroupSource | null;
  [key: string]: unknown;
} | null | undefined;

type ModifierLinkSource = {
  id?: string | number | null;
  modifier?: ModifierReference | null;
  modifierGroup?: ModifierGroupSource;
  [key: string]: unknown;
} | null | undefined;

export type ModifierPricingMenuItem = {
  id?: string | number | null;
  name?: string | null;
  variationPriceOverrides?: VariationPriceOverrideSource[];
  modifierPriceOverrides?: ModifierPriceSource[];
  modifiers?: ModifierPriceSource[];
  modifierGroups?: ModifierGroupSource[];
  categoryModifierGroups?: ModifierGroupSource[];
  modifierLinks?: ModifierLinkSource[];
  category?: {
    modifierGroups?: ModifierGroupSource[];
    categoryModifierGroups?: ModifierGroupSource[];
    modifierLinks?: ModifierLinkSource[];
  } | null;
};

const normalizeId = (value: unknown) => String(value ?? "");

const getModifierId = (source: ModifierPriceSource) => {
  if (!source) return "";

  if ("modifierId" in source && source.modifierId !== undefined && source.modifierId !== null) {
    return normalizeId(source.modifierId);
  }

  if ("modifier" in source && source.modifier?.id) {
    return normalizeId(source.modifier.id);
  }

  if ("id" in source && source.id !== undefined && source.id !== null) {
    return normalizeId(source.id);
  }

  return "";
};

const getVariationId = (source: VariationPriceOverrideSource | null | undefined) => {
  if (!source) return "";

  return normalizeId(source.variationId ?? source.id ?? source.variation?.id);
};

const getPriceDelta = (source: ModifierPriceSource) => {
  if (!source) return null;

  if ("priceDelta" in source && source.priceDelta !== undefined && source.priceDelta !== null) {
    return toNumber(source.priceDelta, 0);
  }

  if ("price" in source && source.price !== undefined && source.price !== null) {
    return toNumber(source.price, 0);
  }

  return null;
};

const findVariationOverride = (
  item: ModifierPricingMenuItem,
  selectedVariationId?: string | null
) => {
  const variationId = normalizeId(selectedVariationId);

  if (!variationId) return null;

  return (
    normalizeArray<VariationPriceOverrideSource>(item.variationPriceOverrides).find(
      (override) => getVariationId(override) === variationId
    ) ?? null
  );
};

const findModifierPrice = (
  sources: ModifierPriceSource[] | undefined,
  modifierId: string
) => {
  const source = normalizeArray<ModifierPriceSource>(sources).find(
    (entry) => getModifierId(entry) === modifierId
  );

  return getPriceDelta(source);
};

const getGroupsFromSource = (source: ModifierGroupSource): ModifierGroupSource[] => {
  if (!source) return [];

  if ("modifierGroup" in source && source.modifierGroup) {
    return [source.modifierGroup];
  }

  return [source];
};

const getItemModifierGroups = (item: ModifierPricingMenuItem) => {
  return [
    ...normalizeArray<ModifierGroupSource>(item.modifierGroups),
    ...normalizeArray<ModifierGroupSource>(item.categoryModifierGroups),
    ...normalizeArray<ModifierGroupSource>(item.category?.modifierGroups),
    ...normalizeArray<ModifierGroupSource>(item.category?.categoryModifierGroups),
    ...normalizeArray<ModifierLinkSource>(item.modifierLinks).map((link) => link?.modifierGroup),
    ...normalizeArray<ModifierLinkSource>(item.category?.modifierLinks).map((link) => link?.modifierGroup),
  ].flatMap(getGroupsFromSource);
};

const getItemModifierCandidates = (item: ModifierPricingMenuItem) => {
  return [
    ...normalizeArray<ModifierPriceSource>(item.modifiers),
    ...getItemModifierGroups(item).flatMap((group) =>
      normalizeArray<ModifierReference>(group?.modifiers)
    ),
  ];
};

const getModifierItemPriceOverrides = (modifier: ModifierPriceSource) => {
  if (!modifier || !("itemPriceOverrides" in modifier)) return [];

  return normalizeArray<ModifierPriceSource>(
    modifier.itemPriceOverrides as ModifierPriceSource[] | undefined
  );
};

export const getModifierPriceForVariation = ({
  item,
  selectedVariation,
  selectedVariationId,
  modifierId,
}: {
  item: ModifierPricingMenuItem;
  selectedVariation?: VariationPriceOverrideSource | null;
  selectedVariationId?: string | null;
  modifierId: string;
}): number => {
  const normalizedModifierId = normalizeId(modifierId);

  if (!normalizedModifierId) return 0;

  const selectedVariationModifierPrice = findModifierPrice(
    selectedVariation?.modifierPriceOverrides,
    normalizedModifierId
  );

  if (selectedVariationModifierPrice !== null) {
    return selectedVariationModifierPrice;
  }

  const variation = findVariationOverride(item, selectedVariationId);
  const variationModifierPrice = findModifierPrice(
    variation?.modifierPriceOverrides,
    normalizedModifierId
  );

  if (variationModifierPrice !== null) {
    return variationModifierPrice;
  }

  const itemOverridePrice = findModifierPrice(
    item.modifierPriceOverrides,
    normalizedModifierId
  );

  if (itemOverridePrice !== null) {
    return itemOverridePrice;
  }

  const itemModifier = getItemModifierCandidates(item).find(
    (modifier) => getModifierId(modifier) === normalizedModifierId
  );

  const modifierVariationPrice = findModifierPrice(
    normalizeArray<VariationPriceOverrideSource>(
      itemModifier && "variationPriceOverrides" in itemModifier
        ? itemModifier.variationPriceOverrides
        : undefined
    ).filter((override) => getVariationId(override) === normalizeId(selectedVariationId)),
    normalizedModifierId
  );

  if (modifierVariationPrice !== null) {
    return modifierVariationPrice;
  }

  const modifierItemOverridePrice = findModifierPrice(
    getModifierItemPriceOverrides(itemModifier),
    normalizedModifierId
  );

  if (modifierItemOverridePrice !== null) {
    return modifierItemOverridePrice;
  }

  const itemModifierPrice = getPriceDelta(itemModifier);

  if (itemModifierPrice !== null) {
    return itemModifierPrice;
  }

  const groupModifier = getItemModifierGroups(item)
    .flatMap((group) => normalizeArray<ModifierReference>(group?.modifiers))
    .find((modifier) => normalizeId(modifier?.id) === normalizedModifierId);

  return toNumber(groupModifier?.priceDelta, 0);
};

export const formatModifierPriceDelta = (value: number | string | null | undefined) => {
  const amount = toNumber(value, 0);

  if (amount === 0) return "$0.00";

  const sign = amount > 0 ? "+" : "-";

  return `${sign}$${Math.abs(amount).toFixed(2)}`;
};
