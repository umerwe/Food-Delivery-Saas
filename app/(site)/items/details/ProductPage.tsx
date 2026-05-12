"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import TestimonialsSection from "./Testimonials";
import useApi from "@/hooks/useApi";
import { useAuthContext } from "@/context/AuthContext";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Download, Eye, Loader2, Minus, Plus, X } from "lucide-react";
import AsyncSelect from "@/components/ui/AsyncSelect";

type ItemPriceOverride = {
  id?: string;
  menuItemId?: string | null;
  modifierId?: string | null;
  variationId?: string | null;
  price?: string | number | null;
  priceDelta?: string | number | null;
  modifier?: Modifier;
};

type VariationPriceOverride = {
  id?: string;
  menuItemId?: string | null;
  variationId?: string | null;
  modifierId?: string | null;
  price?: string | number | null;
  pickupPrice?: string | number | null;
  displayText?: string | null;
  priceDelta?: string | number | null;
  modifier?: Modifier;
  variation?: any;
  modifierPriceOverrides?: VariationPriceOverride[];
};

type MenuVariation = {
  id: string;
  categoryId?: string;
  name: string;
  description?: string | null;
  price?: string | number;
  pickupPrice?: string | number | null;
  displayText?: string | null;
  sortOrder?: number;
  isDefault?: boolean;
  isActive?: boolean;
  modifierPriceOverrides?: VariationPriceOverride[];
  itemPriceOverrides?: VariationPriceOverride[];
};

type Modifier = {
  id: string;
  modifierGroupId?: string;
  restaurantId?: string;
  name: string;
  description?: string | null;
  priceDelta?: string | number;
  sortOrder?: number;
  isActive?: boolean;
  itemPriceOverrides?: ItemPriceOverride[];
  variationPriceOverrides?: VariationPriceOverride[];
};

type SelectedModifier = Modifier & {
  selectedQuantity: number;
};

type RawModifierLink = {
  id?: string;
  modifierGroupId?: string;
  modifierId?: string;
  sortOrder?: number;
  modifier?: Modifier;
};

type ModifierGroup = {
  id: string;
  name: string;
  description?: string;
  minSelect?: number;
  maxSelect?: number;
  isRequired?: boolean;
  sortOrder?: number;
  isActive?: boolean;
  modifiers?: Modifier[];
  modifierLinks?: RawModifierLink[];
};

type ModifierLink = {
  id: string;
  variationId?: string | null;
  sortOrder?: number;
  modifierGroup: ModifierGroup;
};

type ModifierSelectionMap = Record<string, SelectedModifier[]>;

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const sortBySortOrder = <T extends { sortOrder?: number }>(items: T[]) => {
  return [...items].sort(
    (a, b) => toNumber(a?.sortOrder, 0) - toNumber(b?.sortOrder, 0)
  );
};

const hasText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text !== "" && text.toLowerCase() !== "null";
};

const normalizeApiList = (res: any) => {
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.items)) return res.items;
  return [];
};

const normalizeArray = (value: any): any[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [];
};

const getId = (value: any) => {
  if (value === undefined || value === null) return "";
  return String(value);
};

const getOverrideAmount = (
  override?: VariationPriceOverride | ItemPriceOverride | null
) => {
  if (!override) return null;

  if (override.priceDelta !== undefined && override.priceDelta !== null) {
    return toNumber(override.priceDelta, 0);
  }

  if (override.price !== undefined && override.price !== null) {
    return toNumber(override.price, 0);
  }

  return null;
};

const getOverrideMenuItemId = (override: any) =>
  getId(override?.menuItemId || override?.menuItem?.id);

const getOverrideVariationId = (override: any) =>
  getId(override?.variationId || override?.variation?.id);

const getOverrideModifierId = (override: any) =>
  getId(override?.modifierId || override?.modifier?.id);

const isGenericMenuItemOverride = (override: any) => {
  const value = override?.menuItemId;
  return value === null || value === undefined || value === "";
};

const findBestModifierOverride = ({
  overrides,
  modifierId,
  menuItemId,
  variationId,
}: {
  overrides?: any[];
  modifierId?: string;
  menuItemId?: string;
  variationId?: string;
}) => {
  if (!modifierId || !Array.isArray(overrides)) return null;

  const normalizedModifierId = String(modifierId);
  const normalizedMenuItemId = menuItemId ? String(menuItemId) : "";
  const normalizedVariationId = variationId ? String(variationId) : "";

  const matching = overrides.filter((override) => {
    return getOverrideModifierId(override) === normalizedModifierId;
  });

  if (!matching.length) return null;

  const isItemSpecific = (override: any) => {
    if (!normalizedMenuItemId) return false;
    return getOverrideMenuItemId(override) === normalizedMenuItemId;
  };

  const isExactVariation = (override: any) => {
    if (!normalizedVariationId) return false;
    return getOverrideVariationId(override) === normalizedVariationId;
  };

  const hasNoVariation = (override: any) => !getOverrideVariationId(override);

  if (normalizedVariationId) {
    const exactVariationMatches = matching.filter(isExactVariation);

    if (normalizedMenuItemId) {
      const exactItemVariation = exactVariationMatches.find(isItemSpecific);
      if (exactItemVariation) return exactItemVariation;
    }

    const exactGenericVariation = exactVariationMatches.find(
      isGenericMenuItemOverride
    );
    if (exactGenericVariation) return exactGenericVariation;

    if (exactVariationMatches[0]) return exactVariationMatches[0];

    const fallbackWithoutVariation = matching.filter(hasNoVariation);

    if (normalizedMenuItemId) {
      const itemFallback = fallbackWithoutVariation.find(isItemSpecific);
      if (itemFallback) return itemFallback;
    }

    const genericFallback = fallbackWithoutVariation.find(
      isGenericMenuItemOverride
    );
    if (genericFallback) return genericFallback;

    return fallbackWithoutVariation[0] || null;
  }

  if (normalizedMenuItemId) {
    const itemSpecific = matching.find(isItemSpecific);
    if (itemSpecific) return itemSpecific;
  }

  const generic = matching.find(isGenericMenuItemOverride);

  return generic || matching[0];
};

const findBestItemPriceOverride = ({
  overrides,
  menuItemId,
  variationId,
}: {
  overrides?: any[];
  menuItemId?: string;
  variationId?: string;
}) => {
  if (!variationId || !Array.isArray(overrides)) return null;

  const matching = overrides.filter((override) => {
    const overrideVariationId = getOverrideVariationId(override);
    return String(overrideVariationId) === String(variationId);
  });

  if (!matching.length) return null;

  if (menuItemId) {
    const itemSpecific = matching.find(
      (override) => getOverrideMenuItemId(override) === String(menuItemId)
    );

    if (itemSpecific) return itemSpecific;
  }

  return matching[0];
};

const normalizeModifier = (
  raw: any,
  extra?: Partial<Modifier>
): Modifier | null => {
  if (!raw?.id) return null;
  if (raw?.isActive === false) return null;

  return {
    id: String(raw.id),
    modifierGroupId: raw?.modifierGroupId,
    restaurantId: raw?.restaurantId,
    name: String(raw?.name || ""),
    description: raw?.description ?? "",
    priceDelta: raw?.priceDelta ?? 0,
    sortOrder: toNumber(raw?.sortOrder, 0),
    isActive: raw?.isActive !== false,
    itemPriceOverrides: Array.isArray(raw?.itemPriceOverrides)
      ? raw.itemPriceOverrides
      : [],
    variationPriceOverrides: Array.isArray(raw?.variationPriceOverrides)
      ? raw.variationPriceOverrides
      : [],
    ...extra,
  };
};

const getAllRawVariationSources = (menuItem: any) => {
  const fromVariationPriceOverrides = normalizeArray(
    menuItem?.variationPriceOverrides
  )
    .map((override) => ({
      ...(override?.variation || {}),
      id: override?.variationId || override?.variation?.id,
      price: override?.price ?? override?.variation?.price,
      pickupPrice: override?.pickupPrice ?? override?.variation?.pickupPrice,
      displayText: override?.displayText ?? override?.variation?.displayText,
      itemPriceOverrides: [
        ...(Array.isArray(override?.variation?.itemPriceOverrides)
          ? override.variation.itemPriceOverrides
          : []),
        override,
      ],
      modifierPriceOverrides: [
        ...(Array.isArray(override?.variation?.modifierPriceOverrides)
          ? override.variation.modifierPriceOverrides
          : []),
        ...(Array.isArray(override?.modifierPriceOverrides)
          ? override.modifierPriceOverrides
          : []),
      ],
    }))
    .filter((variation) => variation?.id);

  const fromCategoryVariationLinks = normalizeArray(
    menuItem?.category?.variationLinks
  )
    .map((link) => link?.variation)
    .filter(Boolean);

  return [
    ...normalizeArray(menuItem?.variations),
    ...fromVariationPriceOverrides,
    ...normalizeArray(menuItem?.category?.variations),
    ...fromCategoryVariationLinks,
  ];
};

const getVariationScopedModifierOverrides = (
  menuItem: any,
  variation?: MenuVariation | null
) => {
  if (!menuItem || !variation?.id) return [];

  const menuItemId = String(menuItem.id || "");
  const variationId = String(variation.id || "");

  const overrides: any[] = [];

  normalizeArray(menuItem?.variationPriceOverrides)
    .filter((entry) => getOverrideVariationId(entry) === variationId)
    .forEach((entry) => {
      normalizeArray(entry?.modifierPriceOverrides).forEach((modifierOverride) => {
        overrides.push({
          ...modifierOverride,
          menuItemId: entry?.menuItemId ?? menuItemId,
          variationId,
        });
      });

      normalizeArray(entry?.variation?.modifierPriceOverrides).forEach(
        (modifierOverride) => {
          overrides.push({
            ...modifierOverride,
            variationId: getOverrideVariationId(modifierOverride) || variationId,
          });
        }
      );
    });

  normalizeArray(variation?.modifierPriceOverrides).forEach((modifierOverride) => {
    overrides.push({
      ...modifierOverride,
      variationId: getOverrideVariationId(modifierOverride) || variationId,
    });
  });

  getAllRawVariationSources(menuItem)
    .filter((rawVariation) => String(rawVariation?.id || "") === variationId)
    .forEach((rawVariation) => {
      normalizeArray(rawVariation?.modifierPriceOverrides).forEach(
        (modifierOverride) => {
          overrides.push({
            ...modifierOverride,
            variationId: getOverrideVariationId(modifierOverride) || variationId,
          });
        }
      );

      normalizeArray(rawVariation?.itemPriceOverrides).forEach(
        (itemOverride) => {
          normalizeArray(itemOverride?.variation?.modifierPriceOverrides).forEach(
            (modifierOverride) => {
              overrides.push({
                ...modifierOverride,
                variationId:
                  getOverrideVariationId(modifierOverride) || variationId,
              });
            }
          );
        }
      );
    });

  return overrides;
};

const getModifierSideVariationOverrides = (menuItem: any, modifier: Modifier) => {
  const modifierId = String(modifier?.id || "");
  const overrides: any[] = [];

  normalizeArray(modifier?.variationPriceOverrides).forEach((override) => {
    overrides.push(override);
  });

  normalizeArray(menuItem?.modifierPriceOverrides)
    .filter((entry) => getOverrideModifierId(entry) === modifierId)
    .forEach((entry) => {
      normalizeArray(entry?.modifier?.variationPriceOverrides).forEach(
        (override) => {
          overrides.push(override);
        }
      );
    });

  return overrides;
};

export default function ProductPage() {
  const params = useSearchParams();
  const slug = params.get("slug");

  const { token } = useAuthContext();
  const { get, post } = useApi(token);
  const router = useRouter();

  const [item, setItem] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [qty, setQty] = useState(1);
  const [instructions, setInstructions] = useState("");

  const [infoOpen, setInfoOpen] = useState(false);

  const [selectedVariation, setSelectedVariation] =
    useState<MenuVariation | null>(null);

  const [selectedModifiers, setSelectedModifiers] =
    useState<ModifierSelectionMap>({});

  const [splitPizzaEnabled, setSplitPizzaEnabled] = useState(false);
  const [splitPizzaItem, setSplitPizzaItem] = useState<any>(null);

  const { user } = useAuth();
  const customerId = user?.id;
  const branchId = user?.branchId;
  const restaurantId =
    item?.restaurantId ||
    item?.restaurant?.id ||
    (user as any)?.restaurantId ||
    (user as any)?.profile?.restaurantId ||
    "";

  const getVariationDisplayPrice = (menuItem: any, variation: any) => {
    const variationId = String(variation?.id || variation?.variationId || "");

    const itemOverride =
      findBestItemPriceOverride({
        overrides: menuItem?.variationPriceOverrides,
        menuItemId: menuItem?.id,
        variationId,
      }) ||
      findBestItemPriceOverride({
        overrides: variation?.itemPriceOverrides,
        menuItemId: menuItem?.id,
        variationId,
      });

    if (itemOverride?.price !== undefined && itemOverride?.price !== null) {
      return itemOverride.price;
    }

    return variation?.price ?? menuItem?.basePrice ?? menuItem?.price ?? 0;
  };

  const getVariationPickupPrice = (menuItem: any, variation: any) => {
    const variationId = String(variation?.id || variation?.variationId || "");

    const itemOverride =
      findBestItemPriceOverride({
        overrides: menuItem?.variationPriceOverrides,
        menuItemId: menuItem?.id,
        variationId,
      }) ||
      findBestItemPriceOverride({
        overrides: variation?.itemPriceOverrides,
        menuItemId: menuItem?.id,
        variationId,
      });

    return itemOverride?.pickupPrice ?? variation?.pickupPrice ?? null;
  };

  const getVariationDisplayText = (menuItem: any, variation: any) => {
    const variationId = String(variation?.id || variation?.variationId || "");

    const itemOverride =
      findBestItemPriceOverride({
        overrides: menuItem?.variationPriceOverrides,
        menuItemId: menuItem?.id,
        variationId,
      }) ||
      findBestItemPriceOverride({
        overrides: variation?.itemPriceOverrides,
        menuItemId: menuItem?.id,
        variationId,
      });

    return itemOverride?.displayText ?? variation?.displayText ?? "";
  };

  const getMergedVariationModifierOverrides = (menuItem: any, variation: any) => {
    if (!menuItem || !variation?.id) return [];

    const variationId = String(variation.id);
    const map = new Map<string, VariationPriceOverride>();

    getVariationScopedModifierOverrides(menuItem, {
      id: variationId,
      name: String(variation?.name || ""),
      modifierPriceOverrides: normalizeArray(variation?.modifierPriceOverrides),
    }).forEach((override: any, index: number) => {
      const modifierId = getOverrideModifierId(override);
      if (!modifierId) return;

      const key = `${
        getOverrideMenuItemId(override) || "generic"
      }::${variationId}::${modifierId}::${index}`;

      map.set(key, {
        ...override,
        variationId,
        modifierId,
      });
    });

    return Array.from(map.values());
  };

  const getItemVariations = (menuItem: any): MenuVariation[] => {
    if (!menuItem) return [];

    const rawVariations = getAllRawVariationSources(menuItem);
    const deduped = new Map<string, MenuVariation>();

    for (const raw of rawVariations) {
      if (!raw?.id) continue;
      if (raw?.isActive === false) continue;

      const id = String(raw.id);

      if (deduped.has(id)) continue;

      const normalized: MenuVariation = {
        id,
        categoryId: raw?.categoryId,
        name: String(raw?.name || ""),
        description: raw?.description ?? "",
        price: getVariationDisplayPrice(menuItem, raw),
        pickupPrice: getVariationPickupPrice(menuItem, raw),
        displayText: getVariationDisplayText(menuItem, raw),
        sortOrder: toNumber(raw?.sortOrder, 0),
        isDefault: Boolean(raw?.isDefault),
        isActive: raw?.isActive !== false,
        modifierPriceOverrides: getMergedVariationModifierOverrides(
          menuItem,
          raw
        ),
        itemPriceOverrides: Array.isArray(raw?.itemPriceOverrides)
          ? raw.itemPriceOverrides
          : [],
      };

      deduped.set(id, normalized);
    }

    return sortBySortOrder(Array.from(deduped.values()));
  };

  const getNormalizedModifiersFromGroup = (group: any): Modifier[] => {
    const directModifiers = Array.isArray(group?.modifiers)
      ? group.modifiers
      : [];

    const modifiersFromLinks = Array.isArray(group?.modifierLinks)
      ? group.modifierLinks.map((link: any) => link?.modifier).filter(Boolean)
      : [];

    const rawModifiers = [...directModifiers, ...modifiersFromLinks];
    const deduped = new Map<string, Modifier>();

    for (const raw of rawModifiers) {
      const normalized = normalizeModifier(raw);
      if (!normalized) continue;

      if (!deduped.has(normalized.id)) {
        deduped.set(normalized.id, normalized);
      }
    }

    return sortBySortOrder(Array.from(deduped.values()));
  };

  const normalizeGroup = (group: any): ModifierGroup | null => {
    if (!group?.id) return null;
    if (group?.isActive === false) return null;

    return {
      id: String(group.id),
      name: String(group?.name || ""),
      description: group?.description || "",
      minSelect: group?.minSelect,
      maxSelect: group?.maxSelect,
      isRequired: Boolean(group?.isRequired),
      sortOrder: toNumber(group?.sortOrder, 0),
      isActive: group?.isActive !== false,
      modifiers: getNormalizedModifiersFromGroup(group),
      modifierLinks: Array.isArray(group?.modifierLinks)
        ? group.modifierLinks
        : [],
    };
  };

  const getStandaloneItemModifiers = (
    menuItem: any,
    linkedModifierIds: Set<string>
  ) => {
    const rawOverrides = normalizeArray(menuItem?.modifierPriceOverrides);

    const modifiersFromOverrides = rawOverrides
      .map((override) => {
        const rawModifier = override?.modifier || {
          id: override?.modifierId,
          name: override?.name || "Modifier",
          priceDelta: override?.priceDelta ?? 0,
        };

        const existingItemPriceOverrides = Array.isArray(
          rawModifier?.itemPriceOverrides
        )
          ? rawModifier.itemPriceOverrides
          : [];

        return normalizeModifier(rawModifier, {
          itemPriceOverrides: [
            ...existingItemPriceOverrides,
            {
              menuItemId: menuItem?.id,
              modifierId: override?.modifierId,
              priceDelta: override?.priceDelta,
            },
          ],
          variationPriceOverrides: Array.isArray(
            rawModifier?.variationPriceOverrides
          )
            ? rawModifier.variationPriceOverrides
            : [],
        });
      })
      .filter(Boolean) as Modifier[];

    const rawDirectModifiers = normalizeArray(menuItem?.modifiers)
      .map((modifier) => normalizeModifier(modifier))
      .filter(Boolean) as Modifier[];

    const deduped = new Map<string, Modifier>();

    [...modifiersFromOverrides, ...rawDirectModifiers].forEach((modifier) => {
      if (!modifier?.id) return;
      if (linkedModifierIds.has(String(modifier.id))) return;
      deduped.set(String(modifier.id), modifier);
    });

    return sortBySortOrder(Array.from(deduped.values()));
  };

  const getItemModifierLinks = (menuItem: any): ModifierLink[] => {
    if (!menuItem) return [];

    const rawDirectLinks = [
      ...normalizeArray(menuItem?.modifierLinks),
      ...normalizeArray(menuItem?.category?.modifierLinks),
    ];

    const rawModifierGroups = [
      ...normalizeArray(menuItem?.modifierGroups),
      ...normalizeArray(menuItem?.categoryModifierGroups).map(
        (entry) => entry?.modifierGroup || entry
      ),
      ...normalizeArray(menuItem?.category?.modifierGroups),
      ...normalizeArray(menuItem?.category?.categoryModifierGroups).map(
        (entry) => entry?.modifierGroup || entry
      ),
    ];

    const normalizedDirectLinks: ModifierLink[] = rawDirectLinks
      .map((link: any, index: number) => {
        const normalizedGroup = normalizeGroup(link?.modifierGroup);
        if (!normalizedGroup) return null;

        return {
          id:
            String(link?.id || "") ||
            `modifier-link-${normalizedGroup.id}-${index}`,
          variationId: link?.variationId ? String(link.variationId) : null,
          sortOrder: toNumber(
            link?.sortOrder ?? normalizedGroup?.sortOrder ?? 0,
            0
          ),
          modifierGroup: normalizedGroup,
        };
      })
      .filter(Boolean) as ModifierLink[];

    const normalizedModifierGroups: ModifierLink[] = rawModifierGroups
      .map((group: any, index: number) => {
        const normalizedGroup = normalizeGroup(group);
        if (!normalizedGroup) return null;

        return {
          id: `group-${normalizedGroup.id}-${index}`,
          variationId: null,
          sortOrder: toNumber(normalizedGroup?.sortOrder, 0),
          modifierGroup: normalizedGroup,
        };
      })
      .filter(Boolean) as ModifierLink[];

    const linkedModifierIds = new Set<string>();

    [...normalizedDirectLinks, ...normalizedModifierGroups].forEach((link) => {
      normalizeArray(link?.modifierGroup?.modifiers).forEach((modifier) => {
        if (modifier?.id) linkedModifierIds.add(String(modifier.id));
      });
    });

    const standaloneModifiers = getStandaloneItemModifiers(
      menuItem,
      linkedModifierIds
    );

    const standaloneLink: ModifierLink | null = standaloneModifiers.length
      ? {
          id: `standalone-modifiers-${menuItem.id}`,
          variationId: null,
          sortOrder: 999,
          modifierGroup: {
            id: `standalone-modifiers-${menuItem.id}`,
            name: "Add-ons",
            description: "Available add-ons for this item.",
            minSelect: 0,
            maxSelect: undefined,
            isRequired: false,
            sortOrder: 999,
            isActive: true,
            modifiers: standaloneModifiers,
            modifierLinks: [],
          },
        }
      : null;

    const deduped = new Map<string, ModifierLink>();

    for (const link of [
      ...normalizedDirectLinks,
      ...normalizedModifierGroups,
      ...(standaloneLink ? [standaloneLink] : []),
    ]) {
      const groupId = String(link?.modifierGroup?.id || "");
      if (!groupId) continue;

      const key = `${String(link?.variationId || "common")}::${groupId}`;

      if (!deduped.has(key)) {
        deduped.set(key, link);
      }
    }

    return sortBySortOrder(Array.from(deduped.values()));
  };

  const getDefaultVariation = (menuItem: any) => {
    const variations = getItemVariations(menuItem);
    if (!variations.length) return null;
    return variations.find((variation) => variation.isDefault) || variations[0];
  };

  const getVisibleModifierLinks = (
    menuItem: any,
    variation?: MenuVariation | null
  ) => {
    const links = getItemModifierLinks(menuItem);
    const hasVariations = getItemVariations(menuItem).length > 0;

    return links.filter((link) => {
      const groupName = String(link?.modifierGroup?.name || "")
        .trim()
        .toLowerCase();

      if (hasVariations && groupName === "size") {
        return false;
      }

      if (link?.variationId) {
        return String(link.variationId) === String(variation?.id || "");
      }

      return true;
    });
  };

  const getModifierEffectivePrice = (
    modifier: Modifier,
    menuItem: any,
    variation?: MenuVariation | null
  ) => {
    const menuItemId = String(menuItem?.id || "");
    const variationId = String(variation?.id || "");
    const modifierId = String(modifier?.id || "");

    if (variationId) {
      const variationScopedOverrides = getVariationScopedModifierOverrides(
        menuItem,
        variation
      );

      const variationScopedOverride = findBestModifierOverride({
        overrides: variationScopedOverrides,
        modifierId,
        menuItemId,
        variationId,
      });

      const variationScopedAmount = getOverrideAmount(variationScopedOverride);

      if (variationScopedAmount !== null) {
        return variationScopedAmount;
      }

      const modifierSideOverride = findBestModifierOverride({
        overrides: getModifierSideVariationOverrides(menuItem, modifier),
        modifierId,
        menuItemId,
        variationId,
      });

      const modifierSideAmount = getOverrideAmount(modifierSideOverride);

      if (modifierSideAmount !== null) {
        return modifierSideAmount;
      }
    }

    const topLevelItemOverride = findBestModifierOverride({
      overrides: menuItem?.modifierPriceOverrides,
      modifierId,
      menuItemId,
    });

    const topLevelItemAmount = getOverrideAmount(topLevelItemOverride);

    if (topLevelItemAmount !== null) {
      return topLevelItemAmount;
    }

    const modifierItemOverride = findBestModifierOverride({
      overrides: modifier?.itemPriceOverrides,
      modifierId,
      menuItemId,
    });

    const modifierItemAmount = getOverrideAmount(modifierItemOverride);

    if (modifierItemAmount !== null) {
      return modifierItemAmount;
    }

    return toNumber(modifier?.priceDelta, 0);
  };

  const getGroupValidation = (group: ModifierGroup) => {
    const rawMin = toNumber(group?.minSelect, 0);
    const rawMax =
      group?.maxSelect !== undefined && group?.maxSelect !== null
        ? toNumber(group.maxSelect, 0)
        : undefined;

    const isRequired = Boolean(group?.isRequired);

    return {
      minSelect: Math.max(isRequired ? 1 : 0, rawMin),
      maxSelect: rawMax && rawMax > 0 ? rawMax : undefined,
      isRequired,
    };
  };

  useEffect(() => {
    let isMounted = true;

    const fetchItem = async () => {
      if (!slug) {
        if (isMounted) {
          setItem(null);
          setPageLoading(false);
        }
        return;
      }

      if (!token) {
        return;
      }

      try {
        setPageLoading(true);

        const res = await get(
          `/v1/menu/items?search=${encodeURIComponent(slug)}`
        );

        if (!isMounted) return;

        if (!res || res?.error) {
          toast.error(res?.error || "Failed to fetch item");
          setItem(null);
          return;
        }

        const items = normalizeApiList(res);

        const matchedItem =
          items.find(
            (menuItem: any) => String(menuItem?.slug || "") === String(slug)
          ) || items[0];

        if (!matchedItem) {
          setItem(null);
          return;
        }

        setItem(matchedItem);
        setSelectedVariation(getDefaultVariation(matchedItem));
        setSelectedModifiers({});
        setQty(1);
        setInstructions("");
        setSplitPizzaEnabled(false);
        setSplitPizzaItem(null);
      } catch (error) {
        if (!isMounted) return;
        console.error("Failed to fetch item:", error);
        toast.error("Failed to fetch item");
        setItem(null);
      } finally {
        if (isMounted) {
          setPageLoading(false);
        }
      }
    };

    fetchItem();

    return () => {
      isMounted = false;
    };
  }, [slug, token]);

  const itemVariations = useMemo(() => getItemVariations(item), [item]);

  const splitPizzaDefaultVariation = useMemo(
    () => getDefaultVariation(splitPizzaItem),
    [splitPizzaItem]
  );

  const filteredModifierLinks = useMemo(() => {
    return getVisibleModifierLinks(item, selectedVariation);
  }, [item, selectedVariation]);


  const itemSupportsSplitPizza = Boolean(item?.supportsSplitPizza);

  useEffect(() => {
    if (itemSupportsSplitPizza) return;

    setSplitPizzaEnabled(false);
    setSplitPizzaItem(null);
  }, [itemSupportsSplitPizza]);

  const hasIngredients = hasText(item?.ingredients);
  const hasAllergenFlags =
    Array.isArray(item?.allergenFlags) && item.allergenFlags.length > 0;
  const hasDietaryFlags =
    Array.isArray(item?.dietaryFlags) && item.dietaryFlags.length > 0;
  const hasAllergenPdf = hasText(item?.allergenPdfUrl);

  useEffect(() => {
    if (!item) return;

    const visibleGroupIds = new Set(
      filteredModifierLinks.map((link) => String(link?.modifierGroup?.id || ""))
    );

    setSelectedModifiers((prev) => {
      const next: ModifierSelectionMap = {};

      for (const [groupId, modifiers] of Object.entries(prev || {})) {
        if (visibleGroupIds.has(String(groupId))) {
          const normalizedModifiers = modifiers
            .filter(Boolean)
            .map((modifier) => ({
              ...modifier,
              selectedQuantity: Math.max(1, toNumber(modifier.selectedQuantity, 1)),
            }));

          if (normalizedModifiers.length) {
            next[groupId] = normalizedModifiers;
          }
        }
      }

      return next;
    });
  }, [filteredModifierLinks, item]);


  const handleModifierToggle = (group: ModifierGroup, modifier: Modifier) => {
    const groupId = String(group.id);
    const { minSelect, maxSelect, isRequired } = getGroupValidation(group);

    setSelectedModifiers((prev) => {
      const current = prev[groupId] || [];
      const alreadySelected = current.some(
        (selected) => selected.id === modifier.id
      );

      if (maxSelect === 1) {
        if (alreadySelected && !isRequired) {
          const next = { ...prev };
          delete next[groupId];
          return next;
        }

        return {
          ...prev,
          [groupId]: [{ ...modifier, selectedQuantity: 1 }],
        };
      }

      if (alreadySelected) {
        if (minSelect > 0 && current.length <= minSelect) {
          toast.error(
            `${group?.name || "This group"} requires at least ${minSelect} selection(s)`
          );
          return prev;
        }

        const remaining = current.filter((selected) => selected.id !== modifier.id);
        const next = { ...prev };

        if (remaining.length) {
          next[groupId] = remaining;
        } else {
          delete next[groupId];
        }

        return next;
      }

      if (maxSelect && current.length >= maxSelect) {
        toast.error(
          `You can select up to ${maxSelect} option(s) for ${group?.name || "this group"}`
        );
        return prev;
      }

      return {
        ...prev,
        [groupId]: [...current, { ...modifier, selectedQuantity: 1 }],
      };
    });
  };

  const validateSelections = (
    links: ModifierLink[],
    selectionMap: ModifierSelectionMap
  ) => {
    for (const link of links) {
      const group = link?.modifierGroup;
      const groupId = String(group?.id || "");
      const selected = selectionMap[groupId] || [];
      const { minSelect, maxSelect } = getGroupValidation(group);

      if (minSelect > 0 && selected.length < minSelect) {
        toast.error(
          `${
            group?.name || "This group"
          } requires at least ${minSelect} selection(s)`
        );
        return false;
      }

      if (maxSelect && selected.length > maxSelect) {
        toast.error(
          `${group?.name || "This group"} allows at most ${maxSelect} selection(s)`
        );
        return false;
      }
    }

    return true;
  };

  const buildModifiersPayload = (selectionMap: ModifierSelectionMap) => {
    return Object.values(selectionMap)
      .flat()
      .map((modifier) => ({
        modifierId: modifier.id,
        quantity: Math.max(1, toNumber(modifier.selectedQuantity, 1)),
      }));
  };

  const getModifiersTotal = (
    selectionMap: ModifierSelectionMap,
    menuItem: any,
    variation?: MenuVariation | null
  ) => {
    return Object.values(selectionMap)
      .flat()
      .reduce((acc, modifier) => {
        const price = getModifierEffectivePrice(modifier, menuItem, variation);
        const modifierQty = Math.max(1, toNumber(modifier.selectedQuantity, 1));

        return acc + price * modifierQty;
      }, 0);
  };

  const getMenuItemBasePrice = (menuItem: any) => {
    return toNumber(menuItem?.basePrice ?? menuItem?.unitPrice ?? menuItem?.price, 0);
  };

  const getMenuItemResolvedPrice = (
    menuItem: any,
    variation?: MenuVariation | null
  ) => {
    if (!menuItem) return 0;

    if (variation?.id) {
      return toNumber(variation.price, 0);
    }

    return getMenuItemBasePrice(menuItem);
  };

  const resolvedItemPrice = getMenuItemResolvedPrice(item, selectedVariation);

  const splitPizzaResolvedItemPrice = getMenuItemResolvedPrice(
    splitPizzaItem,
    splitPizzaDefaultVariation
  );

  const modifiersTotal = getModifiersTotal(
    selectedModifiers,
    item,
    selectedVariation
  );

  const splitPizzaBasePrice =
    splitPizzaEnabled && splitPizzaItem
      ? Math.max(resolvedItemPrice, splitPizzaResolvedItemPrice)
      : resolvedItemPrice;

  const totalPrice = (splitPizzaBasePrice + modifiersTotal) * qty;

  const fetchPizzaItems = async ({
    search,
    page,
  }: {
    search: string;
    page: number;
  }) => {
    const queryParams = new URLSearchParams();

    queryParams.set("page", String(page));
    queryParams.set("supportsSplitPizza", "true");

    if (restaurantId) {
      queryParams.set("restaurantId", String(restaurantId));
    }

    const resolvedSearch = search?.trim();

    if (resolvedSearch) {
      queryParams.set("search", resolvedSearch);
    }

    const res = await get(`/v1/menu/items?${queryParams.toString()}`);
    const data = normalizeApiList(res);

    return {
      data,
      meta: res?.data?.meta || res?.meta,
    };
  };

  const handleSplitPizzaToggle = (checked: boolean) => {
    setSplitPizzaEnabled(checked);

    if (!checked) {
      setSplitPizzaItem(null);
    }
  };

  const handleSplitPizzaItemChange = (selectedItem: any) => {
    setSplitPizzaItem(selectedItem || null);
  };

  const renderModifierGroups = ({
    links,
    selectionMap,
    menuItem,
    variation,
    scope,
  }: {
    links: ModifierLink[];
    selectionMap: ModifierSelectionMap;
    menuItem: any;
    variation?: MenuVariation | null;
    scope: "main" | "split";
  }) => {
    return links.map((link) => {
      const group = link.modifierGroup;
      const groupId = String(group?.id || "");
      const selectedInGroup = selectionMap[groupId] || [];
      const { minSelect, maxSelect, isRequired } = getGroupValidation(group);

      const groupModifiers = Array.isArray(group?.modifiers)
        ? group.modifiers.filter((modifier) => modifier?.isActive !== false)
        : [];

      if (!groupModifiers.length) return null;

      return (
        <div key={`${scope}-${String(link?.variationId || "common")}-${groupId}`}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-gray-900">{group?.name}</p>
              <p className="text-xs text-gray-500">
                {maxSelect === 1
                  ? isRequired || minSelect > 0
                    ? "Select 1 required option"
                    : "Optional · select 1 option"
                  : maxSelect
                  ? minSelect > 0
                    ? `Select ${minSelect}-${maxSelect}`
                    : `Select up to ${maxSelect}`
                  : minSelect > 0
                  ? `Select at least ${minSelect}`
                  : "Optional"}
              </p>
            </div>

            <span className="text-xs text-gray-500">
              {selectedInGroup.length}
              {maxSelect ? ` / ${maxSelect}` : ""}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {groupModifiers.map((modifier) => {
              const selectedModifier = selectedInGroup.find(
                (selected) => selected.id === modifier.id
              );

              const checked = Boolean(selectedModifier);

              const effectivePrice = getModifierEffectivePrice(
                modifier,
                menuItem,
                variation
              );

              const inputType = maxSelect === 1 ? "radio" : "checkbox";
              const disableBecauseMaxReached =
                maxSelect !== 1 &&
                !checked &&
                !!maxSelect &&
                selectedInGroup.length >= maxSelect;

              return (
                <div
                  key={`${modifier.id}-${String(variation?.id || "base")}`}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    disableBecauseMaxReached
                      ? "bg-gray-100 opacity-70"
                      : checked
                      ? "bg-primary/5 ring-1 ring-primary/20"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <label className="flex min-w-0 flex-1 cursor-pointer gap-2">
                      <input
                        type={inputType}
                        name={`${scope}-modifier-group-${groupId}`}
                        checked={checked}
                        disabled={disableBecauseMaxReached}
                        onClick={() => {
                          if (inputType === "radio" && checked && !isRequired) {
                            handleModifierToggle(group, modifier);
                          }
                        }}
                        onChange={() => handleModifierToggle(group, modifier)}
                        className="mt-1 accent-[var(--primary)]"
                      />

                      <span className="min-w-0">
                        <span className="block truncate text-gray-900">
                          {modifier.name}
                        </span>

                        {modifier.description ? (
                          <span className="mt-0.5 block text-xs text-gray-500">
                            {modifier.description}
                          </span>
                        ) : null}
                      </span>
                    </label>

                    {effectivePrice > 0 ? (
                      <span className="shrink-0 font-medium text-primary">
                        +${effectivePrice.toFixed(2)}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    });
  };

  const handleAddToCart = async () => {
    try {
      setLoading(true);

      if (!item?.id) {
        toast.error("Item not found");
        return;
      }

      if (!validateSelections(filteredModifierLinks, selectedModifiers)) {
        return;
      }

      if (splitPizzaEnabled) {
        if (!splitPizzaItem?.id) {
          toast.error("Please select the other pizza half");
          return;
        }
      }

      const groupCode =
        typeof window !== "undefined"
          ? localStorage.getItem("groupOrderCode")
          : null;

      const splitSections =
        splitPizzaEnabled && splitPizzaItem?.id
          ? [
              {
                slot: "LEFT",
                menuItemId: item.id,
              },
              {
                slot: "RIGHT",
                menuItemId: splitPizzaItem.id,
              },
            ]
          : undefined;

      const restaurantMenuId = getId(
        item?.restaurantMenuId ||
          item?.restaurantMenu?.id ||
          item?.menuLinks?.[0]?.restaurantMenuId ||
          item?.menuLinks?.[0]?.restaurantMenu?.id ||
          item?.menuLinks?.[0]?.menuId
      );

      const basePayload: any = {
        menuItemId: item.id,
        ...(restaurantMenuId ? { restaurantMenuId } : {}),
        quantity: qty,
        variationId: selectedVariation?.id || null,
        modifiers: buildModifiersPayload(selectedModifiers),
        note: instructions?.trim() || "",
      };

      if (splitSections) {
        basePayload.sections = splitSections;
      }

      let res: any;

      if (groupCode) {
        const groupOrdersRes = await get("/v1/group-orders");

        if (!groupOrdersRes || groupOrdersRes.error) {
          toast.error("Failed to fetch group order");
          return;
        }

        const groupOrders = Array.isArray(groupOrdersRes?.data)
          ? groupOrdersRes.data
          : Array.isArray(groupOrdersRes?.data?.data)
          ? groupOrdersRes.data.data
          : [];

        const groupOrder = groupOrders.find(
          (order: any) => order?.inviteCode === groupCode
        );

        if (!groupOrder) {
          toast.error("Invalid group order");
          return;
        }

        res = await post(`/v1/group-orders/${groupOrder.id}/items`, basePayload);
      } else {
        if (!customerId) {
          toast.error("Customer not found");
          return;
        }

        if (!branchId) {
          toast.error("Please select a branch first");
          return;
        }

        res = await post(`/v1/cart/items?customerId=${customerId}`, {
          ...basePayload,
          branchId,
        });
      }

      if (!res || res?.error) {
        toast.error(res?.error || res?.message || "Failed to add");
        return;
      }

      toast.success(groupCode ? "Added to group order" : "Added to cart");

      if (groupCode) {
        router.push("/group-order/lobby");
      } else {
        router.push("/checkout");
      }
    } catch (error) {
      console.error("Add to cart failed:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading || (!!slug && !token)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!item) {
    return (
      <>
        <div className="mx-auto px-4 py-16 text-center sm:px-6 md:px-10 lg:px-40">
          <h2 className="text-xl font-semibold text-gray-900">Item not found</h2>
          <p className="mt-2 text-sm text-gray-500">
            We could not find the requested menu item.
          </p>
        </div>
        <TestimonialsSection />
      </>
    );
  }

  return (
    <>
      <div className="mx-auto grid grid-cols-1 gap-8 px-4 py-6 sm:px-6 md:grid-cols-2 md:px-10 md:py-10 lg:gap-12 lg:px-40">
        <div className="flex flex-col gap-6">
          <div className="overflow-hidden rounded-2xl">
            <Image
              src={item?.imageUrl || "/placeholder.png"}
              alt={item?.name || "Product image"}
              width={600}
              height={600}
              className="h-[250px] w-full object-cover sm:h-[350px] md:h-auto"
              unoptimized
            />
          </div>

          <div className="text-xs text-gray-400">
            {item?.prepTimeMinutes ? (
              <p>Prep Time: {item.prepTimeMinutes} mins</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">
              {item?.category?.name || "Best Seller"}
            </p>

            <div className="mt-1 flex items-start justify-between gap-3">
              <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">
                {item?.name}
              </h1>

              <button
                type="button"
                onClick={() => setInfoOpen(true)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-primary hover:text-white"
                title="View ingredients and allergens"
              >
                <Eye size={18} />
              </button>
            </div>

            <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-500">
              <span className="font-medium text-primary">★ 4.8</span>
              <span>(150 reviews)</span>
              <span>• 20–25 mins delivery</span>
            </div>
          </div>

          <p className="text-sm text-gray-600">{item?.description}</p>

          <div className="text-2xl font-bold text-primary">
            ${totalPrice.toFixed(2)}
          </div>

          {itemVariations.length > 0 ? (
            <div>
              <p className="mb-2 font-medium">Size</p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {itemVariations.map((variation) => (
                  <label
                    key={variation.id}
                    className={`cursor-pointer rounded-xl border px-4 py-3 ${
                      selectedVariation?.id === variation.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="size"
                          checked={selectedVariation?.id === variation.id}
                          onChange={() => {
                            setSelectedVariation(variation);
                          }}
                          className="mt-1 accent-[var(--primary)]"
                        />

                        <div>
                          <p className="font-medium text-gray-900">
                            {variation.displayText || variation.name}
                          </p>

                          {variation.description ? (
                            <p className="mt-1 text-xs leading-relaxed text-gray-500">
                              {variation.description}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <span className="shrink-0 font-medium text-primary">
                        ${toNumber(variation.price, 0).toFixed(2)}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

{itemSupportsSplitPizza ? (
  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 transition">
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="font-medium text-gray-900">Enable split pizza</p>
        <p className="text-xs text-gray-500">
          Choose another split-pizza item for the second half.
        </p>
      </div>

      <button
        type="button"
        onClick={() => handleSplitPizzaToggle(!splitPizzaEnabled)}
        className={`relative h-7 w-12 rounded-full transition ${
          splitPizzaEnabled ? "bg-primary" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
            splitPizzaEnabled ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>

    {splitPizzaEnabled ? (
      <div className="mt-4 space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-gray-900">
            Select other pizza half
          </p>

          <AsyncSelect
            value={splitPizzaItem}
            onChange={handleSplitPizzaItemChange}
            placeholder="Select split-pizza item"
            fetchOptions={fetchPizzaItems}
            labelKey="name"
            valueKey="id"
          />
        </div>

        {splitPizzaItem ? (
          <div className="rounded-xl bg-white p-3">
            <p className="text-sm font-semibold text-gray-900">
              Selected second half
            </p>

            <div className="mt-2 flex items-start justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900">
                  {splitPizzaItem?.name}
                </p>

                {splitPizzaItem?.description ? (
                  <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                    {splitPizzaItem.description}
                  </p>
                ) : null}
              </div>

              {splitPizzaResolvedItemPrice > 0 ? (
                <span className="shrink-0 font-medium text-primary">
                  ${splitPizzaResolvedItemPrice.toFixed(2)}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    ) : null}
  </div>
) : null}

          {filteredModifierLinks.length > 0 ? (
            <div className="space-y-4">
              {renderModifierGroups({
                links: filteredModifierLinks,
                selectionMap: selectedModifiers,
                menuItem: item,
                variation: selectedVariation,
                scope: "main",
              })}
            </div>
          ) : null}

          <div>
            <p className="mb-2 font-medium">Special Instructions</p>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Add cooking notes (e.g., no onions, extra spicy)..."
              className="h-24 w-full rounded-xl bg-gray-100 p-3 text-sm outline-none"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-full bg-gray-100">
              <button
                type="button"
                onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                className="px-3 py-2"
                disabled={loading}
              >
                <Minus size={16} />
              </button>

              <span className="px-4">{qty}</span>

              <button
                type="button"
                onClick={() => setQty((prev) => prev + 1)}
                className="px-3 py-2"
                disabled={loading}
              >
                <Plus size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3 text-white disabled:opacity-70"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading
                ? "Processing..."
                : `Add to Cart | $${totalPrice.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>

      {infoOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="max-h-[90vh] w-full max-w-[520px] overflow-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Product Information
                </h2>
                <p className="mt-1 text-sm text-gray-500">{item?.name}</p>
              </div>

              <button
                type="button"
                onClick={() => setInfoOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <h3 className="mb-2 font-semibold text-gray-900">
                  Ingredients
                </h3>

                {hasIngredients ? (
                  <p className="text-sm leading-relaxed text-gray-600">
                    {item.ingredients}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">
                    Ingredients information is not available.
                  </p>
                )}
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-gray-900">
                  Allergens
                </h3>

                {hasAllergenFlags ? (
                  <div className="flex flex-wrap gap-2">
                    {item.allergenFlags.map((flag: string) => (
                      <span
                        key={flag}
                        className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-600"
                      >
                        {flag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">
                    Allergen information is not available.
                  </p>
                )}

                {hasAllergenPdf ? (
                  <a
                    href={item.allergenPdfUrl}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white"
                  >
                    <Download size={16} />
                    Download allergen PDF
                  </a>
                ) : null}
              </div>

              {hasDietaryFlags ? (
                <div>
                  <h3 className="mb-2 font-semibold text-gray-900">
                    Dietary Preferences
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {item.dietaryFlags.map((flag: string) => (
                      <span
                        key={flag}
                        className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                      >
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <TestimonialsSection />
    </>
  );
}