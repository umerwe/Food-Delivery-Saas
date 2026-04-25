"use client";

import Image from "next/image";
import {
  Plus,
  Minus,
  Info,
  TicketPercent,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface CartItem {
  id: string;
  name: string;
  price: number;
  unitPrice?: number;
  lineTotal?: number;
  desc?: string;
  quantity: number;
  img?: string;
  selectedVariationName?: string;
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
  const itemTotal = cartItems?.reduce((acc, item) => {
    const lineTotal =
      item.lineTotal !== undefined && item.lineTotal !== null
        ? toNumber(item.lineTotal, 0)
        : toNumber(item.price, 0) * toNumber(item.quantity, 1);

    return acc + lineTotal;
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
          <h2 className="text-[20px] font-medium text-gray-900">
            {title}
          </h2>

          {cartItems?.length > 0 && (
            <button
              onClick={clearCart}
              className="cursor-pointer text-sm text-red-500 hover:underline"
            >
              Clear Cart
            </button>
          )}
        </div>

        {cartItems?.length === 0 ? (
          <p className="text-sm text-gray-400">Your cart is empty</p>
        ) : (
          <div className="space-y-[19px]">
            {cartItems?.map((item) => {
              const unitPrice = toNumber(item.unitPrice ?? item.price, 0);
              const lineTotal =
                item.lineTotal !== undefined && item.lineTotal !== null
                  ? toNumber(item.lineTotal, 0)
                  : unitPrice * toNumber(item.quantity, 1);

              return (
                <div
                  key={item.id}
                  className="group relative flex items-center gap-4"
                >
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="absolute right-2 top-2 rounded-md bg-red-100 p-1 opacity-0 transition group-hover:opacity-100"
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

                  <div className="flex-1 space-y-[8px]">
                    <div>
                      <h4 className="text-base font-medium leading-tight text-gray-900">
                        {item.name}
                      </h4>

                      {item.selectedVariationName ? (
                        <p className="mt-1 text-xs text-gray-500">
                          {item.selectedVariationName}
                        </p>
                      ) : null}
                    </div>

                    {item.desc ? (
                      <p className="line-clamp-2 text-xs text-gray-900">
                        {item.desc}
                      </p>
                    ) : null}

                    <div className="flex justify-between py-[4px]">
                      <div>
                        <p className="text-base font-medium text-primary">
                          Rs {lineTotal.toFixed(2)}
                        </p>

                        {item.quantity > 1 ? (
                          <p className="text-[11px] text-gray-400">
                            Rs {unitPrice.toFixed(2)} each
                          </p>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-[12px]">
                        <button
                          onClick={() => updateQuantity(item.id, "dec")}
                          className="flex h-[20px] w-[20px] items-center justify-center rounded-sm border border-gray-900 text-gray-900 transition-colors hover:border-primary hover:text-primary"
                        >
                          <Minus size={13} strokeWidth={3} />
                        </button>

                        <span className="w-4 text-center text-base text-gray-900">
                          {item.quantity}
                        </span>

                        <button
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
            <span>Rs {itemTotal?.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span>Delivery Fee | 12.9 kms</span>
              <Info size={16} />
            </div>
            <span>Rs {deliveryFee?.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span>Taxes and Charges</span>
              <Info size={16} />
            </div>
            <span>Rs {taxes?.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={couponCode}
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

        {discount > 0 && (
          <div className="flex items-center gap-2 rounded-md bg-green-100 p-3 text-sm font-medium text-green-700">
            <TicketPercent width={16} height={16} />
            Coupon Applied
          </div>
        )}

        <div className="space-y-[15px]">
          <div className="flex items-center justify-between pt-[15px] text-sm text-gray-500">
            <span>Total</span>
            <span>Rs {totalBeforeDiscount?.toFixed(2)}</span>
          </div>

          {discount > 0 && (
            <div className="flex items-center justify-between pb-[15px] text-sm text-green-600">
              <span>Discount</span>
              <span>- Rs {discount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-[24px] font-medium text-gray-900">
            <span>Total</span>
            <span>Rs {finalTotal?.toFixed(2)}</span>
          </div>
        </div>

        {title !== "Order Details" && (
          <Button
            onClick={onPlaceOrder}
            disabled={placingOrder}
            variant="primary"
            className="mt-[15px] h-[54px] w-full cursor-pointer rounded-[10px] text-base font-medium shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {placingOrder ? "Placing Order..." : "Place Order"}
          </Button>
        )}
      </section>
    </div>
  );
}