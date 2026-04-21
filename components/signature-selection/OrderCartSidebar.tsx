"use client";

import Image from "next/image";
import { Minus, Plus, Tag, X, ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import useApi from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

type CartItem = {
  id: string;
  menuItemId?: string;
  quantity: number;
  name: string;
  price: number;
  desc?: string;
  img?: string;
};

type OrderCartSidebarProps = {
  customerId?: string;
  cartRefreshKey: number;
  onCartRefresh?: () => void;
};

export default function OrderCartSidebar({
  customerId,
  cartRefreshKey,
  onCartRefresh,
}: OrderCartSidebarProps) {
  const router = useRouter();
  const { token } = useAuth();
  const { get, patch, del } = useApi(token);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchCart = async () => {
    if (!customerId) return;

    try {
      setLoadingCart(true);

      const res = await get(`/v1/cart?customerId=${customerId}`);
      if (!res || res.error) {
        setCartItems([]);
        return;
      }

      const items = res?.data?.items || [];

      const formatted: CartItem[] = items.map((i: any) => ({
        id: i.id,
        menuItemId: i.menuItemId,
        quantity: Number(i.quantity || 1),
        name: i.menuItem?.name || "Untitled Item",
        price: Number(
          i.unitPrice ??
            i.price ??
            i.menuItem?.unitPrice ??
            i.menuItem?.basePrice ??
            0
        ),
        desc: i.menuItem?.description || "",
        img: i.menuItem?.imageUrl || "",
      }));

      setCartItems(formatted);
    } catch (err) {
      console.error(err);
      setCartItems([]);
    } finally {
      setLoadingCart(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [customerId, cartRefreshKey]);

  const totalItems = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.quantity, 0),
    [cartItems]
  );

  const subtotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cartItems]
  );

  const updateQuantity = async (id: string, type: "inc" | "dec") => {
    const item = cartItems.find((i) => i.id === id);
    if (!item || !customerId) return;

    const newQty =
      type === "inc" ? item.quantity + 1 : Math.max(1, item.quantity - 1);

    try {
      setActionId(id);

      const res = await patch(`/v1/cart/items/${id}?customerId=${customerId}`, {
        quantity: newQty,
      });

      if (!res || res.error) {
        toast.error(res?.error || "Failed to update quantity");
        return;
      }

      setCartItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, quantity: newQty } : i))
      );

      onCartRefresh?.();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update quantity");
    } finally {
      setActionId(null);
    }
  };

  const deleteItem = async (id: string) => {
    if (!customerId) return;

    try {
      setActionId(id);

      const res = await del(`/v1/cart/items/${id}?customerId=${customerId}`);

      if (!res || res.error) {
        toast.error(res?.error || "Failed to remove item");
        return;
      }

      toast.success("Item removed");
      setCartItems((prev) => prev.filter((i) => i.id !== id));
      onCartRefresh?.();
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove item");
    } finally {
      setActionId(null);
    }
  };

  return (
    <aside className="border-l border-black/5 bg-white/95 px-4 py-5 backdrop-blur-sm sm:px-6 xl:sticky xl:top-0 xl:h-screen xl:overflow-y-auto shadow-[-12px_0_32px_0_rgba(26,28,28,0.04)]">
      <div className="mx-auto flex h-full max-w-[320px] flex-col">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#1f1f1f]">
            Your Order
          </h2>

          <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
            {totalItems} {totalItems === 1 ? "Item" : "Items"}
          </span>
        </div>

        {loadingCart ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : cartItems.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-black/10 bg-[#fafafa] p-5 text-center">
            <p className="text-sm text-[#777]">Your cart is empty.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[18px] border border-black/5 bg-white p-3 shadow-[0_6px_20px_rgba(15,23,42,0.04)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative h-[64px] w-[64px] shrink-0 overflow-hidden rounded-[16px] bg-[#f4f4f4]">
                      <Image
                        src={item.img || "/placeholder.png"}
                        alt={item.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="line-clamp-2 text-[13px] font-medium leading-5 text-[#222]">
                            {item.name}
                          </h3>
                        </div>

                        <button
                          onClick={() => deleteItem(item.id)}
                          disabled={actionId === item.id}
                          className="mt-0.5 shrink-0 text-[#a3a3a3] transition hover:text-[#222] disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <div className="flex h-8 items-center overflow-hidden rounded-full border border-black/5 bg-[#f7f7f7] px-1.5">
                          <button
                            onClick={() => updateQuantity(item.id, "dec")}
                            disabled={actionId === item.id}
                            className="flex h-6 w-6 items-center justify-center rounded-full text-[#666] transition hover:bg-white hover:text-[#222] disabled:opacity-50"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>

                          <span className="w-7 text-center text-[13px] font-medium text-[#222]">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() => updateQuantity(item.id, "inc")}
                            disabled={actionId === item.id}
                            className="flex h-6 w-6 items-center justify-center rounded-full text-[#666] transition hover:bg-white hover:text-[#222] disabled:opacity-50"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <span className="shrink-0 text-[13px] font-medium text-[#222]">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[18px] border border-sky-100 bg-sky-50/80 p-4">
              <div className="flex items-start gap-2 text-[13px] leading-5 text-sky-700">
                <Tag className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Add ‘Vivid Signature Sauce’ for just $2.00?</span>
              </div>
            </div>
          </>
        )}

        <div className="mt-auto pt-12">
          <div className="space-y-3 border-t border-black/5 pt-6">
            <div className="flex items-center justify-between text-[13px] text-[#8b8b8b]">
              <span>Subtotal</span>
              <span className="font-medium text-[#666]">
                ${subtotal.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between text-[13px] text-[#8b8b8b]">
              <span>Delivery Fee</span>
              <span className="font-medium text-sky-600">FREE</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[22px] font-semibold tracking-[-0.02em] text-[#222]">
                Total
              </span>
              <span className="text-[22px] font-semibold tracking-[-0.02em] text-[#222]">
                ${subtotal.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={() => router.push("/checkout")}
            disabled={!cartItems.length}
            className="mt-6 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-[14px] font-medium text-primary-foreground shadow-[0_10px_24px_rgba(0,0,0,0.10)] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Proceed to Checkout
            <ArrowRight className="h-4 w-4" />
          </button>

          <p className="mt-4 text-center text-[11px] text-[#b0b0b0]">
            Average delivery time: 25–35 mins
          </p>
        </div>
      </div>
    </aside>
  );
}