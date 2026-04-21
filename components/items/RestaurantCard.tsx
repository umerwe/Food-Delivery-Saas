"use client";

import Image from "next/image";
import { Plus, Info, Loader2, Eye, EyeOff } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useApi from "@/hooks/useApi";
import { useAuthContext } from "@/context/AuthContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function RestaurantCard({ item }: any) {
  const router = useRouter();
  const { token } = useAuthContext();
  const { post, get } = useApi(token);
  const { user } = useAuth();
const [showInfoBox, setShowInfoBox] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const [qty, setQty] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState<any>(
    item?.variations?.length > 0 ? item.variations[0] : null
  );
  const [selectedModifiers, setSelectedModifiers] = useState<any>({});
  const [animateCart, setAnimateCart] = useState(false);

  const customerId = user?.id;
  const branchId = user?.branchId;

  const hasOptions =
    item?.variations?.length > 0 || item?.modifierLinks?.length > 0;

  /* ---------------- PRICE ---------------- */
  const basePrice = Number(item?.basePrice || 0);

  const variationPrice = selectedVariation
    ? Number(selectedVariation.price || 0)
    : 0;

  const modifiersTotal = Object.values(selectedModifiers)
    .flat()
    .reduce((acc: number, m: any) => acc + Number(m.priceDelta || 0), 0);

  const totalPrice = (basePrice + variationPrice + modifiersTotal) * qty;

  /* ---------------- FILTER MODIFIERS ---------------- */
  const filteredModifierLinks = useMemo(() => {
    if (!item?.modifierLinks?.length) return [];

    return item.modifierLinks.filter((group: any) => {
      const groupName = group?.modifierGroup?.name?.trim()?.toLowerCase();

      // if variations exist, skip modifier group named "size"
      if (item?.variations?.length > 0 && groupName === "size") {
        return false;
      }

      // optional variation-aware filtering
      if (group?.variationId && selectedVariation?.id) {
        return group.variationId === selectedVariation.id;
      }

      return true;
    });
  }, [item?.modifierLinks, item?.variations, selectedVariation]);

  /* ---------------- MODIFIERS ---------------- */
  const handleModifierChange = (
    groupId: string,
    modifier: any,
    checked: boolean
  ) => {
    setSelectedModifiers((prev: any) => {
      const current = prev[groupId] || [];

      if (checked) {
        return { ...prev, [groupId]: [...current, modifier] };
      }

      return {
        ...prev,
        [groupId]: current.filter((m: any) => m.id !== modifier.id),
      };
    });
  };

  /* ---------------- ADD TO CART ---------------- */
  async function handleAddToCart() {
    try {
      setLoading(true);

      const groupCode = localStorage.getItem("groupOrderCode");

      if (!groupCode && !branchId) {
        toast.error("Please select a branch");
        return;
      }

      const basePayload = {
        menuItemId: item.id,
        quantity: qty,
        variationId: selectedVariation?.id || null,
        modifiers: Object.values(selectedModifiers)
          .flat()
          .map((m: any) => ({
            modifierId: m.id,
            quantity: 1,
          })),
      };

      let res;

      if (groupCode) {
        const groupOrdersRes = await get("/v1/group-orders");
        const groupOrder = groupOrdersRes.data?.find(
          (o: any) => o.inviteCode === groupCode
        );

        if (!groupOrder) {
          toast.error("Invalid group order");
          return;
        }

        res = await post(`/v1/group-orders/${groupOrder.id}/items`, basePayload);
      } else {
        res = await post(`/v1/cart/items?customerId=${customerId}`, {
          ...basePayload,
          branchId,
        });
      }

      if (!res || res.error) {
        toast.error(res?.error || "Failed to add to cart");
        return;
      }

      toast.success("Added to cart");
      router.push("/checkout");

      setAnimateCart(true);
      setTimeout(() => setAnimateCart(false), 700);

      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- CLICK + ---------------- */
  const handlePlusClick = () => {
    const groupCode = localStorage.getItem("groupOrderCode");

    if (!hasOptions) {
      if (!groupCode && !branchId) {
        toast.error("Please select a branch first");
        return;
      }

      handleAddToCart();
      return;
    }

    setOpen(true);
  };

  const handleNavigateToDetails = () => {
    router.push(`/items/details?itemId=${item.id}&slug=${item.slug}`);
  };

  const truncatedDesc =
    item?.description?.length > 90
      ? item.description.slice(0, 90) + "..."
      : item?.description;

      const hasIngredients =
  item?.ingredients && String(item.ingredients).trim() !== "";

const hasNutritionalInformation =
  item?.nutritionalInformation &&
  String(item.nutritionalInformation).trim() !== "";

const hasInfoBoxContent = hasIngredients || hasNutritionalInformation;

  return (
    <>
      {/* CARD */}
      <div className="group relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-lg">
        <div className="flex justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">{item.name}</h3>

            <p className="mb-2 text-xs text-gray-500">
              {truncatedDesc || "Fresh premium item"}
            </p>
         
            <p className="text-sm font-semibold text-gray-900">
              ${Number(item.basePrice || 0).toFixed(2)}
            </p>
{hasInfoBoxContent ? (
  <div className="mt-3">
    <div className="flex justify-end">
      <button
        type="button"
        onClick={() => setShowInfoBox((prev) => !prev)}
        className="rounded-full border border-gray-200 bg-gray-50 p-2 text-gray-500 transition hover:text-primary"
      >
        {showInfoBox ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>

    {showInfoBox ? (
      <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
        <div className="space-y-2 text-xs text-gray-600">
          {hasIngredients ? (
            <div>
              <span className="font-medium text-gray-800">
                Ingredients:
              </span>{" "}
              {item.ingredients}
            </div>
          ) : null}

          {hasNutritionalInformation ? (
            <div>
              <span className="font-medium text-gray-800">
                Nutritional Info:
              </span>{" "}
              {item.nutritionalInformation}
            </div>
          ) : null}
        </div>
      </div>
    ) : null}
  </div>
) : null}
            <button
              onClick={handleNavigateToDetails}
              className="mt-2 flex items-center gap-1 text-xs text-primary"
            >
              <Info size={14} /> Item Info
            </button>
            
          </div>

          <div className="relative h-[110px] w-[120px] overflow-hidden rounded-xl">
            <Image
              src={item.imageUrl || "/placeholder.png"}
              alt={item.name}
              fill
              className="object-cover"
            />

            <button
              onClick={handlePlusClick}
              disabled={loading}
              className="absolute bottom-2 right-2 rounded-full bg-primary p-2 text-white shadow-sm transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            </button>
          </div>
        </div>

        {animateCart && (
          <div className="absolute bottom-6 right-6 h-3 w-3 animate-bounce rounded-full bg-primary" />
        )}
      </div>

      {/* MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[95vh] max-w-md overflow-auto rounded-2xl p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{item.name}</h2>

          {/* VARIATIONS */}
          {item.variations?.length > 0 && (
            <div className="mb-5">
              <p className="mb-2 font-medium text-gray-900">Size</p>

              <div className="grid grid-cols-1 gap-3">
                {item.variations.map((v: any) => (
                  <label
                    key={v.id}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition ${
                      selectedVariation?.id === v.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name={`size-${item.id}`}
                        checked={selectedVariation?.id === v.id}
                        onChange={() => setSelectedVariation(v)}
                        className="accent-[var(--primary)]"
                      />
                      <span className="text-sm font-medium text-gray-800">
                        {v.name}
                      </span>
                    </div>

                    <span className="text-sm font-semibold text-primary">
                      {Number(v.price) > 0 ? `+$${Number(v.price).toFixed(0)}` : "+$0"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* MODIFIERS */}
          {filteredModifierLinks.map((group: any) => (
            <div key={group.id} className="mb-5">
              <p className="mb-2 font-medium text-gray-900">
                {group.modifierGroup.name}
              </p>

              <div className="space-y-2">
                {group.modifierGroup.modifiers.map((m: any) => {
                  const checked =
                    (selectedModifiers[group.modifierGroup.id] || []).some(
                      (selected: any) => selected.id === m.id
                    );

                  return (
                    <label
                      key={m.id}
                      className="flex cursor-pointer items-center justify-between rounded-xl bg-gray-50 px-3 py-3 text-sm"
                    >
                      <span className="flex items-center gap-2 text-gray-800">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            handleModifierChange(
                              group.modifierGroup.id,
                              m,
                              e.target.checked
                            )
                          }
                          className="accent-[var(--primary)]"
                        />
                        {m.name}
                      </span>

                      <span className="font-medium text-primary">
                        +${Number(m.priceDelta || 0).toFixed(0)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          {/* QTY + TOTAL */}
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center rounded-full bg-gray-100 px-3 py-1.5">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="px-2 text-lg text-gray-700"
                disabled={loading}
              >
                −
              </button>
              <span className="px-4 text-sm font-semibold text-gray-900">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                className="px-2 text-lg text-gray-700"
                disabled={loading}
              >
                +
              </button>
            </div>

            <div className="text-lg font-semibold text-primary">
              ${totalPrice.toFixed(2)}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleAddToCart}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Processing..." : "Add to Cart"}
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}