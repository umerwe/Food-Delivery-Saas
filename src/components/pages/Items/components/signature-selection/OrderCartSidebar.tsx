"use client";

import Image from "next/image";
import {
  ArrowRight,
  BadgeDollarSign,
  Layers2,
  Loader2,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  formatCurrency,
  getAddonQuantity,
  getAddonTotal,
  getCheckoutPriceAdjustmentTotal,
  getItemImage,
  getItemPricing,
  getScopedItemDiscountDisplays,
  getSelectedVariationName,
  getTotalBeforeDiscount,
  getSplitPizzaDisplay,
  isDealCartItem,
  type CheckoutType,
} from "@/components/pages/Checkout/components/CartSummarySection";
import {
  getAppliedPromotionDiscountLine,
  type ApiRecord,
  type CartItem,
  normalizeCartItem,
  recalculateCartItemQuantity,
  toNumber,
} from "@/components/pages/Checkout/utils/checkout-normalizers";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { dispatchCartChanged } from "@/lib/cart-events";
import { cn } from "@/lib/utils";

type OrderCartSidebarProps = {
  customerId?: string;
  cartRefreshKey: number;
  onCartRefresh?: () => void;
  presentation?: "embedded" | "floating";
  checkoutType?: CheckoutType;
  currency?: string | null;
};

export function OrderCartSidebar({
  customerId,
  cartRefreshKey,
  onCartRefresh,
  presentation = "embedded",
  checkoutType = "delivery",
  currency,
}: OrderCartSidebarProps) {
  const t = useTranslations("checkout");
  const cartT = useTranslations("cart");
  const router = useRouter();
  const { token } = useAuth();
  const {
    fetchCustomerCart,
    updateCustomerCartItemQuantity,
    updateCustomerCartDealQuantity,
    deleteCustomerCartItem,
    deleteCustomerCartDeal,
  } = useCart(token);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartQuote, setCartQuote] = useState<ApiRecord | null>(null);
  const [loadingCart, setLoadingCart] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchCart = async () => {
    if (!customerId) return;

    try {
      setLoadingCart(true);

      const { response: res, items, quote } = await fetchCustomerCart({ customerId });

      if (!res || res.error) {
        setCartItems([]);
        setCartQuote(null);
        return;
      }

      setCartItems(items.map((item) => normalizeCartItem(item)));
      setCartQuote(quote as ApiRecord | null);
    } catch (err) {
      setCartItems([]);
      setCartQuote(null);
    } finally {
      setLoadingCart(false);
    }
  };

  useEffect(() => {
    void fetchCart();
  }, [customerId, cartRefreshKey]);

  const splitLabels = useMemo(
    () => ({
      half: t("half"),
      leftHalf: t("leftHalf"),
      rightHalf: t("rightHalf"),
      selectedItem: t("selectedItem"),
    }),
    [t]
  );

  const pricingItems = useMemo(
    () =>
      cartItems.map((item) => ({
        item,
        pricing: getItemPricing(item, checkoutType),
      })),
    [cartItems, checkoutType]
  );

  const totalItems = useMemo(
    () => cartItems.reduce((acc, item) => acc + Math.max(1, toNumber(item.quantity, 1)), 0),
    [cartItems]
  );

  const itemTotal = useMemo(
    () => pricingItems.reduce((acc, entry) => acc + entry.pricing.itemSubtotal, 0),
    [pricingItems]
  );

  const depositTotal = useMemo(
    () => pricingItems.reduce((acc, entry) => acc + entry.pricing.depositTotal, 0),
    [pricingItems]
  );

  const checkoutPriceAdjustment = getCheckoutPriceAdjustmentTotal(cartItems, checkoutType);
  const hasCartQuote = Boolean(cartQuote);
  const deliveryAdjustmentFee =
    checkoutType === "delivery" ? checkoutPriceAdjustment : 0;
  const deliveryFee =
    checkoutType === "delivery"
      ? hasCartQuote
        ? toNumber(cartQuote?.deliveryFee, 0)
        : deliveryAdjustmentFee > 0
          ? deliveryAdjustmentFee
          : toNumber(cartQuote?.deliveryFee, 0)
      : 0;
  const pickupFee = checkoutType === "pickup" && !hasCartQuote ? checkoutPriceAdjustment : 0;
  const selectedOrderFee = checkoutType === "pickup" ? pickupFee : deliveryFee;
  const tipAmount = Math.max(0, toNumber(cartQuote?.tipAmount, 0));
  const quoteSubtotal = cartQuote ? toNumber(cartQuote.subtotal, itemTotal) : itemTotal;
  const appliedPromotion =
    typeof cartQuote?.appliedPromotion === "object" && cartQuote.appliedPromotion !== null
      ? cartQuote.appliedPromotion
      : null;
  const hasAppliedPromotion = Boolean(
    appliedPromotion && ("id" in appliedPromotion || "title" in appliedPromotion)
  );
  const promotionDiscountLine = getAppliedPromotionDiscountLine(cartQuote);
  const scopedItemDiscountDisplays = getScopedItemDiscountDisplays(pricingItems, cartQuote);
  const discount = promotionDiscountLine?.amount ?? Math.max(0, toNumber(cartQuote?.discountAmount, 0));
  const loyaltyDiscount = Math.max(0, toNumber(cartQuote?.loyaltyDiscountAmount, 0));
  const walletAppliedAmount = Math.max(0, toNumber(cartQuote?.walletAppliedAmount, 0));
  const totalBeforeDiscount = getTotalBeforeDiscount({
    subtotal: quoteSubtotal,
    orderFee: selectedOrderFee,
    tipAmount,
  });
  const finalTotal = Math.max(
    0,
    toNumber(
      cartQuote?.payableAmount ?? cartQuote?.totalAmount,
      totalBeforeDiscount - discount - loyaltyDiscount - walletAppliedAmount
    )
  );

  const updateQuantity = async (id: string, type: "inc" | "dec") => {
    const item = cartItems.find((cartItem) => String(cartItem.id) === id);
    if (!item || !customerId) return;

    const currentQty = Math.max(1, toNumber(item.quantity, 1));
    const newQty = type === "inc" ? currentQty + 1 : Math.max(1, currentQty - 1);

    if (newQty === currentQty) return;

    try {
      setActionId(id);
      setCartItems((prev) =>
        prev.map((cartItem) =>
          String(cartItem.id) === id ? recalculateCartItemQuantity(cartItem, newQty) : cartItem
        )
      );

      const isDealItem = isDealCartItem(item);
      const res = isDealItem && item.dealId
        ? await updateCustomerCartDealQuantity({ customerId, dealId: item.dealId, quantity: newQty })
        : await updateCustomerCartItemQuantity({ customerId, cartItemId: id, quantity: newQty });

      if (!res || res.error) {
        toast.error(res?.error || cartT("failedUpdateQuantity"));
        await fetchCart();
        return;
      }

      onCartRefresh?.();
      await fetchCart();
    } catch (err) {
      toast.error(cartT("failedUpdateQuantity"));
      await fetchCart();
    } finally {
      setActionId(null);
    }
  };

  const deleteItem = async (id: string) => {
    if (!customerId) return;
    const item = cartItems.find((cartItem) => String(cartItem.id) === id);
    const previousTotalItems = totalItems;
    const deletedQuantity = Math.max(1, toNumber(item?.quantity, 1));

    try {
      setActionId(id);

      const isDealItem = item ? isDealCartItem(item) : false;
      const res = isDealItem && item?.dealId
        ? await deleteCustomerCartDeal({ customerId, dealId: item.dealId })
        : await deleteCustomerCartItem({ customerId, cartItemId: id });

      if (!res || res.error) {
        toast.error(res?.error || cartT("failedRemoveItem"));
        return;
      }

      toast.success(cartT("itemRemoved"));
      setCartItems((prev) => prev.filter((cartItem) => String(cartItem.id) !== id));
      dispatchCartChanged({ itemCount: Math.max(0, previousTotalItems - deletedQuantity) });
      onCartRefresh?.();
      await fetchCart();
    } catch (err) {
      toast.error(cartT("failedRemoveItem"));
    } finally {
      setActionId(null);
    }
  };

  return (
    <aside
      className={cn(
        "border-l border-black/5 bg-white/95 px-4 py-5 backdrop-blur-sm sm:px-6 shadow-[-12px_0_32px_0_rgba(26,28,28,0.04)]",
        presentation === "embedded"
          ? "xl:sticky xl:top-0"
          : "h-full overflow-y-auto rounded-[22px] border border-black/10 shadow-[0_24px_80px_rgba(15,23,42,0.18)]"
      )}
    >
      <div className="mx-auto flex h-full max-w-[320px] flex-col">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-gray-900">
              {t("cartSummary")}
            </h2>
            <p className="mt-1 text-xs capitalize text-gray-400">
              {checkoutType === "pickup" ? t("pickupPricingApplied") : t("deliveryPricingApplied")}
            </p>
          </div>

          <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
            {cartT("itemCount", { count: totalItems })}
          </span>
        </div>

        {loadingCart ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : cartItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 p-5 text-center">
            <p className="text-sm font-medium text-gray-700">{t("yourCartIsEmpty")}</p>
            <p className="mt-1 text-xs text-gray-400">{t("emptyCartDescription")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pricingItems.map(({ item, pricing }) => {
              const {
                quantity,
                checkoutUnitPrice,
                modifiersTotal,
                unitPriceWithModifiers,
                lineTotal,
                depositUnitAmount,
                depositTotal: itemDepositTotal,
                selectedAddons,
                selectedSections,
              } = pricing;
              const isDealItem = isDealCartItem(item);
              const selectedVariationName = isDealItem ? "" : getSelectedVariationName(item);
              const splitPizzaDisplay = getSplitPizzaDisplay(
                item,
                selectedSections,
                splitLabels,
                checkoutType
              );
              const includedItems = Array.isArray(item.includedItems) ? item.includedItems : [];
              const itemDiscountDisplay = scopedItemDiscountDisplays.get(String(item.id || item.menuItemId || ""));

              return (
                <div
                  key={String(item.id)}
                  className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative h-[66px] w-[66px] shrink-0 overflow-hidden rounded-[12px] bg-gray-100">
                      <Image
                        src={String(getItemImage(item) || "/placeholder.png")}
                        alt={item.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="line-clamp-2 text-[13px] font-medium leading-5 text-gray-900">
                            {item.name}
                          </h3>

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

                        <button
                          type="button"
                          onClick={() => void deleteItem(String(item.id))}
                          disabled={actionId === String(item.id)}
                          className="mt-0.5 shrink-0 rounded-md bg-red-50 p-1 text-red-500 transition hover:bg-red-100 disabled:opacity-50"
                          aria-label={t("removeItem", { name: item.name })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {isDealItem && includedItems.length > 0 ? (
                        <div className="rounded-[10px] border border-primary/10 bg-primary/5 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                            {t("dealIncludes")}
                          </p>
                          <div className="mt-1.5 space-y-1">
                            {includedItems.map((includedItem, index) => {
                              const includedName =
                                String(includedItem.menuItem?.name || includedItem.name || "").trim() ||
                                t("includedItemFallback");
                              const includedQuantity = Math.max(1, toNumber(includedItem.quantity, 1));
                              const includedModifiers = Array.isArray(includedItem.selectedModifiers)
                                ? includedItem.selectedModifiers
                                : [];
                              const includedKey =
                                includedItem.id ||
                                includedItem.menuItemId ||
                                `${item.id}-included-${index}`;

                              return (
                                <div
                                  key={String(includedKey)}
                                  className="space-y-1 text-xs"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="min-w-0 truncate text-gray-700">{includedName}</span>
                                    <span className="shrink-0 font-medium text-primary">× {includedQuantity}</span>
                                  </div>

                                  {includedModifiers.length > 0 ? (
                                    <div className="space-y-0.5 pl-2">
                                      {includedModifiers.map((modifier, modifierIndex) => {
                                        const modifierKey =
                                          modifier.id ||
                                          modifier.modifierId ||
                                          `${includedKey}-modifier-${modifierIndex}`;
                                        const modifierQuantity = Math.max(
                                          1,
                                          toNumber(modifier.quantity, 1)
                                        );
                                        const modifierTotal = toNumber(modifier.total, 0);

                                        return (
                                          <div
                                            key={String(modifierKey)}
                                            className="flex items-center justify-between gap-3 text-[11px] text-gray-500"
                                          >
                                            <span className="min-w-0 truncate">
                                              {modifier.name}
                                              {modifierQuantity > 1 ? ` × ${modifierQuantity}` : ""}
                                            </span>
                                            {modifierTotal > 0 ? (
                                              <span className="shrink-0 font-medium text-gray-600">
                                                +{formatCurrency(modifierTotal, currency)}
                                              </span>
                                            ) : null}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      {selectedSections.length > 0 ? (
                        <div className="rounded-[12px] border border-primary/10 bg-primary/5 px-3 py-2">
                          <div className="mb-2 flex items-center gap-2">
                            <Layers2 size={14} className="text-primary" />
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                              {t("splitPizza")}
                            </p>
                          </div>

                          <div className="space-y-1.5">
                            {splitPizzaDisplay.sections.map((section) => (
                              <div
                                key={`${item.id}-section-${section.slot || section.index}`}
                                className="flex items-start justify-between gap-3 text-xs"
                              >
                                <p className="min-w-0 truncate text-gray-700">
                                  <span className="font-semibold">{section.label}:</span>{" "}
                                  {section.displayName}
                                </p>

                                {section.checkoutPrice > 0 ? (
                                  <p className="shrink-0 font-medium text-gray-800">
                                    {formatCurrency(section.checkoutPrice, currency)}
                                  </p>
                                ) : null}
                              </div>
                            ))}
                          </div>

                          <p className="mt-2 text-[11px] text-gray-500">
                            {t("highestHalfPrice")}
                          </p>
                        </div>
                      ) : null}

                      {selectedAddons.length > 0 ? (
                        <div className="rounded-[10px] border border-gray-100 bg-gray-50 px-3 py-2">
                          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                            {t("addons")}
                          </p>
                          <div className="space-y-1">
                            {selectedAddons.map((addon, index) => {
                              const addonName = String(addon.name || "").trim() || t("addonFallback");
                              const addonQty = getAddonQuantity(addon);
                              const addonTotal = getAddonTotal(addon);
                              const addonKey = addon.modifierId || addon.id || `${item.id}-addon-${index}`;

                              return (
                                <div key={addonKey} className="flex items-center justify-between gap-3 text-xs">
                                  <span className="min-w-0 truncate text-gray-600">
                                    {addonName}
                                    {addonQty > 1 ? ` × ${addonQty}` : ""}
                                  </span>
                                  <span className="shrink-0 font-medium text-gray-700">
                                    {addonTotal > 0 ? `+${formatCurrency(addonTotal, currency)}` : t("free")}
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
                            {formatCurrency(depositUnitAmount, currency)}
                            {quantity > 1 ? ` × ${quantity}` : ""}
                          </span>
                        </div>
                      ) : null}

                      {item.note ? (
                        <p className="rounded-md bg-yellow-50 px-2 py-1 text-[11px] text-yellow-700">
                          {t("note")}: {item.note}
                        </p>
                      ) : null}

                      <div className="flex items-end justify-between gap-3 pt-1">
                        <div>
                          {itemDiscountDisplay ? (
                            <div className="flex flex-wrap items-baseline gap-2">
                              <span className="text-xs font-medium text-gray-400 line-through decoration-gray-400">
                                {formatCurrency(lineTotal, currency)}
                              </span>
                              <span className="text-sm font-semibold text-primary">
                                {formatCurrency(itemDiscountDisplay.discountedLineTotal, currency)}
                              </span>
                            </div>
                          ) : (
                            <p className="text-sm font-semibold text-primary">
                              {formatCurrency(lineTotal, currency)}
                            </p>
                          )}
                          <div className="space-y-0.5">
                            {itemDepositTotal > 0 ? (
                              <p className="text-[11px] text-gray-400">
                                {t("includesDeposit", { amount: formatCurrency(itemDepositTotal, currency) })}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex h-8 items-center overflow-hidden rounded-full border border-black/5 bg-[#f7f7f7] px-1.5">
                          <button
                            type="button"
                            onClick={() => void updateQuantity(String(item.id), "dec")}
                            disabled={actionId === String(item.id)}
                            className="flex h-6 w-6 items-center justify-center rounded-full text-[#666] transition hover:bg-white hover:text-[#222] disabled:opacity-50"
                            aria-label={`Decrease ${item.name} quantity`}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-7 text-center text-[13px] font-medium text-[#222]">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => void updateQuantity(String(item.id), "inc")}
                            disabled={actionId === String(item.id)}
                            className="flex h-6 w-6 items-center justify-center rounded-full text-[#666] transition hover:bg-white hover:text-[#222] disabled:opacity-50"
                            aria-label={`Increase ${item.name} quantity`}
                          >
                            <Plus className="h-3.5 w-3.5" />
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

        <div className="mt-auto pt-8">
          <div className="space-y-3 border-t border-black/5 pt-5 text-sm text-gray-500">
            <div className="flex items-center justify-between">
              <span>{t("itemTotal")}</span>
              <span>{formatCurrency(quoteSubtotal, currency)}</span>
            </div>

            {depositTotal > 0 ? (
              <div className="flex items-center justify-between text-amber-700">
                <span>{t("deposit")}</span>
                <span>{formatCurrency(depositTotal, currency)}</span>
              </div>
            ) : null}

            {selectedOrderFee > 0 ? (
              <div className="flex items-center justify-between">
                <span>
                  {checkoutType === "pickup" ? t("pickupPrice") : t("deliveryFee")}
                </span>
                <span>{formatCurrency(selectedOrderFee, currency)}</span>
              </div>
            ) : null}

            {tipAmount > 0 ? (
              <div className="flex items-center justify-between">
                <span>{t("totals.tip")}</span>
                <span>{formatCurrency(tipAmount, currency)}</span>
              </div>
            ) : null}

            <div className="flex items-center justify-between pt-2">
              <span>{t("totalBeforeDiscount")}</span>
              <span>{formatCurrency(totalBeforeDiscount, currency)}</span>
            </div>

            {discount > 0 ? (
              <div className="flex items-center justify-between text-green-600">
                <span>{hasAppliedPromotion ? t("appliedDealDiscount") : t("discount")}</span>
                <span>- {formatCurrency(discount, currency)}</span>
              </div>
            ) : null}

            {loyaltyDiscount > 0 ? (
              <div className="flex items-center justify-between text-green-600">
                <span>
                  {toNumber(cartQuote?.loyaltyPointsRedeemed, 0) > 0
                    ? t("loyaltyDiscountWithPoints", {
                        points: toNumber(cartQuote?.loyaltyPointsRedeemed, 0),
                      })
                    : t("loyaltyDiscount")}
                </span>
                <span>- {formatCurrency(loyaltyDiscount, currency)}</span>
              </div>
            ) : null}

            {walletAppliedAmount > 0 ? (
              <div className="flex items-center justify-between text-green-600">
                <span>{t("walletApplied")}</span>
                <span>- {formatCurrency(walletAppliedAmount, currency)}</span>
              </div>
            ) : null}

            <div className="flex items-center justify-between pt-2 text-[22px] font-semibold tracking-[-0.02em] text-gray-900">
              <span>{walletAppliedAmount > 0 ? t("payableTotal") : t("total")}</span>
              <span>{formatCurrency(finalTotal, currency)}</span>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => router.push(`/checkout?type=${checkoutType}`)}
            disabled={!cartItems.length}
            className="mt-5 flex h-[50px] w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-[14px] font-medium text-primary-foreground shadow-[0_10px_24px_rgba(0,0,0,0.10)] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cartT("proceedToCheckout")}
            <ArrowRight className="h-4 w-4" />
          </Button>

          <p className="mt-4 text-center text-[11px] text-[#b0b0b0]">
            {cartT("averageDeliveryTime")}
          </p>
        </div>
      </div>
    </aside>
  );
}
