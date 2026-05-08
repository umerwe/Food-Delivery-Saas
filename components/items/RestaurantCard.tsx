"use client";

import Image from "next/image";
import {
  Plus,
  Info,
  Loader2,
  Eye,
  Minus,
  Download,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useApi from "@/hooks/useApi";
import { useAuthContext } from "@/context/AuthContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import AsyncSelect from "../ui/AsyncSelect";

type ItemPriceOverride = {
  id?: string;
  menuItemId?: string;
  modifierId?: string;
  price?: string | number;
  priceDelta?: string | number;
};

type VariationPriceOverride = {
  id?: string;
  menuItemId?: string | null;
  variationId?: string;
  modifierId?: string;
  price?: string | number;
  priceDelta?: string | number;
};

type MenuVariation = {
  id: string;
  categoryId?: string;
  name: string;
  description?: string;
  price?: string | number;
  sortOrder?: number;
  isDefault?: boolean;
  isActive?: boolean;
  modifierPriceOverrides?: VariationPriceOverride[];
};

type Modifier = {
  id: string;
  modifierGroupId?: string;
  restaurantId?: string;
  name: string;
  description?: string;
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

type SelectedModifiersMap = Record<string, SelectedModifier[]>;

const toNumber = (value: unknown, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
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
  return [];
};

export default function RestaurantCard({ item }: any) {
  const router = useRouter();
  const { token } = useAuthContext();
  const { post, get } = useApi(token);
  const { user } = useAuth();

  const [infoOpen, setInfoOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  const [selectedVariation, setSelectedVariation] =
    useState<MenuVariation | null>(null);

  const [selectedModifiers, setSelectedModifiers] =
    useState<SelectedModifiersMap>({});

  const [splitPizzaEnabled, setSplitPizzaEnabled] = useState(false);
  const [splitPizzaItem, setSplitPizzaItem] = useState<any>(null);

  const [animateCart, setAnimateCart] = useState(false);

  const customerId = user?.id;
  const branchId = user?.branchId;
  const restaurantId =
    item?.restaurantId ||
    item?.restaurant?.id ||
    (user as any)?.restaurantId ||
    (user as any)?.profile?.restaurantId ||
    "";

  const itemSupportsSplitPizza = Boolean(item?.supportsSplitPizza);

  const getItemVariations = (menuItem: any): MenuVariation[] => {
    const rawVariations = [
      ...(Array.isArray(menuItem?.variations) ? menuItem.variations : []),
      ...(Array.isArray(menuItem?.category?.variations)
        ? menuItem.category.variations
        : []),
    ];

    const deduped = new Map<string, MenuVariation>();

    for (const raw of rawVariations) {
      if (!raw?.id) continue;
      if (raw?.isActive === false) continue;

      const id = String(raw.id);

      const normalized: MenuVariation = {
        id,
        categoryId: raw?.categoryId,
        name: String(raw?.name || ""),
        description: raw?.description || "",
        price: raw?.price ?? 0,
        sortOrder: toNumber(raw?.sortOrder, 0),
        isDefault: Boolean(raw?.isDefault),
        isActive: raw?.isActive !== false,
        modifierPriceOverrides: Array.isArray(raw?.modifierPriceOverrides)
          ? raw.modifierPriceOverrides
          : [],
      };

      if (!deduped.has(id)) {
        deduped.set(id, normalized);
      }
    }

    return sortBySortOrder(Array.from(deduped.values()));
  };

  const getNormalizedModifiersFromGroup = (group: any): Modifier[] => {
    const directModifiers = Array.isArray(group?.modifiers)
      ? group.modifiers
      : [];

    const fromModifierLinks = Array.isArray(group?.modifierLinks)
      ? group.modifierLinks.map((link: any) => link?.modifier).filter(Boolean)
      : [];

    const rawModifiers = [...directModifiers, ...fromModifierLinks];
    const deduped = new Map<string, Modifier>();

    for (const raw of rawModifiers) {
      if (!raw?.id) continue;
      if (raw?.isActive === false) continue;

      const id = String(raw.id);

      const normalized: Modifier = {
        id,
        modifierGroupId: raw?.modifierGroupId,
        restaurantId: raw?.restaurantId,
        name: String(raw?.name || ""),
        description: raw?.description || "",
        priceDelta: raw?.priceDelta ?? 0,
        sortOrder: toNumber(raw?.sortOrder, 0),
        isActive: raw?.isActive !== false,
        itemPriceOverrides: Array.isArray(raw?.itemPriceOverrides)
          ? raw.itemPriceOverrides
          : [],
        variationPriceOverrides: Array.isArray(raw?.variationPriceOverrides)
          ? raw.variationPriceOverrides
          : [],
      };

      if (!deduped.has(id)) {
        deduped.set(id, normalized);
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

  const normalizeStandaloneModifier = (raw: any): Modifier | null => {
    if (!raw?.id) return null;
    if (raw?.isActive === false) return null;

    return {
      id: String(raw.id),
      modifierGroupId: raw?.modifierGroupId,
      restaurantId: raw?.restaurantId,
      name: String(raw?.name || ""),
      description: raw?.description || "",
      priceDelta: raw?.priceDelta ?? 0,
      sortOrder: toNumber(raw?.sortOrder, 0),
      isActive: raw?.isActive !== false,
      itemPriceOverrides: Array.isArray(raw?.itemPriceOverrides)
        ? raw.itemPriceOverrides
        : [],
      variationPriceOverrides: Array.isArray(raw?.variationPriceOverrides)
        ? raw.variationPriceOverrides
        : [],
    };
  };

  const getStandaloneItemModifiers = (
    menuItem: any,
    linkedModifierIds: Set<string>
  ): Modifier[] => {
    const deduped = new Map<string, Modifier>();

    const addModifier = (modifier: Modifier | null) => {
      if (!modifier?.id) return;
      if (linkedModifierIds.has(String(modifier.id))) return;

      const id = String(modifier.id);
      const existing = deduped.get(id);

      if (!existing) {
        deduped.set(id, modifier);
        return;
      }

      deduped.set(id, {
        ...existing,
        ...modifier,
        itemPriceOverrides: [
          ...(Array.isArray(existing.itemPriceOverrides)
            ? existing.itemPriceOverrides
            : []),
          ...(Array.isArray(modifier.itemPriceOverrides)
            ? modifier.itemPriceOverrides
            : []),
        ],
        variationPriceOverrides: [
          ...(Array.isArray(existing.variationPriceOverrides)
            ? existing.variationPriceOverrides
            : []),
          ...(Array.isArray(modifier.variationPriceOverrides)
            ? modifier.variationPriceOverrides
            : []),
        ],
      });
    };

    if (Array.isArray(menuItem?.modifiers)) {
      menuItem.modifiers.forEach((modifier: any) => {
        addModifier(normalizeStandaloneModifier(modifier));
      });
    }

    if (Array.isArray(menuItem?.modifierPriceOverrides)) {
      menuItem.modifierPriceOverrides.forEach((override: any) => {
        const rawModifier = override?.modifier || {
          id: override?.modifierId,
          name: override?.name || "Modifier",
          priceDelta: override?.priceDelta ?? 0,
        };

        const normalized = normalizeStandaloneModifier({
          ...rawModifier,
          itemPriceOverrides: [
            ...(Array.isArray(rawModifier?.itemPriceOverrides)
              ? rawModifier.itemPriceOverrides
              : []),
            {
              id: override?.id,
              menuItemId: override?.menuItemId ?? menuItem?.id,
              modifierId: override?.modifierId ?? rawModifier?.id,
              price: override?.price,
              priceDelta: override?.priceDelta,
            },
          ],
          variationPriceOverrides: Array.isArray(
            rawModifier?.variationPriceOverrides
          )
            ? rawModifier.variationPriceOverrides
            : [],
        });

        addModifier(normalized);
      });
    }

    return sortBySortOrder(Array.from(deduped.values()));
  };

  const getItemModifierLinks = (menuItem: any): ModifierLink[] => {
    const rawItemLinks = Array.isArray(menuItem?.modifierLinks)
      ? menuItem.modifierLinks
      : [];

    const rawCategoryLinks = Array.isArray(menuItem?.category?.modifierLinks)
      ? menuItem.category.modifierLinks
      : [];

    const rawCategoryModifierGroups = Array.isArray(
      menuItem?.categoryModifierGroups
    )
      ? menuItem.categoryModifierGroups
      : [];

    const rawModifierGroups = Array.isArray(menuItem?.modifierGroups)
      ? menuItem.modifierGroups
      : [];

    const normalizedModifierGroups: ModifierLink[] = [
      ...rawModifierGroups,
      ...rawCategoryModifierGroups,
    ]
      .map((group: any, index: number) => {
        const normalizedGroup = normalizeGroup(group);
        if (!normalizedGroup) return null;

        return {
          id: `group-${normalizedGroup.id}-${index}`,
          variationId: null,
          sortOrder: toNumber(normalizedGroup.sortOrder, 0),
          modifierGroup: normalizedGroup,
        };
      })
      .filter(Boolean) as ModifierLink[];

    const combinedRawLinks = [...rawItemLinks, ...rawCategoryLinks];

    const normalizedDirectLinks: ModifierLink[] = combinedRawLinks
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

    const linkedModifierIds = new Set<string>();

    [...normalizedDirectLinks, ...normalizedModifierGroups].forEach((link) => {
      link.modifierGroup?.modifiers?.forEach((modifier) => {
        if (modifier?.id) linkedModifierIds.add(String(modifier.id));
      });
    });

    const standaloneModifiers = getStandaloneItemModifiers(
      menuItem,
      linkedModifierIds
    );

    const standaloneLink: ModifierLink | null = standaloneModifiers.length
      ? {
          id: `standalone-modifiers-${menuItem?.id || "item"}`,
          variationId: null,
          sortOrder: 999,
          modifierGroup: {
            id: `standalone-modifiers-${menuItem?.id || "item"}`,
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

    return variations.find((v) => v.isDefault) || variations[0];
  };

  const getGroupValidation = (group: ModifierGroup) => {
    const rawMin = toNumber(group?.minSelect, 0);

    const rawMax =
      group?.maxSelect !== undefined && group?.maxSelect !== null
        ? toNumber(group.maxSelect, 0)
        : undefined;

    const isRequired = Boolean(group?.isRequired);
    const minSelect = Math.max(isRequired ? 1 : 0, rawMin);

    return {
      minSelect,
      maxSelect: rawMax,
      isRequired,
    };
  };

  const getVisibleModifierLinks = (
    menuItem: any,
    variation?: MenuVariation | null
  ) => {
    const links = getItemModifierLinks(menuItem);
    const hasVariations = getItemVariations(menuItem).length > 0;

    return links.filter((groupLink) => {
      const groupName = String(groupLink?.modifierGroup?.name || "")
        .trim()
        .toLowerCase();

      if (hasVariations && groupName === "size") {
        return false;
      }

      if (groupLink?.variationId) {
        return String(groupLink.variationId) === String(variation?.id || "");
      }

      return true;
    });
  };

  const getOverridePrice = (override?: any | null) => {
    if (!override) return null;

    if (override?.priceDelta !== undefined && override.priceDelta !== null) {
      return toNumber(override.priceDelta, 0);
    }

    if (override?.price !== undefined && override.price !== null) {
      return toNumber(override.price, 0);
    }

    return null;
  };

  const getModifierEffectivePrice = (
    modifier: Modifier,
    menuItemId?: string,
    variation?: MenuVariation | null
  ) => {
    const modifierId = String(modifier?.id || "");
    const normalizedMenuItemId = String(menuItemId || "");
    const variationId = variation?.id ? String(variation.id) : "";

    if (variationId) {
      const variationOverrides = [
        ...(Array.isArray(variation?.modifierPriceOverrides)
          ? variation.modifierPriceOverrides
          : []),
        ...(Array.isArray(modifier?.variationPriceOverrides)
          ? modifier.variationPriceOverrides
          : []),
      ].filter((override: any) => {
        const overrideModifierId = String(override?.modifierId || "");
        const overrideVariationId = String(override?.variationId || "");

        return (
          overrideModifierId === modifierId &&
          overrideVariationId === variationId
        );
      });

      const itemSpecificOverride = variationOverrides.find((override: any) => {
        return String(override?.menuItemId || "") === normalizedMenuItemId;
      });

      const itemSpecificPrice = getOverridePrice(itemSpecificOverride);
      if (itemSpecificPrice !== null) return itemSpecificPrice;

      const genericOverride = variationOverrides.find((override: any) => {
        return (
          override?.menuItemId === null ||
          override?.menuItemId === undefined ||
          override?.menuItemId === ""
        );
      });

      const genericPrice = getOverridePrice(genericOverride);
      if (genericPrice !== null) return genericPrice;

      const firstVariationPrice = getOverridePrice(variationOverrides[0]);
      if (firstVariationPrice !== null) return firstVariationPrice;
    }

    const itemOverride = Array.isArray(modifier?.itemPriceOverrides)
      ? modifier.itemPriceOverrides.find((override) => {
          return String(override?.menuItemId || "") === normalizedMenuItemId;
        })
      : null;

    const itemOverridePrice = getOverridePrice(itemOverride);
    if (itemOverridePrice !== null) return itemOverridePrice;

    return toNumber(modifier?.priceDelta, 0);
  };

  const itemVariations = useMemo(() => getItemVariations(item), [item]);
  const itemModifierLinks = useMemo(() => getItemModifierLinks(item), [item]);

  const splitPizzaDefaultVariation = useMemo(
    () => getDefaultVariation(splitPizzaItem),
    [splitPizzaItem]
  );

  const filteredModifierLinks = useMemo(() => {
    return getVisibleModifierLinks(item, selectedVariation);
  }, [item, selectedVariation]);

  const hasOptions =
    itemVariations.length > 0 ||
    itemModifierLinks.length > 0 ||
    itemSupportsSplitPizza;

  useEffect(() => {
    setSelectedVariation(getDefaultVariation(item));
  }, [item]);

  useEffect(() => {
    if (itemSupportsSplitPizza) return;

    setSplitPizzaEnabled(false);
    setSplitPizzaItem(null);
  }, [itemSupportsSplitPizza]);

  useEffect(() => {
    if (!open) {
      setQty(1);
      setNote("");
      setSelectedModifiers({});
      setSelectedVariation(getDefaultVariation(item));
      setSplitPizzaEnabled(false);
      setSplitPizzaItem(null);
    }
  }, [open, item]);

  useEffect(() => {
    const visibleGroupIds = new Set(
      filteredModifierLinks.map((groupLink) =>
        String(groupLink?.modifierGroup?.id || "")
      )
    );

    setSelectedModifiers((prev) => {
      const next: SelectedModifiersMap = {};

      for (const [groupId, modifiers] of Object.entries(prev || {})) {
        if (visibleGroupIds.has(String(groupId))) {
          next[groupId] = modifiers;
        }
      }

      return next;
    });
  }, [filteredModifierLinks]);


  const handleModifierToggle = (group: ModifierGroup, modifier: Modifier) => {
    const groupId = String(group.id);

    setSelectedModifiers((prev) => {
      const current = prev[groupId] || [];
      const { minSelect, maxSelect, isRequired } = getGroupValidation(group);
      const isSelected = current.some((m) => m.id === modifier.id);

      if (maxSelect === 1) {
        if (isSelected && !isRequired) {
          const next = { ...prev };
          delete next[groupId];
          return next;
        }

        return {
          ...prev,
          [groupId]: [{ ...modifier, selectedQuantity: 1 }],
        };
      }

      if (isSelected) {
        if (minSelect > 0 && current.length <= minSelect) {
          toast.error(
            `${group?.name || "This group"} requires at least ${minSelect} selection(s)`
          );
          return prev;
        }

        const remaining = current.filter((m) => m.id !== modifier.id);
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
          `You can select up to ${maxSelect} option(s) for ${group.name}`
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
    selectionMap: SelectedModifiersMap
  ) => {
    for (const link of links) {
      const group = link?.modifierGroup;
      const groupId = String(group?.id || "");
      const selected = selectionMap[groupId] || [];
      const { minSelect, maxSelect } = getGroupValidation(group);

      if (minSelect > 0 && selected.length < minSelect) {
        toast.error(
          `${group?.name || "This group"} requires at least ${minSelect} selection(s)`
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

  const buildModifiersPayload = (selectionMap: SelectedModifiersMap) => {
    return Object.values(selectionMap)
      .flat()
      .map((modifier) => ({
        modifierId: modifier.id,
        quantity: 1,
      }));
  };

  const getModifiersTotal = (
    selectionMap: SelectedModifiersMap,
    menuItemId?: string,
    variation?: MenuVariation | null
  ) => {
    return Object.values(selectionMap)
      .flat()
      .reduce((acc, modifier) => {
        const modifierPrice = getModifierEffectivePrice(
          modifier,
          menuItemId,
          variation
        );

        return acc + modifierPrice;
      }, 0);
  };

  const getMenuItemBasePrice = (menuItem: any) => {
    return toNumber(
      menuItem?.basePrice ?? menuItem?.unitPrice ?? menuItem?.price,
      0
    );
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
    item?.id,
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

    const data = normalizeApiList(res).filter((menuItem: any) => {
      return Boolean(menuItem?.id);
    });

    return {
      data,
      meta: res?.data?.meta || res?.meta,
    };
  };

  const handleSplitPizzaToggle = (checked: boolean) => {
    if (!itemSupportsSplitPizza) return;

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
    selectionMap: SelectedModifiersMap;
    menuItem: any;
    variation?: MenuVariation | null;
    scope: "main" | "split";
  }) => {
    return links.map((groupLink) => {
      const group = groupLink.modifierGroup;
      const groupId = String(group?.id || "");
      const selectedInGroup = selectionMap[groupId] || [];
      const { minSelect, maxSelect, isRequired } = getGroupValidation(group);

      const groupModifiers = Array.isArray(group?.modifiers)
        ? group.modifiers.filter((modifier) => modifier?.isActive !== false)
        : [];

      if (!groupModifiers.length) return null;

      return (
        <div
          key={`${scope}-${groupLink?.variationId || "common"}-${groupId}`}
          className="mb-5"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-gray-900">{group?.name}</p>
              <p className="text-xs text-gray-500">
                {maxSelect === 1
                  ? isRequired
                    ? "Select 1 required option"
                    : "Select up to 1 option"
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

          <div className="space-y-2">
            {groupModifiers.map((modifier) => {
              const selectedModifier = selectedInGroup.find(
                (selected) => selected.id === modifier.id
              );

              const checked = Boolean(selectedModifier);

              const disableBecauseMaxReached =
                !checked && !!maxSelect && selectedInGroup.length >= maxSelect;

              const effectivePrice = getModifierEffectivePrice(
                modifier,
                menuItem?.id,
                variation
              );

              const inputType = maxSelect === 1 ? "radio" : "checkbox";

              return (
                <div
                  key={modifier.id}
                  className={`rounded-xl px-3 py-3 text-sm ${
                    disableBecauseMaxReached
                      ? "bg-gray-100 opacity-70"
                      : checked
                      ? "bg-primary/5 ring-1 ring-primary/20"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2 text-gray-800">
                      <input
                        type={inputType}
                        name={`${scope}-modifier-group-${groupId}`}
                        checked={checked}
                        disabled={disableBecauseMaxReached}
                        onChange={() =>
                          handleModifierToggle(group, modifier)
                        }
                        className="mt-1 accent-[var(--primary)]"
                      />

                      <span className="min-w-0">
                        <span className="block truncate">{modifier.name}</span>

                        {modifier.description ? (
                          <span className="mt-1 block text-xs text-gray-500">
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

  async function handleAddToCart() {
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

      if (!groupCode && !customerId) {
        toast.error("Customer not found");
        return;
      }

      if (!groupCode && !branchId) {
        toast.error("Please select a branch");
        return;
      }

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

      const basePayload: any = {
        menuItemId: item?.id,
        quantity: qty,
        variationId: selectedVariation?.id || null,
        modifiers: buildModifiersPayload(selectedModifiers),
        note: note.trim() || "",
      };

      if (splitSections) {
        basePayload.sections = splitSections;
      }

      let res: any;

      if (groupCode) {
        const groupOrdersRes = await get("/v1/group-orders");

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
        res = await post(`/v1/cart/items?customerId=${customerId}`, {
          ...basePayload,
          branchId,
        });
      }

      if (!res || res?.error) {
        toast.error(res?.error || "Failed to add to cart");
        return;
      }

      toast.success(groupCode ? "Added to group order" : "Added to cart");

      setAnimateCart(true);
      setTimeout(() => setAnimateCart(false), 700);

      setOpen(false);

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
  }

  const handlePlusClick = () => {
    const groupCode =
      typeof window !== "undefined"
        ? localStorage.getItem("groupOrderCode")
        : null;

    if (!hasOptions) {
      if (!groupCode && !branchId) {
        toast.error("Please select a branch first");
        return;
      }

      handleAddToCart();
      return;
    }

    setOpen(true);
  };

  const handleNavigateToDetails = () => {
    router.push(`/items/details?itemId=${item?.id}&slug=${item?.slug}`);
  };

  const truncatedDesc =
    item?.description && String(item.description).length > 90
      ? `${String(item.description).slice(0, 90)}...`
      : item?.description || "";

  const hasIngredients = hasText(item?.ingredients);

  const hasNutritionalInformation = hasText(item?.nutritionalInformation);

  const hasAllergenFlags =
    Array.isArray(item?.allergenFlags) && item.allergenFlags.length > 0;

  const hasDietaryFlags =
    Array.isArray(item?.dietaryFlags) && item.dietaryFlags.length > 0;

  const hasAllergenPdf = hasText(item?.allergenPdfUrl);

  const hasInfoBoxContent =
    hasIngredients ||
    hasNutritionalInformation ||
    hasAllergenFlags ||
    hasDietaryFlags ||
    hasAllergenPdf;

  const defaultCardVariation = getDefaultVariation(item);
  const displayCardPrice = getMenuItemResolvedPrice(item, defaultCardVariation);

  return (
    <>
      <div className="group relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-lg">
        <div className="flex justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-900">
                {item?.name}
              </h3>

              {hasInfoBoxContent ? (
                <button
                  type="button"
                  onClick={() => setInfoOpen(true)}
                  className="rounded-full border border-gray-200 bg-gray-50 p-1.5 text-gray-500 transition hover:text-primary"
                  title="View ingredients and allergens"
                >
                  <Eye size={15} />
                </button>
              ) : null}
            </div>

            <p className="mb-2 text-xs text-gray-500">
              {truncatedDesc || "Fresh premium item"}
            </p>

            <p className="text-sm font-semibold text-gray-900">
              ${displayCardPrice.toFixed(2)}
            </p>

            <button
              type="button"
              onClick={handleNavigateToDetails}
              className="mt-2 flex items-center gap-1 text-xs text-primary"
            >
              <Info size={14} /> Item Info
            </button>
          </div>

          <div className="relative h-[110px] w-[120px] overflow-hidden rounded-xl">
            <Image
              src={item?.imageUrl || "/placeholder.png"}
              alt={item?.name || "item"}
              fill
              className="object-cover"
              unoptimized
            />

            <button
              type="button"
              onClick={handlePlusClick}
              disabled={loading}
              className="absolute bottom-2 right-2 rounded-full bg-primary p-2 text-white shadow-sm transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )}
            </button>
          </div>
        </div>

        {animateCart ? (
          <div className="absolute bottom-6 right-6 h-3 w-3 animate-bounce rounded-full bg-primary" />
        ) : null}
      </div>

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-auto rounded-2xl p-6">
          <h2 className="mb-1 text-lg font-semibold text-gray-900">
            Product Information
          </h2>

          <p className="mb-5 text-sm text-gray-500">{item?.name}</p>

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
              <h3 className="mb-2 font-semibold text-gray-900">Allergens</h3>

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

            {hasNutritionalInformation ? (
              <div>
                <h3 className="mb-2 font-semibold text-gray-900">
                  Nutritional Information
                </h3>

                <p className="text-sm leading-relaxed text-gray-600">
                  {item.nutritionalInformation}
                </p>
              </div>
            ) : null}

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
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[95vh] max-w-md overflow-auto rounded-2xl p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            {item?.name}
          </h2>

          {itemVariations.length > 0 ? (
            <div className="mb-5">
              <p className="mb-2 font-medium text-gray-900">Size</p>

              <div className="grid grid-cols-1 gap-3">
                {itemVariations.map((variation) => (
                  <label
                    key={variation.id}
                    className={`cursor-pointer rounded-xl border px-4 py-3 transition ${
                      selectedVariation?.id === variation.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name={`size-${item?.id}`}
                          checked={selectedVariation?.id === variation.id}
                          onChange={() => setSelectedVariation(variation)}
                          className="mt-1 accent-[var(--primary)]"
                        />

                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {variation.name}
                          </p>

                          {variation.description ? (
                            <p className="mt-1 text-xs leading-relaxed text-gray-500">
                              {variation.description}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {toNumber(variation.price, 0) > 0 ? (
                        <span className="shrink-0 text-sm font-semibold text-primary">
                          ${toNumber(variation.price, 0).toFixed(2)}
                        </span>
                      ) : null}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          <div
            className={`mb-5 rounded-2xl border border-gray-100 bg-gray-50 p-4 transition ${
              itemSupportsSplitPizza ? "" : "pointer-events-none opacity-50"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900">
                  Enable split pizza
                </p>
                <p className="text-xs text-gray-500">
                  {itemSupportsSplitPizza
                    ? "Choose another split-pizza item for the second half."
                    : "Split pizza is not available for this item."}
                </p>
              </div>

              <button
                type="button"
                disabled={!itemSupportsSplitPizza}
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

          {filteredModifierLinks.length > 0 ? (
            <div>
              {renderModifierGroups({
                links: filteredModifierLinks,
                selectionMap: selectedModifiers,
                menuItem: item,
                variation: selectedVariation,
                scope: "main",
              })}
            </div>
          ) : null}

          <div className="mb-5">
            <p className="mb-2 font-medium text-gray-900">
              Special Instructions
            </p>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add cooking notes, e.g. no onions, extra spicy..."
              className="h-24 w-full rounded-xl bg-gray-100 p-3 text-sm outline-none"
            />
          </div>

          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center rounded-full bg-gray-100 px-3 py-1.5">
              <button
                type="button"
                onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                className="px-2 text-lg text-gray-700"
                disabled={loading}
              >
                <Minus size={16} />
              </button>

              <span className="px-4 text-sm font-semibold text-gray-900">
                {qty}
              </span>

              <button
                type="button"
                onClick={() => setQty((prev) => prev + 1)}
                className="px-2 text-lg text-gray-700"
                disabled={loading}
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="text-lg font-semibold text-primary">
              ${totalPrice.toFixed(2)}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? "Processing..." : "Add to Cart"}
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}