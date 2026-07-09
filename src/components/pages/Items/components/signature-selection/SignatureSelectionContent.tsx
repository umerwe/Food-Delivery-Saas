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
import { useTranslations } from "next-intl";
import { useCart } from "@/hooks/useCart";
import { useGroupOrderApi } from "@/hooks/useGroupOrder";
import { useGroupOrderApi } from "@/hooks/useGroupOrder";
import { FavoriteHeartButton } from "@/components/common/favorites/FavoriteHeartButton";
import { useHome } from "@/hooks/useHome";
import useMenu from "@/hooks/useMenu";
import { setStoredRestaurantMenuId } from "@/lib/timed-menu";
import { useAuth } from "@/hooks/useAuth";
import { formatMoney as formatDisplayMoney, resolveCustomerCurrency } from "@/lib/money";
import { getSignatureMenuViewMode, setSignatureMenuViewMode } from "@/lib/view-preferences";
import { getStoredGroupOrderCode, getStoredGroupOrderId, setStoredGroupOrderId } from "@/lib/group-order";
import { getStoredGroupOrderCode, getStoredGroupOrderId, setStoredGroupOrderId } from "@/lib/group-order";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AsyncSelect } from "@/components/ui/AsyncSelect";
import type { ApiRecord, CartPayload, ItemPriceOverride, MenuItem, MenuRecord, MenuVariation, Modifier, ModifierGroup, ModifierLink, ProductCardData, RawModifierLink, SelectedModifier, SelectedModifiersMap, SplitPizzaSelection, VariationPriceOverride } from "./types";
import { normalizeArray, sortBySortOrder, toNumber } from "./signature-selection-utils";
import { getSplitPizzaPricingVariation } from "@/components/pages/Items/utils/restaurant-card-utils";
import {
  buildModifierSelections,
  getModifierGroupSelectedQuantity,
  validateModifierSelections,
} from "@/components/pages/Items/utils/modifier-selections";
import {
  getModifierPriceForVariation,
} from "@/components/pages/Items/utils/modifier-pricing";

type SignatureSelectionContentProps = {
  restaurantId?: string | null;
  customerId?: string;
  branchId?: string | null;
  onCartRefresh?: () => void;
};

type MenuViewMode = "multiple" | "onePage";

const ADDONS_GROUP_ID = "__item_addons__";

const hasText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text !== "" && text.toLowerCase() !== "null";
};

const formatMoney = (value: unknown, currency?: string | null) =>
  formatDisplayMoney(value, currency, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatModifierSelectionPrice = (
  unitPrice: number,
  quantity: number,
  currency?: string | null
) => {
  const safeQuantity = Math.max(1, Math.floor(toNumber(quantity, 1)));

  const sign = unitPrice >= 0 ? "+" : "-";
  const absoluteUnitPrice = Math.abs(unitPrice);
  const total = absoluteUnitPrice * safeQuantity;

  if (safeQuantity <= 1) {
    return `${sign}${formatMoney(absoluteUnitPrice, currency)}`;
  }

  return `${sign}${formatMoney(absoluteUnitPrice, currency)} * ${safeQuantity} = ${sign}${formatMoney(total, currency)}`;
};

const titleizeConstant = (value: unknown) => {
  return String(value || "")
    .trim()
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getTenantSettings = (item: MenuItem | null) => {
  return (
    (item?.restaurant?.tenant as ApiRecord | undefined)?.settings ||
    (item?.tenant as ApiRecord | undefined)?.settings ||
    item?.restaurant?.settings ||
    {}
  );
};

const getProductLabelMap = (item: MenuItem | null) => {
  const settings = getTenantSettings(item) as ApiRecord;
  const labels = normalizeArray<ApiRecord>(settings?.productLabels);

  const map = new Map<string, string>();

  labels.forEach((entry: ApiRecord) => {
    const value = String(entry?.value || entry?.code || "").trim();
    const label = String(entry?.label || entry?.name || "").trim();

    if (value) {
      map.set(value, label || titleizeConstant(value));
    }
  });

  return map;
};

const getProductLabels = (item: MenuItem | null) => {
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

const getAllergenTemplateMap = (item: MenuItem | null) => {
  const settings = getTenantSettings(item) as ApiRecord;
  const customerApp = typeof settings.customerApp === "object" && settings.customerApp !== null ? settings.customerApp as ApiRecord : {};
  const templates = (customerApp.allergenAdditiveTemplates || settings.allergenAdditiveTemplates || {}) as ApiRecord;

  const allergens = normalizeArray<ApiRecord>(templates?.allergens);
  const additives = normalizeArray<ApiRecord>(templates?.additives);

  const map = new Map<string, string>();

  [...allergens, ...additives].forEach((entry: ApiRecord) => {
    const code = String(entry?.code || entry?.value || "").trim();
    const label = String(entry?.label || entry?.name || "").trim();

    if (code && label) {
      map.set(code, label);
    }
  });

  return map;
};

const getAllergenAdditives = (item: MenuItem | null) => {
  const templateMap = getAllergenTemplateMap(item);
  const seen = new Set<string>();

  const directEntries = normalizeArray<ApiRecord>(item?.allergenAdditives)
    .map((entry: ApiRecord) => {
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

const hasProductInfoContent = (item: MenuItem | null) => {
  return Boolean(
    hasText(item?.ingredients) ||
      hasText(item?.nutritionalInformation) ||
      getProductLabels(item).length > 0 ||
      getAllergenAdditives(item).length > 0 ||
      hasText(item?.allergenPdfUrl)
  );
};

function ProductInfoContent({ item }: { item: MenuItem | null }) {
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
            {String(item?.ingredients ?? "")}
          </p>
        </div>
      ) : null}

      {hasNutritionalInformation ? (
        <div className="rounded-2xl bg-gray-50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-900">
            Nutritional Information
          </h3>
          <p className="text-sm leading-relaxed text-gray-600">
            {String(item?.nutritionalInformation ?? "")}
          </p>
        </div>
      ) : null}

      {hasAllergenPdf ? (
        <a
          href={String(item?.allergenPdfUrl)}
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

const getId = (value: unknown) => {
  if (value === undefined || value === null) return "";
  return String(value);
};

const getOverrideAmount = (override?: VariationPriceOverride | ItemPriceOverride | ApiRecord | null) => {
  if (!override) return null;

  if (override.priceDelta !== undefined && override.priceDelta !== null) {
    return toNumber(override.priceDelta, 0);
  }

  if (override.price !== undefined && override.price !== null) {
    return toNumber(override.price, 0);
  }

  return null;
};

const getOverrideMenuItemId = (override: VariationPriceOverride | ItemPriceOverride | ApiRecord | null | undefined) => {
  if (!override) return "";
  return getId(override.menuItemId || ("menuItem" in override ? (override.menuItem as ApiRecord | undefined)?.id : undefined));
};

const getOverrideVariationId = (override: VariationPriceOverride | ApiRecord | null | undefined) => {
  if (!override) return "";
  return getId(override.variationId || ("variation" in override ? (override.variation as ApiRecord | undefined)?.id : undefined));
};

const getOverrideModifierId = (override: VariationPriceOverride | ItemPriceOverride | ApiRecord | null | undefined) => {
  if (!override) return "";
  return getId(override.modifierId || ("modifier" in override ? (override.modifier as ApiRecord | undefined)?.id : undefined));
};

const isGenericMenuItemOverride = (override: VariationPriceOverride | ItemPriceOverride | ApiRecord | null | undefined) => {
  const value = override?.menuItemId;
  return value === null || value === undefined || value === "";
};

const findBestItemPriceOverride = ({
  overrides,
  menuItemId,
  variationId,
}: {
  overrides?: Array<VariationPriceOverride | ItemPriceOverride | ApiRecord>;
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
  overrides?: Array<VariationPriceOverride | ItemPriceOverride | ApiRecord>;
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

  const isItemSpecific = (override: VariationPriceOverride | ItemPriceOverride | ApiRecord) => {
    if (!normalizedMenuItemId) return false;
    return getOverrideMenuItemId(override) === normalizedMenuItemId;
  };

  const isExactVariation = (override: VariationPriceOverride | ItemPriceOverride | ApiRecord) => {
    if (!normalizedVariationId) return false;
    return getOverrideVariationId(override) === normalizedVariationId;
  };

  const hasNoVariation = (override: VariationPriceOverride | ItemPriceOverride | ApiRecord) => !getOverrideVariationId(override);

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



const getApiErrorMessage = (res: ApiRecord | null | undefined, fallback = "Something went wrong") => {
  if (!res) return fallback;

  if (typeof res?.error === "string") return res.error;
  const errorValue = res.error;
  const errorRecord = typeof errorValue === "object" && errorValue !== null && !Array.isArray(errorValue) ? errorValue as ApiRecord : null;
  if (typeof errorRecord?.message === "string") return errorRecord.message;
  if (typeof res?.message === "string") return res.message;
  const dataValue = res.data;
  const dataRecord = typeof dataValue === "object" && dataValue !== null && !Array.isArray(dataValue) ? dataValue as ApiRecord : null;
  if (typeof dataRecord?.message === "string") return dataRecord.message;
  if (typeof dataRecord?.error === "string") return dataRecord.error;
  const dataErrorValue = dataRecord?.error;
  const dataErrorRecord = typeof dataErrorValue === "object" && dataErrorValue !== null && !Array.isArray(dataErrorValue) ? dataErrorValue as ApiRecord : null;
  if (typeof dataErrorRecord?.message === "string") {
    return dataErrorRecord.message;
  }

  return fallback;
};

const isBranchCartConflictResponse = (res: ApiRecord | null | undefined) => {
  const message = getApiErrorMessage(res, "")
    .toLowerCase()
    .replace(/\s+/g, " ");

  return (
    message.includes("cart already contains items from another branch") ||
    (message.includes("another branch") && message.includes("clear"))
  );
};


export function SignatureSelectionContent({
  restaurantId,
  customerId,
  branchId,
  onCartRefresh,
}: SignatureSelectionContentProps) {
  const tCommon = useTranslations("items.common");
  const tProduct = useTranslations("items.productCard");
  const tSignature = useTranslations("items.signature");
  const tErrors = useTranslations("errors");
  const { token } = useAuth();
  const { fetchSignatureMenus, fetchSignatureSplitPizzaItems } = useMenu(token);
  const { addCustomerCartItem, addGroupOrderItem, clearCustomerCart, fetchGroupOrders } = useCart(token);
  const { fetchGroupOrderById, searchGroupOrdersByInviteCode } = useGroupOrderApi(token);
  const homeQuery = useHome(
    restaurantId,
    branchId,
    Boolean(token && restaurantId && branchId)
  );
  const currency = resolveCustomerCurrency({
    configCurrency: homeQuery.data?.data.config?.currency,
    restaurant: homeQuery.data?.data.restaurant,
  });

  const [menus, setMenus] = useState<MenuRecord[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string>("");
  const [activeOnePageMenuId, setActiveOnePageMenuId] = useState<string>("");
  const [loadingMenus, setLoadingMenus] = useState(false);

  const [viewMode, setViewMode] = useState<MenuViewMode>(() => {
    return getSignatureMenuViewMode();
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
  const [splitPizzaItem, setSplitPizzaItem] = useState<MenuItem | null>(null);
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
    setSignatureMenuViewMode(viewMode);
  }, [viewMode]);

  const normalizeMenuRecords = (items: MenuRecord[]): MenuRecord[] => {
    const deduped = new Map<string, MenuRecord>();

    items.forEach((menu) => {
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

      const { menus: collected, error } = await fetchSignatureMenus({
        restaurantId: String(restaurantId),
      });

      if (error) {
        toast.error(error);
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
      toast.error(tSignature("failedFetchMenus"));
    } finally {
      setLoadingMenus(false);
    }
  };

  useEffect(() => {
    fetchMenus();
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
    setStoredRestaurantMenuId(activeChipMenuId);
  }, [activeChipMenuId]);

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

  const normalizeVariation = (raw: MenuVariation | ApiRecord | null | undefined): MenuVariation | null => {
    if (!raw?.id) return null;
    if (raw?.isActive === false) return null;
    const rawRecord = raw as ApiRecord;
    const happyHour = typeof rawRecord.happyHour === "object" && rawRecord.happyHour !== null && !Array.isArray(rawRecord.happyHour)
      ? rawRecord.happyHour as ApiRecord
      : null;
    const promotion = typeof rawRecord.promotion === "object" && rawRecord.promotion !== null && !Array.isArray(rawRecord.promotion)
      ? rawRecord.promotion as ApiRecord
      : null;
    const happyHourDiscountedPrice = typeof rawRecord.happyHourDiscountedPrice === "string" || typeof rawRecord.happyHourDiscountedPrice === "number"
      ? rawRecord.happyHourDiscountedPrice
      : typeof happyHour?.discountedPrice === "string" || typeof happyHour?.discountedPrice === "number"
        ? happyHour.discountedPrice
        : null;
    const discountedPrice = happyHourDiscountedPrice ??
      (typeof rawRecord.discountedPrice === "string" || typeof rawRecord.discountedPrice === "number"
        ? rawRecord.discountedPrice
        : typeof promotion?.discountedAmount === "string" || typeof promotion?.discountedAmount === "number"
          ? promotion.discountedAmount
          : null);

    return {
      id: String(raw.id),
      categoryId: typeof raw?.categoryId === "string" ? raw.categoryId : undefined,
      name: String(raw?.name || ""),
      description: typeof raw?.description === "string" ? raw.description : "",
      price: typeof raw?.price === "string" || typeof raw?.price === "number" ? raw.price : 0,
      pickupPrice: typeof raw?.pickupPrice === "string" || typeof raw?.pickupPrice === "number" ? raw.pickupPrice : null,
      discountedPrice,
      happyHourDiscountedPrice,
      promotion,
      happyHour,
      displayText: typeof raw?.displayText === "string" ? raw.displayText : null,
      sortOrder: toNumber(raw?.sortOrder, 0),
      isDefault: Boolean(raw?.isDefault),
      isActive: raw?.isActive !== false,
      modifierPriceOverrides: normalizeArray<VariationPriceOverride>(raw?.modifierPriceOverrides),
      itemPriceOverrides: normalizeArray<ItemPriceOverride>(raw?.itemPriceOverrides),
    };
  };

  const normalizeModifier = (
    raw: Modifier | ApiRecord | null | undefined,
    extra?: Partial<Modifier>
  ): Modifier | null => {
    if (!raw?.id) return null;
    if (raw?.isActive === false) return null;

    return {
      id: String(raw.id),
      name: String(raw?.name || ""),
      displayText: typeof raw?.displayText === "string" ? raw.displayText : typeof (raw as ApiRecord).label === "string" ? (raw as ApiRecord).label as string : null,
      description: typeof raw?.description === "string" ? raw.description : null,
      priceDelta: typeof raw?.priceDelta === "string" || typeof raw?.priceDelta === "number" ? raw.priceDelta : 0,
      sortOrder: toNumber(raw?.sortOrder, 0),
      isActive: raw?.isActive !== false,
      itemPriceOverrides: normalizeArray<ItemPriceOverride>(raw?.itemPriceOverrides),
      variationPriceOverrides: normalizeArray<VariationPriceOverride>(raw?.variationPriceOverrides),
      ...extra,
    };
  };

  const getAllRawVariationSources = (item?: MenuItem | null) => {
    if (!item) return [];

    const fromVariationPriceOverrides = normalizeArray<VariationPriceOverride>(
      item?.variationPriceOverrides
    )
      .map((override) => ({
        ...(override?.variation || {}),
        id: override?.variationId || override?.variation?.id,
        price: override?.price ?? override?.variation?.price,
        pickupPrice: override?.pickupPrice ?? override?.variation?.pickupPrice,
        displayText: override?.displayText ?? override?.variation?.displayText,
        itemPriceOverrides: [
          ...normalizeArray<VariationPriceOverride>(override?.variation?.itemPriceOverrides),
          override,
        ],
        modifierPriceOverrides: [
          ...normalizeArray<VariationPriceOverride>(override?.variation?.modifierPriceOverrides),
          ...normalizeArray<VariationPriceOverride>(override?.modifierPriceOverrides),
        ],
      }))
      .filter((variation) => variation?.id);

    const fromCategoryVariationLinks = normalizeArray<{ variation?: MenuVariation | null }>(
      item?.category?.variationLinks
    )
      .map((link) => link?.variation)
      .filter(Boolean);

    return [
      ...normalizeArray<MenuVariation>(item?.variations),
      ...fromVariationPriceOverrides,
      ...normalizeArray<MenuVariation>(item?.category?.variations),
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

  const getNormalizedModifiersFromGroup = (group: ModifierGroup | ApiRecord | null | undefined): Modifier[] => {
    const directModifiers = Array.isArray(group?.modifiers)
      ? group.modifiers
      : [];

    const fromModifierLinks = Array.isArray(group?.modifierLinks)
      ? group.modifierLinks.map((link: RawModifierLink) => link?.modifier).filter(Boolean)
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

  const normalizeGroup = (group: ModifierGroup | ApiRecord | null | undefined): ModifierGroup | null => {
    if (!group?.id) return null;
    if (group?.isActive === false) return null;
    const modifiers = getNormalizedModifiersFromGroup(group);
    const minSelect = Math.max(0, toNumber(group?.minSelect, 0));
    const rawMaxSelect = toNumber(group?.maxSelect, modifiers.length);
    const isSingleSelectionGroup = minSelect === 1 && rawMaxSelect === 1;
    const selectionType =
      group?.selectionType === "SINGLE" || isSingleSelectionGroup
        ? "SINGLE"
        : "MULTIPLE";
    const maxSelect = selectionType === "SINGLE"
      ? 1
      : Math.max(minSelect, rawMaxSelect > 0 ? rawMaxSelect : modifiers.length);

    return {
      id: String(group.id),
      name: String(group?.name || ""),
      description: typeof group?.description === "string" ? group.description : "",
      selectionType,
      minSelect,
      maxSelect,
      isRequired: typeof group?.isRequired === "boolean" ? group.isRequired : minSelect > 0,
      sortOrder: toNumber(group?.sortOrder, 0),
      isActive: group?.isActive !== false,
      modifiers,
      modifierLinks: Array.isArray(group?.modifierLinks)
        ? group.modifierLinks
        : [],
    };
  };

  const getStandaloneItemModifiers = (
    item: MenuItem,
    linkedModifierIds: Set<string>
  ) => {
    const modifiersFromOverrides = normalizeArray<VariationPriceOverride>(item?.modifierPriceOverrides)
      .map((override) => {
        const overrideRecord = override as ApiRecord;
        const rawModifier: Modifier = override?.modifier || {
          id: String(override?.modifierId ?? ""),
          name: String(overrideRecord.name ?? "Modifier"),
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

    const directModifiers = normalizeArray<Modifier>(item?.modifiers)
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
          ...normalizeArray<ItemPriceOverride>(existing?.itemPriceOverrides),
          ...normalizeArray<ItemPriceOverride>(modifier?.itemPriceOverrides),
        ],
        variationPriceOverrides: [
          ...normalizeArray<VariationPriceOverride>(existing?.variationPriceOverrides),
          ...normalizeArray<VariationPriceOverride>(modifier?.variationPriceOverrides),
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
      .map((link: ModifierLink | ApiRecord, index: number) => {
        const linkGroup = "modifierGroup" in link ? link.modifierGroup : undefined;
        const normalizedGroup = normalizeGroup(linkGroup as ModifierGroup | ApiRecord | undefined);
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
      .map((link: ModifierLink | ApiRecord, index: number) => {
        const linkGroup = "modifierGroup" in link ? link.modifierGroup : undefined;
        const normalizedGroup = normalizeGroup(linkGroup as ModifierGroup | ApiRecord | undefined);
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
      ...normalizeArray<ModifierGroup | ApiRecord>(item?.modifierGroups),
      ...normalizeArray<ModifierGroup | ApiRecord>(item?.category?.modifierGroups),
    ]
      .map((group: ModifierGroup | ApiRecord, index: number) => {
        const groupRecord = group as ModifierGroup | ApiRecord;
        const normalizedGroup = normalizeGroup((("modifierGroup" in groupRecord ? groupRecord.modifierGroup : undefined) || group) as ModifierGroup | ApiRecord);
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
      ...normalizeArray<ModifierGroup | ApiRecord>(item?.categoryModifierGroups),
      ...normalizeArray<ModifierGroup | ApiRecord>(item?.category?.categoryModifierGroups),
    ]
      .map((group: ModifierGroup | ApiRecord, index: number) => {
        const groupRecord = group as ModifierGroup | ApiRecord;
        const normalizedGroup = normalizeGroup((("modifierGroup" in groupRecord ? groupRecord.modifierGroup : undefined) || group) as ModifierGroup | ApiRecord);
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
      normalizeArray<Modifier>(link?.modifierGroup?.modifiers).forEach((modifier) => {
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
          name: tProduct("addons"),
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
    item?: MenuItem | null,
    variation?: MenuVariation | null
  ) => {
    if (!item) return toNumber(modifier?.priceDelta, 0);

    return getModifierPriceForVariation({
      item,
      selectedVariation: variation,
      selectedVariationId: variation?.id ?? null,
      modifierId: String(modifier?.id || ""),
    });
  };

  const getGroupValidation = (group: ModifierGroup) => {
    const rawMin = toNumber(group?.minSelect, 0);

    const rawMax =
      group?.maxSelect !== undefined && group?.maxSelect !== null
        ? toNumber(group.maxSelect, 0)
        : undefined;

    const isSingleSelectionGroup = rawMin === 1 && rawMax === 1;
    const selectionType =
      group?.selectionType === "SINGLE" || isSingleSelectionGroup
        ? "SINGLE"
        : "MULTIPLE";
    const isRequired = Boolean(group?.isRequired) || rawMin > 0;

    return {
      minSelect: Math.max(isRequired ? 1 : 0, rawMin),
      maxSelect: selectionType === "SINGLE" ? 1 : rawMax,
      isRequired,
      selectionType,
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
    const { minSelect, maxSelect, selectionType } = getGroupValidation(group);
    const alreadySelected = current.some((m) => m.id === modifier.id);
    const selectedQuantity = getModifierGroupSelectedQuantity(current);

    if (selectionType === "SINGLE" || maxSelect === 1) {
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
      const modifierQuantity =
        current.find((selected) => selected.id === modifier.id)?.selectedQuantity || 1;

      if (minSelect > 0 && selectedQuantity - modifierQuantity < minSelect) {
        toast.error(
          `${group.name || "This group"} requires at least ${minSelect} selection${minSelect === 1 ? "" : "s"}`
        );
        return;
      }

      setSelectionMap((prev) => ({
        ...prev,
        [groupId]: current.filter((m) => m.id !== modifier.id),
      }));
      return;
    }

    if (maxSelect && selectedQuantity >= maxSelect) {
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

  const handleModifierQuantityChange = (
    group: ModifierGroup,
    modifier: Modifier,
    nextQuantity: number,
    scope: "main" | "split" = "main"
  ) => {
    const groupId = String(group.id);
    const { minSelect, maxSelect, selectionType } = getGroupValidation(group);

    if (selectionType === "SINGLE" || maxSelect === 1) {
      return;
    }

    const setSelectionMap =
      scope === "main" ? setSelectedModifiers : setSplitPizzaModifiers;

    setSelectionMap((prev) => {
      const current = prev[groupId] || [];
      const currentModifier = current.find((selected) => selected.id === modifier.id);

      if (!currentModifier) {
        return prev;
      }

      const normalizedNextQuantity = Math.max(
        1,
        Math.floor(Number.isFinite(nextQuantity) ? nextQuantity : 1)
      );
      const otherSelectedQuantity = current.reduce((total, selected) => {
        if (selected.id === modifier.id) return total;

        return total + Math.max(1, Math.floor(toNumber(selected.selectedQuantity, 1)));
      }, 0);
      const maxAllowedQuantity =
        maxSelect && maxSelect > 0
          ? Math.max(1, maxSelect - otherSelectedQuantity)
          : normalizedNextQuantity;

      if (maxSelect && otherSelectedQuantity + normalizedNextQuantity > maxSelect) {
        toast.error(
          `You can select up to ${maxSelect} option(s) for ${group.name}`
        );
      }

      const minAllowedQuantity =
        minSelect > otherSelectedQuantity ? minSelect - otherSelectedQuantity : 1;
      const clampedQuantity = Math.max(
        minAllowedQuantity,
        Math.min(normalizedNextQuantity, maxAllowedQuantity)
      );

      return {
        ...prev,
        [groupId]: current.map((selected) =>
          selected.id === modifier.id
            ? { ...selected, selectedQuantity: clampedQuantity }
            : selected
        ),
      };
    });
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
      const selectedQuantity = getModifierGroupSelectedQuantity(selectedInGroup);

      if (minSelect > 0 && selectedQuantity < minSelect) {
        toast.error(
          `${
            group?.name || "This group"
          } requires at least ${minSelect} selection(s)`
        );
        return false;
      }

      if (maxSelect && selectedQuantity > maxSelect) {
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
        quantity: Math.max(1, Math.floor(toNumber(modifier.selectedQuantity, 1))),
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
          item,
          variation
        );

        const modifierQuantity = Math.max(
          1,
          Math.floor(toNumber(modifier.selectedQuantity, 1))
        );

        return acc + modifierPrice * modifierQuantity;
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
  }, [activeMenu]);

  const onePageMenuSections = useMemo(() => {
    return menus.map((menu) => ({
      menu,
      products: buildProductsForMenu(menu),
    }));
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

    return tProduct("optional");
  }, [addonSelectionRules, tProduct]);

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
    return fetchSignatureSplitPizzaItems({ restaurantId, branchId, search, page });
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

  const handleSplitPizzaItemChange = (item: MenuItem | null) => {
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
      toast.error(tProduct("customerNotFound"));
      return;
    }

    if (!branchId) {
      toast.error(tProduct("selectBranchFirst"));
      return;
    }

    const safeModifiersMap = modifiersMap || {};

    const visibleModifierGroups = getVisibleModifierLinks(item, variation).map((link) => link.modifierGroup);
    const groupedFlowModifierGroups = visibleModifierGroups.filter((group) => {
      const groupId = String(group?.id || "");
      return groupId && groupId !== ADDONS_GROUP_ID && !groupId.startsWith("standalone-modifiers-");
    });
    const groupedValidation = validateModifierSelections(groupedFlowModifierGroups, safeModifiersMap);

    if (!groupedValidation.isValid) {
      toast.error(Object.values(groupedValidation.errors)[0] || tProduct("failedAddToCart"));
      return;
    }

    if (!validateAddonSelections(item, safeModifiersMap)) {
      return;
    }

    if (splitPizzaEnabled && !splitPizzaItem?.id) {
      toast.error(tProduct("selectOtherPizzaHalf"));
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

      const payload: CartPayload & Record<string, unknown> = {
        menuItemId: item.id,
        quantity,
        variationId: variation?.id ?? null,
        ...(activeChipMenuId ? { restaurantMenuId: activeChipMenuId } : {}),
        branchId,
        note: note.trim() || "",
      };

      if (groupedFlowModifierGroups.length > 0) {
        payload.modifierSelections = buildModifierSelections(groupedFlowModifierGroups, safeModifiersMap);
      } else {
        payload.modifiers = buildModifiersPayload(safeModifiersMap);
      }

      if (splitSections) {
        payload.sections = splitSections;
      }

      const groupCode = getStoredGroupOrderCode();
      const groupOrderId = getStoredGroupOrderId();

      const addCartItem = async () => {
        if (!groupCode && !groupOrderId) {
          return addCustomerCartItem({ customerId, payload });
        }

        let groupOrder: ApiRecord | null = null;

        if (groupOrderId) {
          const { groupOrder: directGroupOrder } = await fetchGroupOrderById({ orderId: groupOrderId });
          groupOrder = directGroupOrder as ApiRecord | null;
        }

        if (!groupOrder && groupCode) {
          const { groupOrder: searchedGroupOrder } = await searchGroupOrdersByInviteCode({ inviteCode: groupCode });
          groupOrder = searchedGroupOrder as ApiRecord | null;
        }

        if (!groupOrder && groupCode) {
          const { response: groupOrdersRes, groupOrders } = await fetchGroupOrders();

          if (!groupOrdersRes || groupOrdersRes.error) {
            toast.error(tProduct("failedFetchGroupOrder"));
            return null;
          }

          groupOrder = groupOrders.find((order: ApiRecord) => order?.inviteCode === groupCode) || null;
        }

        if (!groupOrder?.id) {
          toast.error(tProduct("invalidGroupOrder"));
          return null;
        }

        setStoredGroupOrderId(String(groupOrder.id));

        return addGroupOrderItem({
          groupOrderId: String(groupOrder.id),
          payload,
        });
      };

      let res = await addCartItem();

      if (!groupCode && !groupOrderId && isBranchCartConflictResponse(res)) {
        toast.info(tSignature("cartBranchConflict"));

        const clearCartRes = await clearCustomerCart({ customerId });

        if (!clearCartRes || clearCartRes.error) {
          toast.error(
            getApiErrorMessage(clearCartRes, tSignature("failedClearCart"))
          );
          return;
        }

        res = await addCartItem();
      }

      if (!res || res.error) {
        toast.error(getApiErrorMessage(res, tProduct("failedAddToCart")));
        return;
      }

      toast.success(groupCode || groupOrderId ? tProduct("addedToGroupOrder") : tProduct("addedToCart"));
      if (groupCode || groupOrderId) {
        window.dispatchEvent(new Event("deliveryway:group-order:item-added"));
      }
      setModalOpen(false);
      onCartRefresh?.();
    } catch (error) {
      toast.error(tErrors("somethingWentWrong"));
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
    return hasProductInfoContent(item ?? null);
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
      const itemName = selectedItem?.name || tProduct("thisItem");
      const isSingleAddonSelection = maxSelect === 1;

      if (isSingleAddonSelection) {
        if (isSelected && minSelect <= 0) {
          const next = { ...prev };
          delete next[ADDONS_GROUP_ID];
          return next;
        }

        return {
          ...prev,
          [ADDONS_GROUP_ID]: [{ ...modifier, selectedQuantity: 1 }],
        };
      }

      if (isSelected) {
        if (minSelect > 0 && current.length <= minSelect) {
          toast.error(
            tProduct("minimumAddons", { itemName, count: minSelect })
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
          tProduct("maximumAddons", { itemName, count: maxSelect })
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
    const itemName = item?.name || tProduct("thisItem");

    if (minSelect > 0 && selectedCount < minSelect) {
      toast.error(
        tProduct("minimumAddons", { itemName, count: minSelect })
      );
      return false;
    }

    if (maxSelect && selectedCount > maxSelect) {
      toast.error(
        tProduct("maximumAddons", { itemName, count: maxSelect })
      );
      return false;
    }

    return true;
  };

  const renderAddonSection = () => {
    if (!selectedItem || !selectedItemAddons.length) return null;

    const { maxSelect } = addonSelectionRules;
    const selectedCount = selectedAddons.length;
    const inputType = maxSelect === 1 ? "radio" : "checkbox";

    return (
      <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-gray-900">{tProduct("addons")}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                {addonSelectionLabel}
              </span>
              <span className="text-xs text-gray-500">
                {tProduct("addonsDescription")}
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
              inputType !== "radio" && !checked && Boolean(maxSelect) && selectedCount >= Number(maxSelect);

            const effectivePrice = getModifierEffectivePrice(
              modifier,
              selectedItem,
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
                    type={inputType}
                    name={`item-addons-${selectedItem?.id || "item"}`}
                    checked={checked}
                    disabled={disableBecauseMaxReached}
                    onChange={() => handleAddonToggle(modifier)}
                    className="mt-1 accent-[var(--primary)]"
                  />

                  <span className="min-w-0">
                    <span className="block truncate font-medium text-gray-900">
                      {modifier.displayText || modifier.name}
                    </span>

                    {modifier.description ? (
                      <span className="mt-1 block text-xs leading-relaxed text-gray-500">
                        {modifier.description}
                      </span>
                    ) : null}
                  </span>
                </span>

                {effectivePrice !== 0 ? (
                  <span className="shrink-0 font-semibold text-primary">
                    {formatModifierSelectionPrice(effectivePrice, 1, currency)}
                  </span>
                ) : null}
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  const splitPizzaPricingVariation = splitPizzaItem
    ? getSplitPizzaPricingVariation({
        variations: getItemVariations(splitPizzaItem),
        selectedVariation,
        fallbackVariation: splitPizzaVariation || getDefaultVariation(splitPizzaItem),
      })
    : null;

  const totalModalPrice = selectedItem
    ? getCalculatedPrice(
        selectedItem,
        selectedVariation,
        selectedModifiers,
        splitPizzaEnabled ? splitPizzaItem : null,
        splitPizzaPricingVariation
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
      const selectedGroupQuantity = getModifierGroupSelectedQuantity(selectedInGroup);
      const { minSelect, maxSelect, isRequired, selectionType } = getGroupValidation(group);

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
                  : tProduct("optional")}
              </p>
            </div>

            <span className="text-xs text-gray-500">
              {selectedGroupQuantity}
              {maxSelect ? ` / ${maxSelect}` : ""}
            </span>
          </div>

          <div className="space-y-2">
            {groupModifiers.map((modifier) => {
              const selectedModifier = selectedInGroup.find(
                (selected) => selected.id === modifier.id
              );

              const checked = Boolean(selectedModifier);
              const selectedModifierQuantity = Math.max(
                1,
                Math.floor(toNumber(selectedModifier?.selectedQuantity, 1))
              );

              const disableBecauseMaxReached =
                !checked && !!maxSelect && selectedGroupQuantity >= maxSelect;

              const effectivePrice = getModifierEffectivePrice(
                modifier,
                item,
                variation
              );

              const inputType = selectionType === "SINGLE" || maxSelect === 1 ? "radio" : "checkbox";
              const showQuantitySelector = checked && inputType === "checkbox";
              const disableIncrement = Boolean(maxSelect && selectedGroupQuantity >= maxSelect);

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

                    {toNumber(effectivePrice, 0) !== 0 ? (
                      <span className="shrink-0 font-medium text-primary">
                        {formatModifierSelectionPrice(
                          effectivePrice,
                          selectedModifierQuantity,
                          currency
                        )}
                      </span>
                    ) : null}
                  </div>

                  {showQuantitySelector ? (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-full border border-primary/10 bg-white/90 px-2 py-1.5 shadow-sm">
                      <span className="pl-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Qty
                      </span>

                      <div className="flex items-center rounded-full bg-gray-100 p-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleModifierQuantityChange(
                              group,
                              modifier,
                              selectedModifierQuantity - 1,
                              scope
                            )
                          }
                          disabled={selectedModifierQuantity <= 1}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-gray-700 transition hover:bg-white hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
                          aria-label={`Decrease ${modifier.name} quantity`}
                        >
                          <Minus size={14} />
                        </button>

                        <span className="min-w-8 text-center text-sm font-bold text-gray-900">
                          {selectedModifierQuantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            handleModifierQuantityChange(
                              group,
                              modifier,
                              selectedModifierQuantity + 1,
                              scope
                            )
                          }
                          disabled={disableIncrement}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-gray-700 transition hover:bg-white hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
                          aria-label={`Increase ${modifier.name} quantity`}
                        >
                          <Plus size={14} />
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
              title={tProduct("viewIngredients")}
            >
              <Eye size={16} />
            </button>
          ) : null}

          <FavoriteHeartButton
            menuItemId={product.id}
            className="absolute left-3 top-3 z-10"
          />
        </div>

        <div className="p-4">
          <div className="mb-2 flex items-start justify-between gap-3">
            <h3 className="min-w-0 flex-1 text-[17px] font-semibold leading-[1.35] tracking-[-0.01em] text-[#202020]">
              <span className="block break-words">{firstLine}</span>
              <span className="block break-words">{secondLine}</span>
            </h3>

            <span className="shrink-0 pt-0.5 text-[18px] font-semibold text-primary">
              {formatMoney(product.price, currency)}
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
              tSignature("addToCartWithPlus")
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
                {tSignature("title")}
              </h1>
              <p className="mt-2 max-w-[560px] text-[13px] leading-6 text-[#8a8a8a] sm:text-sm">
                {tSignature("description")}
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
              <p className="text-sm text-[#777]">{tSignature("noMenus")}</p>
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
                          {tSignature("exploreMenuItems")}
                        </p>
                      )}
                    </div>

                    <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
                      {tCommon("itemCount", { count: products.length })}
                    </span>
                  </div>

                  {products.length === 0 ? (
                    <div className="rounded-[20px] border border-dashed border-black/10 bg-[#fafafa] p-8 text-center">
                      <p className="text-sm text-[#777]">
                        {tSignature("noMenuItemsInMenu")}
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
              <p className="text-sm text-[#777]">{tSignature("noMenuItems")}</p>
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
                  {tProduct("viewIngredients")}
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
                    {tSignature("selectOptions")}
                  </p>
                </div>

                <FavoriteHeartButton
                  menuItemId={selectedItem.id}
                  className="h-9 w-9 shrink-0 border border-gray-100"
                />
              </div>

              {getItemVariations(selectedItem).length > 0 ? (
                <div className="mb-5">
                  <p className="mb-2 font-medium text-gray-900">{tProduct("size")}</p>

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
                              {formatMoney(variation.price, currency)}
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
                          placeholder={tProduct("selectSplitPizzaItem")}
                          fetchOptions={fetchPizzaItems}
                          labelKey="name"
                          valueKey="id"
                        />
                      </div>

                      {splitPizzaItem ? (
                        <div className="rounded-xl bg-white p-3">
                          <p className="text-sm font-semibold text-gray-900">
                            {tProduct("selectedSecondHalf")}
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
                              splitPizzaPricingVariation
                            ) > 0 ? (
                              <span className="shrink-0 font-medium text-primary">
                                {formatMoney(getMenuItemResolvedPrice(
                                  splitPizzaItem,
                                  splitPizzaPricingVariation
                                ), currency)}
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
                  {tProduct("specialInstructions")}
                </p>

                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={tProduct("notesPlaceholder")}
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
                  {formatMoney(totalModalPrice, currency)}
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
                {addingId === selectedItem.id ? tProduct("processing") : tProduct("addToCart")}
              </button>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
