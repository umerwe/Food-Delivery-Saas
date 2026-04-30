"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Loader2,
  Minus,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import useApi from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import AsyncSelect from "@/components/ui/AsyncSelect";

type SignatureSelectionContentProps = {
  restaurantId?: string | null;
  customerId?: string;
  branchId?: string | null;
  onCartRefresh?: () => void;
};

type ItemPriceOverride = {
  id?: string;
  menuItemId?: string;
  modifierId?: string;
  price?: string | number;
  priceDelta?: string | number;
};

type VariationPriceOverride = {
  id?: string;
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

type MenuItem = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  basePrice?: string | number;
  unitPrice?: string | number;
  price?: string | number;
  isActive?: boolean;
  supportsSplitPizza?: boolean;
  categoryId?: string;
  ingredients?: string | null;
  nutritionalInformation?: string | null;
  allergenFlags?: string[];
  dietaryFlags?: string[];
  allergenPdfUrl?: string | null;
  category?: {
    id: string;
    name?: string;
    variations?: MenuVariation[];
    modifierLinks?: ModifierLink[];
  };
  variations?: MenuVariation[];
  modifierLinks?: ModifierLink[];
  modifierGroups?: ModifierGroup[];
  categoryModifierGroups?: ModifierGroup[];
};

type MenuRecord = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  items?: {
    id: string;
    sortOrder?: number;
    menuItem?: MenuItem;
  }[];
};

type SelectedModifiersMap = Record<string, SelectedModifier[]>;

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
  return [];
};

export default function SignatureSelectionContent({
  restaurantId,
  customerId,
  branchId,
  onCartRefresh,
}: SignatureSelectionContentProps) {
  const { token } = useAuth();
  const { get, post } = useApi(token);

  const [menus, setMenus] = useState<MenuRecord[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string>("");
  const [loadingMenus, setLoadingMenus] = useState(false);

  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftStart, setScrollLeftStart] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [addingId, setAddingId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedVariation, setSelectedVariation] =
    useState<MenuVariation | null>(null);
  const [selectedModifiers, setSelectedModifiers] =
    useState<SelectedModifiersMap>({});
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  const [infoOpen, setInfoOpen] = useState(false);
  const [infoItem, setInfoItem] = useState<MenuItem | null>(null);

  const [splitPizzaEnabled, setSplitPizzaEnabled] = useState(false);
  const [splitPizzaItem, setSplitPizzaItem] = useState<any>(null);
  const [splitPizzaVariation, setSplitPizzaVariation] =
    useState<MenuVariation | null>(null);
  const [splitPizzaModifiers, setSplitPizzaModifiers] =
    useState<SelectedModifiersMap>({});

  const selectedItemSupportsSplitPizza = Boolean(
    selectedItem?.supportsSplitPizza
  );

  const fetchMenus = async () => {
    if (!restaurantId) return;

    try {
      setLoadingMenus(true);

      const res = await get(`/v1/menus?restaurantId=${restaurantId}`);

      if (!res || res.error) {
        toast.error(res?.error || "Failed to fetch menus");
        return;
      }

      const rawMenus = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : [];

      const menuData: MenuRecord[] = rawMenus.filter(
        (menu: MenuRecord) => menu?.isActive !== false
      );

      setMenus(menuData);

      if (menuData.length > 0) {
        setActiveMenuId((prev) =>
          prev && menuData.some((menu) => menu.id === prev)
            ? prev
            : menuData[0].id
        );
      } else {
        setActiveMenuId("");
      }
    } catch (error) {
      console.error("Failed to fetch menus:", error);
      toast.error("Failed to fetch menus");
    } finally {
      setLoadingMenus(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, [restaurantId]);

  const activeMenu = useMemo(
    () => menus.find((menu) => menu.id === activeMenuId) || menus[0] || null,
    [menus, activeMenuId]
  );

  const normalizeVariation = (raw: any): MenuVariation | null => {
    if (!raw?.id) return null;
    if (raw?.isActive === false) return null;

    return {
      id: String(raw.id),
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
  };

  const normalizeModifier = (raw: any): Modifier | null => {
    if (!raw?.id) return null;
    if (raw?.isActive === false) return null;

    return {
      id: String(raw.id),
      name: String(raw?.name || ""),
      description: raw?.description ?? null,
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

  const getItemVariations = (item?: MenuItem | null): MenuVariation[] => {
    if (!item) return [];

    const rawVariations = [
      ...(Array.isArray(item?.variations) ? item.variations : []),
      ...(Array.isArray(item?.category?.variations)
        ? item.category.variations
        : []),
    ];

    const deduped = new Map<string, MenuVariation>();

    for (const raw of rawVariations) {
      const normalized = normalizeVariation(raw);
      if (!normalized) continue;

      if (!deduped.has(normalized.id)) {
        deduped.set(normalized.id, normalized);
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

  const getItemModifierLinks = (item?: MenuItem | null): ModifierLink[] => {
    if (!item) return [];

    const normalizedFromItemModifierLinks: ModifierLink[] = (
      Array.isArray(item?.modifierLinks) ? item.modifierLinks : []
    )
      .map((link: any, index: number) => {
        const normalizedGroup = normalizeGroup(link?.modifierGroup);
        if (!normalizedGroup) return null;

        return {
          id: String(link?.id || `item-link-${normalizedGroup.id}-${index}`),
          variationId: link?.variationId ? String(link.variationId) : null,
          sortOrder: toNumber(
            link?.sortOrder ?? normalizedGroup.sortOrder ?? 0,
            0
          ),
          modifierGroup: normalizedGroup,
        };
      })
      .filter(Boolean) as ModifierLink[];

    const normalizedFromCategoryModifierLinks: ModifierLink[] = (
      Array.isArray(item?.category?.modifierLinks)
        ? item.category.modifierLinks
        : []
    )
      .map((link: any, index: number) => {
        const normalizedGroup = normalizeGroup(link?.modifierGroup);
        if (!normalizedGroup) return null;

        return {
          id: String(
            link?.id || `category-link-${normalizedGroup.id}-${index}`
          ),
          variationId: link?.variationId ? String(link.variationId) : null,
          sortOrder: toNumber(
            link?.sortOrder ?? normalizedGroup.sortOrder ?? 0,
            0
          ),
          modifierGroup: normalizedGroup,
        };
      })
      .filter(Boolean) as ModifierLink[];

    const normalizedFromModifierGroups: ModifierLink[] = (
      Array.isArray(item?.modifierGroups) ? item.modifierGroups : []
    )
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

    const normalizedFromCategoryModifierGroups: ModifierLink[] = (
      Array.isArray(item?.categoryModifierGroups)
        ? item.categoryModifierGroups
        : []
    )
      .map((group: any, index: number) => {
        const normalizedGroup = normalizeGroup(group);
        if (!normalizedGroup) return null;

        return {
          id: `category-group-${normalizedGroup.id}-${index}`,
          variationId: null,
          sortOrder: toNumber(normalizedGroup.sortOrder, 0),
          modifierGroup: normalizedGroup,
        };
      })
      .filter(Boolean) as ModifierLink[];

    const deduped = new Map<string, ModifierLink>();

    for (const link of [
      ...normalizedFromItemModifierLinks,
      ...normalizedFromCategoryModifierLinks,
      ...normalizedFromModifierGroups,
      ...normalizedFromCategoryModifierGroups,
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

  const getDefaultVariation = (item?: MenuItem | null) => {
    const variations = getItemVariations(item);
    if (!variations.length) return null;

    return variations.find((variation) => variation.isDefault) || variations[0];
  };

  const getVisibleModifierLinks = (
    item?: MenuItem | null,
    variation?: MenuVariation | null
  ) => {
    const links = getItemModifierLinks(item);
    const hasVariations = getItemVariations(item).length > 0;

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
    itemId?: string,
    variation?: MenuVariation | null
  ) => {
    const variationId = String(variation?.id || "");

    const variationOverrideFromModifier = Array.isArray(
      modifier?.variationPriceOverrides
    )
      ? modifier.variationPriceOverrides.find(
          (override) => String(override?.variationId || "") === variationId
        )
      : null;

    if (variationOverrideFromModifier) {
      if (
        variationOverrideFromModifier?.priceDelta !== undefined &&
        variationOverrideFromModifier?.priceDelta !== null
      ) {
        return toNumber(variationOverrideFromModifier.priceDelta, 0);
      }

      if (
        variationOverrideFromModifier?.price !== undefined &&
        variationOverrideFromModifier?.price !== null
      ) {
        return toNumber(variationOverrideFromModifier.price, 0);
      }
    }

    const variationOverrideFromVariation = Array.isArray(
      variation?.modifierPriceOverrides
    )
      ? variation.modifierPriceOverrides.find(
          (override) =>
            String(override?.modifierId || "") === String(modifier?.id || "")
        )
      : null;

    if (variationOverrideFromVariation) {
      if (
        variationOverrideFromVariation?.priceDelta !== undefined &&
        variationOverrideFromVariation?.priceDelta !== null
      ) {
        return toNumber(variationOverrideFromVariation.priceDelta, 0);
      }

      if (
        variationOverrideFromVariation?.price !== undefined &&
        variationOverrideFromVariation?.price !== null
      ) {
        return toNumber(variationOverrideFromVariation.price, 0);
      }
    }

    const itemOverride = Array.isArray(modifier?.itemPriceOverrides)
      ? modifier.itemPriceOverrides.find(
          (override) =>
            String(override?.menuItemId || "") === String(itemId || "")
        )
      : null;

    if (itemOverride) {
      if (
        itemOverride?.priceDelta !== undefined &&
        itemOverride?.priceDelta !== null
      ) {
        return toNumber(itemOverride.priceDelta, 0);
      }

      if (itemOverride?.price !== undefined && itemOverride?.price !== null) {
        return toNumber(itemOverride.price, 0);
      }
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
      maxSelect: rawMax,
      isRequired,
    };
  };

  const handleModifierToggle = (
    group: ModifierGroup,
    modifier: Modifier,
    scope: "main" | "split" = "main"
  ) => {
    const groupId = String(group.id);

    const selectionMap =
      scope === "main" ? selectedModifiers : splitPizzaModifiers;

    const setSelectionMap =
      scope === "main" ? setSelectedModifiers : setSplitPizzaModifiers;

    const current = selectionMap[groupId] || [];
    const { maxSelect } = getGroupValidation(group);
    const alreadySelected = current.some((m) => m.id === modifier.id);

    if (maxSelect === 1) {
      setSelectionMap((prev) => ({
        ...prev,
        [groupId]: alreadySelected
          ? []
          : [
              {
                ...modifier,
                selectedQuantity: 1,
              },
            ],
      }));
      return;
    }

    if (alreadySelected) {
      setSelectionMap((prev) => ({
        ...prev,
        [groupId]: current.filter((m) => m.id !== modifier.id),
      }));
      return;
    }

    if (maxSelect && current.length >= maxSelect) {
      toast.error(`You can select up to ${maxSelect} option(s) for ${group.name}`);
      return;
    }

    setSelectionMap((prev) => ({
      ...prev,
      [groupId]: [
        ...current,
        {
          ...modifier,
          selectedQuantity: 1,
        },
      ],
    }));
  };

  const handleModifierQuantityChange = (
    groupId: string,
    modifierId: string,
    type: "inc" | "dec",
    scope: "main" | "split" = "main"
  ) => {
    const setSelectionMap =
      scope === "main" ? setSelectedModifiers : setSplitPizzaModifiers;

    setSelectionMap((prev) => ({
      ...prev,
      [groupId]: (prev[groupId] || []).map((modifier) => {
        if (modifier.id !== modifierId) return modifier;

        const currentQty = Math.max(1, toNumber(modifier.selectedQuantity, 1));
        const nextQty =
          type === "inc" ? currentQty + 1 : Math.max(1, currentQty - 1);

        return {
          ...modifier,
          selectedQuantity: nextQty,
        };
      }),
    }));
  };

  const validateSelections = (
    item: MenuItem,
    modifiersMap: SelectedModifiersMap,
    variation?: MenuVariation | null
  ) => {
    const visibleLinks = getVisibleModifierLinks(item, variation);

    for (const link of visibleLinks) {
      const group = link?.modifierGroup;
      const groupId = String(group?.id || "");
      const selectedInGroup = modifiersMap[groupId] || [];
      const { minSelect, maxSelect } = getGroupValidation(group);

      if (minSelect > 0 && selectedInGroup.length < minSelect) {
        toast.error(
          `${group?.name || "This group"} requires at least ${minSelect} selection(s)`
        );
        return false;
      }

      if (maxSelect && selectedInGroup.length > maxSelect) {
        toast.error(
          `${group?.name || "This group"} allows at most ${maxSelect} selection(s)`
        );
        return false;
      }
    }

    return true;
  };

  const sanitizeSelectedModifiersForVisibleGroups = (
    prev: SelectedModifiersMap,
    visibleLinks: ModifierLink[]
  ) => {
    const visibleGroupIds = new Set(
      visibleLinks.map((link) => String(link?.modifierGroup?.id || ""))
    );

    const next: SelectedModifiersMap = {};

    for (const [groupId, modifiers] of Object.entries(prev || {})) {
      if (visibleGroupIds.has(String(groupId))) {
        next[groupId] = modifiers;
      }
    }

    return next;
  };

  const buildModifiersPayload = (modifiersMap: SelectedModifiersMap) => {
    return Object.values(modifiersMap)
      .flat()
      .map((modifier) => ({
        modifierId: modifier.id,
        quantity: Math.max(1, toNumber(modifier.selectedQuantity, 1)),
      }));
  };

  const getModifiersTotal = (
    item: MenuItem,
    variation?: MenuVariation | null,
    modifiersMap?: SelectedModifiersMap
  ) => {
    return Object.values(modifiersMap || {})
      .flat()
      .reduce((acc, modifier) => {
        const modifierPrice = getModifierEffectivePrice(
          modifier,
          item?.id,
          variation
        );

        const modifierQty = Math.max(
          1,
          toNumber(modifier.selectedQuantity, 1)
        );

        return acc + modifierPrice * modifierQty;
      }, 0);
  };

  const getCalculatedPrice = (
    item: MenuItem,
    variation?: MenuVariation | null,
    modifiersMap?: SelectedModifiersMap,
    splitItem?: MenuItem | null,
    splitVariation?: MenuVariation | null,
    splitModifiersMap?: SelectedModifiersMap
  ) => {
    const resolvedItemPrice = variation
      ? toNumber(variation?.price, 0)
      : toNumber(item?.basePrice ?? item?.unitPrice ?? item?.price, 0);

    const modifiersTotal = getModifiersTotal(item, variation, modifiersMap);

    const splitModifiersTotal = splitItem
      ? getModifiersTotal(splitItem, splitVariation, splitModifiersMap)
      : 0;

    return resolvedItemPrice + modifiersTotal + splitModifiersTotal;
  };

  const products = useMemo(() => {
    if (!activeMenu?.items?.length) return [];

    return activeMenu.items
      .filter((entry) => entry?.menuItem && entry.menuItem.isActive !== false)
      .sort((a, b) => toNumber(a?.sortOrder, 0) - toNumber(b?.sortOrder, 0))
      .map((entry) => {
        const item = entry.menuItem as MenuItem;

        const variations = getItemVariations(item);
        const defaultVariation =
          variations.find((variation) => variation.isDefault) ||
          variations[0] ||
          null;

        return {
          id: item.id,
          name: item.name,
          slug: item.slug,
          price: defaultVariation
            ? toNumber(defaultVariation?.price, 0)
            : toNumber(item.basePrice ?? item.unitPrice ?? item.price, 0),
          image: item.imageUrl || "/placeholder.png",
          description: item.description || "",
          variations,
          modifierLinks: getItemModifierLinks(item),
          raw: item,
        };
      });
  }, [activeMenu]);

  const filteredModifierLinks = useMemo(() => {
    return getVisibleModifierLinks(selectedItem, selectedVariation);
  }, [selectedItem, selectedVariation]);

  const splitPizzaModifierLinks = useMemo(() => {
    if (!splitPizzaEnabled || !splitPizzaItem) return [];
    return getVisibleModifierLinks(splitPizzaItem, splitPizzaVariation);
  }, [splitPizzaEnabled, splitPizzaItem, splitPizzaVariation]);

  useEffect(() => {
    if (!selectedItem) return;

    const visibleLinks = getVisibleModifierLinks(selectedItem, selectedVariation);

    setSelectedModifiers((prev) =>
      sanitizeSelectedModifiersForVisibleGroups(prev, visibleLinks)
    );
  }, [selectedItem, selectedVariation]);

  useEffect(() => {
    if (selectedItemSupportsSplitPizza) return;

    setSplitPizzaEnabled(false);
    setSplitPizzaItem(null);
    setSplitPizzaVariation(null);
    setSplitPizzaModifiers({});
  }, [selectedItemSupportsSplitPizza]);

  useEffect(() => {
    if (!splitPizzaEnabled || !splitPizzaItem) {
      setSplitPizzaModifiers({});
      return;
    }

    setSplitPizzaModifiers((prev) =>
      sanitizeSelectedModifiersForVisibleGroups(prev, splitPizzaModifierLinks)
    );
  }, [splitPizzaEnabled, splitPizzaItem, splitPizzaModifierLinks]);

  const fetchPizzaItems = async ({
    search,
    page,
  }: {
    search: string;
    page: number;
  }) => {
    const resolvedSearch = search?.trim() || "pizza";

    const res = await get(
      `/v1/menu/items?search=${encodeURIComponent(resolvedSearch)}&page=${page}`
    );

    const data = normalizeApiList(res).filter((menuItem: any) => {
      if (!menuItem?.id) return false;
      if (String(menuItem.id) === String(selectedItem?.id)) return false;

      const name = String(menuItem?.name || "").toLowerCase();
      const categoryName = String(menuItem?.category?.name || "").toLowerCase();

      return name.includes("pizza") || categoryName.includes("pizza");
    });

    return {
      data,
      meta: res?.data?.meta || res?.meta,
    };
  };

  const openItemModal = (item: MenuItem) => {
    const defaultVariation = getDefaultVariation(item);

    setSelectedItem(item);
    setSelectedVariation(defaultVariation);
    setSelectedModifiers({});
    setSplitPizzaEnabled(false);
    setSplitPizzaItem(null);
    setSplitPizzaVariation(null);
    setSplitPizzaModifiers({});
    setQty(1);
    setNote("");
    setModalOpen(true);
  };

  const handleSplitPizzaToggle = (checked: boolean) => {
    if (!selectedItemSupportsSplitPizza) return;

    setSplitPizzaEnabled(checked);

    if (!checked) {
      setSplitPizzaItem(null);
      setSplitPizzaVariation(null);
      setSplitPizzaModifiers({});
    }
  };

  const handleSplitPizzaItemChange = (item: any) => {
    setSplitPizzaItem(item);
    setSplitPizzaVariation(getDefaultVariation(item));
    setSplitPizzaModifiers({});
  };

  const addToCart = async (
    item: MenuItem,
    quantity = 1,
    variation?: MenuVariation | null,
    modifiersMap?: SelectedModifiersMap
  ) => {
    if (!customerId) {
      toast.error("Customer not found");
      return;
    }

    if (!branchId) {
      toast.error("Please select a branch first");
      return;
    }

    const safeModifiersMap = modifiersMap || {};

    if (!validateSelections(item, safeModifiersMap, variation)) {
      return;
    }

    if (splitPizzaEnabled) {
      if (!splitPizzaItem?.id) {
        toast.error("Please select the other pizza half");
        return;
      }

      if (
        !validateSelections(
          splitPizzaItem,
          splitPizzaModifiers,
          splitPizzaVariation
        )
      ) {
        return;
      }
    }

    try {
      setAddingId(item.id);
 const splitSections =
  splitPizzaEnabled && splitPizzaItem?.id
    ? [
        {
          slot: "LEFT",
          menuItemId: item.id,
          modifiers: buildModifiersPayload(selectedModifiers),
        },
        {
          slot: "RIGHT",
          menuItemId: splitPizzaItem.id,
          modifiers: buildModifiersPayload(splitPizzaModifiers),
        },
      ]
    : undefined;


      const payload: any = {
        menuItemId: item.id,
        quantity,
        variationId: variation?.id || null,
        branchId,
        note: note.trim() || "",
        modifiers: buildModifiersPayload(safeModifiersMap),
      };

        if (splitSections) {
        payload.sections = splitSections;
      }
      const res = await post(`/v1/cart/items?customerId=${customerId}`, payload);

      if (!res || res.error) {
        toast.error(res?.error || "Failed to add to cart");
        return;
      }

      toast.success("Added to cart");
      setModalOpen(false);
      onCartRefresh?.();
    } catch (error) {
      console.error("Add to cart failed:", error);
      toast.error("Something went wrong");
    } finally {
      setAddingId(null);
    }
  };

  const handleAddClick = (item: MenuItem) => {
    const variations = getItemVariations(item);
    const modifiers = getItemModifierLinks(item);

    const hasOptions =
      variations.length > 0 ||
      modifiers.length > 0 ||
      Boolean(item?.supportsSplitPizza);

    if (hasOptions) {
      openItemModal(item);
      return;
    }

    addToCart(item, 1, null, {});
  };

  const openInfoModal = (item: MenuItem) => {
    setInfoItem(item);
    setInfoOpen(true);
  };

  const hasInfoContent = (item?: MenuItem | null) => {
    if (!item) return false;

    return (
      hasText(item.ingredients) ||
      hasText(item.nutritionalInformation) ||
      (Array.isArray(item.allergenFlags) && item.allergenFlags.length > 0) ||
      (Array.isArray(item.dietaryFlags) && item.dietaryFlags.length > 0) ||
      hasText(item.allergenPdfUrl)
    );
  };

  const startDragging = (pageX: number) => {
    if (!scrollRef.current) return;

    setIsDown(true);
    setStartX(pageX - scrollRef.current.offsetLeft);
    setScrollLeftStart(scrollRef.current.scrollLeft);
  };

  const stopDragging = () => setIsDown(false);

  const onMouseMove = (pageX: number) => {
    if (!isDown || !scrollRef.current) return;

    const x = pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.1;
    scrollRef.current.scrollLeft = scrollLeftStart - walk;
  };

  const scrollMenu = (direction: "left" | "right") => {
    if (!scrollRef.current) return;

    const amount = direction === "left" ? -220 : 220;
    scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  const totalModalPrice = selectedItem
    ? getCalculatedPrice(
        selectedItem,
        selectedVariation,
        selectedModifiers,
        splitPizzaEnabled ? splitPizzaItem : null,
        splitPizzaVariation,
        splitPizzaModifiers
      ) * qty
    : 0;

  const renderModifierGroups = ({
    links,
    selectionMap,
    item,
    variation,
    scope,
  }: {
    links: ModifierLink[];
    selectionMap: SelectedModifiersMap;
    item: MenuItem;
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
        <div
          key={`${scope}-${String(link?.variationId || "common")}-${groupId}`}
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
                item.id,
                variation
              );

              const inputType = maxSelect === 1 ? "radio" : "checkbox";

              const selectedQty = Math.max(
                1,
                toNumber(selectedModifier?.selectedQuantity, 1)
              );

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
                          handleModifierToggle(group, modifier, scope)
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

                  {checked ? (
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-white px-2 py-1.5">
                      <span className="text-xs text-gray-500">Quantity</span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleModifierQuantityChange(
                              groupId,
                              modifier.id,
                              "dec",
                              scope
                            )
                          }
                          className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 text-gray-700 hover:border-primary hover:text-primary"
                        >
                          <Minus size={12} strokeWidth={3} />
                        </button>

                        <span className="w-5 text-center text-sm font-semibold text-gray-900">
                          {selectedQty}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            handleModifierQuantityChange(
                              groupId,
                              modifier.id,
                              "inc",
                              scope
                            )
                          }
                          className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 text-gray-700 hover:border-primary hover:text-primary"
                        >
                          <Plus size={12} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <>
      <section className="overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8 xl:pr-5">
        <div className="w-full max-w-full">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-[21px] font-semibold leading-tight tracking-[-0.02em] text-[#1f1f1f] sm:text-[32px]">
                Our Signature Selection
              </h1>
              <p className="mt-2 max-w-[560px] text-[13px] leading-6 text-[#8a8a8a] sm:text-sm">
                Every dish is a curated masterpiece, crafted with locally sourced
                ingredients and a passion for culinary excellence.
              </p>
            </div>
          </div>

          <div className="relative mb-7 w-full max-w-full overflow-hidden">
            <button
              onClick={() => scrollMenu("left")}
              className="absolute left-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/90 shadow-[0_6px_20px_rgba(0,0,0,0.06)] backdrop-blur md:flex"
            >
              <ChevronLeft className="h-4 w-4 text-[#555]" />
            </button>

            <div
              ref={scrollRef}
              className={`scrollbar-hide flex w-full max-w-full select-none gap-2.5 overflow-x-auto py-2 md:px-11 ${
                isDown ? "cursor-grabbing" : "cursor-grab"
              }`}
              onMouseDown={(e) => startDragging(e.pageX)}
              onMouseLeave={stopDragging}
              onMouseUp={stopDragging}
              onMouseMove={(e) => onMouseMove(e.pageX)}
              onTouchStart={(e) => startDragging(e.touches[0].pageX)}
              onTouchEnd={stopDragging}
              onTouchMove={(e) => onMouseMove(e.touches[0].pageX)}
            >
              {menus.map((menu) => {
                const active = activeMenu?.id === menu.id;

                return (
                  <button
                    key={menu.id}
                    onClick={() => setActiveMenuId(menu.id)}
                    className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                      active
                        ? "border-primary/15 bg-primary text-primary-foreground shadow-[0_8px_18px_rgba(0,0,0,0.08)]"
                        : "border-black/10 bg-white text-[#444] hover:border-primary/30 hover:text-primary"
                    }`}
                  >
                    {menu.name}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => scrollMenu("right")}
              className="absolute right-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/90 shadow-[0_6px_20px_rgba(0,0,0,0.06)] backdrop-blur md:flex"
            >
              <ChevronRight className="h-4 w-4 text-[#555]" />
            </button>
          </div>

          {loadingMenus ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-black/10 bg-[#fafafa] p-8 text-center">
              <p className="text-sm text-[#777]">No menu items found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {products.map((product) => {
                const nameParts = product.name.split(" ");
                const firstLine = nameParts.slice(0, 2).join(" ");
                const secondLine = nameParts.slice(2).join(" ");

                return (
                  <div
                    key={product.id}
                    className="group min-w-0 overflow-hidden rounded-[20px] border border-black/5 bg-white shadow-[-12px_0_32px_0_rgba(26,28,28,0.09)] transition-all duration-300 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
                  >
                    <div className="relative h-[210px] w-full overflow-hidden bg-[#f5f5f5]">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        unoptimized
                      />

                      {hasInfoContent(product.raw) ? (
                        <button
                          type="button"
                          onClick={() => openInfoModal(product.raw)}
                          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm backdrop-blur transition hover:bg-primary hover:text-white"
                          title="View ingredients and allergens"
                        >
                          <Eye size={16} />
                        </button>
                      ) : null}
                    </div>

                    <div className="p-4">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <h3 className="min-w-0 flex-1 text-[17px] font-semibold leading-[1.35] tracking-[-0.01em] text-[#202020]">
                          <span className="block break-words">{firstLine}</span>
                          <span className="block break-words">{secondLine}</span>
                        </h3>

                        <span className="shrink-0 pt-0.5 text-[18px] font-semibold text-primary">
                          ${toNumber(product.price, 0).toFixed(2)}
                        </span>
                      </div>

                      <p className="line-clamp-2 min-h-[44px] text-[13px] leading-[1.65] text-[#8a8a8a]">
                        {product.description}
                      </p>

                      <button
                        onClick={() => handleAddClick(product.raw)}
                        disabled={addingId === product.id}
                        className="mt-4 flex h-11 w-full items-center justify-center rounded-full border border-primary/10 bg-primary text-[13px] font-medium text-primary-foreground shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-95 disabled:opacity-70"
                      >
                        {addingId === product.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "+ Add to Cart"
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <style jsx>{`
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </section>

      <Dialog
        open={infoOpen}
        onOpenChange={(nextOpen) => {
          setInfoOpen(nextOpen);

          if (!nextOpen) {
            setInfoItem(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-md overflow-auto rounded-2xl p-6">
          {infoItem ? (
            <>
              <h2 className="mb-1 text-lg font-semibold text-gray-900">
                Product Information
              </h2>

              <p className="mb-5 text-sm text-gray-500">{infoItem.name}</p>

              <div className="space-y-5">
                <div>
                  <h3 className="mb-2 font-semibold text-gray-900">
                    Ingredients
                  </h3>

                  {hasText(infoItem.ingredients) ? (
                    <p className="text-sm leading-relaxed text-gray-600">
                      {infoItem.ingredients}
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

                  {Array.isArray(infoItem.allergenFlags) &&
                  infoItem.allergenFlags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {infoItem.allergenFlags.map((flag: string) => (
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

                  {hasText(infoItem.allergenPdfUrl) ? (
                    <a
                      href={String(infoItem.allergenPdfUrl)}
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

                {hasText(infoItem.nutritionalInformation) ? (
                  <div>
                    <h3 className="mb-2 font-semibold text-gray-900">
                      Nutritional Information
                    </h3>

                    <p className="text-sm leading-relaxed text-gray-600">
                      {infoItem.nutritionalInformation}
                    </p>
                  </div>
                ) : null}

                {Array.isArray(infoItem.dietaryFlags) &&
                infoItem.dietaryFlags.length > 0 ? (
                  <div>
                    <h3 className="mb-2 font-semibold text-gray-900">
                      Dietary Preferences
                    </h3>

                    <div className="flex flex-wrap gap-2">
                      {infoItem.dietaryFlags.map((flag: string) => (
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
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={modalOpen}
        onOpenChange={(nextOpen) => {
          setModalOpen(nextOpen);

          if (!nextOpen) {
            setSelectedItem(null);
            setSelectedVariation(null);
            setSelectedModifiers({});
            setSplitPizzaEnabled(false);
            setSplitPizzaItem(null);
            setSplitPizzaVariation(null);
            setSplitPizzaModifiers({});
            setQty(1);
            setNote("");
          }
        }}
      >
        <DialogContent className="max-h-[95vh] max-w-md overflow-auto rounded-2xl p-6">
          {selectedItem ? (
            <>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-gray-900">
                    {selectedItem.name}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Select variation, modifiers, and quantity
                  </p>
                </div>
              </div>

              {getItemVariations(selectedItem).length > 0 ? (
                <div className="mb-5">
                  <p className="mb-2 font-medium text-gray-900">Size</p>

                  <div className="grid grid-cols-1 gap-3">
                    {getItemVariations(selectedItem).map((variation) => (
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
                              name={`size-${selectedItem.id}`}
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
                  selectedItemSupportsSplitPizza
                    ? ""
                    : "pointer-events-none opacity-50"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">
                      Enable split pizza
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedItemSupportsSplitPizza
                        ? "Choose another pizza half and optional modifiers."
                        : "Split pizza is not available for this item."}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={!selectedItemSupportsSplitPizza}
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
                        placeholder="Select pizza"
                        fetchOptions={fetchPizzaItems}
                        labelKey="name"
                        valueKey="id"
                      />
                    </div>

                    {splitPizzaItem ? (
                      <div className="rounded-xl bg-white p-3">
                        <p className="mb-3 text-sm font-semibold text-gray-900">
                          Modifiers for {splitPizzaItem?.name}
                        </p>

                        {splitPizzaModifierLinks.length > 0 ? (
                          <div>
                            {renderModifierGroups({
                              links: splitPizzaModifierLinks,
                              selectionMap: splitPizzaModifiers,
                              item: splitPizzaItem,
                              variation: splitPizzaVariation,
                              scope: "split",
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">
                            No modifiers available for this pizza.
                          </p>
                        )}
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
                    item: selectedItem,
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
                    disabled={addingId === selectedItem.id}
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <span className="px-4 text-sm font-semibold text-gray-900">
                    {qty}
                  </span>

                  <button
                    type="button"
                    onClick={() => setQty((prev) => prev + 1)}
                    className="px-2 text-lg text-gray-700"
                    disabled={addingId === selectedItem.id}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-lg font-semibold text-primary">
                  ${totalModalPrice.toFixed(2)}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  addToCart(
                    selectedItem,
                    qty,
                    selectedVariation,
                    selectedModifiers
                  )
                }
                disabled={addingId === selectedItem.id}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {addingId === selectedItem.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}
                {addingId === selectedItem.id ? "Processing..." : "Add to Cart"}
              </button>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}