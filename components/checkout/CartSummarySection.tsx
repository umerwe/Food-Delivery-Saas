"use client";

import Image from "next/image";
import { Plus, Minus, Info, TicketPercent, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface CartItem {
  id: string;
  menuItemId?: string;
  name: string;
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
  selectedModifiers?: CartAddon[];
  note?: string;
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

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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

const getItemPricing = (item: CartItem) => {
  const quantity = Math.max(1, toNumber(item.quantity, 1));
  const selectedAddons = getSelectedAddons(item);

  const fallbackModifiersTotal = selectedAddons.reduce((acc, addon) => {
    return acc + getAddonTotal(addon);
  }, 0);

  const modifiersTotal = toNumber(item.modifiersTotal, fallbackModifiersTotal);

  const unitPriceWithModifiers = toNumber(
    item.unitPriceWithModifiers ?? item.price,
    toNumber(item.unitPrice, 0) + modifiersTotal
  );

  const baseUnitPrice = toNumber(
    item.itemUnitPrice ?? item.unitPrice,
    Math.max(0, unitPriceWithModifiers - modifiersTotal)
  );

  const lineTotal = toNumber(
    item.lineTotal,
    unitPriceWithModifiers * quantity
  );

  return {
    quantity,
    baseUnitPrice,
    modifiersTotal,
    unitPriceWithModifiers,
    lineTotal,
    selectedAddons,
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
  const itemTotal = cartItems.reduce((acc, item) => {
    return acc + getItemPricing(item).lineTotal;
  }, 0);

  const deliveryFee = 0;
  const taxes = 0;
  const discount = toNumber(couponDiscount, 0);

  const totalBeforeDiscount = itemTotal + deliveryFee + taxes;
  const finalTotal = Math.max(0, totalBeforeDiscount - discount);

  return (
    <div className="sticky top-10 space-y-[42.63px]">
      <section className="space-y-[20.37px]">
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-medium text-gray-900">{title}</h2>

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

        {cartItems.length === 0 ? (
          <p className="text-sm text-gray-400">Your cart is empty</p>
        ) : (
          <div className="space-y-[19px]">
            {cartItems.map((item) => {
              const {
                quantity,
                baseUnitPrice,
                modifiersTotal,
                unitPriceWithModifiers,
                lineTotal,
                selectedAddons,
              } = getItemPricing(item);

              return (
                <div
                  key={item.id}
                  className="group relative flex items-start gap-4"
                >
                  <button
                    type="button"
                    onClick={() => deleteItem(item.id)}
                    className="absolute right-2 top-2 z-10 rounded-md bg-red-100 p-1 opacity-0 transition group-hover:opacity-100"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 size={14} className="text-red-600" />
                  </button>

                  <div className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-[12px]">
                    <Image
                      src={item.img || "/placeholder.png"}
                      alt={item.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-[8px] pr-8">
                    <div>
                      <h4 className="text-base font-medium leading-tight text-gray-900">
                        {item.name}
                      </h4>

                      {item.selectedVariationName ? (
                        <p className="mt-1 text-xs text-gray-500">
                          Size: {item.selectedVariationName}
                        </p>
                      ) : null}
                    </div>

                 

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
                                    ? `+$${addonTotal.toFixed(2)}`
                                    : "Free"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
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
                          ${lineTotal.toFixed(2)}
                        </p>

                        <div className="space-y-0.5">
                          <p className="text-[11px] text-gray-400">
                            ${unitPriceWithModifiers.toFixed(2)} each
                          </p>

                          {selectedAddons.length > 0 ? (
                            <p className="text-[11px] text-gray-400">
                              Price ${baseUnitPrice.toFixed(2)} + add-ons $
                              {modifiersTotal.toFixed(2)}
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
            <span>${itemTotal.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span>Delivery Fee | 12.9 kms</span>
              <Info size={16} />
            </div>
            <span>${deliveryFee.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span>Taxes and Charges</span>
              <Info size={16} />
            </div>
            <span>${taxes.toFixed(2)}</span>
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
            <span>Total</span>
            <span>${totalBeforeDiscount.toFixed(2)}</span>
          </div>

          {discount > 0 ? (
            <div className="flex items-center justify-between pb-[15px] text-sm text-green-600">
              <span>Discount</span>
              <span>- ${discount.toFixed(2)}</span>
            </div>
          ) : null}

          <div className="flex items-center justify-between text-[24px] font-medium text-gray-900">
            <span>Total</span>
            <span>${finalTotal.toFixed(2)}</span>
          </div>
        </div>

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