"use client";

import Image from "next/image";
import { Plus, Info, Loader2, Eye, Minus, Download, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import useItems from "@/hooks/useItems";
import { useCart } from "@/hooks/useCart";
import { useAuthContext } from "@/hooks/useAuth";
import { useGroupOrderApi } from "@/hooks/useGroupOrder";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  clearStoredGroupOrderCode,
  findCurrentGroupOrderParticipant,
  getStoredGroupOrderCode,
  getStoredGroupOrderId,
  isGroupOrderParticipantCompleted,
  isStoredGroupOrderCompleted,
  markStoredGroupOrderCompleted,
  setStoredGroupOrderId,
} from "@/lib/group-order";
import { formatMoney as formatDisplayMoney } from "@/lib/money";
import { AsyncSelect } from "@/components/ui/AsyncSelect";
import { FavoriteHeartButton } from "@/components/common/favorites/FavoriteHeartButton";
import type {
  ApiRecord,
  CartPayload,
  ItemPriceOverride,
  MenuItem,
  MenuVariation,
  Modifier,
  ModifierGroup,
  ModifierLink,
  SelectedModifiersMap,
  PromotionInfo,
  PromotionPricing,
  RawModifierLink,
  SelectedModifier,
  VariationPriceOverride,
} from "@/components/pages/Items/types";
import {
  hasText,
  formatPrice,
  getSplitPizzaPricingVariation,
  toNumber,
} from "@/components/pages/Items/utils/restaurant-card-utils";
import { getModifierPriceForVariation } from "@/components/pages/Items/utils/modifier-pricing";
import {
  buildModifierSelections,
  getModifierGroupSelectedQuantity,
  validateModifierSelections,
} from "@/components/pages/Items/utils/modifier-selections";

const getApiResponseMessage = (res: ApiRecord | null | undefined) => {
  const errorValue = res?.error;
  const dataValue = res?.data;
  const errorRecord =
    typeof errorValue === "object" &&
    errorValue !== null &&
    !Array.isArray(errorValue)
      ? (errorValue as ApiRecord)
      : null;
  const dataRecord =
    typeof dataValue === "object" &&
    dataValue !== null &&
    !Array.isArray(dataValue)
      ? (dataValue as ApiRecord)
      : null;
  const dataErrorValue = dataRecord?.error;
  const dataErrorRecord =
    typeof dataErrorValue === "object" &&
    dataErrorValue !== null &&
    !Array.isArray(dataErrorValue)
      ? (dataErrorValue as ApiRecord)
      : null;

  return [
    res?.message,
    typeof errorValue === "string" ? errorValue : "",
    errorRecord?.message,
    errorRecord?.code,
    dataRecord?.message,
    typeof dataErrorValue === "string" ? dataErrorValue : "",
    dataErrorRecord?.message,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
};

const isApiErrorResponse = (res: ApiRecord | null | undefined) => {
  return !res || res?.success === false || Boolean(res?.error);
};

const getApiErrorMessage = (
  res: ApiRecord | null | undefined,
  fallback = "Something went wrong",
) => {
  return getApiResponseMessage(res) || fallback;
};

const isCartBranchConflictResponse = (res: ApiRecord | null | undefined) => {
  const message = getApiResponseMessage(res).toLowerCase();
  return message.includes("branch") && message.includes("cart");
};

const ADDONS_GROUP_ID = "__item_addons__";

const sortBySortOrder = <T extends { sortOrder?: number }>(items: T[]) => {
  return [...items].sort(
    (a, b) => toNumber(a?.sortOrder, 0) - toNumber(b?.sortOrder, 0),
  );
};

const normalizeArray = <T = unknown,>(value: unknown): T[] => {
  if (!value) return [];
  return Array.isArray(value) ? (value as T[]) : [];
};

/* ================= PROMOTION HELPERS ================= */

const formatMoney = (value: unknown, currency?: string | null) =>
  formatDisplayMoney(value, currency, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatModifierSelectionPrice = (
  unitPrice: number,
  quantity: number,
  currency?: string | null,
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

const isPromotionObject = (value: unknown): value is PromotionInfo => {
  return Boolean(value && typeof value === "object");
};

const hasPromotionSignal = (value: unknown): value is PromotionInfo => {
  if (!value || typeof value !== "object") return false;

  const promotion = value as PromotionInfo;
  const record = value as ApiRecord;

  if (
    record.dealSelectionMode ||
    record.dealRequiredQuantity !== undefined ||
    Array.isArray(record.scopeCategoryRules) ||
    Array.isArray(record.scopeCategoryIds) ||
    record.supportsDealIdCartPayload === true ||
    record.supportsDealCartPayload === true ||
    record.isDealMenuItem === true ||
    promotion.discountType === "FIXED_PRICE" ||
    (promotion.applyMode && promotion.applyMode !== "SCOPED_ITEMS")
  ) {
    return false;
  }

  const discountValue = toNumber(promotion.discountValue, 0);

  return Boolean(
    ((promotion.discountType === "PERCENTAGE" ||
      promotion.discountType === "FLAT") &&
      discountValue > 0) ||
    toNumber(promotion.discountAmount, 0) > 0 ||
    toNumber(promotion.discountedPrice, 0) > 0 ||
    toNumber(promotion.discountedAmount, 0) > 0,
  );
};

const getPromotionInfo = (
  source: MenuItem | MenuVariation | ApiRecord | null | undefined,
): PromotionInfo | null => {
  if (
    isPromotionObject(source?.happyHour) &&
    source.happyHour.isCurrentlyActive !== false
  ) {
    return source.happyHour;
  }

  return hasPromotionSignal(source?.promotion) ? source.promotion : null;
};

const getPromotionDiscountLabel = (promotion?: PromotionInfo | null) => {
  if (!promotion) return "";

  const discountValue = toNumber(promotion.discountValue, 0);

  if (promotion.discountType === "PERCENTAGE") {
    return `${discountValue}% OFF`;
  }

  if (promotion.discountType === "FLAT") {
    return `${formatMoney(discountValue)} OFF`;
  }

  return "OFFER";
};

const getPromotionTitle = (promotion?: PromotionInfo | null) => {
  if (!promotion) return "";

  return (
    String(promotion.title || "").trim() ||
    getPromotionDiscountLabel(promotion) ||
    "Promotion applied"
  );
};

const calculatePromotionDiscount = (
  originalPrice: number,
  promotion?: PromotionInfo | null,
) => {
  if (!promotion || originalPrice <= 0) return 0;

  const discountValue = toNumber(promotion.discountValue, 0);
  const backendDiscountAmount = toNumber(promotion.discountAmount, 0);
  const maxDiscountAmount = toNumber(promotion.maxDiscountAmount, 0);

  let discountAmount = 0;

  if (backendDiscountAmount > 0) {
    discountAmount = backendDiscountAmount;
  } else if (promotion.discountType === "PERCENTAGE") {
    discountAmount = (originalPrice * discountValue) / 100;
  } else if (promotion.discountType === "FLAT") {
    discountAmount = discountValue;
  }

  if (maxDiscountAmount > 0) {
    discountAmount = Math.min(discountAmount, maxDiscountAmount);
  }

  return Math.min(Math.max(discountAmount, 0), originalPrice);
};

const getPromotionPricing = ({
  source,
  originalPrice,
}: {
  source: MenuItem | MenuVariation | ApiRecord | null | undefined;
  originalPrice: number;
}): PromotionPricing => {
  const safeOriginalPrice = Math.max(0, toNumber(originalPrice, 0));
  const promotion = getPromotionInfo(source);

  if (!promotion) {
    return {
      promotion: null,
      originalPrice: safeOriginalPrice,
      finalPrice: safeOriginalPrice,
      discountAmount: 0,
      hasPromotion: false,
      hasDiscount: false,
    };
  }

  const calculatedDiscount = calculatePromotionDiscount(
    safeOriginalPrice,
    promotion,
  );

  const finalPrice = Math.max(0, safeOriginalPrice - calculatedDiscount);

  const discountAmount = Math.max(0, safeOriginalPrice - finalPrice);

  return {
    promotion,
    originalPrice: safeOriginalPrice,
    finalPrice,
    discountAmount,
    hasPromotion: true,
    hasDiscount: discountAmount > 0 && finalPrice < safeOriginalPrice,
  };
};

const getPromotionSourceForPrice = (
  menuItem: MenuItem | null,
  variation?: MenuVariation | null,
) => {
  if (getPromotionInfo(variation)) return variation;
  if (getPromotionInfo(menuItem)) return menuItem;
  return variation || menuItem;
};

function PromotionBadge({
  promotion,
  compact = false,
  currency,
}: {
  promotion?: PromotionInfo | null;
  compact?: boolean;
  currency?: string | null;
}) {
  const t = useTranslations("items.productCard");
  if (!promotion) return null;

  const label = getPromotionDiscountLabel(promotion)?.replace(
    formatMoney(toNumber(promotion.discountValue, 0)),
    formatMoney(toNumber(promotion.discountValue, 0), currency),
  );

  return (
    <span
      className={`inline-flex w-fit items-center rounded-full bg-green-50 font-semibold text-green-700 ring-1 ring-green-100 ${
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"
      }`}
    >
      {label || t("offer")}
    </span>
  );
}

function PromotionPrice({
  pricing,
  className = "",
  originalClassName = "",
  currency,
}: {
  pricing: PromotionPricing;
  className?: string;
  originalClassName?: string;
  currency?: string | null;
}) {
  if (!pricing.hasDiscount) {
    return (
      <span className={className}>
        {formatMoney(pricing.originalPrice, currency)}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className={`text-gray-400 line-through ${originalClassName}`}>
        {formatMoney(pricing.originalPrice, currency)}
      </span>
      <span>{formatMoney(pricing.finalPrice, currency)}</span>
    </span>
  );
}

/* ================= PRODUCT INFO HELPERS ================= */

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

  const customerApp =
    typeof settings.customerApp === "object" && settings.customerApp !== null
      ? (settings.customerApp as ApiRecord)
      : {};
  const templates = (customerApp.allergenAdditiveTemplates ||
    settings.allergenAdditiveTemplates ||
    {}) as ApiRecord;

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
    hasText(item?.allergenPdfUrl),
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

export function RestaurantCard({
  item,
  currency,
}: {
  item: MenuItem;
  currency?: string | null;
}) {
  const t = useTranslations("items.productCard");
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const { token } = useAuthContext();
  const { fetchSplitPizzaMenuItems } = useItems(token);
  const {
    addCustomerCartItem,
    addGroupOrderItem,
    clearCustomerCart,
    fetchGroupOrders,
  } = useCart(token);
  const { fetchGroupOrderById, searchGroupOrdersByInviteCode } =
    useGroupOrderApi(token);
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
  const [splitPizzaItem, setSplitPizzaItem] = useState<MenuItem | null>(null);

  const [animateCart, setAnimateCart] = useState(false);

  const customerId = user?.id;
  const branchId = user?.branchId;
  const restaurantId =
    item?.restaurantId || item?.restaurant?.id || user?.restaurantId || "";

  const itemSupportsSplitPizza = Boolean(item?.supportsSplitPizza);

  const getItemVariations = (menuItem: MenuItem | null): MenuVariation[] => {
    const rawVariations = [
      ...(Array.isArray(menuItem?.variations) ? menuItem.variations : []),
      ...(Array.isArray(menuItem?.category?.variations)
        ? menuItem.category.variations
        : []),
    ];

    const deduped = new Map<string, MenuVariation>();

    for (const raw of rawVariations) {
      if (!raw?.id) continue;
      if ((raw as { isActive?: boolean }).isActive === false) continue;

      const id = String(raw.id);

      const normalized: MenuVariation = {
        id,
        categoryId:
          typeof raw?.categoryId === "string" ? raw.categoryId : undefined,
        name: String(raw?.name || ""),
        description:
          typeof raw?.description === "string" ? raw.description : "",
        price:
          typeof raw?.price === "string" || typeof raw?.price === "number"
            ? raw.price
            : (raw?.itemPriceOverrides?.[0]?.price ?? 0),
        displayText:
          typeof raw?.displayText === "string"
            ? raw.displayText
            : (raw?.itemPriceOverrides?.[0]?.displayText ?? null),
        discountedPrice:
          raw?.happyHourDiscountedPrice ??
          raw?.discountedPrice ??
          raw?.happyHour?.discountedPrice ??
          raw?.promotion?.discountedAmount ??
          null,
        happyHourDiscountedPrice:
          raw?.happyHourDiscountedPrice ??
          raw?.happyHour?.discountedPrice ??
          null,
        promotion: getPromotionInfo(raw),
        happyHour: raw?.happyHour ?? null,
        sortOrder: toNumber(raw?.sortOrder, 0),
        isDefault: Boolean(raw?.isDefault),
        isActive: raw?.isActive !== false,
        modifierPriceOverrides: normalizeArray<VariationPriceOverride>(
          raw?.modifierPriceOverrides,
        ),
      };

      if (!deduped.has(id)) {
        deduped.set(id, normalized);
      }
    }

    return sortBySortOrder(Array.from(deduped.values()));
  };

  const getNormalizedModifiersFromGroup = (
    group: ModifierGroup | ApiRecord | null | undefined,
  ): Modifier[] => {
    const directModifiers = normalizeArray<Modifier>(group?.modifiers);

    const fromModifierLinks = normalizeArray<RawModifierLink>(
      group?.modifierLinks,
    )
      .map((link) => link?.modifier)
      .filter((modifier): modifier is Modifier => Boolean(modifier));

    const rawModifiers = [...directModifiers, ...fromModifierLinks];
    const deduped = new Map<string, Modifier>();

    for (const raw of rawModifiers) {
      if (!raw?.id) continue;
      if ((raw as { isActive?: boolean }).isActive === false) continue;

      const id = String(raw.id);

      const normalized: Modifier = {
        id,
        modifierGroupId:
          typeof raw?.modifierGroupId === "string"
            ? raw.modifierGroupId
            : undefined,
        restaurantId:
          typeof raw?.restaurantId === "string" ? raw.restaurantId : undefined,
        name: String(raw?.name || ""),
        displayText:
          typeof raw?.displayText === "string"
            ? raw.displayText
            : typeof (raw as ApiRecord).label === "string"
              ? ((raw as ApiRecord).label as string)
              : null,
        description:
          typeof raw?.description === "string" ? raw.description : "",
        priceDelta:
          typeof raw?.priceDelta === "string" ||
          typeof raw?.priceDelta === "number"
            ? raw.priceDelta
            : 0,
        sortOrder: toNumber(raw?.sortOrder, 0),
        isActive: raw?.isActive !== false,
        itemPriceOverrides: normalizeArray<ItemPriceOverride>(
          raw?.itemPriceOverrides,
        ),
        variationPriceOverrides: normalizeArray<VariationPriceOverride>(
          raw?.variationPriceOverrides,
        ),
      };

      if (!deduped.has(id)) {
        deduped.set(id, normalized);
      }
    }

    return sortBySortOrder(Array.from(deduped.values()));
  };

  const normalizeGroup = (
    group: ModifierGroup | ApiRecord | null | undefined,
  ): ModifierGroup | null => {
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
    const maxSelect =
      selectionType === "SINGLE"
        ? 1
        : Math.max(
            minSelect,
            rawMaxSelect > 0 ? rawMaxSelect : modifiers.length,
          );

    return {
      id: String(group.id),
      name: String(group?.name || ""),
      description:
        typeof group?.description === "string" ? group.description : "",
      selectionType,
      minSelect,
      maxSelect,
      isRequired:
        typeof group?.isRequired === "boolean"
          ? group.isRequired
          : minSelect > 0,
      sortOrder: toNumber(group?.sortOrder, 0),
      isActive: group?.isActive !== false,
      modifiers,
      modifierLinks: Array.isArray(group?.modifierLinks)
        ? group.modifierLinks
        : [],
    };
  };

  const normalizeStandaloneModifier = (
    raw: Modifier | ApiRecord | null | undefined,
  ): Modifier | null => {
    if (!raw?.id) return null;
    if (raw?.isActive === false) return null;

    return {
      id: String(raw.id),
      modifierGroupId:
        typeof raw?.modifierGroupId === "string"
          ? raw.modifierGroupId
          : undefined,
      restaurantId:
        typeof raw?.restaurantId === "string" ? raw.restaurantId : undefined,
      name: String(raw?.name || ""),
      displayText:
        typeof raw?.displayText === "string"
          ? raw.displayText
          : typeof (raw as ApiRecord).label === "string"
            ? ((raw as ApiRecord).label as string)
            : null,
      description: typeof raw?.description === "string" ? raw.description : "",
      priceDelta:
        typeof raw?.priceDelta === "string" ||
        typeof raw?.priceDelta === "number"
          ? raw.priceDelta
          : 0,
      sortOrder: toNumber(raw?.sortOrder, 0),
      isActive: raw?.isActive !== false,
      itemPriceOverrides: normalizeArray<ItemPriceOverride>(
        raw?.itemPriceOverrides,
      ),
      variationPriceOverrides: normalizeArray<VariationPriceOverride>(
        raw?.variationPriceOverrides,
      ),
    };
  };

  const getStandaloneItemModifiers = (
    menuItem: MenuItem | null,
    linkedModifierIds: Set<string>,
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
      menuItem.modifiers.forEach((modifier: Modifier) => {
        addModifier(normalizeStandaloneModifier(modifier));
      });
    }

    if (Array.isArray(menuItem?.modifierPriceOverrides)) {
      menuItem.modifierPriceOverrides.forEach(
        (override: VariationPriceOverride) => {
          const overrideRecord = override as ApiRecord;
          const rawModifier: Modifier = override?.modifier || {
            id: String(override?.modifierId ?? ""),
            name: String(overrideRecord.name ?? "Modifier"),
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
              rawModifier?.variationPriceOverrides,
            )
              ? rawModifier.variationPriceOverrides
              : [],
          });

          addModifier(normalized);
        },
      );
    }

    return sortBySortOrder(Array.from(deduped.values()));
  };

  const getItemModifierLinks = (menuItem: MenuItem | null): ModifierLink[] => {
    const rawItemLinks = Array.isArray(menuItem?.modifierLinks)
      ? menuItem.modifierLinks
      : [];

    const rawCategoryLinks = Array.isArray(menuItem?.category?.modifierLinks)
      ? menuItem.category.modifierLinks
      : [];

    const rawCategoryModifierGroups = Array.isArray(
      menuItem?.categoryModifierGroups,
    )
      ? menuItem.categoryModifierGroups
      : [];

    const rawNestedCategoryModifierGroups = Array.isArray(
      menuItem?.category?.categoryModifierGroups,
    )
      ? menuItem.category.categoryModifierGroups
      : [];

    const rawModifierGroups = Array.isArray(menuItem?.modifierGroups)
      ? menuItem.modifierGroups
      : [];

    const rawNestedCategoryGroups = Array.isArray(
      menuItem?.category?.modifierGroups,
    )
      ? menuItem.category.modifierGroups
      : [];

    const normalizedModifierGroups: ModifierLink[] = [
      ...rawModifierGroups,
      ...rawNestedCategoryGroups,
      ...rawCategoryModifierGroups,
      ...rawNestedCategoryModifierGroups,
    ]
      .map((group: ModifierGroup | ApiRecord, index: number) => {
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
      .map((link: ModifierLink | ApiRecord, index: number) => {
        const normalizedGroup = normalizeGroup(
          (link as ModifierLink | ApiRecord).modifierGroup as
            ModifierGroup | ApiRecord | undefined,
        );
        if (!normalizedGroup) return null;

        return {
          id:
            String(link?.id || "") ||
            `modifier-link-${normalizedGroup.id}-${index}`,
          variationId: link?.variationId ? String(link.variationId) : null,
          sortOrder: toNumber(
            link?.sortOrder ?? normalizedGroup?.sortOrder ?? 0,
            0,
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
      linkedModifierIds,
    );

    const standaloneLink: ModifierLink | null = standaloneModifiers.length
      ? {
          id: `standalone-modifiers-${menuItem?.id || "item"}`,
          variationId: null,
          sortOrder: 999,
          modifierGroup: {
            id: `standalone-modifiers-${menuItem?.id || "item"}`,
            name: t("addons"),
            description: t("addonsDescription"),
            selectionType: "MULTIPLE",
            minSelect: 0,
            maxSelect: standaloneModifiers.length,
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

  const getDefaultVariation = useCallback((menuItem: MenuItem | null) => {
    const variations = getItemVariations(menuItem);
    if (!variations.length) return null;

    return variations.find((v) => v.isDefault) || variations[0];
  }, []);

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
    const minSelect = Math.max(isRequired ? 1 : 0, rawMin);

    return {
      minSelect,
      maxSelect: selectionType === "SINGLE" ? 1 : rawMax,
      isRequired,
      selectionType,
    };
  };

  const getVisibleModifierLinks = (
    menuItem: MenuItem | null,
    variation?: MenuVariation | null,
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

  const getModifierEffectivePrice = (
    modifier: Modifier,
    menuItem: MenuItem | null,
    variation?: MenuVariation | null,
  ) => {
    if (!menuItem) return toNumber(modifier?.priceDelta, 0);

    return getModifierPriceForVariation({
      item: menuItem,
      selectedVariation: variation,
      selectedVariationId: variation?.id ?? null,
      modifierId: String(modifier?.id || ""),
    });
  };

  const itemVariations = useMemo(() => getItemVariations(item), [item]);

  const visibleModifierLinks = useMemo(() => {
    return getVisibleModifierLinks(item, selectedVariation);
  }, [item, selectedVariation]);

  const groupedModifierLinks = useMemo(() => {
    return visibleModifierLinks.filter((link) => {
      const groupId = String(link?.modifierGroup?.id || "");
      return (
        groupId &&
        groupId !== ADDONS_GROUP_ID &&
        !groupId.startsWith("standalone-modifiers-")
      );
    });
  }, [visibleModifierLinks]);

  const groupedModifierGroups = useMemo(
    () => groupedModifierLinks.map((link) => link.modifierGroup),
    [groupedModifierLinks],
  );

  const itemAddons = useMemo(() => {
    if (groupedModifierGroups.length > 0) return [];
    return getStandaloneItemModifiers(item, new Set<string>());
  }, [groupedModifierGroups.length, item]);

  const itemQuantityRules = useMemo(() => {
    const minQuantity = Math.max(1, toNumber(item?.minQuantity, 1));
    const rawMaxQuantity = toNumber(item?.maxQuantity, 0);

    return {
      minQuantity,
      maxQuantity: rawMaxQuantity > 0 ? rawMaxQuantity : undefined,
    };
  }, [item]);

  const addonSelectionRules = useMemo(() => {
    const rawMinSelect = toNumber(item?.minSelect, 0);
    const rawMaxSelect = toNumber(item?.maxSelect, 0);
    const isRequired = Boolean(item?.isRequired);

    return {
      minSelect: Math.max(isRequired ? 1 : 0, rawMinSelect),
      maxSelect: rawMaxSelect > 0 ? rawMaxSelect : undefined,
      isRequired,
    };
  }, [item]);

  const selectedAddons: SelectedModifier[] =
    selectedModifiers[ADDONS_GROUP_ID] || [];
  const selectedAddonsQuantity =
    getModifierGroupSelectedQuantity(selectedAddons);

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

    return t("optional");
  }, [addonSelectionRules, t]);

  const quantityLabel = useMemo(() => {
    const { minQuantity, maxQuantity } = itemQuantityRules;

    if (maxQuantity) {
      return `Min ${minQuantity} · Max ${maxQuantity}`;
    }

    return `Min ${minQuantity}`;
  }, [itemQuantityRules]);

  const splitPizzaPricingVariation = useMemo(
    () =>
      getSplitPizzaPricingVariation({
        variations: getItemVariations(splitPizzaItem),
        selectedVariation,
        fallbackVariation: getDefaultVariation(splitPizzaItem),
      }),
    [getDefaultVariation, getItemVariations, selectedVariation, splitPizzaItem],
  );

  const hasOptions =
    itemVariations.length > 0 ||
    itemAddons.length > 0 ||
    groupedModifierLinks.length > 0 ||
    itemSupportsSplitPizza;

  useEffect(() => {
    queueMicrotask(() => {
      setSelectedVariation(getDefaultVariation(item));
      setQty(Math.max(1, toNumber(item?.minQuantity, 1)));
    });
  }, [getDefaultVariation, item]);

  useEffect(() => {
    if (itemSupportsSplitPizza) return;

    queueMicrotask(() => {
      setSplitPizzaEnabled(false);
      setSplitPizzaItem(null);
    });
  }, [itemSupportsSplitPizza]);

  useEffect(() => {
    if (!open) {
      queueMicrotask(() => {
        setQty(Math.max(1, toNumber(item?.minQuantity, 1)));
        setNote("");
        setSelectedModifiers({});
        setSelectedVariation(getDefaultVariation(item));
        setSplitPizzaEnabled(false);
        setSplitPizzaItem(null);
      });
    }
  }, [getDefaultVariation, open, item]);

  useEffect(() => {
    queueMicrotask(() => {
      setQty((prev) => {
        const minQuantity = itemQuantityRules.minQuantity;
        const maxQuantity = itemQuantityRules.maxQuantity;
        const nextQuantity = Math.max(minQuantity, prev);

        return maxQuantity ? Math.min(maxQuantity, nextQuantity) : nextQuantity;
      });
    });
  }, [itemQuantityRules]);

  useEffect(() => {
    const validAddonIds = new Set(itemAddons.map((addon) => String(addon.id)));
    const validGroupIds = new Set(
      groupedModifierGroups.map((group) => String(group?.id || "")),
    );

    queueMicrotask(() => {
      setSelectedModifiers((prev): SelectedModifiersMap => {
        const existingAddons = prev[ADDONS_GROUP_ID] || [];
        const nextAddons = existingAddons.filter((addon) =>
          validAddonIds.has(String(addon.id)),
        );

        const next: SelectedModifiersMap = {};

        if (nextAddons.length) {
          next[ADDONS_GROUP_ID] = nextAddons;
        }

        for (const [groupId, modifiers] of Object.entries(prev)) {
          if (!validGroupIds.has(groupId)) continue;

          const group = groupedModifierGroups.find(
            (entry) => String(entry?.id || "") === groupId,
          );
          const validModifierIds = new Set(
            normalizeArray<Modifier>(group?.modifiers).map((modifier) =>
              String(modifier?.id || ""),
            ),
          );
          const nextModifiers = modifiers.filter((modifier) =>
            validModifierIds.has(String(modifier?.id || "")),
          );

          if (nextModifiers.length) {
            next[groupId] = nextModifiers;
          }
        }

        return next;
      });
    });
  }, [groupedModifierGroups, itemAddons]);

  const handleAddonToggle = (modifier: Modifier) => {
    setSelectedModifiers((prev) => {
      const current = prev[ADDONS_GROUP_ID] || [];
      const isSelected = current.some((addon) => addon.id === modifier.id);
      const selectedQuantity = getModifierGroupSelectedQuantity(current);
      const selectedAddon = current.find((addon) => addon.id === modifier.id);
      const selectedAddonQuantity = selectedAddon
        ? Math.max(1, Math.floor(toNumber(selectedAddon.selectedQuantity, 1)))
        : 0;
      const { minSelect, maxSelect } = addonSelectionRules;
      const itemName = item?.name || t("thisItem");
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
        if (
          minSelect > 0 &&
          selectedQuantity - selectedAddonQuantity < minSelect
        ) {
          toast.error(t("minimumAddons", { itemName, count: minSelect }));
          return prev;
        }

        const nextAddons = current.filter((addon) => addon.id !== modifier.id);
        const next: SelectedModifiersMap = { ...prev };

        if (nextAddons.length) {
          next[ADDONS_GROUP_ID] = nextAddons;
        } else {
          delete next[ADDONS_GROUP_ID];
        }

        return next;
      }

      if (maxSelect && selectedQuantity >= maxSelect) {
        toast.error(t("maximumAddons", { itemName, count: maxSelect }));
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

  const handleGroupedModifierToggle = (
    group: ModifierGroup,
    modifier: Modifier,
  ) => {
    const groupId = String(group.id);
    const { minSelect, maxSelect, isRequired, selectionType } =
      getGroupValidation(group);
    const itemName = item?.name || t("thisItem");

    setSelectedModifiers((prev) => {
      const current = prev[groupId] || [];
      const isSelected = current.some(
        (selected) => selected.id === modifier.id,
      );
      const selectedQuantity = getModifierGroupSelectedQuantity(current);

      if (selectionType === "SINGLE" || maxSelect === 1) {
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
        const modifierQuantity =
          current.find((selected) => selected.id === modifier.id)
            ?.selectedQuantity || 1;

        if (minSelect > 0 && selectedQuantity - modifierQuantity < minSelect) {
          toast.error(t("minimumAddons", { itemName, count: minSelect }));
          return prev;
        }

        const nextModifiers = current.filter(
          (selected) => selected.id !== modifier.id,
        );
        const next = { ...prev };

        if (nextModifiers.length) {
          next[groupId] = nextModifiers;
        } else {
          delete next[groupId];
        }

        return next;
      }

      if (maxSelect && selectedQuantity >= maxSelect) {
        toast.error(t("maximumAddons", { itemName, count: maxSelect }));
        return prev;
      }

      return {
        ...prev,
        [groupId]: [
          ...current,
          {
            ...modifier,
            selectedQuantity: 1,
          },
        ],
      };
    });
  };

  const handleGroupedModifierQuantityChange = (
    group: ModifierGroup,
    modifier: Modifier,
    nextQuantity: number,
  ) => {
    const groupId = String(group.id);
    const { minSelect, maxSelect, selectionType } = getGroupValidation(group);

    if (selectionType === "SINGLE" || maxSelect === 1) {
      return;
    }

    setSelectedModifiers((prev) => {
      const current = prev[groupId] || [];
      const currentModifier = current.find(
        (selected) => selected.id === modifier.id,
      );

      if (!currentModifier) {
        return prev;
      }

      const normalizedNextQuantity = Math.max(
        1,
        Math.floor(Number.isFinite(nextQuantity) ? nextQuantity : 1),
      );
      const otherSelectedQuantity = current.reduce((total, selected) => {
        if (selected.id === modifier.id) return total;

        return (
          total +
          Math.max(1, Math.floor(toNumber(selected.selectedQuantity, 1)))
        );
      }, 0);
      const maxAllowedQuantity =
        maxSelect && maxSelect > 0
          ? Math.max(1, maxSelect - otherSelectedQuantity)
          : normalizedNextQuantity;

      if (
        maxSelect &&
        otherSelectedQuantity + normalizedNextQuantity > maxSelect
      ) {
        toast.error(
          t("maximumAddons", {
            itemName: item?.name || t("thisItem"),
            count: maxSelect,
          }),
        );
      }

      const minAllowedQuantity =
        minSelect > otherSelectedQuantity
          ? minSelect - otherSelectedQuantity
          : 1;
      const clampedQuantity = Math.max(
        minAllowedQuantity,
        Math.min(normalizedNextQuantity, maxAllowedQuantity),
      );

      return {
        ...prev,
        [groupId]: current.map((selected) =>
          selected.id === modifier.id
            ? { ...selected, selectedQuantity: clampedQuantity }
            : selected,
        ),
      };
    });
  };

  const handleAddonQuantityChange = (
    modifier: Modifier,
    nextQuantity: number,
  ) => {
    const { minSelect, maxSelect } = addonSelectionRules;

    if (maxSelect === 1) {
      return;
    }

    setSelectedModifiers((prev) => {
      const current = prev[ADDONS_GROUP_ID] || [];
      const selectedAddon = current.find((addon) => addon.id === modifier.id);

      if (!selectedAddon) return prev;

      const normalizedNextQuantity = Math.max(
        1,
        Math.floor(Number.isFinite(nextQuantity) ? nextQuantity : 1),
      );
      const otherSelectedQuantity = current.reduce((total, addon) => {
        if (addon.id === modifier.id) return total;

        return (
          total + Math.max(1, Math.floor(toNumber(addon.selectedQuantity, 1)))
        );
      }, 0);

      const maxAllowedQuantity =
        maxSelect && maxSelect > 0
          ? Math.max(1, maxSelect - otherSelectedQuantity)
          : normalizedNextQuantity;

      if (
        maxSelect &&
        otherSelectedQuantity + normalizedNextQuantity > maxSelect
      ) {
        toast.error(
          t("maximumAddons", {
            itemName: item?.name || t("thisItem"),
            count: maxSelect,
          }),
        );
      }

      const minAllowedQuantity =
        minSelect > otherSelectedQuantity
          ? minSelect - otherSelectedQuantity
          : 1;
      const clampedQuantity = Math.max(
        minAllowedQuantity,
        Math.min(normalizedNextQuantity, maxAllowedQuantity),
      );

      return {
        ...prev,
        [ADDONS_GROUP_ID]: current.map((selected) =>
          selected.id === modifier.id
            ? { ...selected, selectedQuantity: clampedQuantity }
            : selected,
        ),
      };
    });
  };

  const validateAddonSelections = () => {
    if (!itemAddons.length) return true;

    const selectedCount = selectedAddonsQuantity;
    const { minSelect, maxSelect } = addonSelectionRules;
    const itemName = item?.name || t("thisItem");

    if (minSelect > 0 && selectedCount < minSelect) {
      toast.error(t("minimumAddons", { itemName, count: minSelect }));
      return false;
    }

    if (maxSelect && selectedCount > maxSelect) {
      toast.error(t("maximumAddons", { itemName, count: maxSelect }));
      return false;
    }

    return true;
  };

  const buildModifiersPayload = (selectionMap: SelectedModifiersMap) => {
    return Object.values(selectionMap)
      .flat()
      .map((modifier: SelectedModifier) => ({
        modifierId: modifier.id,
        quantity: Math.max(
          1,
          Math.floor(toNumber(modifier.selectedQuantity, 1)),
        ),
      }));
  };

  const getModifiersTotal = (
    selectionMap: SelectedModifiersMap,
    menuItem: MenuItem | null,
    variation?: MenuVariation | null,
  ) => {
    return Object.values(selectionMap)
      .flat()
      .reduce((acc: number, modifier: SelectedModifier) => {
        const modifierPrice = getModifierEffectivePrice(
          modifier as Modifier,
          menuItem,
          variation,
        );

        return (
          acc +
          modifierPrice *
            Math.max(1, Math.floor(toNumber(modifier.selectedQuantity, 1)))
        );
      }, 0);
  };

  const getMenuItemBasePrice = (menuItem: MenuItem | null) => {
    return toNumber(
      menuItem?.basePrice ?? menuItem?.unitPrice ?? menuItem?.price,
      0,
    );
  };

  const getMenuItemResolvedPrice = (
    menuItem: MenuItem | null,
    variation?: MenuVariation | null,
  ) => {
    if (!menuItem) return 0;

    if (variation?.id) {
      return toNumber(variation.price, 0);
    }

    return getMenuItemBasePrice(menuItem);
  };

  const resolvedItemPrice = getMenuItemResolvedPrice(item, selectedVariation);

  const selectedItemPromotionPricing = getPromotionPricing({
    source: getPromotionSourceForPrice(item, selectedVariation),
    originalPrice: resolvedItemPrice,
  });

  const splitPizzaResolvedItemPrice = getMenuItemResolvedPrice(
    splitPizzaItem,
    splitPizzaPricingVariation,
  );

  const splitPizzaPromotionPricing = getPromotionPricing({
    source: getPromotionSourceForPrice(
      splitPizzaItem,
      splitPizzaPricingVariation,
    ),
    originalPrice: splitPizzaResolvedItemPrice,
  });

  const modifiersTotal = Number(
    getModifiersTotal(selectedModifiers, item, selectedVariation),
  );

  const splitPizzaBasePrice =
    splitPizzaEnabled && splitPizzaItem
      ? Math.max(resolvedItemPrice, splitPizzaResolvedItemPrice)
      : resolvedItemPrice;

  const splitPizzaDisplayBasePrice =
    splitPizzaEnabled && splitPizzaItem
      ? Math.max(
          selectedItemPromotionPricing.finalPrice,
          splitPizzaPromotionPricing.finalPrice,
        )
      : selectedItemPromotionPricing.finalPrice;

  const totalPrice = (splitPizzaBasePrice + modifiersTotal) * qty;
  const displayTotalPrice = (splitPizzaDisplayBasePrice + modifiersTotal) * qty;
  const hasTotalPromotionDiscount = displayTotalPrice < totalPrice;
  const totalPromotionDiscount = Math.max(0, totalPrice - displayTotalPrice);
  const activeVisiblePromotion =
    selectedItemPromotionPricing.promotion ||
    splitPizzaPromotionPricing.promotion;

  const fetchPizzaItems = async ({
    search,
    page,
  }: {
    search: string;
    page: number;
  }) => {
    return fetchSplitPizzaMenuItems({ restaurantId, branchId, search, page });
  };

  const handleSplitPizzaToggle = (checked: boolean) => {
    if (!itemSupportsSplitPizza) return;

    setSplitPizzaEnabled(checked);

    if (!checked) {
      setSplitPizzaItem(null);
    }
  };

  const handleSplitPizzaItemChange = (selectedItem: MenuItem | null) => {
    setSplitPizzaItem(selectedItem || null);
  };

  const renderModifierGroupSections = () => {
    if (!groupedModifierLinks.length) return null;

    return groupedModifierLinks.map((link) => {
      const group = link.modifierGroup;
      const groupId = String(group?.id || "");
      const selectedInGroup = selectedModifiers[groupId] || [];
      const selectedQuantity =
        getModifierGroupSelectedQuantity(selectedInGroup);
      const { maxSelect, isRequired, selectionType } =
        getGroupValidation(group);
      const groupModifiers = normalizeArray<Modifier>(group?.modifiers).filter(
        (modifier) => modifier?.isActive !== false,
      );

      if (!groupModifiers.length) return null;

      const inputType =
        selectionType === "SINGLE" || maxSelect === 1 ? "radio" : "checkbox";
      const groupSelectionLabel =
        maxSelect && maxSelect > 0
          ? `Min ${Math.max(0, toNumber(group?.minSelect, 0))} · Max ${maxSelect}`
          : isRequired
            ? "Required"
            : t("optional");

      return (
        <div
          key={`${String(link?.variationId || "common")}-${groupId}`}
          className="mb-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-gray-900">{group?.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                  {groupSelectionLabel}
                </span>
                {group?.description ? (
                  <span className="text-xs text-gray-500">
                    {group.description}
                  </span>
                ) : null}
              </div>
            </div>

            <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
              {selectedQuantity}
              {maxSelect ? ` / ${maxSelect}` : ""} selected
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {groupModifiers.map((modifier) => {
              const selectedModifier = selectedInGroup.find(
                (selected) => selected.id === modifier.id,
              );
              const checked = Boolean(selectedModifier);
              const selectedModifierQuantity = Math.max(
                1,
                Math.floor(toNumber(selectedModifier?.selectedQuantity, 1)),
              );
              const disableBecauseMaxReached =
                inputType !== "radio" &&
                !checked &&
                !!maxSelect &&
                selectedQuantity >= maxSelect;
              const showQuantitySelector = checked && inputType === "checkbox";
              const disableIncrement = Boolean(
                maxSelect && selectedQuantity >= maxSelect,
              );
              const effectivePrice = getModifierEffectivePrice(
                modifier,
                item,
                selectedVariation,
              );

              return (
                <div
                  key={modifier.id}
                  className={`rounded-xl border px-3 py-3 text-sm transition ${
                    disableBecauseMaxReached
                      ? "cursor-not-allowed border-gray-100 bg-gray-100 opacity-70"
                      : checked
                        ? "border-primary/25 bg-primary/5 ring-1 ring-primary/20"
                        : "border-gray-100 bg-gray-50 hover:border-primary/25 hover:bg-white"
                  }`}
                >
                  <label className="flex cursor-pointer items-start justify-between gap-3">
                    <span className="flex min-w-0 flex-1 items-start gap-2 text-gray-800">
                      <input
                        type={inputType}
                        name={`modifier-group-${item?.id}-${groupId}`}
                        checked={checked}
                        disabled={disableBecauseMaxReached}
                        onChange={() =>
                          handleGroupedModifierToggle(group, modifier)
                        }
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
                        {formatModifierSelectionPrice(
                          effectivePrice,
                          selectedModifierQuantity,
                          currency,
                        )}
                      </span>
                    ) : null}
                  </label>

                  {showQuantitySelector ? (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-full border border-primary/10 bg-white/90 px-2 py-1.5 shadow-sm">
                      <span className="pl-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Qty
                      </span>

                      <div className="flex items-center rounded-full bg-gray-100 p-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleGroupedModifierQuantityChange(
                              group,
                              modifier,
                              selectedModifierQuantity - 1,
                            )
                          }
                          disabled={selectedModifierQuantity <= 1}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-gray-700 transition hover:bg-white hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
                          aria-label={`Decrease ${modifier.displayText || modifier.name} quantity`}
                        >
                          <Minus size={14} />
                        </button>

                        <span className="min-w-8 text-center text-sm font-bold text-gray-900">
                          {selectedModifierQuantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            handleGroupedModifierQuantityChange(
                              group,
                              modifier,
                              selectedModifierQuantity + 1,
                            )
                          }
                          disabled={disableIncrement}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-gray-700 transition hover:bg-white hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
                          aria-label={`Increase ${modifier.displayText || modifier.name} quantity`}
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

  const renderAddonSection = () => {
    if (!itemAddons.length) return null;

    const { maxSelect } = addonSelectionRules;
    const selectedCount = selectedAddonsQuantity;
    const inputType = maxSelect === 1 ? "radio" : "checkbox";

    return (
      <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-gray-900">{t("addons")}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                {addonSelectionLabel}
              </span>
              <span className="text-xs text-gray-500">
                {t("addonsDescription")}
              </span>
            </div>
          </div>

          <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
            {selectedCount}
            {maxSelect ? ` / ${maxSelect}` : ""} selected
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {itemAddons.map((modifier) => {
            const checked = selectedAddons.some(
              (selected) => selected.id === modifier.id,
            );
            const selectedModifier = selectedAddons.find(
              (selected) => selected.id === modifier.id,
            );
            const selectedModifierQuantity = Math.max(
              1,
              Math.floor(toNumber(selectedModifier?.selectedQuantity, 1)),
            );

            const disableBecauseMaxReached =
              inputType !== "radio" &&
              !checked &&
              !!maxSelect &&
              selectedCount >= maxSelect;

            const effectivePrice = getModifierEffectivePrice(
              modifier,
              item,
              selectedVariation,
            );
            const showQuantitySelector = checked && inputType === "checkbox";
            const disableIncrement = Boolean(
              maxSelect && selectedCount >= maxSelect,
            );

            return (
              <div
                key={modifier.id}
                className={`rounded-xl border px-3 py-3 text-sm transition ${
                  disableBecauseMaxReached
                    ? "cursor-not-allowed border-gray-100 bg-gray-100 opacity-70"
                    : checked
                      ? "border-primary/25 bg-primary/5 ring-1 ring-primary/20"
                      : "border-gray-100 bg-gray-50 hover:border-primary/25 hover:bg-white"
                }`}
              >
                <label className="flex cursor-pointer items-start justify-between gap-3">
                  <span className="flex min-w-0 flex-1 items-start gap-2 text-gray-800">
                    <input
                      type={inputType}
                      name={`item-addons-${item?.id || "item"}`}
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
                      {formatModifierSelectionPrice(
                        effectivePrice,
                        selectedModifierQuantity,
                        currency,
                      )}
                    </span>
                  ) : null}
                </label>

                {showQuantitySelector ? (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-full border border-primary/10 bg-white/90 px-2 py-1.5 shadow-sm">
                    <span className="pl-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Qty
                    </span>

                    <div className="flex items-center rounded-full bg-gray-100 p-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          handleAddonQuantityChange(
                            modifier,
                            selectedModifierQuantity - 1,
                          )
                        }
                        disabled={selectedModifierQuantity <= 1}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-gray-700 transition hover:bg-white hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
                        aria-label={`Decrease ${modifier.displayText || modifier.name} quantity`}
                      >
                        <Minus size={14} />
                      </button>

                      <span className="min-w-8 text-center text-sm font-bold text-gray-900">
                        {selectedModifierQuantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          handleAddonQuantityChange(
                            modifier,
                            selectedModifierQuantity + 1,
                          )
                        }
                        disabled={disableIncrement}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-gray-700 transition hover:bg-white hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
                        aria-label={`Increase ${modifier.displayText || modifier.name} quantity`}
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
  };

  const addCartItemWithBranchRetry = async (
    payload: CartPayload & Record<string, unknown>,
  ) => {
    if (!customerId) {
      return {
        success: false,
        error: t("customerNotFound"),
      };
    }

    const cartPayload = {
      ...payload,
      branchId,
    };

    const firstRes = await addCustomerCartItem({
      customerId,
      payload: cartPayload,
    });

    if (!isCartBranchConflictResponse(firstRes)) {
      return firstRes;
    }

    const clearRes = await clearCustomerCart({ customerId });

    if (isApiErrorResponse(clearRes)) {
      return {
        success: false,
        error: getApiErrorMessage(clearRes, t("clearPreviousBranchCartFailed")),
      };
    }

    toast.info(t("previousBranchCartCleared"));

    return addCustomerCartItem({ customerId, payload: cartPayload });
  };

  async function handleAddToCart() {
    try {
      setLoading(true);

      if (!item?.id) {
        toast.error(t("itemNotFound"));
        return;
      }

      const groupedValidation = validateModifierSelections(
        groupedModifierGroups,
        selectedModifiers,
      );

      if (!groupedValidation.isValid) {
        toast.error(
          Object.values(groupedValidation.errors)[0] || t("failedAddToCart"),
        );
        return;
      }

      if (!validateAddonSelections()) {
        return;
      }

      if (splitPizzaEnabled) {
        if (!splitPizzaItem?.id) {
          toast.error(t("selectOtherPizzaHalf"));
          return;
        }
      }

      const groupCode = getStoredGroupOrderCode();
      const groupOrderId = getStoredGroupOrderId();
      let addedToGroupOrder = false;
      const storedGroupOrderCompleted = isStoredGroupOrderCompleted({
        orderId: groupOrderId,
        inviteCode: groupCode,
      });

      if (!groupCode && !groupOrderId && !customerId) {
        toast.error(t("customerNotFound"));
        return;
      }

      if (!groupCode && !groupOrderId && !branchId) {
        toast.error(t("selectBranch"));
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

      const basePayload: CartPayload = {
        menuItemId: item?.id,
        quantity: qty,
        variationId: selectedVariation?.id || undefined,
        note: note.trim() || "",
      };

      if (groupedModifierGroups.length > 0) {
        basePayload.modifierSelections = buildModifierSelections(
          groupedModifierGroups,
          selectedModifiers,
        );
      } else {
        basePayload.modifiers = buildModifiersPayload(selectedModifiers);
      }

      if (splitSections) {
        basePayload.sections = splitSections;
      }

      let res: ApiRecord | null = null;

      if (storedGroupOrderCompleted) {
        clearStoredGroupOrderCode();
      }

      if (!storedGroupOrderCompleted && (groupCode || groupOrderId)) {
        let groupOrder: ApiRecord | null = null;

        if (groupOrderId) {
          const { groupOrder: directGroupOrder } = await fetchGroupOrderById({
            orderId: groupOrderId,
          });
          groupOrder = directGroupOrder as ApiRecord | null;
        }

        if (!groupOrder && groupCode) {
          const { groupOrder: searchedGroupOrder } =
            await searchGroupOrdersByInviteCode({ inviteCode: groupCode });
          groupOrder = searchedGroupOrder as ApiRecord | null;
        }

        if (!groupOrder && groupCode) {
          const { groupOrders } = await fetchGroupOrders();

          groupOrder =
            groupOrders.find(
              (order: ApiRecord) => order?.inviteCode === groupCode,
            ) || null;
        }

        if (!groupOrder) {
          toast.error(t("invalidGroupOrder"));
          return;
        }
        setStoredGroupOrderId(String(groupOrder.id));

        const currentParticipant = findCurrentGroupOrderParticipant({
          order: groupOrder,
          userId: customerId,
        });

        if (isGroupOrderParticipantCompleted(currentParticipant)) {
          markStoredGroupOrderCompleted({
            orderId: groupOrder.id as string | number | null,
            inviteCode: groupOrder.inviteCode as string | number | null,
          });
          clearStoredGroupOrderCode();
          res = await addCartItemWithBranchRetry(basePayload);
        } else {
          res = await addGroupOrderItem({
            groupOrderId: String(groupOrder.id),
            payload: basePayload,
          });
          addedToGroupOrder = true;
        }
      } else {
        res = await addCartItemWithBranchRetry(basePayload);
      }

      if (isApiErrorResponse(res)) {
        toast.error(getApiErrorMessage(res, t("failedAddToCart")));
        return;
      }

      toast.success(
        addedToGroupOrder ? t("addedToGroupOrder") : t("addedToCart"),
      );

      setAnimateCart(true);
      setTimeout(() => setAnimateCart(false), 700);

      setOpen(false);

      if (addedToGroupOrder) {
        window.dispatchEvent(new Event("deliveryway:group-order:item-added"));
      }
    } catch (error) {
      toast.error(tErrors("somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  }

  const handlePlusClick = (event?: React.MouseEvent<HTMLElement>) => {
    event?.stopPropagation();

    if (loading) return;

    const groupCode = getStoredGroupOrderCode();
    const groupOrderId = getStoredGroupOrderId();
    const storedGroupOrderCompleted = isStoredGroupOrderCompleted({
      orderId: groupOrderId,
      inviteCode: groupCode,
    });

    if (storedGroupOrderCompleted) {
      clearStoredGroupOrderCode();
    }

    const hasActiveGroupContext = Boolean(
      !storedGroupOrderCompleted && (groupCode || groupOrderId),
    );

    if (!hasOptions) {
      if (!hasActiveGroupContext && !branchId) {
        toast.error(t("selectBranchFirst"));
        return;
      }

      handleAddToCart();
      return;
    }

    setOpen(true);
  };

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    handlePlusClick();
  };

  const handleNavigateToDetails = () => {
    router.push(`/items/details?itemId=${item?.id}&slug=${item?.slug}`);
  };

  const truncatedDesc =
    item?.description && String(item.description).length > 90
      ? `${String(item.description).slice(0, 90)}...`
      : item?.description || "";

  const hasInfoBoxContent = hasProductInfoContent(item);

  const defaultCardVariation = getDefaultVariation(item);
  const displayCardPrice = getMenuItemResolvedPrice(item, defaultCardVariation);
  const cardPromotionPricing = getPromotionPricing({
    source: getPromotionSourceForPrice(item, defaultCardVariation),
    originalPrice: displayCardPrice,
  });

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handlePlusClick}
        onKeyDown={handleCardKeyDown}
        className="group relative cursor-pointer rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-primary/40 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <div className="flex justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-900">
                {item?.name}
              </h3>

              {hasInfoBoxContent ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setInfoOpen(true);
                  }}
                  className="rounded-full border border-gray-200 bg-gray-50 p-1.5 text-gray-500 transition hover:text-primary"
                  title={t("viewIngredients")}
                >
                  <Eye size={15} />
                </button>
              ) : null}
            </div>

            <p className="mb-2 text-xs text-gray-500">
              {truncatedDesc || t("freshPremiumItem")}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-gray-900">
                <PromotionPrice
                  pricing={cardPromotionPricing}
                  currency={currency}
                />
              </p>

              {cardPromotionPricing.hasPromotion ? (
                <PromotionBadge
                  promotion={cardPromotionPricing.promotion}
                  compact
                  currency={currency}
                />
              ) : null}
            </div>

            {cardPromotionPricing.hasDiscount ? (
              <p className="mt-1 text-[11px] font-medium text-green-700">
                Save{" "}
                {formatMoney(cardPromotionPricing.discountAmount, currency)}
              </p>
            ) : null}

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleNavigateToDetails();
              }}
              className="mt-2 flex items-center gap-1 text-xs text-primary"
            >
              <Info size={14} /> Item Info
            </button>
          </div>

          <div className="relative h-[110px] w-[120px] overflow-hidden rounded-xl">
            {cardPromotionPricing.hasPromotion ? (
              <div className="absolute left-2 top-2 z-10">
                <PromotionBadge
                  promotion={cardPromotionPricing.promotion}
                  compact
                  currency={currency}
                />
              </div>
            ) : null}

            <Image
              src={item?.imageUrl || "/placeholder.png"}
              alt={item?.name || "item"}
              fill
              className="object-cover"
              unoptimized
            />

            <FavoriteHeartButton
              menuItemId={item?.id}
              className="absolute right-2 top-2 z-10 h-9 w-9"
            />

            <button
              type="button"
              onClick={(event) => {
                handlePlusClick(event);
              }}
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

      {infoOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(event) => {
            event.stopPropagation();
            setInfoOpen(false);
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

            <ProductInfoContent item={item} />
          </div>
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[95vh] max-w-md overflow-auto rounded-2xl p-6">
          <div className="mb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {item?.name}
                  </h2>

                  {selectedItemPromotionPricing.hasPromotion ? (
                    <PromotionBadge
                      promotion={selectedItemPromotionPricing.promotion}
                      currency={currency}
                    />
                  ) : null}
                </div>
              </div>

              <FavoriteHeartButton
                menuItemId={item?.id}
                className="h-9 w-9 shrink-0 border border-gray-100"
              />
            </div>

            {selectedItemPromotionPricing.hasPromotion ? (
              <div className="mt-2 rounded-xl bg-green-50 px-3 py-2">
                <p className="text-xs font-semibold text-green-700">
                  {getPromotionTitle(selectedItemPromotionPricing.promotion)}
                </p>

                {selectedItemPromotionPricing.promotion?.description ? (
                  <p className="mt-0.5 line-clamp-2 text-xs text-green-700/80">
                    {selectedItemPromotionPricing.promotion.description}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {itemVariations.length > 0 ? (
            <div className="mb-5">
              <p className="mb-2 font-medium text-gray-900">{t("size")}</p>

              <div className="grid grid-cols-1 gap-3">
                {itemVariations.map((variation) => {
                  const variationPrice = toNumber(variation.price, 0);
                  const variationPromotionPricing = getPromotionPricing({
                    source: getPromotionSourceForPrice(item, variation),
                    originalPrice: variationPrice,
                  });

                  return (
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
                              {variation.displayText || variation.name}
                            </p>

                            {variation.description ? (
                              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                                {variation.description}
                              </p>
                            ) : null}

                            {variationPromotionPricing.hasPromotion ? (
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <PromotionBadge
                                  promotion={
                                    variationPromotionPricing.promotion
                                  }
                                  compact
                                  currency={currency}
                                />

                                {variationPromotionPricing.hasDiscount ? (
                                  <span className="text-xs font-medium text-green-700">
                                    Save{" "}
                                    {formatMoney(
                                      variationPromotionPricing.discountAmount,
                                      currency,
                                    )}
                                  </span>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {variationPrice > 0 ? (
                          <div className="shrink-0 text-right text-sm font-semibold text-primary">
                            <PromotionPrice
                              pricing={variationPromotionPricing}
                              currency={currency}
                            />
                          </div>
                        ) : null}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : null}

          {itemSupportsSplitPizza ? (
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
                      placeholder={t("selectSplitPizzaItem")}
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
                          <div className="shrink-0 text-right font-medium text-primary">
                            <PromotionPrice
                              pricing={splitPizzaPromotionPricing}
                              currency={currency}
                            />

                            {splitPizzaPromotionPricing.hasPromotion ? (
                              <div className="mt-1 flex justify-end">
                                <PromotionBadge
                                  promotion={
                                    splitPizzaPromotionPricing.promotion
                                  }
                                  compact
                                  currency={currency}
                                />
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {renderModifierGroupSections()}

          {renderAddonSection()}

          <div className="mb-5">
            <p className="mb-2 font-medium text-gray-900">
              {t("specialInstructions")}
            </p>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("notesPlaceholder")}
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
                      Math.max(itemQuantityRules.minQuantity, prev - 1),
                    )
                  }
                  className="px-2 text-lg text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={loading || qty <= itemQuantityRules.minQuantity}
                >
                  <Minus size={16} />
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
                        : prev + 1,
                    )
                  }
                  className="px-2 text-lg text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={
                    loading ||
                    Boolean(
                      itemQuantityRules.maxQuantity &&
                      qty >= itemQuantityRules.maxQuantity,
                    )
                  }
                >
                  <Plus size={16} />
                </button>
              </div>

              <p className="mt-1 text-center text-[11px] font-medium text-gray-500">
                {quantityLabel}
              </p>
            </div>

            <div className="text-right text-lg font-semibold text-primary">
              {hasTotalPromotionDiscount ? (
                <div className="flex flex-col items-end">
                  <PromotionPrice
                    pricing={{
                      promotion: activeVisiblePromotion,
                      originalPrice: totalPrice,
                      finalPrice: displayTotalPrice,
                      discountAmount: totalPromotionDiscount,
                      hasPromotion: true,
                      hasDiscount: true,
                    }}
                    originalClassName="text-sm font-medium"
                    currency={currency}
                  />
                  <span className="mt-0.5 text-xs font-medium text-green-700">
                    Save {formatMoney(totalPromotionDiscount, currency)}
                  </span>
                </div>
              ) : (
                formatMoney(totalPrice, currency)
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? t("processing") : t("addToCart")}
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
