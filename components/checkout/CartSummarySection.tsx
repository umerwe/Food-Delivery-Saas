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
  id: string; // ✅ FIXED (was number)
  name: string;
  price: number;
  desc: string;
  quantity: number;
  img: string;
}

interface Props {
  title?: string;
  cartItems: CartItem[];
  updateQuantity: (id: string, type: "inc" | "dec") => void;
  deleteItem: (id: string) => void;
  clearCart: () => void;
  onPlaceOrder: () => void;
  placingOrder?: boolean;
}

export default function CartSummarySection({
  title = "Cart Summary",
  cartItems,
  updateQuantity,
  deleteItem,
  clearCart,
  onPlaceOrder,
  placingOrder
}: Props) {
  /* ================= CALCULATIONS ================= */
  const itemTotal = cartItems?.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const deliveryFee = 0;
  const taxes = 0;
  const discount = 0;

  const totalBeforeDiscount = itemTotal + deliveryFee + taxes;
  const finalTotal = totalBeforeDiscount - discount;

  return (
    <div className="sticky top-10 space-y-[42.63px]">
      
      {/* ================= CART ================= */}
      <section className="space-y-[20.37px]">
        
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h2 className="text-[20px] font-medium text-gray-900">
            {title}
          </h2>

          {cartItems?.length > 0 && (
            <button
              onClick={clearCart}
              className="text-sm text-red-500 hover:underline cursor-pointer"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* EMPTY STATE */}
        {cartItems?.length === 0 ? (
          <p className="text-gray-400 text-sm">
            Your cart is empty
          </p>
        ) : (
          <div className="space-y-[19px]">
            {cartItems?.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 group relative"
              >
                {/* DELETE ICON */}
                <button
                  onClick={() => deleteItem(item.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition bg-red-100 p-1 rounded-md"
                >
                  <Trash2 size={14} className="text-red-600" />
                </button>

                {/* IMAGE */}
                <div className="relative w-[76px] h-[76px] rounded-[12px] overflow-hidden shrink-0">
                  <Image
                    src={item.img || "/placeholder.png"}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* CONTENT */}
                <div className="flex-1 space-y-[8px]">
                  <h4 className="text-base font-medium text-gray-900 leading-tight">
                    {item.name}
                  </h4>

                  <p className="text-xs text-gray-900">
                    {item.desc}
                  </p>

                  <div className="flex justify-between py-[4px]">
                    
                    {/* PRICE */}
                    <p className="text-base font-medium text-primary">
                      Rs {item.price}
                    </p>

                    {/* QUANTITY */}
                    <div className="flex items-center gap-[12px]">
                      <button
                        onClick={() => updateQuantity(item.id, "dec")}
                        className="w-[20px] h-[20px] rounded-sm border border-gray-900 flex items-center justify-center text-gray-900 hover:border-primary hover:text-primary transition-colors"
                      >
                        <Minus size={13} strokeWidth={3} />
                      </button>

                      <span className="text-base text-gray-900 w-4 text-center">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() => updateQuantity(item.id, "inc")}
                        className="w-[20px] h-[20px] rounded-sm border border-gray-900 flex items-center justify-center text-gray-900 hover:border-primary hover:text-primary transition-colors"
                      >
                        <Plus size={13} strokeWidth={3} />
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ================= BILL ================= */}
      <section className="space-y-[15px]">
        <h2 className="text-[18px] font-semibold text-gray-900">
          Bill details
        </h2>

        <div className="space-y-4 text-gray-500 text-sm">
          <div className="flex justify-between items-center">
            <span>Item Total</span>
            <span>Rs {itemTotal?.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <span>Delivery Fee | 12.9 kms</span>
              <Info size={16} />
            </div>
            <span>Rs {deliveryFee?.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <span>Taxes and Charges</span>
              <Info size={16} />
            </div>
            <span>Rs {taxes?.toFixed(2)}</span>
          </div>
        </div>

        {/* 🚧 COMMENT THIS LATER IF NEEDED */}
        {/* 
        <div className="bg-primary/20 text-primary text-base p-4 rounded-md flex items-center gap-3 font-medium">
          <TicketPercent width={19} height={19} />
          Coupon Applied
        </div>
        */}

        <div className="space-y-[15px]">
          <div className="flex justify-between items-center text-sm text-gray-500 pt-[15px]">
            <span>Total</span>
            <span>Rs {totalBeforeDiscount?.toFixed(2)}</span>
          </div>

          {/* 🚧 DISCOUNT (COMMENT IF NOT NEEDED) */}
          {/* 
          <div className="flex justify-between items-center text-sm text-gray-500 pb-[15px]">
            <span>Discount</span>
            <span>Rs {discount.toFixed(2)}</span>
          </div>
          */}

          <div className="flex justify-between items-center text-[24px] font-medium text-gray-900">
            <span>Total</span>
            <span>Rs {finalTotal?.toFixed(2)}</span>
          </div>
        </div>

        {title !== "Order Details" && (
        <Button
  onClick={onPlaceOrder}
  disabled={placingOrder} // ✅ disable while loading
  variant="primary"
  className="w-full h-[54px] rounded-[10px] text-base font-medium shadow-lg shadow-primary/20 mt-[15px] disabled:opacity-50"
>
  {placingOrder ? "Placing Order..." : "Place Order"} {/* ✅ text change */}
</Button>
        )}
      </section>
    </div>
  );
}