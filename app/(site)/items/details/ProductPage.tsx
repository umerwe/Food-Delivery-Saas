"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import TestimonialsSection from "./Testimonials";
import useApi from "@/hooks/useApi";
import { useAuthContext } from "@/context/AuthContext";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Minus, Plus } from "lucide-react";

type ItemPriceOverride = {
  id?: string;
  menuItemId?: string;
  price?: string | number;
  priceDelta?: string | number;
};

type VariationPriceOverride = {
  id?: string;
  variationId?: string;
  price?: string | number;
  priceDelta?: string | number;
};

type MenuVariation = {
  id: string;
  categoryId?: string;
  name: string;
  description?: string | null;
  price: string | number;
  sortOrder?: number;
  isDefault?: boolean;
  isActive?: boolean;
};

type Modifier = {
  id: string;
  modifierGroupId?: string;
  name: string;
  priceDelta?: string | number;
  sortOrder?: number;
  isActive?: boolean;
  itemPriceOverrides?: ItemPriceOverride[];
  variationPriceOverrides?: VariationPriceOverride[];
};

type ModifierGroup = {
  id: string;
  name: string;
  description?: string;
  minSelect?: number;
  maxSelect?: number;
  isRequired?: boolean;
  sortOrder?: number;
  modifiers: Modifier[];
};

type ModifierLink = {
  id: string;
  variationId?: string | null;
  sortOrder?: number;
  modifierGroup: ModifierGroup;
};

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

  const [selectedVariation, setSelectedVariation] =
    useState<MenuVariation | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<
    Record<string, Modifier[]>
  >({});

  const { user } = useAuth();
  const customerId = user?.id;
  const branchId = user?.branchId;

  const getItemVariations = (menuItem: any): MenuVariation[] => {
    const rawVariations = [
      ...(Array.isArray(menuItem?.variations) ? menuItem.variations : []),
      ...(Array.isArray(menuItem?.category?.variations)
        ? menuItem.category.variations
        : []),
    ];

    const map = new Map<string, MenuVariation>();

    rawVariations.forEach((variation: MenuVariation) => {
      if (!variation?.id || variation?.isActive === false) return;
      const key = String(variation.id);

      if (!map.has(key)) {
        map.set(key, variation);
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => Number(a?.sortOrder || 0) - Number(b?.sortOrder || 0)
    );
  };

  const getItemModifierLinks = (menuItem: any): ModifierLink[] => {
    const rawLinks = [
      ...(Array.isArray(menuItem?.modifierLinks) ? menuItem.modifierLinks : []),
      ...(Array.isArray(menuItem?.category?.modifierLinks)
        ? menuItem.category.modifierLinks
        : []),
      ...(Array.isArray(menuItem?.categoryModifierGroups)
        ? menuItem.categoryModifierGroups.map((group: ModifierGroup, index: number) => ({
            id: `category-group-${group.id || index}`,
            variationId: null,
            sortOrder: group?.sortOrder || 0,
            modifierGroup: group,
          }))
        : []),
    ];

    const map = new Map<string, ModifierLink>();

    rawLinks.forEach((link: any, index: number) => {
      const modifierGroupId = String(link?.modifierGroup?.id || "");
      if (!modifierGroupId) return;

      const dedupeKey = `${String(link?.variationId || "common")}::${modifierGroupId}`;

      if (!map.has(dedupeKey)) {
        map.set(dedupeKey, {
          ...link,
          id: link?.id || dedupeKey || `modifier-link-${index}`,
        });
      }
    });

    return Array.from(map.values()).sort(
      (a, b) =>
        Number(a?.sortOrder ?? a?.modifierGroup?.sortOrder ?? 0) -
        Number(b?.sortOrder ?? b?.modifierGroup?.sortOrder ?? 0)
    );
  };

  const getDefaultVariation = (menuItem: any) => {
    const variations = getItemVariations(menuItem);
    if (!variations.length) return null;
    return variations.find((v) => v.isDefault) || variations[0];
  };

  const getVisibleModifierLinks = (
    menuItem: any,
    variation?: MenuVariation | null
  ) => {
    const links = getItemModifierLinks(menuItem);
    const hasVariations = getItemVariations(menuItem).length > 0;

    return links.filter((link) => {
      const groupName = link?.modifierGroup?.name?.trim()?.toLowerCase();

      if (hasVariations && groupName === "size") {
        return false;
      }

      if (link?.variationId) {
        return String(link.variationId) === String(variation?.id || "");
      }

      return true;
    });
  };

  const getModifierEffectivePrice = (
    modifier: Modifier,
    menuItemId?: string,
    variationId?: string | null
  ) => {
    const variationOverride = Array.isArray(modifier?.variationPriceOverrides)
      ? modifier.variationPriceOverrides.find(
          (override) =>
            String(override?.variationId || "") === String(variationId || "")
        )
      : null;

    if (variationOverride) {
      if (
        variationOverride?.priceDelta !== undefined &&
        variationOverride?.priceDelta !== null
      ) {
        return Number(variationOverride.priceDelta || 0);
      }

      if (
        variationOverride?.price !== undefined &&
        variationOverride?.price !== null
      ) {
        return Number(variationOverride.price || 0);
      }
    }

    const itemOverride = Array.isArray(modifier?.itemPriceOverrides)
      ? modifier.itemPriceOverrides.find(
          (override) =>
            String(override?.menuItemId || "") === String(menuItemId || "")
        )
      : null;

    if (itemOverride) {
      if (
        itemOverride?.priceDelta !== undefined &&
        itemOverride?.priceDelta !== null
      ) {
        return Number(itemOverride.priceDelta || 0);
      }

      if (itemOverride?.price !== undefined && itemOverride?.price !== null) {
        return Number(itemOverride.price || 0);
      }
    }

    return Number(modifier?.priceDelta || 0);
  };

  const getGroupValidation = (group: ModifierGroup) => {
    const minSelect = Number(group?.minSelect ?? 0);
    const maxSelect =
      group?.maxSelect !== undefined && group?.maxSelect !== null
        ? Number(group.maxSelect)
        : undefined;
    const isRequired = Boolean(group?.isRequired);

    return {
      minSelect: Math.max(isRequired ? 1 : 0, minSelect),
      maxSelect,
      isRequired,
    };
  };

  /* ---------------- FETCH ITEM ---------------- */
  const fetchItem = async () => {
    if (!slug) return;

    const res = await get(`/v1/menu/items?search=${slug}`);

    const items = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.data?.data)
      ? res.data.data
      : [];

    if (!res?.error && items.length > 0) {
      const data = items[0];
      setItem(data);
      setSelectedVariation(getDefaultVariation(data));
      setSelectedModifiers({});
      setQty(1);
    }
  };

  useEffect(() => {
    fetchItem();
  }, [slug]);

  const itemVariations = useMemo(() => getItemVariations(item), [item]);

  const filteredModifierLinks = useMemo(() => {
    return getVisibleModifierLinks(item, selectedVariation);
  }, [item, selectedVariation]);

  useEffect(() => {
    if (!item) return;

    const visibleGroupIds = new Set(
      filteredModifierLinks.map((group) => String(group?.modifierGroup?.id || ""))
    );

    setSelectedModifiers((prev) => {
      const next: Record<string, Modifier[]> = {};

      Object.entries(prev || {}).forEach(([groupId, modifiers]) => {
        if (visibleGroupIds.has(String(groupId))) {
          next[groupId] = modifiers;
        }
      });

      return next;
    });
  }, [selectedVariation?.id, item?.id]);

  /* ---------------- MODIFIER HANDLER ---------------- */
  const handleModifierToggle = (group: ModifierGroup, modifier: Modifier) => {
    const groupId = String(group.id);
    const current = selectedModifiers[groupId] || [];
    const { maxSelect } = getGroupValidation(group);
    const alreadySelected = current.some((m) => m.id === modifier.id);

    if (maxSelect === 1) {
      setSelectedModifiers((prev) => ({
        ...prev,
        [groupId]: alreadySelected ? [] : [modifier],
      }));
      return;
    }

    if (alreadySelected) {
      setSelectedModifiers((prev) => ({
        ...prev,
        [groupId]: current.filter((m) => m.id !== modifier.id),
      }));
      return;
    }

    if (maxSelect && current.length >= maxSelect) {
      toast.error(`You can select up to ${maxSelect} option(s) for ${group.name}`);
      return;
    }

    setSelectedModifiers((prev) => ({
      ...prev,
      [groupId]: [...current, modifier],
    }));
  };

  /* ---------------- PRICE CALC ---------------- */
  const basePrice = Number(item?.basePrice || 0);

  const variationPrice = selectedVariation
    ? Number(selectedVariation.price || 0)
    : 0;

  const modifiersTotal = Object.values(selectedModifiers)
    .flat()
    .reduce(
      (acc: number, m: Modifier) =>
        acc + getModifierEffectivePrice(m, item?.id, selectedVariation?.id),
      0
    );

  const totalPrice = (basePrice + variationPrice + modifiersTotal) * qty;

  const validateSelections = () => {
    for (const link of filteredModifierLinks) {
      const group = link?.modifierGroup;
      const groupId = String(group?.id || "");
      const selected = selectedModifiers[groupId] || [];
      const { minSelect, maxSelect } = getGroupValidation(group);

      if (minSelect > 0 && selected.length < minSelect) {
        toast.error(
          `${group?.name || "This group"} requires at least ${minSelect} selection(s)`
        );
        return false;
      }

      if (maxSelect && selected.length > maxSelect) {
        toast.error(
          `${group?.name || "This group"} allows at most ${maxSelect} selection(s)`
        );
        return false;
      }
    }

    return true;
  };

  /* ---------------- ADD TO CART ---------------- */
  const handleAddToCart = async () => {
    try {
      setLoading(true);

      if (!validateSelections()) {
        return;
      }

      const groupCode = localStorage.getItem("groupOrderCode");

      const basePayload = {
        menuItemId: item.id,
        quantity: qty,
        variationId: selectedVariation?.id || null,
        modifiers: Object.values(selectedModifiers)
          .flat()
          .map((m: Modifier) => ({
            modifierId: m.id,
            quantity: 1,
          })),
        note: instructions,
      };

      let res;

      if (groupCode) {
        const groupOrdersRes = await get("/v1/group-orders");

        if (!groupOrdersRes || groupOrdersRes.error) {
          toast.error("Failed to fetch group order");
          return;
        }

        const groupOrders = Array.isArray(groupOrdersRes?.data)
          ? groupOrdersRes.data
          : Array.isArray(groupOrdersRes?.data?.data)
          ? groupOrdersRes.data.data
          : [];

        const groupOrder = groupOrders.find(
          (o: any) => o.inviteCode === groupCode
        );

        if (!groupOrder) {
          toast.error("Invalid group order");
          return;
        }

        res = await post(`/v1/group-orders/${groupOrder.id}/items`, basePayload);
      } else {
        const payload = {
          ...basePayload,
          branchId,
        };

        res = await post(`/v1/cart/items?customerId=${customerId}`, payload);
      }

      if (!res || res.error) {
        toast.error(res?.error || res?.message || "Failed to add");
        return;
      }

      toast.success(groupCode ? "Added to group order" : "Added to cart");

      if (groupCode) {
        router.push("/group-order/lobby");
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
      <div className="mx-auto grid grid-cols-1 gap-8 px-4 py-6 sm:px-6 md:grid-cols-2 md:px-10 md:py-10 lg:gap-12 lg:px-40">
        <div className="flex flex-col gap-6">
          <div className="overflow-hidden rounded-2xl">
            <Image
              src={item.imageUrl || "/placeholder.png"}
              alt={item.name}
              width={600}
              height={600}
              className="h-[250px] w-full object-cover sm:h-[350px] md:h-auto"
              unoptimized
            />
          </div>

          <div className="text-xs text-gray-400">
            {/* <p>SKU: {item.sku || "-"}</p> */}
            {item.prepTimeMinutes ? <p>Prep Time: {item.prepTimeMinutes} mins</p> : null}
          </div>

          {hasIngredients ? (
            <div>
              <h3 className="mb-2 font-semibold">Ingredients</h3>
              <p className="text-sm leading-relaxed text-gray-600">
                {item.ingredients}
              </p>
            </div>
          ) : null}

          {hasNutritionalInformation || hasDietaryFlags || hasAllergenFlags ? (
            <div>
              {hasNutritionalInformation ? (
                <>
                  <h3 className="mb-3 text-lg font-semibold">
                    Nutritional Information
                  </h3>
                  <div className="rounded-xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-600">
                    {item.nutritionalInformation}
                  </div>
                </>
              ) : null}

              {hasDietaryFlags ? (
                <div className="mt-4">
                  <h4 className="mb-2 text-sm font-medium text-gray-700">
                    Dietary Preferences
                  </h4>

                  <div className="flex flex-wrap gap-2">
                    {item.dietaryFlags.map((f: string) => (
                      <span
                        key={f}
                        className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {hasAllergenFlags ? (
                <div className="mt-4">
                  <h4 className="mb-2 text-sm font-medium text-gray-700">
                    Allergen Information
                  </h4>

                  <div className="flex flex-wrap gap-2">
                    {item.allergenFlags.map((f: string) => (
                      <span
                        key={f}
                        className="rounded-full bg-red-100 px-3 py-1 text-xs text-red-600"
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

        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">
              {item.category?.name || "Best Seller"}
            </p>

            <h1 className="mt-1 text-xl font-bold sm:text-2xl md:text-3xl">
              {item.name}
            </h1>

            <div className="mt-2 flex gap-2 text-sm text-gray-500">
              <span className="font-medium text-primary">★ 4.8</span>
              <span>(150 reviews)</span>
              <span>• 20–25 mins delivery</span>
            </div>
          </div>

          <p className="text-sm text-gray-600">{item.description}</p>

          <div className="text-2xl font-bold text-primary">
            ${totalPrice.toFixed(2)}
          </div>

          {itemVariations.length > 0 && (
            <div>
              <p className="mb-2 font-medium">Size</p>

              <div className="grid grid-cols-2 gap-3">
                {itemVariations.map((v: MenuVariation) => (
                  <label
                    key={v.id}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 ${
                      selectedVariation?.id === v.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="size"
                        checked={selectedVariation?.id === v.id}
                        onChange={() => setSelectedVariation(v)}
                        className="accent-[var(--primary)]"
                      />
                      <span>{v.name}</span>
                    </div>

                    <span className="text-primary">
                      {Number(v.price) > 0
                        ? `+$${Number(v.price).toFixed(2)}`
                        : "+$0.00"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {filteredModifierLinks.map((link: ModifierLink) => {
            const group = link.modifierGroup;
            const groupId = String(group?.id || "");
            const selectedInGroup = selectedModifiers[groupId] || [];
            const { minSelect, maxSelect, isRequired } =
              getGroupValidation(group);

            return (
              <div
                key={`${String(link?.variationId || "common")}-${groupId}`}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{group?.name}</p>
                    <p className="text-xs text-gray-500">
                      {maxSelect === 1
                        ? isRequired
                          ? "Select 1 required option"
                          : "Select up to 1 option"
                        : maxSelect
                        ? `Select ${
                            minSelect > 0
                              ? `${minSelect}-${maxSelect}`
                              : `up to ${maxSelect}`
                          }`
                        : minSelect > 0
                        ? `Select at least ${minSelect}`
                        : "Optional"}
                    </p>
                  </div>

                  <span className="text-xs text-gray-500">
                    {selectedInGroup.length}
                    {maxSelect ? ` / ${maxSelect}` : ""}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {(group.modifiers || [])
                    .filter((m: Modifier) => m.isActive !== false)
                    .map((modifier: Modifier) => {
                      const checked = selectedInGroup.some(
                        (selected) => selected.id === modifier.id
                      );

                      const disableBecauseMaxReached =
                        !checked &&
                        !!maxSelect &&
                        selectedInGroup.length >= maxSelect;

                      const effectivePrice = getModifierEffectivePrice(
                        modifier,
                        item.id,
                        selectedVariation?.id
                      );

                      return (
                        <label
                          key={modifier.id}
                          className={`flex justify-between rounded-lg px-3 py-2 text-sm ${
                            disableBecauseMaxReached
                              ? "bg-gray-100 opacity-70"
                              : "bg-gray-50"
                          }`}
                        >
                          <div className="flex gap-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={disableBecauseMaxReached}
                              onChange={() =>
                                handleModifierToggle(group, modifier)
                              }
                            />
                            {modifier.name}
                          </div>

                          <span className="text-primary">
                            +${effectivePrice.toFixed(2)}
                          </span>
                        </label>
                      );
                    })}
                </div>
              </div>
            );
          })}

          <div>
            <p className="mb-2 font-medium">Special Instructions</p>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Add cooking notes (e.g., no onions, extra spicy)..."
              className="h-24 w-full rounded-xl bg-gray-100 p-3 text-sm"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-full bg-gray-100">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="px-3 py-2"
              >
                <Minus size={16} />
              </button>
              <span className="px-4">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="px-3 py-2">
                <Plus size={16} />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3 text-white disabled:opacity-70"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading
                ? "Processing..."
                : `Add to Cart | $${totalPrice.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>

      <TestimonialsSection />

      
    </>
  );
}