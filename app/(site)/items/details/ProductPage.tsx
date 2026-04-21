"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import TestimonialsSection from "./Testimonials";
import useApi from "@/hooks/useApi";
import { useAuthContext } from "@/context/AuthContext";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

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
const basePrice = Number(item?.basePrice || 0);

const variationPrice = selectedVariation
  ? Number(selectedVariation.price || 0)
  : 0;
  
  const modifiersTotal = Object.values(selectedModifiers).flat().reduce(
    (acc: number, m: any) => acc + Number(m.priceDelta || 0),
    0
  );
const totalPrice = (basePrice + variationPrice + modifiersTotal) * qty;
const { user } = useAuth();
const customerId = user?.id;
const branchId = user?.branchId;

  /* ---------------- ADD TO CART ---------------- */
  const handleAddToCart = async () => {
  try {
    setLoading(true);

    const groupCode = localStorage.getItem("groupOrderCode");


    // 🔥 COMMON BASE PAYLOAD
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
      note: instructions,
    };

    let res;

    // ================= GROUP ORDER FLOW =================
    if (groupCode) {
      // ❗ Resolve group order ID from code
      const groupOrdersRes = await get("/v1/group-orders");

      if (!groupOrdersRes || groupOrdersRes.error) {
        toast.error("Failed to fetch group order");
        return;
      }

      const groupOrder = groupOrdersRes.data?.find(
        (o: any) => o.inviteCode === groupCode
      );

      if (!groupOrder) {
        toast.error("Invalid group order");
        return;
      }

      // 🔥 ADD ITEM TO GROUP ORDER (NO branchId)
      res = await post(
        `/v1/group-orders/${groupOrder.id}/items`,
        basePayload
      );

    } else {
      // ================= NORMAL CART FLOW =================
      const payload = {
        ...basePayload,
        branchId,
      };

      res = await post(
        `/v1/cart/items?customerId=${customerId}`,
        payload
      );
    }
console.log("res is", res);
if (!res || res.error) {
  toast.error(res?.error || res?.message || "Failed to add");
  return;
}

    toast.success(
      groupCode ? "Added to group order" : "Added to cart"
    );

    // 🔥 REDIRECT BASED ON FLOW
    if (groupCode) {
      router.push("/group-order/lobby"); // or lobby later
    } else {
      router.push("/checkout");
    }

  } catch (err) {
    console.error(err);
    toast.error("Something went wrong");
  } finally {
    setLoading(false);
  }
};

  if (!item) return <p className="p-10">Loading...</p>;
const hasIngredients =
  item?.ingredients && String(item.ingredients).trim() !== "";

const hasNutritionalInformation =
  item?.nutritionalInformation &&
  String(item.nutritionalInformation).trim() !== "";

const hasDietaryFlags =
  Array.isArray(item?.dietaryFlags) && item.dietaryFlags.length > 0;

const hasAllergenFlags =
  Array.isArray(item?.allergenFlags) && item.allergenFlags.length > 0;
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
          {item.prepTimeMinutes ? (
  <p>Prep Time: {item.prepTimeMinutes} mins</p>
) : null}
          </div>

                  {/* INGREDIENTS */}
          {hasIngredients ? (
            <div>
              <h3 className="font-semibold mb-2">Ingredients</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {item.ingredients}
              </p>
            </div>
          ) : null}

          {/* NUTRITION */}
        
                  {/* NUTRITION + FLAGS */}
          {hasNutritionalInformation || hasDietaryFlags || hasAllergenFlags ? (
            <div>
              {hasNutritionalInformation ? (
                <>
                  <h3 className="font-semibold text-lg mb-3">
                    Nutritional Information
                  </h3>
                  <div className="text-sm text-gray-600 rounded-xl bg-gray-50 p-4 leading-relaxed">
                    {item.nutritionalInformation}
                  </div>
                </>
              ) : null}

              {hasDietaryFlags ? (
                <div className="mt-4">
                  <h4 className="font-medium text-sm mb-2 text-gray-700">
                    Dietary Preferences
                  </h4>

                  <div className="flex flex-wrap gap-2">
                    {item.dietaryFlags.map((f: string) => (
                      <span
                        key={f}
                        className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {hasAllergenFlags ? (
                <div className="mt-4">
                  <h4 className="font-medium text-sm mb-2 text-gray-700">
                    Allergen Information
                  </h4>

                  <div className="flex flex-wrap gap-2">
                    {item.allergenFlags.map((f: string) => (
                      <span
                        key={f}
                        className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
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
              <span className="text-primary font-medium">★ 4.8</span>
              <span>(150 reviews)</span>
              <span>• 20–25 mins delivery</span>
            </div>
          </div>

          <p className="text-sm text-gray-600">
         {item.description}
          </p>

          <div className="text-2xl font-bold text-primary">
            ${totalPrice.toFixed(2)}
          </div>

        {/* VARIATIONS */}
<div>
  <p className="font-medium mb-2">Size</p>

<div className="grid grid-cols-2 gap-3">
    {item.variations?.map((v: any) => (
      <label
        key={v.id}
        className={`flex justify-between items-center border rounded-xl px-4 py-3 cursor-pointer ${
          selectedVariation?.id === v.id
            ? "border-primary"
            : "border-gray-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <input
            type="radio"
            name="size"
            checked={selectedVariation?.id === v.id}
            onChange={() => setSelectedVariation(v)}
          />
          <span>{v.name}</span>
        </div>

        <span className="text-primary">
          {Number(v.price) > 0 ? `+$${v.price}` : ""}
        </span>
      </label>
    ))}
  </div>
</div>

          {/* MODIFIERS */}
        
        {item.modifierLinks
  ?.filter((group: any) => {
    // 👇 adjust depending on your API structure
    return (
      !group.variationId || 
      group.variationId === selectedVariation?.id
    );
  })
  .map((group: any) => (
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

                    <span className="text-primary">
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
              className="flex-1 bg-primary text-white py-3 rounded-full"
            >
              Add to Cart | ${totalPrice.toFixed(2)}
            </button>
          </div>
        </div>
      </div>

      <TestimonialsSection />

     
    </>
  );
}