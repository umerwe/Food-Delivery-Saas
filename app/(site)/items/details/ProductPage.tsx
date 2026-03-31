"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import TestimonialsSection from "./Testimonials";
import useApi from "@/hooks/useApi";
import { useAuthContext } from "@/context/AuthContext";
import { toast } from "sonner";
import useBranchSelector from "@/hooks/useBranchSelector";
import BranchPopup from "@/components/popups/BranchPopup";

export default function ProductPage() {
  const params = useSearchParams();
  const slug = params.get("slug");

  const { token } = useAuthContext();
  const { get, post } = useApi(token);
  const router = useRouter();

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [qty, setQty] = useState(1);
  const [instructions, setInstructions] = useState("");

  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<any>({});

  /* ---------------- FETCH ITEM ---------------- */
  const fetchItem = async () => {
    if (!slug) return;

    const res = await get(`/v1/menu/items?search=${slug}`);

    if (!res?.error && res.data?.length > 0) {
      const data = res.data[0];
      setItem(data);

      if (data.variations?.length > 0) {
        setSelectedVariation(data.variations[0]);
      }
    }
  };

  useEffect(() => {
    fetchItem();
  }, [slug]);

  /* ---------------- MODIFIER HANDLER ---------------- */
  const handleModifierChange = (groupId: string, modifier: any, checked: boolean) => {
    setSelectedModifiers((prev: any) => {
      const current = prev[groupId] || [];

      if (checked) {
        return { ...prev, [groupId]: [...current, modifier] };
      } else {
        return {
          ...prev,
          [groupId]: current.filter((m: any) => m.id !== modifier.id),
        };
      }
    });
  };

  /* ---------------- PRICE CALC ---------------- */
  const basePrice = selectedVariation
    ? Number(selectedVariation.price)
    : Number(item?.basePrice || 0);

  const modifiersTotal = Object.values(selectedModifiers).flat().reduce(
    (acc: number, m: any) => acc + Number(m.priceDelta || 0),
    0
  );

  const totalPrice = (basePrice + modifiersTotal) * qty;

  /* ---------------- ADD TO CART ---------------- */
  const handleAddToCart = async () => {
    try {
      setLoading(true);

      const auth = JSON.parse(localStorage.getItem("auth") || "{}");
      const customerId = auth?.user?.id;
      const branchId = auth?.user?.branchId;

      if (!branchId || showBranchPopup === false) {
        await fetchBranches();
        setShowBranchPopup(true);
        return;
      }

      const res = await post(`/v1/cart/items?customerId=${customerId}`, {
        menuItemId: item.id,
        quantity: qty,
        branchId,
        variationId: selectedVariation?.id || null,
        modifiers: Object.values(selectedModifiers)
          .flat()
          .map((m: any) => ({
            modifierId: m.id,
            quantity: 1,
          })),
        note: instructions,
      });

      if (!res || res.error) {
        toast.error("Failed to add");
        return;
      }

      toast.success("Added to cart");
      router.push("/checkout");
    } finally {
      setLoading(false);
    }
  };

  const {
    showBranchPopup,
    setShowBranchPopup,
    branches,
    loadingBranches,
    fetchBranches,
    selectBranch,
  } = useBranchSelector(handleAddToCart);

  if (!item) return <p className="p-10">Loading...</p>;

  return (
    <>
      <div className="mx-auto px-4 sm:px-6 md:px-10 lg:px-40 py-6 md:py-10 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">

        {/* LEFT */}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl overflow-hidden">
            <Image
              src={item.imageUrl || "/placeholder.png"}
              alt={item.name}
              width={600}
              height={600}
              className="w-full h-[250px] sm:h-[350px] md:h-auto object-cover"
            />
          </div>

          {/* EXTRA INFO (minimal, no UI break) */}
          <div className="text-xs text-gray-400">
            <p>SKU: {item.sku}</p>
            <p>Prep Time: {item.prepTimeMinutes} mins</p>
          </div>

          {/* INGREDIENTS */}
          <div>
            <h3 className="font-semibold mb-2">Ingredients</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Our beef is 100% pasture-raised, aged for 21 days for maximum flavor density. We use Vermont white cheddar, heirloom beefsteak tomatoes from local farms, wild-grown crisp lettuce, and our proprietary butter-toasted brioche bun.
            </p>
          </div>

          {/* NUTRITION */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Nutritional Information</h3>
            <div className="text-sm text-gray-600 rounded-xl overflow-hidden">
              <div className="flex justify-between py-2 text-xs uppercase text-gray-400 bg-gray-50">
                <span>Metric</span>
                <span>Per Serving (14oz)</span>
              </div>

              {[
                ["Energy", "1,120 kcal"],
                ["Protein", "68g"],
                ["Total Fat", "84g"],
                ["Carbohydrates", "0g"],
                ["Sodium", "840mg"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-3">
                  <span>{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>

            {/* DIETARY */}
            <div className="mt-4 flex flex-wrap gap-2">
              {item.dietaryFlags?.map((f: string) => (
                <span key={f} className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                  {f}
                </span>
              ))}
            </div>

            {/* ALLERGENS */}
            <div className="mt-3 flex flex-wrap gap-2">
              {item.allergenFlags?.map((f: string) => (
                <span key={f} className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-5">

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">
              {item.category?.name || "Best Seller"}
            </p>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mt-1">
              {item.name}
            </h1>

            <div className="flex gap-2 text-sm text-gray-500 mt-2">
              <span className="text-orange-500 font-medium">★ 4.8</span>
              <span>(150 reviews)</span>
              <span>• 20–25 mins delivery</span>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            Experience the ultimate crunch. Two 4oz aged beef patties smashed to perfection, topped with molten Vermont cheddar, heirloom tomatoes, and secret sauce on a toasted brioche.
          </p>

          <div className="text-2xl font-bold text-orange-500">
            ${totalPrice.toFixed(2)}
          </div>

          {/* VARIATIONS (base added inside same UI) */}
          <div>
            <p className="font-medium mb-2">Select Size</p>

            <div className="flex gap-3 flex-wrap">
              {/* BASE */}
              <button
                onClick={() => setSelectedVariation(null)}
                className={`px-4 py-2 rounded-xl border ${
                  !selectedVariation ? "border-orange-500" : "border-gray-200"
                }`}
              >
                Base (${item.basePrice})
              </button>

              {item.variations?.map((v: any) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariation(v)}
                  className={`px-4 py-2 rounded-xl border ${
                    selectedVariation?.id === v.id
                      ? "border-orange-500"
                      : "border-gray-200"
                  }`}
                >
                  {v.name} (+${v.price})
                </button>
              ))}
            </div>
          </div>

          {/* MODIFIERS */}
          {item.modifierLinks?.map((group: any) => (
            <div key={group.id}>
              <p className="font-medium mb-2">
                {group.modifierGroup.name}
              </p>

              <div className="grid grid-cols-2 gap-2">
                {group.modifierGroup.modifiers.map((m: any) => (
                  <label
                    key={m.id}
                    className="flex justify-between bg-gray-50 px-3 py-2 rounded-lg text-sm"
                  >
                    <div className="flex gap-2">
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
                    </div>

                    <span className="text-orange-500">
                      +${m.priceDelta}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {/* INSTRUCTIONS */}
          <div>
            <p className="font-medium mb-2">Special Instructions</p>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Add cooking notes (e.g., no onions, extra spicy)..."
              className="w-full bg-gray-100 rounded-xl p-3 text-sm h-24"
            />
          </div>

          {/* QTY + CTA (restored UI) */}
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 rounded-full">
              <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <span className="px-4">{qty}</span>
              <button onClick={() => setQty(qty + 1)}>+</button>
            </div>

            <button
              onClick={handleAddToCart}
              className="flex-1 bg-orange-500 text-white py-3 rounded-full"
            >
              Add to Cart | ${totalPrice.toFixed(2)}
            </button>
          </div>
        </div>
      </div>

      <TestimonialsSection />

      <BranchPopup
        show={showBranchPopup}
        onClose={() => setShowBranchPopup(false)}
        branches={branches}
        loading={loadingBranches}
        onSelect={selectBranch}
      />
    </>
  );
}