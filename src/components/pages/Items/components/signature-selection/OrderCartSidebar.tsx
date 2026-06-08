"use client";

import Image from "next/image";
import { Minus, Plus, Tag, X, ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import type { CartItemRecord } from "./types";
import { getCartItemUnitPrice, toNumber } from "./signature-selection-utils";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type CartItem = {
  id: string;
  type?: string;
  menuItemId?: string;
  dealId?: string | null;
  quantity: number;
  name: string;
  unitPrice: number;
  lineTotal: number;
  desc?: string;
  img?: string;
  selectedVariationName?: string;
  includedItems?: Array<{ id?: string; menuItemId?: string; name: string; quantity: number }>;
};

type OrderCartSidebarProps = {
  customerId?: string;
  cartRefreshKey: number;
  onCartRefresh?: () => void;
};

export function OrderCartSidebar({
  customerId,
  cartRefreshKey,
  onCartRefresh,
}: OrderCartSidebarProps) {
  const t = useTranslations("cart");
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
  const [loadingCart, setLoadingCart] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchCart = async () => {
    if (!customerId) return;

    try {
      setLoadingCart(true);

      const { response: res, items } = await fetchCustomerCart({ customerId });

      if (!res || res.error) {
        setCartItems([]);
        return;
      }

      const formatted: CartItem[] = items.map((item) => {
        const record = item as CartItemRecord & {
          type?: string;
          deal?: { title?: string; imageUrl?: string };
          includedItems?: Array<{
            id?: string;
            menuItemId?: string;
            quantity?: number | string;
            menuItem?: { name?: string };
            name?: string;
          }>;
        };
        const quantity = toNumber(item.quantity, 1);
        const unitPrice = getCartItemUnitPrice(item);
        const isDealItem = String(record.type || "").toUpperCase() === "DEAL";

        return {
          id: String(item.id ?? ""),
          type: record.type,
          menuItemId: item.menuItemId ? String(item.menuItemId) : undefined,
          dealId: typeof item.dealId === "string" ? item.dealId : null,
          quantity,
          name: isDealItem
            ? record.deal?.title || t("untitledItem")
            : item.menuItem?.name || t("untitledItem"),
          unitPrice,
          lineTotal: toNumber(item.lineTotal, unitPrice * quantity),
          desc: isDealItem ? "" : item.menuItem?.description || "",
          img: isDealItem ? record.deal?.imageUrl || "" : item.menuItem?.imageUrl || "",
          selectedVariationName: isDealItem ? "" : item.menuItem?.selectedVariation?.name || "",
          includedItems: Array.isArray(record.includedItems)
            ? record.includedItems.map((includedItem) => ({
                id: includedItem.id,
                menuItemId: includedItem.menuItemId,
                name: includedItem.menuItem?.name || includedItem.name || t("untitledItem"),
                quantity: toNumber(includedItem.quantity, 1),
              }))
            : [],
        };
      });

      setCartItems(formatted);
    } catch (err) {
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
    () => cartItems.reduce((acc, item) => acc + item.lineTotal, 0),
    [cartItems]
  );

  const updateQuantity = async (id: string, type: "inc" | "dec") => {
    const item = cartItems.find((i) => i.id === id);
    if (!item || !customerId) return;

    const newQty =
      type === "inc" ? item.quantity + 1 : Math.max(1, item.quantity - 1);

    try {
      setActionId(id);

      const isDealItem = String(item.type || "").toUpperCase() === "DEAL";
      const res = isDealItem && item.dealId
        ? await updateCustomerCartDealQuantity({ customerId, dealId: item.dealId, quantity: newQty })
        : await updateCustomerCartItemQuantity({ customerId, cartItemId: id, quantity: newQty });

      if (!res || res.error) {
        toast.error(res?.error || t("failedUpdateQuantity"));
        return;
      }

      setCartItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                quantity: newQty,
                lineTotal: i.unitPrice * newQty,
              }
            : i
        )
      );

      onCartRefresh?.();
    } catch (err) {
      toast.error(t("failedUpdateQuantity"));
    } finally {
      setActionId(null);
    }
  };

  const deleteItem = async (id: string) => {
    if (!customerId) return;
    const item = cartItems.find((i) => i.id === id);

    try {
      setActionId(id);

      const isDealItem = String(item?.type || "").toUpperCase() === "DEAL";
      const res = isDealItem && item?.dealId
        ? await deleteCustomerCartDeal({ customerId, dealId: item.dealId })
        : await deleteCustomerCartItem({ customerId, cartItemId: id });

      if (!res || res.error) {
        toast.error(res?.error || t("failedRemoveItem"));
        return;
      }

      toast.success(t("itemRemoved"));
      setCartItems((prev) => prev.filter((i) => i.id !== id));
      onCartRefresh?.();
    } catch (err) {
      toast.error(t("failedRemoveItem"));
    } finally {
      setActionId(null);
    }
  };

  return (
    <aside className="border-l border-black/5 bg-white/95 px-4 py-5 backdrop-blur-sm sm:px-6 xl:sticky xl:top-0 shadow-[-12px_0_32px_0_rgba(26,28,28,0.04)]">
      <div className="mx-auto flex h-full max-w-[320px] flex-col">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#1f1f1f]">
            {t("yourOrder")}
          </h2>

          <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
            {t("itemCount", { count: totalItems })}
          </span>
        </div>

        {loadingCart ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : cartItems.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-black/10 bg-[#fafafa] p-5 text-center">
            <p className="text-sm text-[#777]">{t("empty")}</p>
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

                          {item.selectedVariationName ? (
                            <p className="mt-0.5 text-[11px] text-[#888]">
                              {item.selectedVariationName}
                            </p>
                          ) : null}

                          {String(item.type || "").toUpperCase() === "DEAL" && item.includedItems?.length ? (
                            <div className="mt-2 rounded-[12px] bg-primary/5 px-2.5 py-2">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                                {t("dealIncludes")}
                              </p>
                              <div className="mt-1 space-y-0.5">
                                {item.includedItems.map((includedItem, index) => (
                                  <p
                                    key={includedItem.id || includedItem.menuItemId || `${item.id}-${index}`}
                                    className="truncate text-[11px] text-[#666]"
                                  >
                                    {includedItem.name} × {includedItem.quantity}
                                  </p>
                                ))}
                              </div>
                            </div>
                          ) : null}
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
                          ${item.lineTotal.toFixed(2)}
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
                <span>{t("sauceUpsell")}</span>
              </div>
            </div>
          </>
        )}

        <div className="mt-auto pt-12">
          <div className="space-y-3 border-t border-black/5 pt-6">
            <div className="flex items-center justify-between text-[13px] text-[#8b8b8b]">
              <span>{t("subtotal")}</span>
              <span className="font-medium text-[#666]">
                ${subtotal.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between text-[13px] text-[#8b8b8b]">
              <span>{t("deliveryFee")}</span>
              <span className="font-medium text-sky-600">{t("free")}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[22px] font-semibold tracking-[-0.02em] text-[#222]">
                {t("total")}
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
            {t("proceedToCheckout")}
            <ArrowRight className="h-4 w-4" />
          </button>

          <p className="mt-4 text-center text-[11px] text-[#b0b0b0]">
            {t("averageDeliveryTime")}
          </p>
        </div>
      </div>
    </aside>
  );
}
