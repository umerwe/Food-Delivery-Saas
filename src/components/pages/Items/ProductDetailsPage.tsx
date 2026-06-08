"use client";

import Image from "next/image";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import TestimonialsSection from "@/components/pages/Items/components/Testimonials";
import useItems from "@/hooks/useItems";
import { useCart } from "@/hooks/useCart";
import { useAuthContext } from "@/hooks/useAuth";
import { getStoredGroupOrderCode } from "@/lib/group-order";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Download, Eye, Loader2, Minus, Plus, X } from "lucide-react";
import { AsyncSelect } from "@/components/ui/AsyncSelect";
import type { CartPayload, CheckoutType, ItemPriceOverride, MenuItem, MenuVariation, Modifier, ModifierGroup, ModifierLink, ModifierSelectionMap, PromotionInfo, RawModifierLink, SelectedModifier, VariationPriceOverride } from "@/components/pages/Items/types";
import {
  buildCartPayload,
  buildModifiersPayload,
  getApiErrorMessage,
  hasUnsupportedDealMenuItemCustomization,
  isCartBranchConflict,
} from "@/components/pages/Items/utils/product-cart";
import {
  validateModifierSelections,
} from "@/components/pages/Items/utils/modifier-selections";
import {
  getModifierPriceForVariation,
} from "@/components/pages/Items/utils/modifier-pricing";
import {
  getDepositAmount,
  getProductDetailsQuantityLimits,
  normalizeApiList,
  normalizeArray,
  sortBySortOrder,
  toNumber,
} from "@/components/pages/Items/utils/product-normalizers";


type ApiRecord = Record<string, unknown>;
type OverrideLike = VariationPriceOverride | ItemPriceOverride | ApiRecord | null | undefined;
type PromotionPricing = { promotion: PromotionInfo | null; originalPrice: number; finalPrice: number; discountAmount: number; hasPromotion: boolean; hasDiscount: boolean };

const hasText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text !== "" && text.toLowerCase() !== "null";
};

const getCheckoutType = (type?: string | null): CheckoutType => {
  const normalized = String(type || "").toLowerCase();

  if (normalized === "pickup" || normalized === "takeaway") {
    return "pickup";
  }

  return "delivery";
};

/* ================= PROMOTION HELPERS ================= */

const formatMoney = (value: unknown) => {
  return `$${toNumber(value, 0).toFixed(2)}`;
};

const isPromotionObject = (value: unknown): value is PromotionInfo => {
  return Boolean(value && typeof value === "object");
};

const getPromotionInfo = (source: ApiRecord | null | undefined): PromotionInfo | null => {
  return isPromotionObject(source?.promotion) ? source.promotion : null;
};

const getPromotionDiscountLabel = (promotion?: PromotionInfo | null) => {
  if (!promotion) return "";

  const discountValue = toNumber(promotion.discountValue, 0);

  if (promotion.discountType === "PERCENTAGE") {
    return `${discountValue}% off`;
  }

  if (promotion.discountType === "FLAT") {
    return `${formatMoney(discountValue)} off`;
  }

  return "Offer applied";
};

const getPromotionTitle = (promotion?: PromotionInfo | null) => {
  if (!promotion) return "";

  return (
    String(promotion.title || "").trim() ||
    getPromotionDiscountLabel(promotion) ||
    "Promotion applied"
  );
};

const getBackendDiscountedPriceCandidate = (
  source: ApiRecord | null | undefined,
  promotion?: PromotionInfo | null
) => {
  const candidates = [
    source?.discountedPrice,
    source?.discountedBasePrice,
    promotion?.discountedAmount,
  ];

  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null || candidate === "") {
      continue;
    }

    const numeric = toNumber(candidate, Number.NaN);

    if (Number.isFinite(numeric) && numeric >= 0) {
      return numeric;
    }
  }

  return null;
};

const calculatePromotionDiscount = (
  originalPrice: number,
  promotion?: PromotionInfo | null
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
  source: ApiRecord | null | undefined;
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

  const backendDiscountedPrice = getBackendDiscountedPriceCandidate(
    source,
    promotion
  );

  const calculatedDiscount = calculatePromotionDiscount(
    safeOriginalPrice,
    promotion
  );

  const calculatedFinalPrice = Math.max(0, safeOriginalPrice - calculatedDiscount);

  const finalPrice =
    backendDiscountedPrice !== null && backendDiscountedPrice <= safeOriginalPrice
      ? backendDiscountedPrice
      : calculatedFinalPrice;

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

const getPromotionSourceForPrice = (menuItem: MenuItem | null, variation?: MenuVariation | null) => {
  if (getPromotionInfo(variation)) return variation;
  if (getPromotionInfo(menuItem)) return menuItem;
  return variation || menuItem;
};

function PromotionBadge({ promotion }: { promotion?: PromotionInfo | null }) {
  const t = useTranslations("productDetails");
  if (!promotion) return null;

  const label = getPromotionDiscountLabel(promotion);

  return (
    <span className="inline-flex w-fit items-center rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700 ring-1 ring-green-100">
      {label || t("promotion")}
    </span>
  );
}

function PromotionPrice({
  pricing,
  className = "",
  originalClassName = "",
}: {
  pricing: PromotionPricing;
  className?: string;
  originalClassName?: string;
}) {
  if (!pricing.hasDiscount) {
    return <span className={className}>{formatMoney(pricing.originalPrice)}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className={`text-gray-400 line-through ${originalClassName}`}>
        {formatMoney(pricing.originalPrice)}
      </span>
      <span>{formatMoney(pricing.finalPrice)}</span>
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

const getOverrideMenuItemId = (override: OverrideLike) => {
  if (!override) return "";
  return getId(override.menuItemId || ("menuItem" in override ? (override.menuItem as ApiRecord | undefined)?.id : undefined));
};

const getOverrideVariationId = (override: OverrideLike) => {
  if (!override) return "";
  return getId(override.variationId || ("variation" in override ? (override.variation as ApiRecord | undefined)?.id : undefined));
};

const getOverrideModifierId = (override: OverrideLike) => {
  if (!override) return "";
  return getId(override.modifierId || ("modifier" in override ? (override.modifier as ApiRecord | undefined)?.id : undefined));
};

const isGenericMenuItemOverride = (override: OverrideLike) => {
  const value = override?.menuItemId;
  return value === null || value === undefined || value === "";
};

const findBestModifierOverride = ({
  overrides,
  modifierId,
  menuItemId,
  variationId,
}: {
  overrides?: OverrideLike[];
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

  const isItemSpecific = (override: OverrideLike) => {
    if (!normalizedMenuItemId) return false;
    return getOverrideMenuItemId(override) === normalizedMenuItemId;
  };

  const isExactVariation = (override: OverrideLike) => {
    if (!normalizedVariationId) return false;
    return getOverrideVariationId(override) === normalizedVariationId;
  };

  const hasNoVariation = (override: OverrideLike) => !getOverrideVariationId(override);

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
  overrides?: VariationPriceOverride[];
  menuItemId?: string;
  variationId?: string;
}): VariationPriceOverride | null => {
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
  raw: ApiRecord,
  extra?: Partial<Modifier>
): Modifier | null => {
  if (!raw?.id) return null;
  if (raw?.isActive === false) return null;

  return {
    id: String(raw.id),
    modifierGroupId: typeof raw?.modifierGroupId === "string" ? raw.modifierGroupId : undefined,
    restaurantId: typeof raw?.restaurantId === "string" ? raw.restaurantId : undefined,
    name: String(raw?.name || ""),
    displayText: typeof raw?.displayText === "string" ? raw.displayText : typeof raw?.label === "string" ? raw.label : null,
    description: typeof raw?.description === "string" ? raw.description : "",
    priceDelta: typeof raw?.priceDelta === "string" || typeof raw?.priceDelta === "number" ? raw.priceDelta : 0,
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

const getAllRawVariationSources = (menuItem: MenuItem | null) => {
  const fromVariationPriceOverrides = normalizeArray<VariationPriceOverride>(
    menuItem?.variationPriceOverrides
  )
    .map((override) => ({
      ...(override?.variation || {}),
      id: override?.variationId || override?.variation?.id,
      price: override?.price ?? override?.variation?.price,
      pickupPrice: override?.pickupPrice ?? override?.variation?.pickupPrice,
      displayText: override?.displayText ?? override?.variation?.displayText,
      discountedPrice: override?.discountedPrice ?? override?.variation?.discountedPrice,
      promotion: override?.promotion ?? override?.variation?.promotion ?? null,
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

  const fromCategoryVariationLinks = normalizeArray<{ variation?: MenuVariation | null }>(
    menuItem?.category?.variationLinks
  )
    .map((link) => link?.variation)
    .filter(Boolean);

  return [
    ...normalizeArray<MenuVariation>(menuItem?.variations),
    ...fromVariationPriceOverrides,
    ...normalizeArray<MenuVariation>(menuItem?.category?.variations),
    ...fromCategoryVariationLinks,
  ];
};

const getVariationScopedModifierOverrides = (
  menuItem: MenuItem | null,
  variation?: MenuVariation | null
) => {
  if (!menuItem || !variation?.id) return [];

  const menuItemId = String(menuItem.id || "");
  const variationId = String(variation.id || "");

  const overrides: VariationPriceOverride[] = [];

  normalizeArray<VariationPriceOverride>(menuItem?.variationPriceOverrides)
    .filter((entry) => getOverrideVariationId(entry) === variationId)
    .forEach((entry) => {
      normalizeArray<VariationPriceOverride>(entry?.modifierPriceOverrides).forEach(
        (modifierOverride) => {
          overrides.push({
            ...modifierOverride,
            menuItemId: entry?.menuItemId ?? menuItemId,
            variationId,
          });
        }
      );

      normalizeArray<VariationPriceOverride>(entry?.variation?.modifierPriceOverrides).forEach(
        (modifierOverride) => {
          overrides.push({
            ...modifierOverride,
            variationId:
              getOverrideVariationId(modifierOverride) || variationId,
          });
        }
      );
    });

  normalizeArray<VariationPriceOverride>(variation?.modifierPriceOverrides).forEach(
    (modifierOverride) => {
      overrides.push({
        ...modifierOverride,
        variationId: getOverrideVariationId(modifierOverride) || variationId,
      });
    }
  );

  getAllRawVariationSources(menuItem)
    .filter((rawVariation) => String(rawVariation?.id || "") === variationId)
    .forEach((rawVariation) => {
      normalizeArray<VariationPriceOverride>(rawVariation?.modifierPriceOverrides).forEach(
        (modifierOverride) => {
          overrides.push({
            ...modifierOverride,
            variationId:
              getOverrideVariationId(modifierOverride) || variationId,
          });
        }
      );

      normalizeArray<VariationPriceOverride>(rawVariation?.itemPriceOverrides).forEach(
        (itemOverride) => {
          normalizeArray<VariationPriceOverride>(
            itemOverride?.variation?.modifierPriceOverrides
          ).forEach((modifierOverride) => {
            overrides.push({
              ...modifierOverride,
              variationId:
                getOverrideVariationId(modifierOverride) || variationId,
            });
          });
        }
      );
    });

  return overrides;
};

const getModifierSideVariationOverrides = (menuItem: MenuItem | null, modifier: Modifier) => {
  const modifierId = String(modifier?.id || "");
  const overrides: VariationPriceOverride[] = [];

  normalizeArray<VariationPriceOverride>(modifier?.variationPriceOverrides).forEach((override) => {
    overrides.push(override);
  });

  normalizeArray<VariationPriceOverride>(menuItem?.modifierPriceOverrides)
    .filter((entry) => getOverrideModifierId(entry) === modifierId)
    .forEach((entry) => {
      normalizeArray<VariationPriceOverride>(entry?.modifier?.variationPriceOverrides).forEach(
        (override) => {
          overrides.push(override);
        }
      );
    });

  return overrides;
};

function ProductDetailsPageContent() {
  const t = useTranslations("productDetails");
  const tErrors = useTranslations("errors");
  const params = useSearchParams();
  const slug = params.get("slug");
  const itemIdParam = params.get("itemId") || "";
  const cartItemId = params.get("cartItemId") || "";
  const dealIdContext = params.get("dealId") || "";
  const dealContext = params.get("dealContext") || "";
  const checkoutType = getCheckoutType(params.get("type"));

  const isEditingCartItem = Boolean(cartItemId);

  const { token } = useAuthContext();
  const { fetchMenuItems } = useItems(token);
  const {
    addCustomerCartItem,
    addGroupOrderItem,
    clearCustomerCart,
    fetchCustomerCartItem,
    fetchGroupOrders,
    updateCustomerCartItem,
  } = useCart(token);
  const router = useRouter();

  const [item, setItem] = useState<MenuItem | null>(null);
  const [cartItemToEdit, setCartItemToEdit] = useState<ApiRecord | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [qty, setQty] = useState(1);
  const [instructions, setInstructions] = useState("");

  const [infoOpen, setInfoOpen] = useState(false);

  const [selectedVariation, setSelectedVariation] =
    useState<MenuVariation | null>(null);

  const [selectedModifiers, setSelectedModifiers] =
    useState<ModifierSelectionMap>({});
  const [modifierErrors, setModifierErrors] = useState<Record<string, string>>({});

  const [splitPizzaEnabled, setSplitPizzaEnabled] = useState(false);
  const [splitPizzaItem, setSplitPizzaItem] = useState<MenuItem | null>(null);

  const editPrefilledRef = useRef(false);

  const { user } = useAuth();
  const customerId = user?.id;
  const branchId = user?.branchId;
  const restaurantId =
    item?.restaurantId ||
    item?.restaurant?.id ||
    user?.restaurantId ||

    "";


  const getMenuItemBasePrice = (menuItem: MenuItem | null) => {
    return toNumber(
      menuItem?.basePrice ?? menuItem?.unitPrice ?? menuItem?.price,
      0
    );
  };

  const getVariationDisplayPrice = (menuItem: MenuItem | null, variation: MenuVariation | null) => {
    const variationId = String(variation?.id || variation?.variationId || "");

    const itemOverride =
      findBestItemPriceOverride({
        overrides: menuItem?.variationPriceOverrides,
        menuItemId: getId(menuItem?.id),
        variationId,
      }) ||
      findBestItemPriceOverride({
        overrides: variation?.itemPriceOverrides,
        menuItemId: getId(menuItem?.id),
        variationId,
      });

    if (itemOverride?.price !== undefined && itemOverride?.price !== null) {
      return itemOverride.price;
    }

    return variation?.price ?? menuItem?.basePrice ?? menuItem?.price ?? 0;
  };

  const getVariationPickupPrice = (menuItem: MenuItem | null, variation: MenuVariation | null) => {
    const variationId = String(variation?.id || variation?.variationId || "");

    const itemOverride =
      findBestItemPriceOverride({
        overrides: menuItem?.variationPriceOverrides,
        menuItemId: getId(menuItem?.id),
        variationId,
      }) ||
      findBestItemPriceOverride({
        overrides: variation?.itemPriceOverrides,
        menuItemId: getId(menuItem?.id),
        variationId,
      });

    const candidates = [
      itemOverride?.pickupPrice,
      variation?.pickupPrice,
      variation?.takeawayPrice,
    ];

    for (const candidate of candidates) {
      const numeric = toNumber(candidate, 0);
      if (numeric > 0) return numeric;
    }

    return null;
  };

  const getVariationDisplayText = (menuItem: MenuItem | null, variation: MenuVariation | null) => {
    const variationId = String(variation?.id || variation?.variationId || "");

    const itemOverride =
      findBestItemPriceOverride({
        overrides: menuItem?.variationPriceOverrides,
        menuItemId: getId(menuItem?.id),
        variationId,
      }) ||
      findBestItemPriceOverride({
        overrides: variation?.itemPriceOverrides,
        menuItemId: getId(menuItem?.id),
        variationId,
      });

    return itemOverride?.displayText ?? variation?.displayText ?? "";
  };

  const getMergedVariationModifierOverrides = (menuItem: MenuItem | null, variation: MenuVariation | null) => {
    if (!menuItem || !variation?.id) return [];

    const variationId = String(variation.id);
    const map = new Map<string, VariationPriceOverride>();

    getVariationScopedModifierOverrides(menuItem, {
      id: variationId,
      name: String(variation?.name || ""),
      modifierPriceOverrides: normalizeArray<VariationPriceOverride>(variation?.modifierPriceOverrides),
    }).forEach((override: OverrideLike, index: number) => {
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

  const getItemVariations = (menuItem: MenuItem | null): MenuVariation[] => {
    if (!menuItem) return [];

    const rawVariations = getAllRawVariationSources(menuItem) as MenuVariation[];
    const deduped = new Map<string, MenuVariation>();

    for (const raw of rawVariations) {
      if (!raw?.id) continue;
      if ((raw as { isActive?: boolean }).isActive === false) continue;

      const id = String(raw.id);

      if (deduped.has(id)) continue;

      const normalized: MenuVariation = {
        id,
        categoryId: raw?.categoryId ? String(raw.categoryId) : undefined,
        name: String(raw?.name || ""),
        description: typeof raw?.description === "string" ? raw.description : "",
        price: getVariationDisplayPrice(menuItem, raw),
        pickupPrice: getVariationPickupPrice(menuItem, raw),
        displayText: getVariationDisplayText(menuItem, raw),
        discountedPrice: raw?.discountedPrice ?? raw?.promotion?.discountedAmount ?? null,
        promotion: getPromotionInfo(raw),
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

  const getStandaloneItemModifiers = (
    menuItem: MenuItem | null,
    linkedModifierIds: Set<string>
  ) => {
    const rawOverrides = normalizeArray<VariationPriceOverride>(menuItem?.modifierPriceOverrides);

    const modifiersFromOverrides = rawOverrides
      .map((override) => {
        const rawModifier: Modifier = override?.modifier || {
          id: String(override?.modifierId ?? ""),
          name: "Modifier",
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
              menuItemId: getId(menuItem?.id),
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

    const rawDirectModifiers = normalizeArray<Modifier>(menuItem?.modifiers)
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

  const getNormalizedModifiersFromGroup = (group: ModifierGroup | ApiRecord | null | undefined): Modifier[] => {
    const directModifiers = Array.isArray(group?.modifiers) ? group.modifiers : [];
    const fromModifierLinks = Array.isArray(group?.modifierLinks)
      ? group.modifierLinks.map((link: RawModifierLink) => link?.modifier).filter(Boolean)
      : [];
    const deduped = new Map<string, Modifier>();

    [...directModifiers, ...fromModifierLinks].forEach((raw) => {
      const normalized = normalizeModifier(raw as ApiRecord);
      if (!normalized?.id) return;
      deduped.set(normalized.id, normalized);
    });

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
      modifierLinks: Array.isArray(group?.modifierLinks) ? group.modifierLinks : [],
    };
  };

  const getItemModifierLinks = (menuItem: MenuItem | null): ModifierLink[] => {
    if (!menuItem) return [];

    const fromLinks: ModifierLink[] = [
      ...normalizeArray<RawModifierLink | ApiRecord>(menuItem?.modifierLinks),
      ...normalizeArray<RawModifierLink | ApiRecord>(menuItem?.category?.modifierLinks),
    ]
      .map((link, index) => {
        const linkRecord = link as ApiRecord & { modifierGroup?: ModifierGroup | ApiRecord };
        const normalizedGroup = normalizeGroup(linkRecord.modifierGroup);
        if (!normalizedGroup) return null;

        return {
          id: String(linkRecord?.id || `modifier-link-${normalizedGroup.id}-${index}`),
          variationId: linkRecord?.variationId ? String(linkRecord.variationId) : null,
          sortOrder: toNumber(linkRecord?.sortOrder ?? normalizedGroup.sortOrder, 0),
          modifierGroup: normalizedGroup,
        };
      })
      .filter(Boolean) as ModifierLink[];

    const fromGroups: ModifierLink[] = [
      ...normalizeArray<ModifierGroup | ApiRecord>(menuItem?.modifierGroups),
      ...normalizeArray<ModifierGroup | ApiRecord>(menuItem?.category?.modifierGroups),
      ...normalizeArray<ModifierGroup | ApiRecord>(menuItem?.categoryModifierGroups),
      ...normalizeArray<ModifierGroup | ApiRecord>(menuItem?.category?.categoryModifierGroups),
    ]
      .map((group, index) => {
        const groupRecord = group as ApiRecord & { modifierGroup?: ModifierGroup | ApiRecord };
        const normalizedGroup = normalizeGroup(groupRecord.modifierGroup || group);
        if (!normalizedGroup) return null;

        return {
          id: `modifier-group-${normalizedGroup.id}-${index}`,
          variationId: null,
          sortOrder: toNumber(normalizedGroup.sortOrder, 0),
          modifierGroup: normalizedGroup,
        };
      })
      .filter(Boolean) as ModifierLink[];

    const deduped = new Map<string, ModifierLink>();

    [...fromLinks, ...fromGroups].forEach((link) => {
      const groupId = String(link?.modifierGroup?.id || "");
      if (!groupId) return;

      const key = `${String(link?.variationId || "common")}::${groupId}`;
      if (!deduped.has(key)) {
        deduped.set(key, link);
      }
    });

    const linkedModifierIds = new Set<string>();

    Array.from(deduped.values()).forEach((link) => {
      normalizeArray<Modifier>(link?.modifierGroup?.modifiers).forEach((modifier) => {
        if (modifier?.id) linkedModifierIds.add(String(modifier.id));
      });
    });

    const standaloneModifiers = getStandaloneItemModifiers(menuItem, linkedModifierIds);

    if (standaloneModifiers.length) {
      const minSelect = Math.max(0, toNumber(menuItem?.minSelect, 0));
      const rawMaxSelect = toNumber(menuItem?.maxSelect, 0);
      const maxSelect = rawMaxSelect > 0 ? Math.max(minSelect, rawMaxSelect) : undefined;
      const isRequired = Boolean(menuItem?.isRequired) || minSelect > 0;

      deduped.set(`common::item-addons-${menuItem.id}`, {
        id: `item-addons-${menuItem.id}`,
        variationId: null,
        sortOrder: 999,
        modifierGroup: {
          id: `item-addons-${menuItem.id}`,
          name: t("addons"),
          description: t("addonsDescription"),
          selectionType: maxSelect === 1 ? "SINGLE" : "MULTIPLE",
          minSelect,
          maxSelect,
          isRequired,
          sortOrder: 999,
          isActive: true,
          modifiers: standaloneModifiers,
          modifierLinks: [],
        },
      });
    }

    return sortBySortOrder(Array.from(deduped.values()));
  };

  const getDefaultVariation = (menuItem: MenuItem | null) => {
    const variations = getItemVariations(menuItem);
    if (!variations.length) return null;
    return variations.find((variation) => variation.isDefault) || variations[0];
  };

  const getVisibleModifierLinks = (
    menuItem: MenuItem | null,
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
    menuItem: MenuItem | null,
    variation?: MenuVariation | null
  ) => {
    if (!menuItem) return toNumber(modifier?.priceDelta, 0);

    const helperPrice = getModifierPriceForVariation({
      item: menuItem,
      selectedVariation: variation,
      selectedVariationId: variation?.id ?? null,
      modifierId: String(modifier?.id || ""),
    });

    return helperPrice;
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
      maxSelect: selectionType === "SINGLE" ? 1 : rawMax && rawMax > 0 ? rawMax : undefined,
      isRequired,
      selectionType,
    };
  };

  const clampQuantity = (
    value: unknown,
    limits: {
      minQuantity: number;
      maxQuantity?: number;
    }
  ) => {
    const parsed = Math.max(
      limits.minQuantity,
      toNumber(value, limits.minQuantity)
    );

    if (limits.maxQuantity) {
      return Math.min(parsed, limits.maxQuantity);
    }

    return parsed;
  };

  const getModifierDisplayName = (modifier?: Modifier | null) => {
    return String(
      modifier?.displayText || modifier?.name || "Option"
    ).trim();
  };

  const getModifierSelectionHelpText = (group?: ModifierGroup | null) => {
    const { minSelect, maxSelect, isRequired } = getGroupValidation(
      group as ModifierGroup
    );

    if (maxSelect === 1) {
      return isRequired || minSelect > 0
        ? t("requiredAddon")
        : t("optionalSelectOne");
    }

    if (maxSelect) {
      return minSelect > 0
        ? `Select ${minSelect}-${maxSelect} add-ons`
        : `Select up to ${maxSelect} add-ons`;
    }

    if (minSelect > 0) {
      return `Select at least ${minSelect} add-on${minSelect === 1 ? "" : "s"}`;
    }

    return t("optionalAddons");
  };

  const getModifierSelectionLimitText = (group?: ModifierGroup | null) => {
    const { minSelect, maxSelect } = getGroupValidation(group as ModifierGroup);

    if (minSelect > 0 && maxSelect) {
      return `Min ${minSelect} · Max ${maxSelect}`;
    }

    if (minSelect > 0) {
      return `Min ${minSelect}`;
    }

    if (maxSelect) {
      return `Max ${maxSelect}`;
    }

    return "";
  };

  const getMenuItemResolvedPrice = (
    menuItem: MenuItem | null,
    variation?: MenuVariation | null
  ) => {
    if (!menuItem) return 0;

    if (variation?.id) {
      if (checkoutType === "pickup") {
        const pickupPrice = getVariationPickupPrice(menuItem, variation);

        if (pickupPrice && pickupPrice > 0) {
          return pickupPrice;
        }
      }

      return toNumber(variation.price, 0);
    }

    const basePrice = getMenuItemBasePrice(menuItem);

    if (checkoutType === "pickup") {
      const adjustment = toNumber(menuItem?.takeawayPriceAdjustment, 0);
      return Math.max(0, basePrice + adjustment);
    }

    const adjustment = toNumber(menuItem?.deliveryPriceAdjustment, 0);
    return Math.max(0, basePrice + adjustment);
  };

  const itemVariations = useMemo(() => getItemVariations(item), [item]);

  const splitPizzaDefaultVariation = useMemo(
    () => getDefaultVariation(splitPizzaItem),
    [splitPizzaItem]
  );

  const filteredModifierLinks = useMemo(() => {
    return getVisibleModifierLinks(item, selectedVariation);
  }, [item, selectedVariation]);

  const filteredModifierGroups = useMemo(
    () => filteredModifierLinks.map((link) => link.modifierGroup),
    [filteredModifierLinks]
  );

  const itemSupportsSplitPizza = Boolean(item?.supportsSplitPizza);

  const itemQuantityLimits = getProductDetailsQuantityLimits(item);

  const resolvedItemPrice = getMenuItemResolvedPrice(item, selectedVariation);

  const selectedItemPromotionPricing = getPromotionPricing({
    source: getPromotionSourceForPrice(item, selectedVariation),
    originalPrice: resolvedItemPrice,
  });

  const splitPizzaResolvedItemPrice = getMenuItemResolvedPrice(
    splitPizzaItem,
    splitPizzaDefaultVariation
  );

  const splitPizzaPromotionPricing = getPromotionPricing({
    source: getPromotionSourceForPrice(splitPizzaItem, splitPizzaDefaultVariation),
    originalPrice: splitPizzaResolvedItemPrice,
  });

  const depositAmount = getDepositAmount(item);

  const getModifiersTotal = (
    selectionMap: ModifierSelectionMap,
    menuItem: MenuItem | null,
    variation?: MenuVariation | null
  ) => {
    return Object.values(selectionMap)
      .flat()
      .reduce((acc, modifier) => {
        const price = getModifierEffectivePrice(modifier, menuItem, variation);

        return acc + price;
      }, 0);
  };

  const modifiersTotal = getModifiersTotal(
    selectedModifiers,
    item,
    selectedVariation
  );

  const splitPizzaBasePrice =
    splitPizzaEnabled && splitPizzaItem
      ? Math.max(resolvedItemPrice, splitPizzaResolvedItemPrice)
      : resolvedItemPrice;

  const splitPizzaDisplayBasePrice =
    splitPizzaEnabled && splitPizzaItem
      ? Math.max(
          selectedItemPromotionPricing.finalPrice,
          splitPizzaPromotionPricing.finalPrice
        )
      : selectedItemPromotionPricing.finalPrice;

  const totalPrice = (splitPizzaBasePrice + modifiersTotal + depositAmount) * qty;
  const displayTotalPrice =
    (splitPizzaDisplayBasePrice + modifiersTotal + depositAmount) * qty;
  const hasTotalPromotionDiscount = displayTotalPrice < totalPrice;
  const totalPromotionDiscount = Math.max(0, totalPrice - displayTotalPrice);
  const activeVisiblePromotion =
    selectedItemPromotionPricing.promotion || splitPizzaPromotionPricing.promotion;

  useEffect(() => {
    let isMounted = true;

    const fetchItem = async () => {
      const searchValue = slug || itemIdParam;

      if (!searchValue) {
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

        const { response: res, items } = await fetchMenuItems(
          `/v1/menu/items?search=${encodeURIComponent(searchValue)}`
        );

        if (!isMounted) return;

        if (!res || res?.error) {
          toast.error(res?.error || t("failedFetchItem"));
          setItem(null);
          return;
        }

        const matchedItem =
          items.find(
            (menuItem: MenuItem) =>
              itemIdParam && String(menuItem?.id || "") === String(itemIdParam)
          ) ||
          items.find(
            (menuItem: MenuItem) =>
              slug && String(menuItem?.slug || "") === String(slug)
          ) ||
          items[0];

        if (!matchedItem) {
          setItem(null);
          return;
        }

        setItem(matchedItem);
        setSelectedVariation(getDefaultVariation(matchedItem));
        setSelectedModifiers({});
        setQty(getProductDetailsQuantityLimits(matchedItem).minQuantity);
        setInstructions("");
        setSplitPizzaEnabled(false);
        setSplitPizzaItem(null);
      } catch (error) {
        if (!isMounted) return;
        toast.error(t("failedFetchItem"));
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
  }, [slug, itemIdParam, token, fetchMenuItems]);

  useEffect(() => {
    const fetchCartItemToEdit = async () => {
      if (!cartItemId || !customerId || !token) return;

      const found = await fetchCustomerCartItem({ customerId, cartItemId });

      if (!found) return;

      setCartItemToEdit(found);
      setQty(Math.max(1, toNumber(found?.quantity, 1)));
      setInstructions(typeof found?.note === "string" ? found.note : "");
    };

    fetchCartItemToEdit();
  }, [cartItemId, customerId, token, fetchCustomerCartItem]);

  useEffect(() => {
    if (!cartItemToEdit || !item || editPrefilledRef.current) return;

    const variation =
      itemVariations.find((entry) => {
        return String(entry?.id || "") === String(cartItemToEdit?.variationId || "");
      }) || getDefaultVariation(item);

    setSelectedVariation(variation);

    const groupedModifierRecords = normalizeArray<ApiRecord>(cartItemToEdit?.modifierSelections)
      .flatMap((selection) => {
        const modifierGroupId = String(selection?.modifierGroupId || "");

        return normalizeArray<ApiRecord>(selection?.modifiers).map((modifier) => ({
          ...modifier,
          modifierGroupId,
        }));
      });
    const selectedModifierRecords = normalizeArray<ApiRecord>(
      groupedModifierRecords.length
        ? groupedModifierRecords
        : normalizeArray(cartItemToEdit?.selectedModifiers).length
        ? cartItemToEdit.selectedModifiers
        : cartItemToEdit?.modifiers
    );

    const visibleLinks = getVisibleModifierLinks(item, variation);
    const nextModifiers: ModifierSelectionMap = {};

    selectedModifierRecords.forEach((selectedRecord: ApiRecord) => {
      const modifierId = String(
        selectedRecord?.modifierId || selectedRecord?.id || ""
      );

      if (!modifierId) return;

      for (const link of visibleLinks) {
        const group = link?.modifierGroup;
        const groupId = String(group?.id || "");

        if (selectedRecord?.modifierGroupId && String(selectedRecord.modifierGroupId) !== groupId) {
          continue;
        }
        const modifier = normalizeArray<Modifier>(group?.modifiers).find((entry) => {
          return String(entry?.id || "") === modifierId;
        });

        if (!modifier || !groupId) continue;

        nextModifiers[groupId] = [
          ...(nextModifiers[groupId] || []),
          {
            ...modifier,
            id: modifierId,
          name: String(selectedRecord?.name ?? modifier?.name ?? t("modifierFallback")),
            selectedQuantity: Math.max(1, toNumber(selectedRecord?.quantity, 1)),
          },
        ];

        break;
      }
    });

    setSelectedModifiers(nextModifiers);

    const selectedSections = normalizeArray<ApiRecord>(
      normalizeArray(cartItemToEdit?.selectedSections).length
        ? cartItemToEdit.selectedSections
        : cartItemToEdit?.sections
    );

    if (selectedSections.length > 0) {
      const rightSection =
        selectedSections.find((section: ApiRecord) => {
          return String(section?.slot || "").toUpperCase() === "RIGHT";
        }) ||
        selectedSections.find((section: ApiRecord) => {
          return String(section?.menuItemId || "") !== String(item?.id || "");
        });

      if (rightSection?.menuItemId) {
        setSplitPizzaEnabled(true);
        setSplitPizzaItem({
          id: getId(rightSection.menuItemId),
          name: String(rightSection.menuItemName ?? t("selectedSecondHalf")),
          basePrice: typeof rightSection.unitPrice === "string" || typeof rightSection.unitPrice === "number" ? rightSection.unitPrice : undefined,
          price: typeof rightSection.unitPrice === "string" || typeof rightSection.unitPrice === "number" ? rightSection.unitPrice : undefined,
          unitPrice: typeof rightSection.unitPrice === "string" || typeof rightSection.unitPrice === "number" ? rightSection.unitPrice : undefined,
        });
      }
    }

    editPrefilledRef.current = true;
  }, [cartItemToEdit, item, itemVariations]);

  useEffect(() => {
    if (itemSupportsSplitPizza) return;

    setSplitPizzaEnabled(false);
    setSplitPizzaItem(null);
  }, [itemSupportsSplitPizza]);

  useEffect(() => {
    if (!item) return;

    setQty((prev) => clampQuantity(prev, getProductDetailsQuantityLimits(item)));
  }, [item?.id, item?.minQuantity, item?.maxQuantity]);

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
              selectedQuantity: 1,
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
    const { minSelect, maxSelect, isRequired, selectionType } = getGroupValidation(group);

    setModifierErrors((prev) => {
      const next = { ...prev };
      delete next[groupId];
      return next;
    });

    setSelectedModifiers((prev) => {
      const current = prev[groupId] || [];
      const alreadySelected = current.some(
        (selected) => selected.id === modifier.id
      );

      if (selectionType === "SINGLE" || maxSelect === 1) {
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
            t("minimumAddons", { itemName: item?.name || t("thisItem"), count: minSelect })
          );
          return prev;
        }

        const remaining = current.filter(
          (selected) => selected.id !== modifier.id
        );
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
          t("maximumAddons", { itemName: item?.name || t("thisItem"), count: maxSelect })
        );
        return prev;
      }

      return {
        ...prev,
        [groupId]: [...current, { ...modifier, selectedQuantity: 1 }],
      };
    });
  };

  const handleItemQuantityChange = (nextQuantity: number) => {
    const limits = getProductDetailsQuantityLimits(item);
    const clamped = clampQuantity(nextQuantity, limits);

    if (
      limits.maxQuantity &&
      nextQuantity > limits.maxQuantity &&
      qty === limits.maxQuantity
    ) {
      toast.error(`You can add up to ${limits.maxQuantity} item(s)`);
      return;
    }

    setQty(clamped);
  };

  const validateSelections = (
    groups: ModifierGroup[],
    selectionMap: ModifierSelectionMap
  ) => {
    const validation = validateModifierSelections(groups, selectionMap);

    if (!validation.isValid) {
      setModifierErrors(validation.errors);
      toast.error(Object.values(validation.errors)[0] || t("minimumAddons", { itemName: item?.name || t("thisItem"), count: 1 }));
      return false;
    }

    setModifierErrors({});
    return true;
  };

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

    const { response, items } = await fetchMenuItems(`/v1/menu/items?${queryParams.toString()}`);
    const resData = typeof response?.data === "object" && response.data !== null && !Array.isArray(response.data) ? response.data as ApiRecord : null;

    return {
      data: items,
      meta: resData?.meta ?? response?.meta,
    };
  };

  const handleSplitPizzaToggle = (checked: boolean) => {
    setSplitPizzaEnabled(checked);

    if (!checked) {
      setSplitPizzaItem(null);
    }
  };

  const handleSplitPizzaItemChange = (selectedItem: MenuItem | null) => {
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
    menuItem: MenuItem | null;
    variation?: MenuVariation | null;
    scope: "main" | "split";
  }) => {
    return links.map((link) => {
      const group = link.modifierGroup;
      const groupId = String(group?.id || "");
      const selectedInGroup = selectionMap[groupId] || [];
      const { maxSelect, isRequired, selectionType } = getGroupValidation(group);

      const groupModifiers = Array.isArray(group?.modifiers)
        ? group.modifiers.filter((modifier) => modifier?.isActive !== false)
        : [];

      if (!groupModifiers.length) return null;

      const selectionHelp = getModifierSelectionHelpText(group);
      const selectionLimit = getModifierSelectionLimitText(group);

      return (
        <div
          key={`${scope}-${String(link?.variationId || "common")}-${groupId}`}
          className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-gray-900">{group?.name || t("addons")}</p>
                {isRequired ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    Required
                  </span>
                ) : null}
              </div>

              <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                {selectionHelp}
              </p>

              {selectionLimit ? (
                <span className="mt-2 inline-flex rounded-full bg-primary/5 px-2.5 py-1 text-[11px] font-semibold text-primary ring-1 ring-primary/10">
                  {selectionLimit}
                </span>
              ) : null}

              {modifierErrors[groupId] ? (
                <p className="mt-2 text-xs font-medium text-red-600">
                  {modifierErrors[groupId]}
                </p>
              ) : null}
            </div>

            <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
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

              const inputType = selectionType === "SINGLE" || maxSelect === 1 ? "radio" : "checkbox";
              const disableBecauseMaxReached =
                maxSelect !== 1 &&
                !checked &&
                !!maxSelect &&
                selectedInGroup.length >= maxSelect;

              const modifierDisplayName = getModifierDisplayName(modifier);

              return (
                <div
                  key={`${modifier.id}-${String(variation?.id || "base")}`}
                  className={`rounded-xl border px-3 py-3 text-sm transition ${
                    disableBecauseMaxReached
                      ? "border-gray-100 bg-gray-100 opacity-70"
                      : checked
                      ? "border-primary/20 bg-primary/5 ring-1 ring-primary/10"
                      : "border-gray-100 bg-gray-50 hover:border-primary/20 hover:bg-white"
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
                        <span className="block truncate font-medium text-gray-900">
                          {modifierDisplayName}
                        </span>

                        {modifier.displayText &&
                        modifier.displayText !== modifier.name ? (
                          <span className="mt-0.5 block text-[11px] font-medium text-primary">
                            {modifier.name}
                          </span>
                        ) : null}

                        {modifier.description ? (
                          <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">
                            {modifier.description}
                          </span>
                        ) : null}
                      </span>
                    </label>

                    {effectivePrice > 0 ? (
                      <span className="shrink-0 text-right font-medium text-primary">
                        +{formatMoney(effectivePrice)}
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

  const isDealMenuItemContext = Boolean(
    dealIdContext &&
      (dealContext === "chooser" ||
        item?.supportsDealIdCartPayload === true ||
        item?.supportsDealCartPayload === true ||
        item?.isDealMenuItem === true)
  );
  const isUnsupportedDealCustomization =
    isDealMenuItemContext &&
    (hasUnsupportedDealMenuItemCustomization(item) || splitPizzaEnabled);

  const buildCreateCartPayload = () => buildCartPayload({
    item,
    branchId,
    selectedVariation,
    qty,
    selectedModifiers,
    modifierGroups: filteredModifierGroups,
    instructions,
    splitPizzaEnabled,
    splitPizzaItem,
    includeMenuItem: true,
    includeBranch: true,
    clearSectionsWhenEmpty: false,
    dealId: dealIdContext,
    shouldSendDealId: isDealMenuItemContext,
    isDealMenuItemContext,
  });

  const buildPatchCartPayload = () => buildCartPayload({
    item,
    selectedVariation,
    qty,
    selectedModifiers,
    modifierGroups: filteredModifierGroups,
    instructions,
    splitPizzaEnabled,
    splitPizzaItem,
    includeMenuItem: false,
    includeBranch: false,
    clearSectionsWhenEmpty: true,
    dealId: dealIdContext,
    shouldSendDealId: isDealMenuItemContext,
    isDealMenuItemContext,
  });

  const clearCartAndRetryAdd = async () => {
    if (!customerId) {
      toast.error(t("customerNotFound"));
      return null;
    }

    const clearRes = await clearCustomerCart({ customerId });

    if (!clearRes || clearRes?.error) {
      toast.error(
        getApiErrorMessage(
          clearRes,
          t("failedClearBranchCart")
        )
      );
      return null;
    }

    return addCustomerCartItem({
      customerId,
      payload: buildCreateCartPayload(),
    });
  };

  const handleAddToCart = async () => {
    try {
      setLoading(true);

      if (!item?.id) {
        toast.error(t("itemNotFound"));
        return;
      }

      if (isUnsupportedDealCustomization) {
        toast.error(t("unsupportedDealCustomization"));
        return;
      }

      if (!validateSelections(filteredModifierGroups, selectedModifiers)) {
        return;
      }

      if (splitPizzaEnabled && !splitPizzaItem?.id) {
        toast.error(t("selectOtherPizzaHalf"));
        return;
      }

      const groupCode = getStoredGroupOrderCode();

      let res: ApiRecord | null = null;

      if (groupCode) {
        const { response: groupOrdersRes, groupOrders } = await fetchGroupOrders();

        if (!groupOrdersRes || groupOrdersRes.error) {
          toast.error(t("failedFetchGroupOrder"));
          return;
        }

        const groupOrder = groupOrders.find(
          (order: ApiRecord) => order?.inviteCode === groupCode
        );

        if (!groupOrder) {
          toast.error(t("invalidGroupOrder"));
          return;
        }

        const groupPayload = buildPatchCartPayload();
        groupPayload.menuItemId = item.id;

        res = await addGroupOrderItem({
          groupOrderId: String(groupOrder.id),
          payload: groupPayload,
        });
      } else {
        if (!customerId) {
          toast.error(t("customerNotFound"));
          return;
        }

        if (!branchId && !isEditingCartItem) {
          toast.error(t("selectBranchFirst"));
          return;
        }

        if (isEditingCartItem) {
          res = await updateCustomerCartItem({
            cartItemId,
            payload: buildPatchCartPayload(),
          });
        } else {
          res = await addCustomerCartItem({
            customerId,
            payload: buildCreateCartPayload(),
          });
        }
      }

      if (
        !groupCode &&
        !isEditingCartItem &&
        isCartBranchConflict(res)
      ) {
        toast.info(t("clearingPreviousBranchCart"));
        res = await clearCartAndRetryAdd();
      }

      if (!res || res?.error) {
        toast.error(getApiErrorMessage(res, t("failedSaveItem")));
        return;
      }

      toast.success(
        isEditingCartItem
          ? t("cartItemUpdated")
          : groupCode
          ? t("addedToGroupOrder")
          : t("addedToCart")
      );

      if (groupCode) {
        router.push("/group-order/lobby");
      } else {
        router.push(`/checkout?type=${checkoutType}`);
      }
    } catch (error) {
      toast.error(tErrors("somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading || (!!(slug || itemIdParam) && !token)) {
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
          <h2 className="text-xl font-semibold text-gray-900">
            {t("itemNotFound")}
          </h2>
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
              alt={item?.name || t("productImageAlt")}
              width={600}
              height={600}
              className="h-[250px] w-full object-cover sm:h-[350px] md:h-auto"
              unoptimized
            />
          </div>

          <div className="text-xs text-gray-400">
            {item?.prepTimeMinutes ? (
              <p>Prep Time: {String(item.prepTimeMinutes)} mins</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">
              {String(item?.category?.name ?? t("bestSeller"))}
            </p>

            <div className="mt-1 flex items-start justify-between gap-3">
              <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">
                {item?.name}
              </h1>

              {hasProductInfoContent(item) ? (
                <button
                  type="button"
                  onClick={() => setInfoOpen(true)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-primary hover:text-white"
                  title={t("viewProductInformation")}
                >
                  <Eye size={18} />
                </button>
              ) : null}
            </div>

            <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-500">
              <span className="font-medium text-primary">★ 4.8</span>
              <span>(150 reviews)</span>
              <span>• 20–25 mins delivery</span>
            </div>
          </div>

          <p className="text-sm text-gray-600">{item?.description}</p>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-2xl font-bold text-primary">
                {hasTotalPromotionDiscount ? (
                  <PromotionPrice
                    pricing={{
                      promotion: activeVisiblePromotion,
                      originalPrice: totalPrice,
                      finalPrice: displayTotalPrice,
                      discountAmount: totalPromotionDiscount,
                      hasPromotion: true,
                      hasDiscount: true,
                    }}
                    originalClassName="text-base font-semibold"
                  />
                ) : (
                  formatMoney(totalPrice)
                )}
              </div>

              {activeVisiblePromotion ? (
                <PromotionBadge promotion={activeVisiblePromotion} />
              ) : null}
            </div>

            {activeVisiblePromotion ? (
              <div className="mt-2 rounded-xl bg-green-50 px-3 py-2">
                <p className="text-xs font-semibold text-green-700">
                  {getPromotionTitle(activeVisiblePromotion)}
                </p>

                {activeVisiblePromotion.description ? (
                  <p className="mt-0.5 line-clamp-2 text-xs text-green-700/80">
                    {activeVisiblePromotion.description}
                  </p>
                ) : null}

                {hasTotalPromotionDiscount ? (
                  <p className="mt-1 text-xs text-green-700">
                    You save {formatMoney(totalPromotionDiscount)}
                  </p>
                ) : null}
              </div>
            ) : null}

            {checkoutType === "pickup" ? (
              <p className="mt-2 text-xs font-medium text-primary">
                Pickup pricing applied
              </p>
            ) : null}

            {depositAmount > 0 ? (
              <p className="mt-1 text-xs text-amber-600">
                Includes deposit {formatMoney(depositAmount)} per item
              </p>
            ) : null}
          </div>

          {itemVariations.length > 0 ? (
            <div>
              <p className="mb-2 font-medium">{t("size")}</p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {itemVariations.map((variation) => {
                  const deliveryPrice = toNumber(variation.price, 0);
                  const pickupPrice = getVariationPickupPrice(item, variation);
                  const shownPrice =
                    checkoutType === "pickup" && pickupPrice && pickupPrice > 0
                      ? pickupPrice
                      : deliveryPrice;

                  const variationPromotionPricing = getPromotionPricing({
                    source: getPromotionSourceForPrice(item, variation),
                    originalPrice: shownPrice,
                  });

                  return (
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

                            {checkoutType === "pickup" &&
                            pickupPrice &&
                            pickupPrice > 0 ? (
                              <p className="mt-1 text-xs text-primary">
                                Pickup price
                              </p>
                            ) : null}

                            {variationPromotionPricing.hasPromotion ? (
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <PromotionBadge
                                  promotion={variationPromotionPricing.promotion}
                                />

                                {variationPromotionPricing.hasDiscount ? (
                                  <span className="text-xs font-medium text-green-700">
                                    Save {formatMoney(
                                      variationPromotionPricing.discountAmount
                                    )}
                                  </span>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="shrink-0 text-right font-medium text-primary">
                          <PromotionPrice pricing={variationPromotionPricing} />
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : null}

          {itemSupportsSplitPizza ? (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 transition">
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
                        {t("selectedSecondHalf")}
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
                            <PromotionPrice pricing={splitPizzaPromotionPricing} />

                            {splitPizzaPromotionPricing.hasPromotion ? (
                              <div className="mt-1 flex justify-end">
                                <PromotionBadge
                                  promotion={splitPizzaPromotionPricing.promotion}
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
            <p className="mb-2 font-medium">{t("specialInstructions")}</p>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={t("notesPlaceholder")}
              className="h-24 w-full rounded-xl bg-gray-100 p-3 text-sm outline-none"
            />
          </div>

          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center rounded-full bg-gray-100">
                <button
                  type="button"
                  onClick={() => handleItemQuantityChange(qty - 1)}
                  className="px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={loading || qty <= itemQuantityLimits.minQuantity}
                >
                  <Minus size={16} />
                </button>

                <span className="min-w-[42px] px-3 text-center font-semibold">
                  {qty}
                </span>

                <button
                  type="button"
                  onClick={() => handleItemQuantityChange(qty + 1)}
                  className="px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={
                    loading ||
                    Boolean(
                      itemQuantityLimits.maxQuantity &&
                        qty >= itemQuantityLimits.maxQuantity
                    )
                  }
                >
                  <Plus size={16} />
                </button>
              </div>

              {(itemQuantityLimits.minQuantity > 1 ||
                itemQuantityLimits.maxQuantity) ? (
                <p className="mt-1 text-center text-[11px] text-gray-400">
                  Min {itemQuantityLimits.minQuantity}
                  {itemQuantityLimits.maxQuantity
                    ? ` · Max ${itemQuantityLimits.maxQuantity}`
                    : ""}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3 text-white disabled:opacity-70"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading
                ? isEditingCartItem
                  ? t("updating")
                  : t("processing")
                : `${isEditingCartItem ? t("updateCart") : t("addToCart")} | ${formatMoney(displayTotalPrice)}`}
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
                  {t("viewProductInformation")}
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

      <TestimonialsSection />
    </>
  );
}

export function ProductDetailsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ProductDetailsPageContent />
    </Suspense>
  );
}
