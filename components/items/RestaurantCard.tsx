"use client";

import Image from "next/image";
import { Plus, Info } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useApi from "@/hooks/useApi";
import { useAuthContext } from "@/context/AuthContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import AsyncSelect from "@/components/ui/AsyncSelect";

export default function RestaurantCard({ item }: any) {
  const router = useRouter();
  const { token, setUser } = useAuthContext();
  const { post, get } = useApi(token);
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const [qty, setQty] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<any>({});

  const [selectedBranch, setSelectedBranch] = useState<any>(
  user?.branchId ? { id: user.branchId } : null
);
const [branchId, setBranchId] = useState(user?.branchId || "");

  const [animateCart, setAnimateCart] = useState(false);

  const customerId = user?.id;
  const hasOptions =
    item?.variations?.length > 0 || item?.modifierLinks?.length > 0;

  /* ---------------- PRICE ---------------- */
  const basePrice = selectedVariation
    ? Number(selectedVariation.price)
    : Number(item?.basePrice || 0);

  const modifiersTotal = Object.values(selectedModifiers)
    .flat()
    .reduce((acc: number, m: any) => acc + Number(m.priceDelta || 0), 0);

  const totalPrice = (basePrice + modifiersTotal) * qty;

  /* ---------------- MODIFIERS ---------------- */
  const handleModifierChange = (groupId: string, modifier: any, checked: boolean) => {
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

  /* ---------------- FETCH BRANCHES ---------------- */
  const fetchBranches = async ({ search = "", page = 1 }) => {
    return await get(
      `/v1/branches?restaurantId=${item.restaurantId}&search=${search}&page=${page}`
    );
  };

  /* ---------------- SELECT BRANCH ---------------- */
  const handleBranchSelect = (branch: any) => {
    setSelectedBranch(branch);

    const authRaw = localStorage.getItem("auth");
    const auth = authRaw ? JSON.parse(authRaw) : null;

    if (auth?.user) {
      auth.user.branchId = branch.id;
      localStorage.setItem("auth", JSON.stringify(auth));
    }
    setBranchId(branch.id);
    setUser((prev: any) => ({
      ...prev,
      branchId: branch.id,
    }));

    toast.success("Branch selected");
  };

  /* ---------------- ADD TO CART ---------------- */
  async function handleAddToCart() {
    try {
      setLoading(true);

      const groupCode = localStorage.getItem("groupOrderCode");
     const finalBranchId = branchId || selectedBranch?.id || user?.branchId;

      if (!groupCode && !finalBranchId) {
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

        res = await post(
          `/v1/group-orders/${groupOrder.id}/items`,
          basePayload
        );
      } else {
        res = await post(`/v1/cart/items?customerId=${customerId}`, {
          ...basePayload,
          branchId: finalBranchId,
        });
      }

    if (!res || res.error) {
  toast.error(res?.error || "Failed to add to cart");
  return;
}

      toast.success("Added to cart");
router.push('/checkout');
      setAnimateCart(true);
      setTimeout(() => setAnimateCart(false), 700);

      setOpen(false);
    } catch (err) {
      toast.error("Error");
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- CLICK + ---------------- */
 const handlePlusClick = () => {
  const groupCode = localStorage.getItem("groupOrderCode");
  const existingBranchId = branchId || selectedBranch?.id || user?.branchId;

  if (!hasOptions) {
    if (!groupCode && !existingBranchId) {
      setOpen(true);
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

  return (
    <>
      {/* CARD */}
      <div className="group relative rounded-2xl p-[1px] bg-gradient-to-br from-gray-200 to-gray-50 from-orange-200 to-orange-50 transition">
        <div className="bg-white/90 rounded-2xl p-4 flex justify-between gap-4 shadow hover:shadow-lg transition">

          <div className="flex-1">
            <h3 className="font-semibold text-sm">{item.name}</h3>

            <p className="text-xs text-gray-500 mb-2">
              {truncatedDesc || "Fresh premium item"}
            </p>

            <p className="font-semibold text-sm">${item.basePrice}</p>

            <button
              onClick={handleNavigateToDetails}
              className="text-xs text-orange-500 mt-2 flex items-center gap-1"
            >
              <Info size={14} /> Item Info
            </button>
          </div>

          <div className="relative w-[120px] h-[110px] rounded-xl overflow-hidden">
            <Image
              src={item.imageUrl || "/placeholder.png"}
              alt={item.name}
              fill
              className="object-cover"
            />

            <button
              onClick={handlePlusClick}
              className="absolute bottom-2 right-2 bg-orange-500 text-white p-2 rounded-full"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {animateCart && (
          <div className="absolute right-6 bottom-6 w-3 h-3 bg-orange-500 rounded-full animate-bounce" />
        )}
      </div>

      {/* MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 max-h-[95vh] overflow-auto">

          <h2 className="text-lg font-semibold mb-3">{item.name}</h2>

          {/* BRANCH */}
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Select Branch</p>
              <AsyncSelect
                value={selectedBranch}
                onChange={handleBranchSelect}
                placeholder="Choose branch"
                fetchOptions={fetchBranches}
              />
            </div>
        

          {/* VARIATIONS */}
          {item.variations?.length > 0 && (
            <div className="mb-4">
              <p className="font-medium mb-2">Choose Option</p>
              <div className="flex gap-2 flex-wrap">
                {item.variations.map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariation(v)}
                    className={`px-3 py-1 rounded-full text-sm border ${
                      selectedVariation?.id === v.id
                        ? "bg-orange-500 text-white"
                        : ""
                    }`}
                  >
                    {v.name} (+${v.price})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 🔥 MODIFIERS BACK */}
          {item.modifierLinks?.map((group: any) => (
            <div key={group.id} className="mb-4">
              <p className="font-medium mb-2">
                {group.modifierGroup.name}
              </p>

              <div className="space-y-2">
                {group.modifierGroup.modifiers.map((m: any) => (
                  <label
                    key={m.id}
                    className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg text-sm cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        onChange={(e) =>
                          handleModifierChange(
                            group.modifierGroup.id,
                            m,
                            e.target.checked
                          )
                        }
                      />
                      {m.name}
                    </span>

                    <span className="text-orange-500">
                      +${m.priceDelta}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {/* QTY + PRICE */}
          <div className="flex justify-between mb-4">
            <div className="flex bg-gray-100 rounded-full px-3">
              <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <span className="px-4">{qty}</span>
              <button onClick={() => setQty(qty + 1)}>+</button>
            </div>

            <div className="font-semibold text-orange-500">
              ${totalPrice.toFixed(2)}
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full bg-orange-500 text-white py-3 rounded-full"
          >
            Add to Cart
          </button>

        </DialogContent>
      </Dialog>
    </>
  );
}