"use client";

import Image from "next/image";
import {
  Plus,
  Minus,
  Info,
  TicketPercent,
  Trash2,
  Pencil,
  Layers2,
  BadgeDollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";

interface CartAddon {
  id?: string;
  modifierId?: string;
  name?: string;
  quantity?: number | string;
  unitPrice?: number | string;
  price?: number | string;
  priceDelta?: number | string;
  total?: number | string;
}

interface CartSection {
  slot?: string;
  menuItemId?: string;
  menuItemName?: string;
  unitPrice?: number | string;
}

interface CartItem {
  id: string;
  menuItemId?: string;
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
  selectedVariation?: any;
  selectedModifiers?: CartAddon[];
  note?: string;

  menuItem?: any;
  variationId?: string;
  selectedSections?: CartSection[];
  sections?: CartSection[];

  depositAmount?: number | string;
  pickupPrice?: number | string;
  pickupUnitPrice?: number | string;
  takeawayPriceAdjustment?: number | string;
  deliveryPriceAdjustment?: number | string;
}

interface Props {
  title?: string;
  cartItems: CartItem[];
  updateQuantity: (id: string, type: "inc" | "dec") => void;
  deleteItem: (id: string) => void;
  clearCart: () => void;
  onPlaceOrder: () => void;
  placingOrder?: boolean;
  couponCode?: string;
  setCouponCode?: (val: string) => void;
  onApplyCoupon?: () => void;
  couponDiscount?: number;
  validatingCoupon?: boolean;
}

type CheckoutType = "delivery" | "pickup";

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const hasText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text !== "" && text.toLowerCase() !== "null";
};

const normalizeArray = (value: any): any[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [];
};

const formatCurrency = (value: unknown) => {
  return `$${toNumber(value, 0).toFixed(2)}`;
};

const slugify = (value: string) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const getCheckoutType = (type?: string | null): CheckoutType => {
  const normalized = String(type || "").toLowerCase();

  if (normalized === "pickup" || normalized === "takeaway") {
    return "pickup";
  }

  return "delivery";
};

const getSelectedAddons = (item: CartItem) => {
  return Array.isArray(item.selectedModifiers)
    ? item.selectedModifiers.filter((addon) => {
        return Boolean(addon?.modifierId || addon?.id || addon?.name);
      })
    : [];
};

const getAddonQuantity = (addon: CartAddon) => {
  return Math.max(1, toNumber(addon.quantity, 1));
};

const getAddonUnitPrice = (addon: CartAddon) => {
  return toNumber(addon.unitPrice ?? addon.price ?? addon.priceDelta, 0);
};

const getAddonTotal = (addon: CartAddon) => {
  const quantity = getAddonQuantity(addon);
  const unitPrice = getAddonUnitPrice(addon);

  return toNumber(addon.total, unitPrice * quantity);
};

const getMenuItem = (item: CartItem) => {
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

const getItemImage = (item: CartItem) => {
  return item.img || item?.menuItem?.imageUrl || "/placeholder.png";
};

const getSelectedVariationName = (item: CartItem) => {
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
    item?.menuItem?.selectedVariation?.id ||
    ""
  );
};

const findSelectedVariationOverride = (item: CartItem) => {
  const variationId = getVariationId(item);
  const menuItem = getMenuItem(item);

  if (!variationId) return null;

  const overrides = normalizeArray(menuItem?.variationPriceOverrides);

  return (
    overrides.find((override: any) => {
      return String(override?.variationId || override?.variation?.id || "") ===
        String(variationId);
    }) || null
  );
};

const findSelectedVariation = (item: CartItem) => {
  const variationId = getVariationId(item);
  const menuItem = getMenuItem(item);

  if (!variationId) return null;

  const variations = [
    ...normalizeArray(menuItem?.variations),
    ...normalizeArray(menuItem?.category?.variations),
  ];

  return (
    variations.find((variation: any) => {
      return String(variation?.id || "") === String(variationId);
    }) || null
  );
};

const getBaseUnitPrice = (item: CartItem) => {
  const selectedSections = getSelectedSections(item);

  if (selectedSections.length > 0) {
    const highestSectionPrice = Math.max(
      ...selectedSections.map((section) => toNumber(section?.unitPrice, 0)),
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

const getExplicitPickupUnitPrice = (item: CartItem) => {
  const menuItem = getMenuItem(item);
  const override = findSelectedVariationOverride(item);
  const variation = findSelectedVariation(item);

  const candidates = [
    item.pickupUnitPrice,
    item.pickupPrice,
    item?.selectedVariation?.pickupPrice,
    item?.menuItem?.selectedVariation?.pickupPrice,
    override?.pickupPrice,
    variation?.pickupPrice,
    menuItem?.pickupPrice,
  ];

  for (const candidate of candidates) {
    const numeric = toNumber(candidate, 0);

    if (numeric > 0) return numeric;
  }

  return null;
};

const getPickupAdjustedUnitPrice = (item: CartItem, baseUnitPrice: number) => {
  const explicitPickupPrice = getExplicitPickupUnitPrice(item);

  if (explicitPickupPrice !== null) {
    return explicitPickupPrice;
  }

  const adjustment = toNumber(
    item.takeawayPriceAdjustment ?? item.menuItem?.takeawayPriceAdjustment,
    0
  );

  return Math.max(0, baseUnitPrice + adjustment);
};

const getDeliveryAdjustedUnitPrice = (item: CartItem, baseUnitPrice: number) => {
  const adjustment = toNumber(
    item.deliveryPriceAdjustment ?? item.menuItem?.deliveryPriceAdjustment,
    0
  );

  return Math.max(0, baseUnitPrice + adjustment);
};

const getDepositUnitAmount = (item: CartItem) => {
  return toNumber(item.depositAmount ?? item.menuItem?.depositAmount, 0);
};

const getSelectedSections = (item: CartItem): CartSection[] => {
  const sections = normalizeArray(item.selectedSections).length
    ? normalizeArray(item.selectedSections)
    : normalizeArray(item.sections);

  return sections
    .map((section: any) => ({
      slot: String(section?.slot || "").toUpperCase(),
      menuItemId: section?.menuItemId,
      menuItemName: section?.menuItemName || section?.menuItem?.name || "",
      unitPrice: section?.unitPrice ?? section?.price ?? 0,
    }))
    .filter((section) => section?.slot || section?.menuItemId);
};

const getItemPricing = (item: CartItem, checkoutType: CheckoutType) => {
  const quantity = Math.max(1, toNumber(item.quantity, 1));
  const selectedAddons = getSelectedAddons(item);

  const fallbackModifiersTotal = selectedAddons.reduce((acc, addon) => {
    return acc + getAddonTotal(addon);
  }, 0);

  const modifiersTotal = toNumber(item.modifiersTotal, fallbackModifiersTotal);

  const baseUnitPrice = getBaseUnitPrice(item);

  const checkoutUnitPrice =
    checkoutType === "pickup"
      ? getPickupAdjustedUnitPrice(item, baseUnitPrice)
      : getDeliveryAdjustedUnitPrice(item, baseUnitPrice);

  const depositUnitAmount = getDepositUnitAmount(item);

  const unitPriceWithModifiers = checkoutUnitPrice + modifiersTotal;
  const itemSubtotal = unitPriceWithModifiers * quantity;
  const depositTotal = depositUnitAmount * quantity;
  const lineTotal = itemSubtotal + depositTotal;

  return {
    quantity,
    baseUnitPrice,
    checkoutUnitPrice,
    modifiersTotal,
    unitPriceWithModifiers,
    itemSubtotal,
    depositUnitAmount,
    depositTotal,
    lineTotal,
    selectedAddons,
    selectedSections: getSelectedSections(item),
  };
};

export default function CartSummarySection({
  title = "Cart Summary",
  cartItems,
  updateQuantity,
  deleteItem,
  clearCart,
  onPlaceOrder,
  placingOrder,
  couponCode,
  setCouponCode,
  onApplyCoupon,
  couponDiscount = 0,
  validatingCoupon,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const checkoutType = getCheckoutType(searchParams.get("type"));
  const canEditCart = title !== "Order Details";

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

  const deliveryFee = checkoutType === "delivery" ? 0 : 0;
  const taxes = 0;
  const discount = toNumber(couponDiscount, 0);

  const totalBeforeDiscount = itemTotal + depositTotal + deliveryFee + taxes;
  const finalTotal = Math.max(0, totalBeforeDiscount - discount);

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

  return (
    <div className="sticky top-10 space-y-[42.63px]">
      <section className="space-y-[20.37px]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-medium text-gray-900">{title}</h2>
            <p className="mt-1 text-xs capitalize text-gray-400">
              {checkoutType === "pickup"
                ? "Pickup pricing is applied"
                : "Delivery pricing is applied"}
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
                Add More Items
              </button>
            ) : null}

            {cartItems.length > 0 ? (
              <button
                type="button"
                onClick={clearCart}
                className="cursor-pointer text-sm text-red-500 hover:underline"
              >
                Clear Cart
              </button>
            ) : null}
          </div>
        </div>

        {cartItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 p-5 text-center">
            <p className="text-sm font-medium text-gray-700">Your cart is empty</p>
            <p className="mt-1 text-xs text-gray-400">
              Add items from the menu to start building the order.
            </p>

            {canEditCart ? (
              <button
                type="button"
                onClick={handleAddMoreItems}
                className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-full border border-primary/15 bg-white px-4 text-sm font-medium text-primary shadow-sm transition hover:border-primary/25 hover:bg-primary/5"
              >
                <Plus size={14} strokeWidth={2.5} />
                Browse Items
              </button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-[19px]">
            {pricingItems.map(({ item, pricing }) => {
              const {
                quantity,
                checkoutUnitPrice,
                baseUnitPrice,
                modifiersTotal,
                unitPriceWithModifiers,
                lineTotal,
                depositUnitAmount,
                depositTotal,
                selectedAddons,
                selectedSections,
              } = pricing;

              const selectedVariationName = getSelectedVariationName(item);
              const isSplitPizza = selectedSections.length > 0;

              return (
                <div
                  key={item.id}
                  className="group relative rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition hover:shadow-md"
                >
                  <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => handleEditItem(item)}
                      className="rounded-md bg-gray-100 p-1 transition hover:bg-primary/10"
                      aria-label={`Edit ${item.name}`}
                    >
                      <Pencil size={14} className="text-gray-700" />
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteItem(item.id)}
                      className="rounded-md bg-red-100 p-1 transition hover:bg-red-200"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 size={14} className="text-red-600" />
                    </button>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-[12px]">
                      <Image
                        src={getItemImage(item)}
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

                        {selectedVariationName ? (
                          <p className="mt-1 text-xs text-gray-500">
                            Size: {selectedVariationName}
                          </p>
                        ) : null}

                        {checkoutType === "pickup" ? (
                          <p className="mt-1 text-xs font-medium text-primary">
                            Pickup price: {formatCurrency(checkoutUnitPrice)} each
                          </p>
                        ) : null}
                      </div>

                      {isSplitPizza ? (
                        <div className="rounded-[12px] border border-primary/10 bg-primary/5 px-3 py-2">
                          <div className="mb-2 flex items-center gap-2">
                            <Layers2 size={14} className="text-primary" />
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                              Split Pizza
                            </p>
                          </div>

                          <div className="space-y-1.5">
                            {selectedSections.map((section, index) => (
                              <div
                                key={`${item.id}-section-${section.slot || index}`}
                                className="flex items-center justify-between gap-3 text-xs"
                              >
                                <span className="min-w-0 truncate text-gray-700">
                                  <span className="font-semibold">
                                    {section.slot || `Side ${index + 1}`}:
                                  </span>{" "}
                                  {section.menuItemName || "Selected item"}
                                </span>

                                {toNumber(section.unitPrice, 0) > 0 ? (
                                  <span className="shrink-0 font-medium text-gray-800">
                                    {formatCurrency(section.unitPrice)}
                                  </span>
                                ) : null}
                              </div>
                            ))}
                          </div>

                          <p className="mt-2 text-[11px] text-gray-500">
                            Highest half price is used for the base item price.
                          </p>
                        </div>
                      ) : null}

                      {selectedAddons.length > 0 ? (
                        <div className="rounded-[10px] border border-gray-100 bg-gray-50 px-3 py-2">
                          <div className="mb-1.5 flex items-center justify-between gap-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                              Add-ons
                            </p>
                          </div>

                          <div className="space-y-1">
                            {selectedAddons.map((addon, index) => {
                              const addonName =
                                String(addon.name || "").trim() || "Add-on";

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
                                      : "Free"}
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
                            Deposit
                          </span>

                          <span className="font-semibold text-amber-700">
                            {formatCurrency(depositUnitAmount)}
                            {quantity > 1 ? ` × ${quantity}` : ""}
                          </span>
                        </div>
                      ) : null}

                      {item.note ? (
                        <p className="rounded-md bg-yellow-50 px-2 py-1 text-[11px] text-yellow-700">
                          Note: {item.note}
                        </p>
                      ) : null}

                      <div className="flex justify-between py-[4px]">
                        <div>
                          <p className="text-base font-medium text-primary">
                            {formatCurrency(lineTotal)}
                          </p>

                          <div className="space-y-0.5">
                            <p className="text-[11px] text-gray-400">
                              {formatCurrency(unitPriceWithModifiers)} each
                            </p>

                            {selectedAddons.length > 0 ? (
                              <p className="text-[11px] text-gray-400">
                                Price {formatCurrency(baseUnitPrice)} + add-ons{" "}
                                {formatCurrency(modifiersTotal)}
                              </p>
                            ) : null}

                            {depositTotal > 0 ? (
                              <p className="text-[11px] text-gray-400">
                                Includes deposit {formatCurrency(depositTotal)}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex items-center gap-[12px]">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, "dec")}
                            className="flex h-[20px] w-[20px] items-center justify-center rounded-sm border border-gray-900 text-gray-900 transition-colors hover:border-primary hover:text-primary"
                          >
                            <Minus size={13} strokeWidth={3} />
                          </button>

                          <span className="w-4 text-center text-base text-gray-900">
                            {quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, "inc")}
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
          Bill details
        </h2>

        <div className="space-y-4 text-sm text-gray-500">
          <div className="flex items-center justify-between">
            <span>Item Total</span>
            <span>{formatCurrency(itemTotal)}</span>
          </div>

          {depositTotal > 0 ? (
            <div className="flex items-center justify-between text-amber-700">
              <div className="flex items-center gap-1">
                <span>Deposit</span>
                <Info size={16} />
              </div>
              <span>{formatCurrency(depositTotal)}</span>
            </div>
          ) : null}

          {checkoutType === "delivery" ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span>Delivery Fee</span>
                <Info size={16} />
              </div>
              <span>{formatCurrency(deliveryFee)}</span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-primary">
              <span>Pickup selected</span>
              <span>No delivery fee</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span>Taxes and Charges</span>
              <Info size={16} />
            </div>
            <span>{formatCurrency(taxes)}</span>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={couponCode || ""}
            onChange={(e) => setCouponCode?.(e.target.value)}
            placeholder="Enter coupon code"
            className="flex-1 rounded-md border px-3 py-2 text-sm"
          />

          <Button
            type="button"
            onClick={onApplyCoupon}
            disabled={validatingCoupon}
            className="h-[42px] text-white"
          >
            {validatingCoupon ? "Applying..." : "Apply"}
          </Button>
        </div>

        {discount > 0 ? (
          <div className="flex items-center gap-2 rounded-md bg-green-100 p-3 text-sm font-medium text-green-700">
            <TicketPercent width={16} height={16} />
            Coupon Applied
          </div>
        ) : null}

        <div className="space-y-[15px]">
          <div className="flex items-center justify-between pt-[15px] text-sm text-gray-500">
            <span>Total before discount</span>
            <span>{formatCurrency(totalBeforeDiscount)}</span>
          </div>

          {discount > 0 ? (
            <div className="flex items-center justify-between pb-[15px] text-sm text-green-600">
              <span>Discount</span>
              <span>- {formatCurrency(discount)}</span>
            </div>
          ) : null}

          <div className="flex items-center justify-between text-[24px] font-medium text-gray-900">
            <span>Total</span>
            <span>{formatCurrency(finalTotal)}</span>
          </div>
        </div>

        {canEditCart && cartItems.length > 0 ? (
          <button
            type="button"
            onClick={handleAddMoreItems}
            className="mt-[15px] inline-flex h-[48px] w-full items-center justify-center gap-2 rounded-[10px] border border-primary/15 bg-primary/5 text-base font-medium text-primary transition hover:border-primary/25 hover:bg-primary/10"
          >
            <Plus size={17} strokeWidth={2.5} />
            Add More Items
          </button>
        ) : null}

        {title !== "Order Details" ? (
          <Button
            onClick={onPlaceOrder}
            disabled={placingOrder || cartItems.length === 0}
            variant="primary"
            className="mt-[15px] h-[54px] w-full cursor-pointer rounded-[10px] text-base font-medium shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {placingOrder ? "Placing Order..." : "Place Order"}
          </Button>
        ) : null}
      </section>
    </div>
  );
}