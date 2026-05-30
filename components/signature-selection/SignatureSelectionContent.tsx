"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  List,
  Loader2,
  Menu as MenuIcon,
  Minus,
  Plus,
  X,
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

type MenuViewMode = "multiple" | "onePage";

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
  pickupPrice?: string | number | null;
  displayText?: string | null;
  priceDelta?: string | number;
  variation?: any;
  modifierPriceOverrides?: VariationPriceOverride[];
};

type MenuVariation = {
  id: string;
  categoryId?: string;
  name: string;
  description?: string;
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
  displayText?: string | null;
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
  restaurantId?: string;
  restaurantMenuId?: string;
  menuLinks?: any[];
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  basePrice?: string | number;
  unitPrice?: string | number;
  price?: string | number;
  isActive?: boolean;
  supportsSplitPizza?: boolean;
  isRequired?: boolean;
  minSelect?: number;
  maxSelect?: number;
  minQuantity?: number;
  maxQuantity?: number;
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
    variationLinks?: any[];
    modifierLinks?: ModifierLink[];
    modifierGroups?: ModifierGroup[];
    categoryModifierGroups?: any[];
  };
  variations?: MenuVariation[];
  variationPriceOverrides?: VariationPriceOverride[];
  modifierLinks?: ModifierLink[];
  modifierGroups?: ModifierGroup[];
  categoryModifierGroups?: ModifierGroup[] | any[];
  modifierPriceOverrides?: any[];
  modifiers?: Modifier[];
  splitPizza?: {
    enabled?: boolean;
    slots?: string[];
    pricingRule?: string;
    allowedFlavors?: any[];
  };
};

type MenuRecord = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
  items?: {
    id: string;
    sortOrder?: number;
    menuItem?: MenuItem;
  }[];
};

type ProductCardData = {
  id: string;
  name: string;
  slug?: string;
  price: number;
  image: string;
  description: string;
  variations: MenuVariation[];
  modifierLinks: ModifierLink[];
  raw: MenuItem;
};

type SelectedModifiersMap = Record<string, SelectedModifier[]>;

const ADDONS_GROUP_ID = "__item_addons__";
const MENU_PAGE_LIMIT = 20;

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
  if (Array.isArray(res?.data?.items)) return res.data.items;
  if (Array.isArray(res?.items)) return res.items;
  return [];
};

const normalizeApiMeta = (res: any) => {
  return (
    res?.data?.pagination ||
    res?.data?.meta ||
    res?.data?.data?.pagination ||
    res?.data?.data?.meta ||
    res?.pagination ||
    res?.meta ||
    {}
  );
};

const resolveHasNext = ({
  meta,
  page,
  limit,
  receivedCount,
  totalLoaded,
}: {
  meta: any;
  page: number;
  limit: number;
  receivedCount: number;
  totalLoaded: number;
}) => {
  if (typeof meta?.hasNext === "boolean") return meta.hasNext;
  if (typeof meta?.hasMore === "boolean") return meta.hasMore;

  const currentPage = Number(meta?.page ?? page);
  const totalPages = Number(meta?.totalPages ?? meta?.pages ?? 0);
  const total = Number(meta?.total ?? 0);

  if (totalPages > 0) return currentPage < totalPages;
  if (total > 0) return totalLoaded < total;

  return receivedCount >= limit;
};

const normalizeArray = (value: any): any[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [];
};

/* ================= PRODUCT INFO HELPERS ================= */

const titleizeConstant = (value: any) => {
  return String(value || "")
    .trim()
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getTenantSettings = (item: any) => {
  return (
    item?.restaurant?.tenant?.settings ||
    item?.tenant?.settings ||
    item?.restaurant?.settings ||
    {}
  );
};

const getProductLabelMap = (item: any) => {
  const settings = getTenantSettings(item);
  const labels = normalizeArray(settings?.productLabels);

  const map = new Map<string, string>();

  labels.forEach((entry: any) => {
    const value = String(entry?.value || entry?.code || "").trim();
    const label = String(entry?.label || entry?.name || "").trim();

    if (value) {
      map.set(value, label || titleizeConstant(value));
    }
  });

  return map;
};

const getProductLabels = (item: any) => {
  const labelMap = getProductLabelMap(item);

  const rawLabels = [
    ...normalizeArray(item?.labels),
    ...normalizeArray(item?.dietaryFlags),
  ];

  const seen = new Set<string>();

  return rawLabels
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .filter((value) => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    })
    .map((value) => ({
      value,
      label: labelMap.get(value) || titleizeConstant(value),
    }));
};

const getAllergenTemplateMap = (item: any) => {
  const settings = getTenantSettings(item);

  const templates =
    settings?.customerApp?.allergenAdditiveTemplates ||
    settings?.allergenAdditiveTemplates ||
    {};

  const allergens = normalizeArray(templates?.allergens);
  const additives = normalizeArray(templates?.additives);

  const map = new Map<string, string>();

  [...allergens, ...additives].forEach((entry: any) => {
    const code = String(entry?.code || entry?.value || "").trim();
    const label = String(entry?.label || entry?.name || "").trim();

    if (code && label) {
      map.set(code, label);
    }
  });

  return map;
};

const getAllergenAdditives = (item: any) => {
  const templateMap = getAllergenTemplateMap(item);
  const seen = new Set<string>();

  const directEntries = normalizeArray(item?.allergenAdditives)
    .map((entry: any) => {
      const code = String(entry?.code || entry?.value || "").trim();
      const directLabel = String(entry?.label || entry?.name || "").trim();
      const mappedLabel = code ? templateMap.get(code) : "";

      return {
        code,
        label: directLabel || mappedLabel || "",
      };
    })
    .filter((entry) => hasText(entry.label));

  const codeEntries = [
    ...normalizeArray(item?.allergenCodes),
    ...normalizeArray(item?.allergenFlags),
    ...normalizeArray(item?.additiveCodes),
    ...normalizeArray(item?.additiveFlags),
  ]
    .map((code) => {
      const normalizedCode = String(code || "").trim();
      const mappedLabel = templateMap.get(normalizedCode) || "";

      return {
        code: normalizedCode,
        label: mappedLabel,
      };
    })
    .filter((entry) => hasText(entry.label));

  return [...directEntries, ...codeEntries]
    .filter((entry) => entry.label)
    .filter((entry) => {
      const key = entry.label.toLowerCase();

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    });
};

const hasProductInfoContent = (item: any) => {
  return Boolean(
    hasText(item?.ingredients) ||
      hasText(item?.nutritionalInformation) ||
      getProductLabels(item).length > 0 ||
      getAllergenAdditives(item).length > 0 ||
      hasText(item?.allergenPdfUrl)
  );
};

function ProductInfoContent({ item }: { item: any }) {
  const productLabels = getProductLabels(item);
  const allergenAdditives = getAllergenAdditives(item);

  const hasIngredients = hasText(item?.ingredients);
  const hasNutritionalInformation = hasText(item?.nutritionalInformation);
  const hasAllergenPdf = hasText(item?.allergenPdfUrl);

  const hasAnyInfo =
    hasIngredients ||
    hasNutritionalInformation ||
    productLabels.length > 0 ||
    allergenAdditives.length > 0 ||
    hasAllergenPdf;

  if (!hasAnyInfo) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-center">
        <p className="text-sm font-medium text-gray-900">
          No additional product information
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Details for ingredients, allergens, labels, and nutrition have not
          been added yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {productLabels.length > 0 ? (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-900">
            Product Labels
          </h3>

          <div className="flex flex-wrap gap-2">
            {productLabels.map((label) => (
              <span
                key={label.value}
                className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 ring-1 ring-green-100"
              >
                {label.label}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {allergenAdditives.length > 0 ? (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-900">
            Allergens & Additives
          </h3>

          <div className="flex flex-wrap gap-2">
            {allergenAdditives.map((entry) => (
              <span
                key={entry.label}
                className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-red-100"
              >
                {entry.label}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {hasIngredients ? (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-900">
            Ingredients
          </h3>
          <p className="text-sm leading-relaxed text-gray-600">
            {item.ingredients}
          </p>
        </div>
      ) : null}

      {hasNutritionalInformation ? (
        <div className="rounded-2xl bg-gray-50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-900">
            Nutritional Information
          </h3>
          <p className="text-sm leading-relaxed text-gray-600">
            {item.nutritionalInformation}
          </p>
        </div>
      ) : null}

      {hasAllergenPdf ? (
        <a
          href={String(item.allergenPdfUrl)}
          download
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white"
        >
          <Download size={16} />
          Download allergen PDF
        </a>
      ) : null}
    </div>
  );
}

const getId = (value: any) => {
  if (value === undefined || value === null) return "";
  return String(value);
};

const getOverrideAmount = (override?: any | null) => {
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

  const matching = overrides.filter(
    (override) => getOverrideVariationId(override) === String(variationId)
  );

  if (!matching.length) return null;

  if (menuItemId) {
    const itemSpecific = matching.find(
      (override) => getOverrideMenuItemId(override) === String(menuItemId)
    );

    if (itemSpecific) return itemSpecific;
  }

  return matching.find(isGenericMenuItemOverride) || matching[0];
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

  const matching = overrides.filter(
    (override) => getOverrideModifierId(override) === normalizedModifierId
  );

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

  return matching.find(isGenericMenuItemOverride) || matching[0];
};

/* ================= CART API HELPERS ================= */

const getApiErrorMessage = (res: any, fallback = "Something went wrong") => {
  if (!res) return fallback;

  if (typeof res?.error === "string") return res.error;
  if (typeof res?.error?.message === "string") return res.error.message;
  if (typeof res?.message === "string") return res.message;
  if (typeof res?.data?.message === "string") return res.data.message;
  if (typeof res?.data?.error === "string") return res.data.error;
  if (typeof res?.data?.error?.message === "string") {
    return res.data.error.message;
  }

  return fallback;
};

const isBranchCartConflictResponse = (res: any) => {
  const message = getApiErrorMessage(res, "")
    .toLowerCase()
    .replace(/\s+/g, " ");

  return (
    message.includes("cart already contains items from another branch") ||
    (message.includes("another branch") && message.includes("clear"))
  );
};


export default function SignatureSelectionContent({
  restaurantId,
  customerId,
  branchId,
  onCartRefresh,
}: SignatureSelectionContentProps) {
  const { token } = useAuth();
  const { get, post, del } = useApi(token);

  const [menus, setMenus] = useState<MenuRecord[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string>("");
  const [activeOnePageMenuId, setActiveOnePageMenuId] = useState<string>("");
  const [loadingMenus, setLoadingMenus] = useState(false);

  const [viewMode, setViewMode] = useState<MenuViewMode>(() => {
    if (typeof window === "undefined") return "multiple";

    const stored = localStorage.getItem("signatureMenuViewMode");

    return stored === "onePage" || stored === "multiple"
      ? stored
      : "multiple";
  });

  const [scrollTarget, setScrollTarget] = useState<{
    id: string;
    nonce: number;
  } | null>(null);

  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftStart, setScrollLeftStart] = useState(0);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const menuSectionRefs = useRef<Record<string, HTMLElement | null>>({});

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

  const menuIdsKey = useMemo(() => {
    return menus.map((menu) => String(menu?.id || "")).join("|");
  }, [menus]);

  useEffect(() => {
    localStorage.setItem("signatureMenuViewMode", viewMode);
  }, [viewMode]);

  const normalizeMenuRecords = (items: any[]): MenuRecord[] => {
    const deduped = new Map<string, MenuRecord>();

    items.forEach((menu: any) => {
      if (!menu?.id) return;
      if (menu?.isActive === false) return;

      deduped.set(String(menu.id), {
        ...menu,
        id: String(menu.id),
        sortOrder: toNumber(menu?.sortOrder, 0),
        items: Array.isArray(menu?.items) ? menu.items : [],
      });
    });

    return sortBySortOrder(Array.from(deduped.values()));
  };

  const fetchMenus = async () => {
    if (!restaurantId || !token) return;

    try {
      setLoadingMenus(true);

      let page = 1;
      let totalLoaded = 0;
      let collected: any[] = [];
      let shouldContinue = true;

      while (shouldContinue) {
        const params = new URLSearchParams({
          restaurantId: String(restaurantId),
          page: String(page),
          limit: String(MENU_PAGE_LIMIT),
          sortBy: "sortOrder",
          sortOrder: "ASC",
        });

        const res = await get(`/v1/menus?${params.toString()}`);

        if (!res || res.error) {
          toast.error(res?.error || "Failed to fetch menus");
          break;
        }

        const fetchedMenus = normalizeApiList(res);
        const meta = normalizeApiMeta(res);

        collected = [...collected, ...fetchedMenus];
        totalLoaded += fetchedMenus.length;

        shouldContinue = resolveHasNext({
          meta,
          page,
          limit: MENU_PAGE_LIMIT,
          receivedCount: fetchedMenus.length,
          totalLoaded,
        });

        page += 1;

        if (page > 30) {
          shouldContinue = false;
        }
      }

      const menuData = normalizeMenuRecords(collected);

      setMenus(menuData);

      if (menuData.length > 0) {
        setActiveMenuId((prev) =>
          prev && menuData.some((menu) => menu.id === prev)
            ? prev
            : menuData[0].id
        );

        setActiveOnePageMenuId((prev) =>
          prev && menuData.some((menu) => menu.id === prev)
            ? prev
            : menuData[0].id
        );
      } else {
        setActiveMenuId("");
        setActiveOnePageMenuId("");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, token]);

  const activeMenu = useMemo(
    () => menus.find((menu) => menu.id === activeMenuId) || menus[0] || null,
    [menus, activeMenuId]
  );

  const activeChipMenuId = useMemo(() => {
    if (viewMode === "onePage") {
      return activeOnePageMenuId || menus?.[0]?.id || "";
    }

    return activeMenuId || menus?.[0]?.id || "";
  }, [viewMode, activeOnePageMenuId, activeMenuId, menus]);

  useEffect(() => {
    if (!menus.length) {
      setActiveOnePageMenuId("");
      return;
    }

    const activeStillExists = menus.some(
      (menu) => String(menu.id) === String(activeOnePageMenuId)
    );

    if (!activeOnePageMenuId || !activeStillExists) {
      setActiveOnePageMenuId(String(menus[0].id));
    }
  }, [menus, activeOnePageMenuId]);

  const handleViewModeChange = (nextMode: MenuViewMode) => {
    setViewMode(nextMode);

    if (nextMode === "onePage") {
      const id = String(activeMenuId || activeOnePageMenuId || menus?.[0]?.id || "");

      if (id) {
        setActiveOnePageMenuId(id);
        setScrollTarget({
          id,
          nonce: Date.now(),
        });
      }
    }
  };

  const handleMenuClick = (menuId: string) => {
    if (viewMode === "onePage") {
      setActiveOnePageMenuId(menuId);
      setScrollTarget({
        id: menuId,
        nonce: Date.now(),
      });
      return;
    }

    setActiveMenuId(menuId);
  };

  useEffect(() => {
    if (viewMode !== "onePage") return;
    if (!scrollTarget?.id) return;

    const el = menuSectionRefs.current[String(scrollTarget.id)];

    if (!el) return;

    window.requestAnimationFrame(() => {
      el.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [viewMode, scrollTarget?.id, scrollTarget?.nonce]);

  useEffect(() => {
    if (viewMode !== "onePage") return;
    if (!menus.length) return;

    let frameId: number | null = null;

    const getDocumentHeight = () => {
      return Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight
      );
    };

    const updateActiveMenu = () => {
      frameId = null;

      const menuIds = menus
        .map((menu) => String(menu?.id || ""))
        .filter(Boolean);

      if (!menuIds.length) return;

      const scrollTop = window.scrollY || window.pageYOffset || 0;
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight || 0;
      const documentHeight = getDocumentHeight();

      const lastMenuId = menuIds[menuIds.length - 1];

      const isNearPageBottom =
        scrollTop + viewportHeight >= documentHeight - 120;

      if (isNearPageBottom) {
        setActiveOnePageMenuId(lastMenuId);
        return;
      }

      const activationLine =
        scrollTop + Math.min(220, Math.max(120, viewportHeight * 0.28));

      let nextActiveId = menuIds[0];

      for (const id of menuIds) {
        const section = menuSectionRefs.current[id];

        if (!section) continue;

        const sectionTop = section.getBoundingClientRect().top + scrollTop;

        if (sectionTop <= activationLine) {
          nextActiveId = id;
        } else {
          break;
        }
      }

      setActiveOnePageMenuId(nextActiveId);
    };

    const scheduleUpdate = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(updateActiveMenu);
    };

    scheduleUpdate();

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [viewMode, menuIdsKey, menus]);

  const normalizeVariation = (raw: any): MenuVariation | null => {
    if (!raw?.id) return null;
    if (raw?.isActive === false) return null;

    return {
      id: String(raw.id),
      categoryId: raw?.categoryId,
      name: String(raw?.name || ""),
      description: raw?.description || "",
      price: raw?.price ?? 0,
      pickupPrice: raw?.pickupPrice ?? null,
      displayText: raw?.displayText ?? null,
      sortOrder: toNumber(raw?.sortOrder, 0),
      isDefault: Boolean(raw?.isDefault),
      isActive: raw?.isActive !== false,
      modifierPriceOverrides: Array.isArray(raw?.modifierPriceOverrides)
        ? raw.modifierPriceOverrides
        : [],
      itemPriceOverrides: Array.isArray(raw?.itemPriceOverrides)
        ? raw.itemPriceOverrides
        : [],
    };
  };

  const normalizeModifier = (
    raw: any,
    extra?: Partial<Modifier>
  ): Modifier | null => {
    if (!raw?.id) return null;
    if (raw?.isActive === false) return null;

    return {
      id: String(raw.id),
      name: String(raw?.name || ""),
      displayText: raw?.displayText ?? raw?.label ?? null,
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
      ...extra,
    };
  };

  const getAllRawVariationSources = (item?: MenuItem | null) => {
    if (!item) return [];

    const fromVariationPriceOverrides = normalizeArray(
      item?.variationPriceOverrides
    )
      .map((override) => ({
        ...(override?.variation || {}),
        id: override?.variationId || override?.variation?.id,
        price: override?.price ?? override?.variation?.price,
        pickupPrice: override?.pickupPrice ?? override?.variation?.pickupPrice,
        displayText: override?.displayText ?? override?.variation?.displayText,
        itemPriceOverrides: [
          ...normalizeArray(override?.variation?.itemPriceOverrides),
          override,
        ],
        modifierPriceOverrides: [
          ...normalizeArray(override?.variation?.modifierPriceOverrides),
          ...normalizeArray(override?.modifierPriceOverrides),
        ],
      }))
      .filter((variation) => variation?.id);

    const fromCategoryVariationLinks = normalizeArray(
      item?.category?.variationLinks
    )
      .map((link) => link?.variation)
      .filter(Boolean);

    return [
      ...normalizeArray(item?.variations),
      ...fromVariationPriceOverrides,
      ...normalizeArray(item?.category?.variations),
      ...fromCategoryVariationLinks,
    ];
  };

  const getItemVariations = (item?: MenuItem | null): MenuVariation[] => {
    if (!item) return [];

    const rawVariations = getAllRawVariationSources(item);

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

  const getStandaloneItemModifiers = (
    item: MenuItem,
    linkedModifierIds: Set<string>
  ) => {
    const modifiersFromOverrides = normalizeArray(item?.modifierPriceOverrides)
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
              menuItemId: item?.id,
              modifierId: override?.modifierId || override?.modifier?.id,
              priceDelta: override?.priceDelta,
              price: override?.price,
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

    const directModifiers = normalizeArray(item?.modifiers)
      .map((modifier) => normalizeModifier(modifier))
      .filter(Boolean) as Modifier[];

    const deduped = new Map<string, Modifier>();

    [...modifiersFromOverrides, ...directModifiers].forEach((modifier) => {
      if (!modifier?.id) return;
      if (linkedModifierIds.has(String(modifier.id))) return;

      const existing = deduped.get(String(modifier.id));

      deduped.set(String(modifier.id), {
        ...(existing || {}),
        ...modifier,
        itemPriceOverrides: [
          ...normalizeArray(existing?.itemPriceOverrides),
          ...normalizeArray(modifier?.itemPriceOverrides),
        ],
        variationPriceOverrides: [
          ...normalizeArray(existing?.variationPriceOverrides),
          ...normalizeArray(modifier?.variationPriceOverrides),
        ],
      });
    });

    return sortBySortOrder(Array.from(deduped.values()));
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

    const normalizedFromModifierGroups: ModifierLink[] = [
      ...normalizeArray(item?.modifierGroups),
      ...normalizeArray(item?.category?.modifierGroups),
    ]
      .map((group: any, index: number) => {
        const normalizedGroup = normalizeGroup(group?.modifierGroup || group);
        if (!normalizedGroup) return null;

        return {
          id: `group-${normalizedGroup.id}-${index}`,
          variationId: null,
          sortOrder: toNumber(normalizedGroup.sortOrder, 0),
          modifierGroup: normalizedGroup,
        };
      })
      .filter(Boolean) as ModifierLink[];

    const normalizedFromCategoryModifierGroups: ModifierLink[] = [
      ...normalizeArray(item?.categoryModifierGroups),
      ...normalizeArray(item?.category?.categoryModifierGroups),
    ]
      .map((group: any, index: number) => {
        const normalizedGroup = normalizeGroup(group?.modifierGroup || group);
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

    const linkedModifierIds = new Set<string>();

    Array.from(deduped.values()).forEach((link) => {
      normalizeArray(link?.modifierGroup?.modifiers).forEach((modifier) => {
        if (modifier?.id) linkedModifierIds.add(String(modifier.id));
      });
    });

    const standaloneModifiers = getStandaloneItemModifiers(
      item,
      linkedModifierIds
    );

    if (standaloneModifiers.length) {
      const standaloneLink: ModifierLink = {
        id: `standalone-modifiers-${item.id}`,
        variationId: null,
        sortOrder: 999,
        modifierGroup: {
          id: `standalone-modifiers-${item.id}`,
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
      };

      deduped.set(`common::${standaloneLink.modifierGroup.id}`, standaloneLink);
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
    const modifierId = String(modifier?.id || "");
    const variationId = String(variation?.id || "");

    if (variationId) {
      const modifierSideOverride = findBestModifierOverride({
        overrides: modifier?.variationPriceOverrides,
        modifierId,
        menuItemId: itemId,
        variationId,
      });

      const modifierSideAmount = getOverrideAmount(modifierSideOverride);

      if (modifierSideAmount !== null) {
        return modifierSideAmount;
      }

      const variationSideOverride = findBestModifierOverride({
        overrides: variation?.modifierPriceOverrides,
        modifierId,
        menuItemId: itemId,
        variationId,
      });

      const variationSideAmount = getOverrideAmount(variationSideOverride);

      if (variationSideAmount !== null) {
        return variationSideAmount;
      }
    }

    const itemOverride = findBestModifierOverride({
      overrides: modifier?.itemPriceOverrides,
      modifierId,
      menuItemId: itemId,
    });

    const itemAmount = getOverrideAmount(itemOverride);

    if (itemAmount !== null) {
      return itemAmount;
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
      toast.error(
        `You can select up to ${maxSelect} option(s) for ${group.name}`
      );
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
          `${
            group?.name || "This group"
          } requires at least ${minSelect} selection(s)`
        );
        return false;
      }

      if (maxSelect && selectedInGroup.length > maxSelect) {
        toast.error(
          `${
            group?.name || "This group"
          } allows at most ${maxSelect} selection(s)`
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
        quantity: 1,
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

        return acc + modifierPrice;
      }, 0);
  };

  const getMenuItemBasePrice = (item?: MenuItem | null) => {
    return toNumber(item?.basePrice ?? item?.unitPrice ?? item?.price, 0);
  };

  const getMenuItemResolvedPrice = (
    item?: MenuItem | null,
    variation?: MenuVariation | null
  ) => {
    if (!item) return 0;

    if (variation?.id) {
      return toNumber(variation.price, 0);
    }

    return getMenuItemBasePrice(item);
  };

  const getCalculatedPrice = (
    item: MenuItem,
    variation?: MenuVariation | null,
    modifiersMap?: SelectedModifiersMap,
    splitItem?: MenuItem | null,
    splitVariation?: MenuVariation | null
  ) => {
    const resolvedItemPrice = getMenuItemResolvedPrice(item, variation);
    const modifiersTotal = getModifiersTotal(item, variation, modifiersMap);

    const splitItemPrice = splitItem
      ? getMenuItemResolvedPrice(
          splitItem,
          splitVariation || getDefaultVariation(splitItem)
        )
      : 0;

    const basePrice = splitItem
      ? Math.max(resolvedItemPrice, splitItemPrice)
      : resolvedItemPrice;

    return basePrice + modifiersTotal;
  };

  const buildProductsForMenu = (menu?: MenuRecord | null): ProductCardData[] => {
    if (!menu?.items?.length) return [];

    return menu.items
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
          price: getMenuItemResolvedPrice(item, defaultVariation),
          image: item.imageUrl || "/placeholder.png",
          description: item.description || "",
          variations,
          modifierLinks: getItemModifierLinks(item),
          raw: item,
        };
      });
  };

  const products = useMemo(() => {
    return buildProductsForMenu(activeMenu);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMenu]);

  const onePageMenuSections = useMemo(() => {
    return menus.map((menu) => ({
      menu,
      products: buildProductsForMenu(menu),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menus]);

  const filteredModifierLinks = useMemo(() => {
    return getVisibleModifierLinks(selectedItem, selectedVariation);
  }, [selectedItem, selectedVariation]);

  const selectedItemAddons = useMemo(() => {
    if (!selectedItem) return [];
    return getStandaloneItemModifiers(selectedItem, new Set<string>());
  }, [selectedItem]);

  const selectedAddons = selectedModifiers[ADDONS_GROUP_ID] || [];

  const itemQuantityRules = useMemo(() => {
    const minQuantity = Math.max(1, toNumber(selectedItem?.minQuantity, 1));
    const rawMaxQuantity = toNumber(selectedItem?.maxQuantity, 0);

    return {
      minQuantity,
      maxQuantity: rawMaxQuantity > 0 ? rawMaxQuantity : undefined,
    };
  }, [selectedItem]);

  const addonSelectionRules = useMemo(() => {
    const rawMinSelect = toNumber(selectedItem?.minSelect, 0);
    const rawMaxSelect = toNumber(selectedItem?.maxSelect, 0);
    const isRequired = Boolean(selectedItem?.isRequired);

    return {
      minSelect: Math.max(isRequired ? 1 : 0, rawMinSelect),
      maxSelect: rawMaxSelect > 0 ? rawMaxSelect : undefined,
      isRequired,
    };
  }, [selectedItem]);

  const addonSelectionLabel = useMemo(() => {
    const { minSelect, maxSelect } = addonSelectionRules;

    if (minSelect > 0 && maxSelect) {
      return `Min ${minSelect} · Max ${maxSelect}`;
    }

    if (minSelect > 0) {
      return `Min ${minSelect}`;
    }

    if (maxSelect) {
      return `Max ${maxSelect}`;
    }

    return "Optional";
  }, [addonSelectionRules]);

  const quantityLabel = useMemo(() => {
    const { minQuantity, maxQuantity } = itemQuantityRules;

    if (maxQuantity) {
      return `Min ${minQuantity} · Max ${maxQuantity}`;
    }

    return `Min ${minQuantity}`;
  }, [itemQuantityRules]);

  useEffect(() => {
    const validAddonIds = new Set(
      selectedItemAddons.map((addon) => String(addon.id))
    );

    setSelectedModifiers((prev): SelectedModifiersMap => {
      const existingAddons = prev[ADDONS_GROUP_ID] || [];
      const nextAddons = existingAddons.filter((addon) =>
        validAddonIds.has(String(addon.id))
      );

      if (!nextAddons.length) {
        return {};
      }

      const next: SelectedModifiersMap = {};
      next[ADDONS_GROUP_ID] = nextAddons;
      return next;
    });
  }, [selectedItemAddons]);

  useEffect(() => {
    setQty((prev) => {
      const minQuantity = itemQuantityRules.minQuantity;
      const maxQuantity = itemQuantityRules.maxQuantity;
      const nextQuantity = Math.max(minQuantity, prev);

      return maxQuantity ? Math.min(maxQuantity, nextQuantity) : nextQuantity;
    });
  }, [itemQuantityRules]);

  useEffect(() => {
    if (selectedItemSupportsSplitPizza) return;

    setSplitPizzaEnabled(false);
    setSplitPizzaItem(null);
    setSplitPizzaVariation(null);
    setSplitPizzaModifiers({});
  }, [selectedItemSupportsSplitPizza]);

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

  const openItemModal = (item: MenuItem) => {
    const defaultVariation = getDefaultVariation(item);

    setSelectedItem(item);
    setSelectedVariation(defaultVariation);
    setSelectedModifiers({});
    setSplitPizzaEnabled(false);
    setSplitPizzaItem(null);
    setSplitPizzaVariation(null);
    setSplitPizzaModifiers({});
    setQty(Math.max(1, toNumber(item?.minQuantity, 1)));
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
    setSplitPizzaItem(item || null);
    setSplitPizzaVariation(item ? getDefaultVariation(item) : null);
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

    if (!validateAddonSelections(item, safeModifiersMap)) {
      return;
    }

    if (splitPizzaEnabled && !splitPizzaItem?.id) {
      toast.error("Please select the other pizza half");
      return;
    }

    try {
      setAddingId(item.id);

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

      const addCartItem = async () => {
        return post(`/v1/cart/items?customerId=${customerId}`, payload);
      };

      let res = await addCartItem();

      if (isBranchCartConflictResponse(res)) {
        toast.info("Your cart had items from another branch. Clearing cart...");

        const clearCartRes = await del(`/v1/cart?customerId=${customerId}`);

        if (!clearCartRes || clearCartRes.error) {
          toast.error(
            getApiErrorMessage(clearCartRes, "Failed to clear cart")
          );
          return;
        }

        res = await addCartItem();
      }

      if (!res || res.error) {
        toast.error(getApiErrorMessage(res, "Failed to add to cart"));
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
    const addons = getStandaloneItemModifiers(item, new Set<string>());

    const hasOptions =
      variations.length > 0 ||
      addons.length > 0 ||
      Boolean(item?.supportsSplitPizza);

    if (hasOptions) {
      openItemModal(item);
      return;
    }

    addToCart(
      item,
      Math.max(1, toNumber(item?.minQuantity, 1)),
      null,
      {}
    );
  };

  const openInfoModal = (item: MenuItem) => {
    setInfoItem(item);
    setInfoOpen(true);
  };

  const hasInfoContent = (item?: MenuItem | null) => {
    return hasProductInfoContent(item);
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

  const handleAddonToggle = (modifier: Modifier) => {
    setSelectedModifiers((prev): SelectedModifiersMap => {
      const current = prev[ADDONS_GROUP_ID] || [];
      const isSelected = current.some((addon) => addon.id === modifier.id);
      const { minSelect, maxSelect } = addonSelectionRules;
      const itemName = selectedItem?.name || "This item";

      if (isSelected) {
        if (minSelect > 0 && current.length <= minSelect) {
          toast.error(
            `${itemName} requires at least ${minSelect} add-on${
              minSelect === 1 ? "" : "s"
            }`
          );
          return prev;
        }

        const nextAddons = current.filter((addon) => addon.id !== modifier.id);
        const next: SelectedModifiersMap = {};

        if (nextAddons.length) {
          next[ADDONS_GROUP_ID] = nextAddons;
        }

        return next;
      }

      if (maxSelect && current.length >= maxSelect) {
        toast.error(
          `${itemName} allows at most ${maxSelect} add-on${
            maxSelect === 1 ? "" : "s"
          }`
        );
        return prev;
      }

      return {
        ...prev,
        [ADDONS_GROUP_ID]: [
          ...current,
          {
            ...modifier,
            selectedQuantity: 1,
          },
        ],
      };
    });
  };

  const validateAddonSelections = (
    item: MenuItem,
    modifiersMap: SelectedModifiersMap
  ) => {
    const addons = getStandaloneItemModifiers(item, new Set<string>());

    if (!addons.length) return true;

    const selectedCount = (modifiersMap[ADDONS_GROUP_ID] || []).length;
    const minSelect = Math.max(
      Boolean(item?.isRequired) ? 1 : 0,
      toNumber(item?.minSelect, 0)
    );
    const rawMaxSelect = toNumber(item?.maxSelect, 0);
    const maxSelect = rawMaxSelect > 0 ? rawMaxSelect : undefined;
    const itemName = item?.name || "This item";

    if (minSelect > 0 && selectedCount < minSelect) {
      toast.error(
        `${itemName} requires at least ${minSelect} add-on${
          minSelect === 1 ? "" : "s"
        }`
      );
      return false;
    }

    if (maxSelect && selectedCount > maxSelect) {
      toast.error(
        `${itemName} allows at most ${maxSelect} add-on${
          maxSelect === 1 ? "" : "s"
        }`
      );
      return false;
    }

    return true;
  };

  const renderAddonSection = () => {
    if (!selectedItem || !selectedItemAddons.length) return null;

    const { maxSelect } = addonSelectionRules;
    const selectedCount = selectedAddons.length;

    return (
      <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-gray-900">Add-ons</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                {addonSelectionLabel}
              </span>
              <span className="text-xs text-gray-500">
                Choose from available add-ons
              </span>
            </div>
          </div>

          <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
            {selectedCount}
            {maxSelect ? ` / ${maxSelect}` : ""} selected
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {selectedItemAddons.map((modifier) => {
            const checked = selectedAddons.some(
              (selected) => selected.id === modifier.id
            );

            const disableBecauseMaxReached =
              !checked && Boolean(maxSelect) && selectedCount >= Number(maxSelect);

            const effectivePrice = getModifierEffectivePrice(
              modifier,
              selectedItem.id,
              selectedVariation
            );

            return (
              <label
                key={modifier.id}
                className={`flex cursor-pointer items-start justify-between gap-3 rounded-xl border px-3 py-3 text-sm transition ${
                  disableBecauseMaxReached
                    ? "cursor-not-allowed border-gray-100 bg-gray-100 opacity-70"
                    : checked
                    ? "border-primary/25 bg-primary/5 ring-1 ring-primary/20"
                    : "border-gray-100 bg-gray-50 hover:border-primary/25 hover:bg-white"
                }`}
              >
                <span className="flex min-w-0 flex-1 items-start gap-2 text-gray-800">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disableBecauseMaxReached}
                    onChange={() => handleAddonToggle(modifier)}
                    className="mt-1 accent-[var(--primary)]"
                  />

                  <span className="min-w-0">
                    <span className="block truncate font-medium text-gray-900">
                      {(modifier as any).displayText || modifier.name}
                    </span>

                    {modifier.description ? (
                      <span className="mt-1 block text-xs leading-relaxed text-gray-500">
                        {modifier.description}
                      </span>
                    ) : null}
                  </span>
                </span>

                {effectivePrice > 0 ? (
                  <span className="shrink-0 font-semibold text-primary">
                    +${effectivePrice.toFixed(2)}
                  </span>
                ) : null}
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  const totalModalPrice = selectedItem
    ? getCalculatedPrice(
        selectedItem,
        selectedVariation,
        selectedModifiers,
        splitPizzaEnabled ? splitPizzaItem : null,
        splitPizzaVariation
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

                    {toNumber(effectivePrice, 0) > 0 ? (
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

  const renderProductCard = (product: ProductCardData) => {
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
  };

  return (
    <>
      <section className="overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8 xl:pr-5">
        <div className="w-full max-w-full">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-[21px] font-semibold leading-tight tracking-[-0.02em] text-[#1f1f1f] sm:text-[32px]">
                Our Signature Selection
              </h1>
              <p className="mt-2 max-w-[560px] text-[13px] leading-6 text-[#8a8a8a] sm:text-sm">
                Every dish is a curated masterpiece, crafted with locally sourced
                ingredients and a passion for culinary excellence.
              </p>
            </div>

            <div className="w-full rounded-2xl bg-gray-100 p-1 sm:w-fit">
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => handleViewModeChange("multiple")}
                  className={`flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold transition ${
                    viewMode === "multiple"
                      ? "bg-white text-primary shadow-sm"
                      : "text-gray-500 hover:bg-white/70 hover:text-gray-800"
                  }`}
                >
                  <MenuIcon size={15} />
                  By Menu
                </button>

                <button
                  type="button"
                  onClick={() => handleViewModeChange("onePage")}
                  className={`flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold transition ${
                    viewMode === "onePage"
                      ? "bg-white text-primary shadow-sm"
                      : "text-gray-500 hover:bg-white/70 hover:text-gray-800"
                  }`}
                >
                  <List size={15} />
                  1 Page
                </button>
              </div>
            </div>
          </div>

          <div className="relative mb-7 w-full max-w-full overflow-hidden">
            <button
              type="button"
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
                const active = String(activeChipMenuId) === String(menu.id);

                return (
                  <button
                    key={menu.id}
                    type="button"
                    onClick={() => handleMenuClick(String(menu.id))}
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
              type="button"
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
          ) : menus.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-black/10 bg-[#fafafa] p-8 text-center">
              <p className="text-sm text-[#777]">No menus found.</p>
            </div>
          ) : viewMode === "onePage" ? (
            <div className="space-y-10">
              {onePageMenuSections.map(({ menu, products }) => (
                <section
                  key={menu.id}
                  ref={(el) => {
                    menuSectionRefs.current[String(menu.id)] = el;
                  }}
                  data-menu-id={menu.id}
                  className="scroll-mt-24"
                >
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="text-[20px] font-semibold text-gray-900">
                        {menu.name}
                      </h2>

                      {hasText(menu.description) ? (
                        <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
                          {menu.description}
                        </p>
                      ) : (
                        <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
                          Explore available items from this menu.
                        </p>
                      )}
                    </div>

                    <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
                      {products.length} item
                      {products.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {products.length === 0 ? (
                    <div className="rounded-[20px] border border-dashed border-black/10 bg-[#fafafa] p-8 text-center">
                      <p className="text-sm text-[#777]">
                        No menu items found in this menu.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
                      {products.map((product) => renderProductCard(product))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-black/10 bg-[#fafafa] p-8 text-center">
              <p className="text-sm text-[#777]">No menu items found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {products.map((product) => renderProductCard(product))}
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

      {infoOpen && infoItem ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => {
            setInfoOpen(false);
            setInfoItem(null);
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-[520px] overflow-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Product Information
                </h2>
                <p className="mt-1 text-sm text-gray-500">{infoItem.name}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setInfoOpen(false);
                  setInfoItem(null);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            <ProductInfoContent item={infoItem} />
          </div>
        </div>
      ) : null}

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
                    Select variation, add-ons, and quantity
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
                                {variation.displayText || variation.name}
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

              {selectedItemSupportsSplitPizza ? (
                <div className="mb-5 rounded-2xl border border-gray-100 bg-gray-50 p-4 transition">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        Enable split pizza
                      </p>
                      <p className="text-xs text-gray-500">
                        Choose another split-pizza item for the second half.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleSplitPizzaToggle(!splitPizzaEnabled)
                      }
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

                            {getMenuItemResolvedPrice(
                              splitPizzaItem,
                              splitPizzaVariation ||
                                getDefaultVariation(splitPizzaItem)
                            ) > 0 ? (
                              <span className="shrink-0 font-medium text-primary">
                                $
                                {getMenuItemResolvedPrice(
                                  splitPizzaItem,
                                  splitPizzaVariation ||
                                    getDefaultVariation(splitPizzaItem)
                                ).toFixed(2)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {renderAddonSection()}

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

              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center rounded-full bg-gray-100 px-3 py-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setQty((prev) =>
                          Math.max(itemQuantityRules.minQuantity, prev - 1)
                        )
                      }
                      className="px-2 text-lg text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={
                        addingId === selectedItem.id ||
                        qty <= itemQuantityRules.minQuantity
                      }
                    >
                      <Minus className="h-4 w-4" />
                    </button>

                    <span className="px-4 text-sm font-semibold text-gray-900">
                      {qty}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setQty((prev) =>
                          itemQuantityRules.maxQuantity
                            ? Math.min(itemQuantityRules.maxQuantity, prev + 1)
                            : prev + 1
                        )
                      }
                      className="px-2 text-lg text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={
                        addingId === selectedItem.id ||
                        Boolean(
                          itemQuantityRules.maxQuantity &&
                            qty >= itemQuantityRules.maxQuantity
                        )
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="mt-1 text-center text-[11px] font-medium text-gray-500">
                    {quantityLabel}
                  </p>
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