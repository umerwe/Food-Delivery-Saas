"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Plus,
  Minus,
  Info,
  TicketPercent,
  Trash2,
  Pencil,
  Layers2,
  BadgeDollarSign,
  AlertTriangle,
  Loader2,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  getDisplayTotalAmount,
  getServiceChargeLabel,
  getTipAdjustedDisplayTotalAmount,
  shouldShowPositiveAmountLine,
} from "@/components/pages/Checkout/utils/checkout-formatters";
import {
  getAppliedPromotionDiscountLine,
  getCartItemLineTotal,
  type ApiRecord,
  type BackendErrorState,
} from "@/components/pages/Checkout/utils/checkout-normalizers";
import { useTranslations } from "next-intl";
import type { LoyaltySummary } from "@/services/loyalty";
import type { CartChargeBreakdown } from "@/types/cart";

interface CartAddon {
  id?: string;
  modifierId?: string;
  name?: string;
  quantity?: number | string;
  unitPrice?: number | string;
  price?: number | string;
  priceDelta?: number | string | null;
  total?: number | string;
}

interface CartSection {
  slot?: string;
  menuItemId?: string | number;
  menuItemName?: string;
  unitPrice?: number | string;
  price?: number | string;
  pickupPrice?: number | string;
  pickupUnitPrice?: number | string;
  selectedVariation?: ApiRecord | null;
  menuItem?: ApiRecord & { selectedVariation?: ApiRecord; pickupPrice?: number | string; unitPrice?: number | string; name?: string; slug?: string; imageUrl?: string; category?: ApiRecord; variationPriceOverrides?: unknown[]; variations?: unknown[]; depositAmount?: number | string; takeawayPriceAdjustment?: number | string; deliveryPriceAdjustment?: number | string; pricing?: ApiRecord };
  name?: string;
}

type CartSectionRecord = ApiRecord & {
  slot?: string;
  menuItemId?: string | number;
  menuItemName?: string;
  unitPrice?: number | string;
  price?: number | string;
  pickupPrice?: number | string;
  pickupUnitPrice?: number | string;
  selectedVariation?: ApiRecord | null;
  menuItem?: ApiRecord & { selectedVariation?: ApiRecord; unitPrice?: number | string; pickupPrice?: number | string; name?: string };
  name?: string;
};

export interface CartItem {
  id?: string | number;
  type?: string;
  menuItemId?: string | number;
  cartItemIds?: string[];
  menuItemIds?: string[];
  name: string;
  slug?: string;
  price: number;
  unitPrice?: number;
  itemUnitPrice?: number;
  unitPriceWithModifiers?: number;
  modifiersTotal?: number;
  lineTotal?: number;
  desc?: string;
  quantity: number;
  img?: string;
  selectedVariationName?: string;
  selectedVariation?: ApiRecord | null;
  selectedModifiers?: CartAddon[];
  note?: string;

  menuItem?: ApiRecord & { selectedVariation?: ApiRecord; pickupPrice?: number | string; unitPrice?: number | string; name?: string; slug?: string; imageUrl?: string; category?: ApiRecord; variationPriceOverrides?: unknown[]; variations?: unknown[]; depositAmount?: number | string; takeawayPriceAdjustment?: number | string; deliveryPriceAdjustment?: number | string };
  variationId?: string | number;
  selectedSections?: CartSection[];
  sections?: CartSection[];

  depositAmount?: unknown;
  depositTotal?: unknown;
  pickupPrice?: unknown;
  pickupUnitPrice?: unknown;
  takeawayPriceAdjustment?: unknown;
  deliveryPriceAdjustment?: unknown;
  dealId?: string | null;
  deal?: ApiRecord & {
    id?: string;
    code?: string;
    title?: string;
    description?: string;
    imageUrl?: string;
    fixedPrice?: number | string;
  };
  includedItems?: Array<{
    type?: string;
    id?: string | number;
    menuItemId?: string | number;
    name?: string;
    quantity?: number | string;
    menuItem?: ApiRecord & { name?: string };
  }>;
}

interface CartQuote {
  subtotal?: number | string;
  taxAmount?: number | string;
  deliveryFee?: number | string;
  serviceChargeType?: string | null;
  serviceChargeValue?: number | string | null;
  serviceChargeAmount?: number | string;
  tipAmount?: number | string;
  discountAmount?: number | string;
  couponCode?: string;
  walletAppliedAmount?: number | string;
  loyaltyDiscountAmount?: number | string;
  loyaltyPointsRedeemed?: number | string;
  totalAmount?: number | string;
  payableAmount?: number | string;
  chargeBreakdown?: CartChargeBreakdown;
  appliedPromotion?: {
    id?: string;
    title?: string;
    applyMode?: string;
    autoApply?: boolean;
    discountType?: string;
    discountValue?: number;
    discountAmount?: number;
  } | null;
}

interface Props {
  title?: string;
  cartItems: CartItem[];
  quote?: CartQuote | null;
  cartQuote?: CartQuote | null;
  updateQuantity: (id: string, type: "inc" | "dec") => void;
  deleteItem: (id: string) => void;
  clearCart: () => void;
  backendError?: BackendErrorState | null;
  checkoutType: CheckoutType;
  onPlaceOrder: () => void;
  placingOrder?: boolean;
  couponCode?: string;
  setCouponCode?: (val: string) => void;
  onApplyCoupon?: () => void;
  onRemoveCoupon?: () => void;
  couponDiscount?: number;
  validatingCoupon?: boolean;
  removingCoupon?: boolean;
  loadingCart?: boolean;
  appliedTipAmount?: number;
  onApplyTip?: (amount: number) => Promise<void> | void;
  applyingTip?: boolean;
  loyalty?: LoyaltySummary | null;
  loyaltyPoints?: string;
  setLoyaltyPoints?: (value: string) => void;
  loadingLoyalty?: boolean;
  isGuest?: boolean;
}

export type CheckoutType = "delivery" | "pickup";

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toNullableNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const hasText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text !== "" && text.toLowerCase() !== "null";
};

const normalizeArray = <T = unknown,>(value: unknown): T[] => {
  if (!value) return [];
  return Array.isArray(value) ? (value as T[]) : [];
};

export const formatCurrency = (value: unknown) => {
  return `$${toNumber(value, 0).toFixed(2)}`;
};

const slugify = (value: string) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const getSelectedAddons = (item: CartItem) => {
  return Array.isArray(item.selectedModifiers)
    ? item.selectedModifiers.filter((addon) => {
        return Boolean(addon?.modifierId || addon?.id || addon?.name);
      })
    : [];
};

export const getAddonQuantity = (addon: CartAddon) => {
  return Math.max(1, toNumber(addon.quantity, 1));
};

const getAddonUnitPrice = (addon: CartAddon) => {
  return toNumber(addon.unitPrice ?? addon.price ?? addon.priceDelta, 0);
};

export const getAddonTotal = (addon: CartAddon) => {
  const quantity = getAddonQuantity(addon);
  const unitPrice = getAddonUnitPrice(addon);

  return toNumber(addon.total, unitPrice * quantity);
};

const getMenuItem = (item: CartItem): ApiRecord => {
  return item?.menuItem || {};
};

const getMenuItemId = (item: CartItem) => {
  return (
    item?.menuItemId ||
    item?.menuItem?.id ||
    item?.selectedSections?.[0]?.menuItemId ||
    ""
  );
};

const getItemSlug = (item: CartItem) => {
  return item?.slug || item?.menuItem?.slug || slugify(item?.name || "");
};

export const getItemImage = (item: CartItem) => {
  return item.img || item?.deal?.imageUrl || item?.menuItem?.imageUrl || "/placeholder.png";
};

export const isDealCartItem = (item: CartItem) =>
  String(item.type || "").toUpperCase() === "DEAL";

export const getSelectedVariationName = (item: CartItem) => {
  return (
    item.selectedVariationName ||
    item?.selectedVariation?.displayText ||
    item?.selectedVariation?.name ||
    item?.menuItem?.selectedVariation?.displayText ||
    item?.menuItem?.selectedVariation?.name ||
    ""
  );
};

const getVariationId = (item: CartItem) => {
  return (
    item?.variationId ||
    item?.selectedVariation?.id ||
    String(item?.menuItem?.selectedVariation?.id ?? "") ||
    ""
  );
};

const findSelectedVariationOverride = (item: CartItem): CartSectionRecord | null => {
  const variationId = getVariationId(item);
  const menuItem = getMenuItem(item);

  if (!variationId) return null;

  const overrides = normalizeArray<ApiRecord>(menuItem?.variationPriceOverrides);

  return (
    overrides.find((override: ApiRecord) => {
      const variation = typeof override?.variation === "object" && override.variation !== null ? override.variation as ApiRecord : null;

      return String(override?.variationId || variation?.id || "") ===
        String(variationId);
    }) || null
  );
};

const findSelectedVariation = (item: CartItem): CartSectionRecord | null => {
  const variationId = getVariationId(item);
  const menuItem = getMenuItem(item);

  if (!variationId) return null;

  const variations = [
    ...normalizeArray<ApiRecord>(menuItem?.variations),
    ...normalizeArray<ApiRecord>(typeof menuItem?.category === "object" && menuItem.category !== null && "variations" in menuItem.category ? menuItem.category.variations : undefined),
  ];

  return (
    variations.find((variation: ApiRecord) => {
      return String(variation?.id || "") === String(variationId);
    }) || null
  );
};

const getBaseUnitPrice = (item: CartItem, checkoutType: CheckoutType) => {
  const selectedSections = getSelectedSections(item);

  if (selectedSections.length > 0) {
    const highestSectionPrice = Math.max(
      ...selectedSections.map((section) =>
        getSplitSectionCheckoutPrice(section, checkoutType)
      ),
      0
    );

    if (highestSectionPrice > 0) {
      return highestSectionPrice;
    }
  }

  return toNumber(
    item.itemUnitPrice ??
      item.unitPrice ??
      item.menuItem?.unitPrice ??
      item.price,
    0
  );
};

const getDepositUnitAmount = (item: CartItem) => {
  return toNumber(item.depositAmount ?? item.menuItem?.depositAmount, 0);
};

const getSelectedSections = (item: CartItem): CartSection[] => {
  const sections = normalizeArray<CartSectionRecord>(item.selectedSections).length
    ? normalizeArray<CartSectionRecord>(item.selectedSections)
    : normalizeArray<CartSectionRecord>(item.sections);

  return sections
    .map((section: CartSectionRecord) => ({
      slot: String(section?.slot || "").toUpperCase(),
      menuItemId: section?.menuItemId,
      menuItemName:
        section?.menuItemName ||
        section?.menuItem?.name ||
        section?.name ||
        "",
      unitPrice:
        section?.unitPrice ??
        section?.price ??
        (toNumber(section?.selectedVariation?.price, 0) ||
          toNumber(section?.menuItem?.selectedVariation?.price, 0) ||
          toNumber(section?.menuItem?.unitPrice, 0) ||
          0),
      price:
        section?.price ??
        section?.unitPrice ??
        (toNumber(section?.selectedVariation?.price, 0) ||
          toNumber(section?.menuItem?.selectedVariation?.price, 0) ||
          toNumber(section?.menuItem?.unitPrice, 0) ||
          0),
      pickupPrice:
        section?.pickupPrice ??
        section?.pickupUnitPrice ??
        (toNumber(section?.selectedVariation?.pickupPrice, 0) ||
          toNumber(section?.menuItem?.selectedVariation?.pickupPrice, 0) ||
          section?.menuItem?.pickupPrice),
      pickupUnitPrice:
        section?.pickupUnitPrice ??
        section?.pickupPrice ??
        (toNumber(section?.selectedVariation?.pickupPrice, 0) ||
          toNumber(section?.menuItem?.selectedVariation?.pickupPrice, 0) ||
          section?.menuItem?.pickupPrice),
      selectedVariation: section?.selectedVariation,
      menuItem: section?.menuItem,
      name: section?.name,
    }))
    .filter((section) => section?.slot || section?.menuItemId);
};

const getSplitSectionDeliveryPrice = (section?: CartSection) => {
  return toNumber(section?.unitPrice ?? section?.price, 0);
};

const getSplitSectionPickupPrice = (section?: CartSection) => {
  const candidates = [
    section?.pickupUnitPrice,
    section?.pickupPrice,
    section?.selectedVariation?.pickupPrice,
    section?.menuItem?.selectedVariation?.pickupPrice,
    section?.menuItem?.pickupPrice,
  ];

  for (const candidate of candidates) {
    const numeric = toNumber(candidate, 0);

    if (numeric > 0) return numeric;
  }

  return null;
};

const isPickupPricingModeEnabled = (section?: CartSection) => {
  const candidateMode = String(
    section?.menuItem?.pricingMode ??
      section?.menuItem?.pricing?.mode ??
      ""
  ).trim();

  return candidateMode.toUpperCase() === "MULTIPLE";
};

const getSplitSectionCheckoutPrice = (
  section: CartSection,
  checkoutType: CheckoutType
) => {
  const deliveryPrice = getSplitSectionDeliveryPrice(section);
  const explicitPickupPrice = getSplitSectionPickupPrice(section);
  const hasMultiplePricing = isPickupPricingModeEnabled(section);
  const deliveryAdjustment = toNumber(section.menuItem?.deliveryPriceAdjustment ?? 0);
  const pickupAdjustment = toNumber(section.menuItem?.takeawayPriceAdjustment ?? 0);

  if (checkoutType === "delivery") {
    if (hasMultiplePricing && deliveryAdjustment > 0) {
      return deliveryPrice + deliveryAdjustment;
    }

    return deliveryPrice;
  }

  if (explicitPickupPrice !== null) {
    return explicitPickupPrice;
  }

  if (hasMultiplePricing && pickupAdjustment > 0) {
    return deliveryPrice + pickupAdjustment;
  }

  return deliveryPrice;
};

type SplitLabels = {
  half: string;
  leftHalf: string;
  rightHalf: string;
  selectedItem: string;
};

const getSplitHalfLabel = (
  slot: string | undefined,
  fallback: string,
  labels: SplitLabels
) => {
  const normalizedSlot = String(slot || "").trim().toUpperCase();

  if (normalizedSlot === "LEFT") return labels.leftHalf;
  if (normalizedSlot === "RIGHT") return labels.rightHalf;

  if (!normalizedSlot) return fallback;

  return `${normalizedSlot.charAt(0)}${normalizedSlot
    .slice(1)
    .toLowerCase()} half`;
};

const getSplitSectionName = (section: CartSection | undefined, fallback: string) => {
  return (
    String(
      section?.menuItemName ||
        section?.menuItem?.name ||
        section?.name ||
        fallback
    ).trim() || fallback
  );
};

export const getSplitPizzaDisplay = (
  item: CartItem,
  selectedSections: CartSection[],
  labels: SplitLabels,
  checkoutType: CheckoutType
) => {
  const currentMenuItemId = String(getMenuItemId(item) || "");
  const currentItemName = String(item?.name || item?.menuItem?.name || "").trim();

  const normalizedSections = selectedSections.map((section, index) => {
    const sectionName = getSplitSectionName(section, labels.selectedItem);
    const sectionMenuItemId = String(section?.menuItemId || "");
    const deliveryPrice = getSplitSectionDeliveryPrice(section);
    const pickupPrice = getSplitSectionPickupPrice(section);
    const checkoutPrice = getSplitSectionCheckoutPrice(section, checkoutType);
    const isCurrentById =
      Boolean(currentMenuItemId) && sectionMenuItemId === currentMenuItemId;
    const isCurrentByName =
      Boolean(currentItemName) &&
      sectionName.toLowerCase() === currentItemName.toLowerCase();

    return {
      ...section,
      index,
      label: getSplitHalfLabel(section?.slot, `${labels.half} ${index + 1}`, labels),
      displayName: sectionName,
      price: checkoutPrice,
      deliveryPrice,
      pickupPrice,
      checkoutPrice,
      hasExplicitPickupPrice: pickupPrice !== null,
      isCurrentItem: isCurrentById || isCurrentByName,
    };
  });

  const currentSectionIndex = normalizedSections.findIndex(
    (section) => section.isCurrentItem
  );

  const otherHalfSections =
    currentSectionIndex >= 0
      ? normalizedSections.filter((section) => section.index !== currentSectionIndex)
      : normalizedSections.length > 1
        ? normalizedSections.slice(1)
        : [];

  return {
    sections: normalizedSections,
    otherHalfSections,
  };
};

export const getItemPricing = (item: CartItem, checkoutType: CheckoutType) => {
  const quantity = Math.max(1, toNumber(item.quantity, 1));
  const selectedAddons = getSelectedAddons(item);
  const selectedSections = getSelectedSections(item);

  const fallbackModifiersTotal = selectedAddons.reduce((acc, addon) => {
    return acc + getAddonTotal(addon);
  }, 0);

  const modifiersTotal = toNumber(item.modifiersTotal, fallbackModifiersTotal);

  const baseUnitPrice = getBaseUnitPrice(item, checkoutType);

  // Keep backend/cart pricing as the source of truth. Pickup price is added
  // separately below instead of replacing the item/variation unit price.
  const checkoutUnitPrice = toNumber(
    item.unitPrice ?? item.itemUnitPrice ?? item.menuItem?.unitPrice ?? item.price,
    baseUnitPrice
  );

  const unitPriceWithModifiers = toNumber(
    item.unitPriceWithModifiers,
    checkoutUnitPrice + modifiersTotal
  );

  const depositUnitAmount = getDepositUnitAmount(item);
  const depositTotal = toNumber(
    item.depositTotal,
    depositUnitAmount * quantity
  );

  const itemSubtotal = getCartItemLineTotal(item);

  return {
    quantity,
    baseUnitPrice,
    checkoutUnitPrice,
    modifiersTotal,
    unitPriceWithModifiers,
    itemSubtotal,
    depositUnitAmount,
    depositTotal,
    backendLineTotal: itemSubtotal,
    lineTotal: itemSubtotal,
    selectedAddons,
    selectedSections,
  };
};

export const getCheckoutPriceAdjustmentTotal = (
  cartItems: CartItem[],
  checkoutType: CheckoutType
) => {
  return cartItems.reduce((total, item) => {
    const quantity = Math.max(1, toNumber(item.quantity, 1));
    const adjustment =
      checkoutType === "pickup"
        ? item.takeawayPriceAdjustment ?? item.menuItem?.takeawayPriceAdjustment
        : item.deliveryPriceAdjustment ?? item.menuItem?.deliveryPriceAdjustment;

    return total + Math.max(0, toNumber(adjustment, 0)) * quantity;
  }, 0);
};

export function CartSummarySection({
  title,
  cartItems,
  quote,
  cartQuote,
  updateQuantity,
  deleteItem,
  clearCart,
  backendError,
  checkoutType,
  onPlaceOrder,
  placingOrder,
  couponCode,
  setCouponCode,
  onApplyCoupon,
  onRemoveCoupon,
  couponDiscount = 0,
  validatingCoupon,
  removingCoupon,
  loadingCart = false,
  appliedTipAmount = 0,
  onApplyTip,
  applyingTip = false,
  loyalty,
  loyaltyPoints = "",
  setLoyaltyPoints,
  loadingLoyalty = false,
  isGuest = false,
}: Props) {
  const t = useTranslations("checkout");
  const router = useRouter();
  const canEditCart = title !== "Order Details";
  const resolvedTitle = title ?? t("cartSummary");
  const splitLabels: SplitLabels = {
    half: t("half"),
    leftHalf: t("leftHalf"),
    rightHalf: t("rightHalf"),
    selectedItem: t("selectedItem"),
  };

  const handleAddMoreItems = () => {
    const params = new URLSearchParams();

    params.set("type", checkoutType);

    router.push(`/items?${params.toString()}`);
  };

  const pricingItems = cartItems.map((item) => ({
    item,
    pricing: getItemPricing(item, checkoutType),
  }));

  const itemTotal = pricingItems.reduce((acc, entry) => {
    return acc + entry.pricing.itemSubtotal;
  }, 0);

  const depositTotal = pricingItems.reduce((acc, entry) => {
    return acc + entry.pricing.depositTotal;
  }, 0);

  const resolvedQuote = quote ?? cartQuote ?? null;
  const quoteSubtotal = toNullableNumber(resolvedQuote?.subtotal);
  const quoteDeliveryFee = toNullableNumber(resolvedQuote?.deliveryFee);
  const quoteTaxAmount = toNullableNumber(resolvedQuote?.taxAmount);
  const quoteServiceChargeAmount = toNullableNumber(resolvedQuote?.serviceChargeAmount) ?? 0;
  const quoteTipAmount =
    toNullableNumber(resolvedQuote?.tipAmount) ??
    Math.max(0, toNumber(appliedTipAmount, 0));
  const quotePayableAmount = resolvedQuote ? getDisplayTotalAmount(resolvedQuote) : null;
  const [tipInput, setTipInput] = useState("");
  const loyaltyPointsValue = Math.max(0, Math.floor(toNumber(loyaltyPoints, 0)));
  const loyaltyEstimatedDiscount = loyaltyPointsValue * toNumber(loyalty?.redemptionValuePerPoint, 0);
  const loyaltyCanRedeem =
    Boolean(loyalty) &&
    loyaltyPointsValue >= toNumber(loyalty?.minimumRedeemPoints, 0) &&
    loyaltyPointsValue <= toNumber(loyalty?.availablePoints, 0);

  useEffect(() => {
    setTipInput(quoteTipAmount > 0 ? String(quoteTipAmount) : "");
  }, [quoteTipAmount]);

  const checkoutPriceAdjustment = getCheckoutPriceAdjustmentTotal(cartItems, checkoutType);
  const hasResolvedQuote = Boolean(resolvedQuote);
  const deliveryAdjustmentFee =
    checkoutType === "delivery" ? checkoutPriceAdjustment : 0;
  const deliveryFee =
    checkoutType === "delivery"
      ? hasResolvedQuote
        ? quoteDeliveryFee ?? 0
        : deliveryAdjustmentFee > 0 ? deliveryAdjustmentFee : quoteDeliveryFee ?? 0
      : 0;
  const pickupFee = checkoutType === "pickup" && !hasResolvedQuote ? checkoutPriceAdjustment : 0;
  const selectedOrderFee = checkoutType === "pickup" ? pickupFee : deliveryFee;
  const taxes = quoteTaxAmount ?? 0;
  const serviceCharge = Math.max(0, quoteServiceChargeAmount);
  const tipAmount = Math.max(0, quoteTipAmount);

  const appliedPromotion = resolvedQuote?.appliedPromotion ?? null;
  const hasAppliedPromotion = Boolean(appliedPromotion?.id || appliedPromotion?.title);
  const promotionDiscountLine = hasAppliedPromotion
    ? getAppliedPromotionDiscountLine(resolvedQuote)
    : null;
  const appliedCouponCode = hasText(resolvedQuote?.couponCode)
    ? String(resolvedQuote?.couponCode).trim()
    : "";
  const hasAppliedCoupon = Boolean(appliedCouponCode);
  const quoteDiscount = Math.max(0, toNumber(resolvedQuote?.discountAmount, 0));
  const manualCouponDiscount = Math.max(0, toNumber(couponDiscount, 0));
  const discount = quoteDiscount > 0 ? quoteDiscount : manualCouponDiscount;

  const loyaltyDiscount = Math.max(
    0,
    toNumber(resolvedQuote?.loyaltyDiscountAmount, 0)
  );

  const walletAppliedAmount = Math.max(
    0,
    toNumber(resolvedQuote?.walletAppliedAmount, 0)
  );

  const computedTotalBeforeDiscount =
    itemTotal + selectedOrderFee + taxes + serviceCharge + tipAmount;

  const totalBeforeDiscount =
    quoteSubtotal !== null
      ? quoteSubtotal + selectedOrderFee + taxes + serviceCharge + tipAmount
      : computedTotalBeforeDiscount;
  const loyaltyPreviewDiscount =
    loyaltyDiscount > 0 || !loyaltyCanRedeem
      ? 0
      : Math.min(Math.max(0, loyaltyEstimatedDiscount), totalBeforeDiscount - discount);

  const totalWithoutTip = Math.max(
    0,
    totalBeforeDiscount - tipAmount - discount - loyaltyDiscount - walletAppliedAmount
  );
  const quotedFinalTotal =
    quotePayableAmount !== null
      ? getTipAdjustedDisplayTotalAmount({
          displayTotal: quotePayableAmount,
          tipAmount,
          totalWithoutTip,
        })
      : null;

  const finalTotal =
    quotedFinalTotal !== null
      ? Math.max(0, quotedFinalTotal)
      : Math.max(
          0,
          totalBeforeDiscount - discount - loyaltyDiscount - walletAppliedAmount
        );
  const displayedFinalTotal = Math.max(0, finalTotal - loyaltyPreviewDiscount);

  const hasAnyDiscount =
    discount > 0 || loyaltyDiscount > 0 || loyaltyPreviewDiscount > 0 || walletAppliedAmount > 0;

  const handleEditItem = (item: CartItem) => {
    const menuItemId = getMenuItemId(item);
    const slug = getItemSlug(item);

    if (!menuItemId && !slug) return;

    const params = new URLSearchParams();

    if (menuItemId) params.set("itemId", String(menuItemId));
    if (slug) params.set("slug", String(slug));

    params.set("cartItemId", String(item.id));
    params.set("type", checkoutType);

    router.push(`/items/details?${params.toString()}`);
  };

  const handleApplyTip = () => {
    const nextTip = toNumber(tipInput, 0);

    if (nextTip < 0) return;

    void onApplyTip?.(nextTip);
  };

  const handleRemoveTip = () => {
    setTipInput("");
    void onApplyTip?.(0);
  };

  return (
    <div className="sticky top-10 space-y-[42.63px]">
      <section className="space-y-[20.37px]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-medium text-gray-900">{resolvedTitle}</h2>
            <p className="mt-1 text-xs capitalize text-gray-400">
              {checkoutType === "pickup"
                ? t("pickupPricingApplied")
                : t("deliveryPricingApplied")}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {canEditCart && cartItems.length > 0 ? (
              <button
                type="button"
                onClick={handleAddMoreItems}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 text-sm font-medium text-primary transition hover:border-primary/25 hover:bg-primary/10"
              >
                <Plus size={14} strokeWidth={2.5} />
                {t("addMoreItems")}
              </button>
            ) : null}

            {cartItems.length > 0 ? (
              <button
                type="button"
                onClick={clearCart}
                className="cursor-pointer text-sm text-red-500 hover:underline"
              >
                {t("clearCart")}
              </button>
            ) : null}
          </div>
        </div>

        {loadingCart ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 p-5 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Loader2 size={20} className="animate-spin" />
            </div>
            <p className="mt-3 text-sm font-medium text-gray-700">{t("loadingCart")}</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div
            className={`rounded-2xl border border-dashed p-5 text-center ${
              backendError
                ? "border-red-200 bg-red-50/80"
                : "border-gray-200 bg-gray-50/70"
            }`}
          >
            {backendError ? (
              <div className="mx-auto max-w-sm">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  <AlertTriangle size={20} />
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <p className="text-sm font-semibold text-red-900">
                    {t("backendError")}
                  </p>

                  {backendError.code ? (
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-red-700 ring-1 ring-red-100">
                      {backendError.code}
                    </span>
                  ) : null}
                </div>

                <p className="mt-1 text-sm leading-6 text-red-800">
                  <span className="font-medium">{backendError.context}:</span>{" "}
                  {backendError.message}
                </p>

                {backendError.timestamp ? (
                  <div className="mt-2 flex flex-wrap justify-center gap-2 text-[11px] text-red-700/80">
                    <span className="rounded-full bg-white/70 px-2 py-1">
                      {new Date(backendError.timestamp).toLocaleString()}
                    </span>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-700">{t("yourCartIsEmpty")}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {t("emptyCartDescription")}
                </p>
              </>
            )}

            {backendError ? (
              <button
                type="button"
                onClick={clearCart}
                className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-4 text-sm font-medium text-red-600 shadow-sm transition hover:border-red-300 hover:bg-red-50"
              >
                <Trash2 size={14} strokeWidth={2.5} />
                {t("clearCart")}
              </button>
            ) : canEditCart ? (
              <button
                type="button"
                onClick={handleAddMoreItems}
                className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-full border border-primary/15 bg-white px-4 text-sm font-medium text-primary shadow-sm transition hover:border-primary/25 hover:bg-primary/5"
              >
                <Plus size={14} strokeWidth={2.5} />
                {t("browseItems")}
              </button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-[19px]">
            {pricingItems.map(({ item, pricing }) => {
              const {
                quantity,
                checkoutUnitPrice,
                modifiersTotal,
                unitPriceWithModifiers,
                lineTotal,
                depositUnitAmount,
                depositTotal,
                selectedAddons,
                selectedSections,
              } = pricing;

              const isDealItem = isDealCartItem(item);
              const selectedVariationName = isDealItem
                ? ""
                : getSelectedVariationName(item);
              const isSplitPizza = selectedSections.length > 0;
              const splitPizzaDisplay = getSplitPizzaDisplay(
                item,
                selectedSections,
                splitLabels,
                checkoutType
              );
              const includedItems = Array.isArray(item.includedItems)
                ? item.includedItems
                : [];

              return (
                <div
                  key={item.id}
                  className="group relative rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition hover:shadow-md"
                >
                  <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition group-hover:opacity-100">
                    {!isDealItem ? (
                      <button
                        type="button"
                        onClick={() => handleEditItem(item)}
                        className="rounded-md bg-gray-100 p-1 transition hover:bg-primary/10"
                        aria-label={t("editItem", { name: item.name })}
                      >
                        <Pencil size={14} className="text-gray-700" />
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => deleteItem(String(item.id))}
                      className="rounded-md bg-red-100 p-1 transition hover:bg-red-200"
                      aria-label={t("removeItem", { name: item.name })}
                    >
                      <Trash2 size={14} className="text-red-600" />
                    </button>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-[12px]">
                      <Image
                        src={String(getItemImage(item) || "/placeholder.png")}
                        alt={item.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-[8px] pr-10">
                      <div>
                        <h4 className="text-base font-medium leading-tight text-gray-900">
                          {item.name}
                        </h4>

                        {isDealItem && item.deal?.code ? (
                          <p className="mt-1 text-xs font-medium text-primary">
                            {String(item.deal.code)}
                          </p>
                        ) : null}

                        {selectedVariationName ? (
                          <p className="mt-1 text-xs text-gray-500">
                            {t("size")}: {String(selectedVariationName)}
                          </p>
                        ) : null}

                      </div>

                      {isDealItem && includedItems.length > 0 ? (
                        <div className="rounded-[10px] border border-primary/10 bg-primary/5 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                            {t("dealIncludes")}
                          </p>

                          <div className="mt-1.5 space-y-1">
                            {includedItems.map((includedItem, index) => {
                              const includedName =
                                String(
                                  includedItem.menuItem?.name ||
                                    includedItem.name ||
                                    ""
                                ).trim() || t("includedItemFallback");
                              const includedQuantity = Math.max(
                                1,
                                toNumber(includedItem.quantity, 1)
                              );
                              const includedKey =
                                includedItem.id ||
                                includedItem.menuItemId ||
                                `${item.id}-included-${index}`;

                              return (
                                <div
                                  key={String(includedKey)}
                                  className="flex items-center justify-between gap-3 text-xs"
                                >
                                  <span className="min-w-0 truncate text-gray-700">
                                    {includedName}
                                  </span>
                                  <span className="shrink-0 font-medium text-primary">
                                    × {includedQuantity}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      {isSplitPizza ? (
                        <div className="rounded-[12px] border border-primary/10 bg-primary/5 px-3 py-2">
                          <div className="mb-2 flex items-center gap-2">
                            <Layers2 size={14} className="text-primary" />
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                              {t("splitPizza")}
                            </p>
                          </div>

                          {splitPizzaDisplay.otherHalfSections.length > 0 ? (
                            <div className="mb-2 rounded-[10px] border border-primary/15 bg-white/80 px-3 py-2">
                              <p className="text-[11px] font-medium text-gray-500">
                                {t("otherHalf")}
                              </p>

                              <div className="mt-1 space-y-1">
                                {splitPizzaDisplay.otherHalfSections.map(
                                  (section) => (
                                    <div
                                      key={`${item.id}-other-half-${
                                        section.slot || section.index
                                      }`}
                                      className="flex items-start justify-between gap-3 text-xs"
                                    >
                                      <div className="min-w-0">
                                        <p className="truncate font-semibold text-gray-900">
                                          {section.label}: {section.displayName}
                                        </p>
                                      </div>

                                      {section.checkoutPrice > 0 ? (
                                        <div className="shrink-0 text-right">
                                          <p className="font-semibold text-primary">
                                            {formatCurrency(section.checkoutPrice)}
                                          </p>
                                        </div>
                                      ) : null}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          ) : null}

                          <div className="space-y-1.5">
                            {splitPizzaDisplay.sections.map((section) => {
                              const isOtherHalf =
                                splitPizzaDisplay.otherHalfSections.some(
                                  (otherSection) =>
                                    otherSection.index === section.index
                                );

                              return (
                                <div
                                  key={`${item.id}-section-${
                                    section.slot || section.index
                                  }`}
                                  className="flex items-start justify-between gap-3 text-xs"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-gray-700">
                                      <span className="font-semibold">
                                        {section.label}:
                                      </span>{" "}
                                      {section.displayName}

                                      {isOtherHalf ? (
                                        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                                          {t("otherHalf")}
                                        </span>
                                      ) : null}
                                    </p>
                                  </div>

                                  {section.checkoutPrice > 0 ? (
                                    <div className="shrink-0 text-right">
                                      <p className="font-medium text-gray-800">
                                        {formatCurrency(section.checkoutPrice)}
                                      </p>
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>

                          <p className="mt-2 text-[11px] text-gray-500">
                            {t("highestHalfPrice")}
                          </p>
                        </div>
                      ) : null}

                      {selectedAddons.length > 0 ? (
                        <div className="rounded-[10px] border border-gray-100 bg-gray-50 px-3 py-2">
                          <div className="mb-1.5 flex items-center justify-between gap-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                              {t("addons")}
                            </p>
                          </div>

                          <div className="space-y-1">
                            {selectedAddons.map((addon, index) => {
                              const addonName =
                                String(addon.name || "").trim() || t("addonFallback");

                              const addonQty = getAddonQuantity(addon);
                              const addonTotal = getAddonTotal(addon);

                              const addonKey =
                                addon.modifierId ||
                                addon.id ||
                                `${item.id}-addon-${index}`;

                              return (
                                <div
                                  key={addonKey}
                                  className="flex items-center justify-between gap-3 text-xs"
                                >
                                  <span className="min-w-0 truncate text-gray-600">
                                    {addonName}
                                    {addonQty > 1 ? ` × ${addonQty}` : ""}
                                  </span>

                                  <span className="shrink-0 font-medium text-gray-700">
                                    {addonTotal > 0
                                      ? `+${formatCurrency(addonTotal)}`
                                      : t("free")}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      {depositUnitAmount > 0 ? (
                        <div className="flex items-center justify-between rounded-[10px] border border-amber-100 bg-amber-50 px-3 py-2 text-xs">
                          <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                            <BadgeDollarSign size={14} />
                            {t("deposit")}
                          </span>

                          <span className="font-semibold text-amber-700">
                            {formatCurrency(depositUnitAmount)}
                            {quantity > 1 ? ` × ${quantity}` : ""}
                          </span>
                        </div>
                      ) : null}

                      {item.note ? (
                        <p className="rounded-md bg-yellow-50 px-2 py-1 text-[11px] text-yellow-700">
                          {t("note")}: {item.note}
                        </p>
                      ) : null}

                      <div className="flex justify-between py-[4px]">
                        <div>
                          <p className="text-base font-medium text-primary">
                            {formatCurrency(lineTotal)}
                          </p>

                          <div className="space-y-0.5">
                            <p className="text-[11px] text-gray-400">
                              {t("each", { price: formatCurrency(unitPriceWithModifiers) })}
                            </p>

                            {selectedAddons.length > 0 ? (
                              <p className="text-[11px] text-gray-400">
                                {t("priceWithAddons", {
                                  price: formatCurrency(checkoutUnitPrice),
                                  addons: formatCurrency(modifiersTotal),
                                })}
                              </p>
                            ) : null}

                            {depositTotal > 0 ? (
                              <p className="text-[11px] text-gray-400">
                                {t("includesDeposit", { amount: formatCurrency(depositTotal) })}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex items-center gap-[12px]">
                          <button
                            type="button"
                            onClick={() => updateQuantity(String(item.id), "dec")}
                            className="flex h-[20px] w-[20px] items-center justify-center rounded-sm border border-gray-900 text-gray-900 transition-colors hover:border-primary hover:text-primary"
                          >
                            <Minus size={13} strokeWidth={3} />
                          </button>

                          <span className="w-4 text-center text-base text-gray-900">
                            {quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() => updateQuantity(String(item.id), "inc")}
                            className="flex h-[20px] w-[20px] items-center justify-center rounded-sm border border-gray-900 text-gray-900 transition-colors hover:border-primary hover:text-primary"
                          >
                            <Plus size={13} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-[15px]">
        <h2 className="text-[18px] font-semibold text-gray-900">
          {t("billDetails")}
        </h2>

        <div className="space-y-4 text-sm text-gray-500">
          <div className="flex items-center justify-between">
            <span>{t("itemTotal")}</span>
            <span>{formatCurrency(quoteSubtotal ?? itemTotal)}</span>
          </div>

          {depositTotal > 0 ? (
            <div className="flex items-center justify-between text-amber-700">
              <div className="flex items-center gap-1">
                <span>{t("deposit")}</span>
                <Info size={16} />
              </div>
              <span>{formatCurrency(depositTotal)}</span>
            </div>
          ) : null}

          {selectedOrderFee > 0 ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span>
                  {checkoutType === "pickup" ? t("pickupPrice") : t("deliveryFee")}
                </span>
                <Info size={16} />
              </div>
              <span>{formatCurrency(selectedOrderFee)}</span>
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span>{t("taxesAndCharges")}</span>
              <Info size={16} />
            </div>
            <span>{formatCurrency(taxes)}</span>
          </div>

          {shouldShowPositiveAmountLine(serviceCharge) ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span>
                  {getServiceChargeLabel({
                    serviceChargeType: resolvedQuote?.serviceChargeType,
                    serviceChargeValue: resolvedQuote?.serviceChargeValue,
                    serviceChargeLabel: t("totals.serviceCharge"),
                    serviceChargeWithPercentageLabel: (value) =>
                      t("totals.serviceChargeWithPercentage", { value }),
                  })}
                </span>
                <Info size={16} />
              </div>
              <span>{formatCurrency(serviceCharge)}</span>
            </div>
          ) : null}

          {shouldShowPositiveAmountLine(tipAmount) ? (
            <div className="flex items-center justify-between">
              <span>{t("totals.tip")}</span>
              <span>{formatCurrency(tipAmount)}</span>
            </div>
          ) : null}
        </div>

        {canEditCart ? (
          <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
            <label
              htmlFor="checkout-tip"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t("tip.label")}
            </label>
            <p className="mb-3 text-xs text-gray-500">{t("tip.helper")}</p>
            <div className="flex gap-2">
              <input
                id="checkout-tip"
                type="number"
                min="0"
                value={tipInput}
                onChange={(event) => setTipInput(event.target.value)}
                placeholder="0"
                className="h-[42px] flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
              />
              <Button
                type="button"
                onClick={handleApplyTip}
                disabled={applyingTip}
                className="h-[42px] text-white"
              >
                {applyingTip
                  ? t("applying")
                  : tipAmount > 0
                    ? t("tip.update")
                    : t("tip.apply")}
              </Button>
              {tipAmount > 0 ? (
                <Button
                  type="button"
                  onClick={handleRemoveTip}
                  disabled={applyingTip}
                  className="h-[42px] bg-gray-200 text-gray-700 hover:bg-gray-200"
                >
                  {t("tip.remove")}
                </Button>
              ) : null}
            </div>
            {tipAmount > 0 ? (
              <p
                role="status"
                className="mt-2 text-xs font-medium text-green-700"
              >
                {t("tip.applied", { amount: formatCurrency(tipAmount) })}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={couponCode || ""}
            onChange={(e) => setCouponCode?.(e.target.value)}
            placeholder={t("couponPlaceholder")}
            disabled={validatingCoupon || removingCoupon}
            className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
          />

          <Button
            type="button"
            onClick={onApplyCoupon}
            disabled={validatingCoupon || removingCoupon}
            className="h-[42px] text-white"
          >
            {validatingCoupon ? t("applying") : t("apply")}
          </Button>
        </div>

        {discount > 0 || hasAppliedPromotion || hasAppliedCoupon ? (
          <div className="rounded-md bg-green-100 p-3 text-sm font-medium text-green-700">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <TicketPercent width={16} height={16} />
                <span>
                  {hasAppliedPromotion
                    ? t("appliedDeal")
                    : t("couponApplied")}
                </span>
              </div>

              {hasAppliedCoupon && onRemoveCoupon ? (
                <button
                  type="button"
                  onClick={onRemoveCoupon}
                  disabled={removingCoupon}
                  className="text-xs font-semibold text-green-800 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {removingCoupon ? t("removing") : t("removeCoupon")}
                </button>
              ) : null}
            </div>

            {hasAppliedPromotion ? (
              <p className="mt-1 pl-6 text-xs font-normal text-green-700/90">
                {promotionDiscountLine?.label || t("promotionDiscount")}
                {appliedPromotion?.applyMode
                  ? ` · ${String(appliedPromotion.applyMode).replace(/_/g, " ")}`
                  : ""}
                {promotionDiscountLine && promotionDiscountLine.amount > 0
                  ? ` · ${t("off", { amount: formatCurrency(promotionDiscountLine.amount) })}`
                  : ""}
              </p>
            ) : hasAppliedCoupon ? (
              <p className="mt-1 pl-6 text-xs font-normal text-green-700/90">
                {appliedCouponCode}
                {discount > 0
                  ? ` · ${t("off", { amount: formatCurrency(discount) })}`
                  : ""}
              </p>
            ) : null}
          </div>
        ) : null}

        {canEditCart && !isGuest ? (
          <div className="rounded-[18px] border border-primary/10 bg-[linear-gradient(135deg,rgba(206,24,27,0.07),rgba(17,24,39,0.03))] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Coins size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-950">
                      {t("loyalty.title")}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      {loadingLoyalty
                        ? t("loyalty.loading")
                        : loyalty
                          ? t("loyalty.available", {
                              points: Math.max(0, Math.round(toNumber(loyalty.availablePoints, 0))),
                              minimum: Math.max(0, Math.round(toNumber(loyalty.minimumRedeemPoints, 0))),
                            })
                          : t("loyalty.unavailable")}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="number"
                    min="0"
                    value={loyaltyPoints}
                    onChange={(event) => setLoyaltyPoints?.(event.target.value)}
                    disabled={loadingLoyalty || !loyalty}
                    placeholder={t("loyalty.placeholder")}
                    className="h-[42px] flex-1 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  {loyaltyPointsValue > 0 ? (
                    <button
                      type="button"
                      onClick={() => setLoyaltyPoints?.("")}
                      className="h-[42px] rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:border-primary/30 hover:text-primary"
                    >
                      {t("loyalty.clear")}
                    </button>
                  ) : null}
                </div>

                {loyaltyPointsValue > 0 ? (
                  <p className={`mt-2 text-xs font-medium ${loyaltyCanRedeem ? "text-green-700" : "text-amber-700"}`}>
                    {loyaltyCanRedeem
                      ? t("loyalty.estimatedDiscount", {
                          amount: formatCurrency(loyaltyEstimatedDiscount),
                        })
                      : t("loyalty.requirements")}
                  </p>
                ) : null}
                {loyaltyCanRedeem ? (
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    {t("loyalty.redeemNotice")}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <div className="space-y-[15px]">
          <div className="flex items-center justify-between pt-[15px] text-sm text-gray-500">
            <span>{t("totalBeforeDiscount")}</span>
            <span>{formatCurrency(totalBeforeDiscount)}</span>
          </div>

          {discount > 0 ? (
            <div className="flex items-center justify-between text-sm text-green-600">
              <span>
                {hasAppliedPromotion
                  ? t("appliedDealDiscount")
                  : hasAppliedCoupon && appliedCouponCode
                    ? `${t("discount")} (${appliedCouponCode})`
                    : t("discount")}
              </span>
              <span>- {formatCurrency(discount)}</span>
            </div>
          ) : null}

          {loyaltyDiscount > 0 ? (
            <div className="flex items-center justify-between text-sm text-green-600">
              <span>
                {toNumber(resolvedQuote?.loyaltyPointsRedeemed, 0) > 0
                  ? t("loyaltyDiscountWithPoints", {
                      points: toNumber(resolvedQuote?.loyaltyPointsRedeemed, 0),
                    })
                  : t("loyaltyDiscount")}
              </span>
              <span>- {formatCurrency(loyaltyDiscount)}</span>
            </div>
          ) : null}

          {loyaltyPreviewDiscount > 0 ? (
            <div className="flex items-center justify-between text-sm text-green-600">
              <span>{t("estimatedLoyaltyDiscount")}</span>
              <span>- {formatCurrency(loyaltyPreviewDiscount)}</span>
            </div>
          ) : null}

          {walletAppliedAmount > 0 ? (
            <div className="flex items-center justify-between pb-[15px] text-sm text-green-600">
              <span>{t("walletApplied")}</span>
              <span>- {formatCurrency(walletAppliedAmount)}</span>
            </div>
          ) : hasAnyDiscount ? (
            <div className="pb-[15px]" />
          ) : null}

          <div className="flex items-center justify-between text-[24px] font-medium text-gray-900">
            <span>
              {loyaltyPreviewDiscount > 0
                ? t("totals.estimatedPayableAmount")
                : quotedFinalTotal !== null
                ? t("totals.payableAmount")
                : walletAppliedAmount > 0
                  ? t("payableTotal")
                  : t("total")}
            </span>
            <span className="flex flex-col items-end leading-none">
              {loyaltyPreviewDiscount > 0 ? (
                <span className="mb-1 text-sm font-medium text-gray-400 line-through">
                  {formatCurrency(finalTotal)}
                </span>
              ) : null}
              <span>{formatCurrency(displayedFinalTotal)}</span>
            </span>
          </div>
        </div>

        {canEditCart && cartItems.length > 0 ? (
          <button
            type="button"
            onClick={handleAddMoreItems}
            className="mt-[15px] inline-flex h-[48px] w-full items-center justify-center gap-2 rounded-[10px] border border-primary/15 bg-primary/5 text-base font-medium text-primary transition hover:border-primary/25 hover:bg-primary/10"
          >
            <Plus size={17} strokeWidth={2.5} />
            {t("addMoreItems")}
          </button>
        ) : null}

        {title !== "Order Details" ? (
          <Button
            onClick={onPlaceOrder}
            disabled={placingOrder || cartItems.length === 0}
            variant="primary"
            className="mt-[15px] h-[54px] w-full cursor-pointer rounded-[10px] text-base font-medium shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {placingOrder ? t("placingOrder") : t("placeOrder")}
          </Button>
        ) : null}
      </section>
    </div>
  );
}
