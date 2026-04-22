"use client";

import Image from "next/image";
import { Plus, Info, Loader2, Eye, EyeOff, Minus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useApi from "@/hooks/useApi";
import { useAuthContext } from "@/context/AuthContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

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

export default function RestaurantCard({ item }: any) {
  const router = useRouter();
  const { token } = useAuthContext();
  const { post, get } = useApi(token);
  const { user } = useAuth();

  const [showInfoBox, setShowInfoBox] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const [qty, setQty] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState<MenuVariation | null>(
    null
  );
  const [selectedModifiers, setSelectedModifiers] = useState<
    Record<string, Modifier[]>
  >({});
  const [animateCart, setAnimateCart] = useState(false);

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

    rawVariations.forEach((variation: any) => {
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
    const rawLinks: ModifierLink[] = [
      ...(Array.isArray(menuItem?.modifierLinks) ? menuItem.modifierLinks : []),
      ...(Array.isArray(menuItem?.category?.modifierLinks)
        ? menuItem.category.modifierLinks
        : []),
      ...(Array.isArray(menuItem?.categoryModifierGroups)
        ? menuItem.categoryModifierGroups.map((group: ModifierGroup) => ({
            id: `category-group-${group.id}`,
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

  const itemVariations = useMemo(() => getItemVariations(item), [item]);
  const itemModifierLinks = useMemo(() => getItemModifierLinks(item), [item]);

  const getDefaultVariation = (menuItem: any) => {
    const variations = getItemVariations(menuItem);
    if (!variations.length) return null;
    return variations.find((v) => v.isDefault) || variations[0];
  };

  const hasOptions = itemVariations.length > 0 || itemModifierLinks.length > 0;

  useEffect(() => {
    const defaultVariation = getDefaultVariation(item);
    setSelectedVariation(defaultVariation);
  }, [item]);

  useEffect(() => {
    if (!open) {
      setQty(1);
      setSelectedModifiers({});
      setSelectedVariation(getDefaultVariation(item));
    }
  }, [open, item]);

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

  const getVisibleModifierLinks = (
    menuItem: any,
    variation?: MenuVariation | null
  ) => {
    const links = getItemModifierLinks(menuItem);
    const hasVariations = getItemVariations(menuItem).length > 0;

    return links.filter((groupLink: any) => {
      const groupName = groupLink?.modifierGroup?.name?.trim()?.toLowerCase();

      if (hasVariations && groupName === "size") {
        return false;
      }

      if (groupLink?.variationId) {
        return String(groupLink.variationId) === String(variation?.id || "");
      }

      return true;
    });
  };

  const filteredModifierLinks = useMemo(() => {
    return getVisibleModifierLinks(item, selectedVariation);
  }, [item, selectedVariation]);

  useEffect(() => {
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

  const basePrice = Number(item?.basePrice || 0);

  const variationPrice = selectedVariation
    ? Number(selectedVariation.price || 0)
    : 0;

  const modifiersTotal = Object.values(selectedModifiers)
    .flat()
    .reduce(
      (acc: number, modifier: Modifier) =>
        acc +
        getModifierEffectivePrice(modifier, item?.id, selectedVariation?.id),
      0
    );

  const totalPrice = (basePrice + variationPrice + modifiersTotal) * qty;

  async function handleAddToCart() {
    try {
      setLoading(true);

      if (!validateSelections()) {
        return;
      }

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
          .map((m: Modifier) => ({
            modifierId: m.id,
            quantity: 1,
          })),
      };

      let res;

      if (groupCode) {
        const groupOrdersRes = await get("/v1/group-orders");
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

  const displayCardPrice =
    basePrice +
    Number(
      (getDefaultVariation(item)?.price as string | number | undefined) || 0
    );

  return (
    <>
      <div className="group relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-lg">
        <div className="flex justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">{item.name}</h3>

            <p className="mb-2 text-xs text-gray-500">
              {truncatedDesc || "Fresh premium item"}
            </p>

            <p className="text-sm font-semibold text-gray-900">
              ${displayCardPrice.toFixed(2)}
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
              unoptimized
            />

            <button
              onClick={handlePlusClick}
              disabled={loading}
              className="absolute bottom-2 right-2 rounded-full bg-primary p-2 text-white shadow-sm transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )}
            </button>
          </div>
        </div>

        {animateCart && (
          <div className="absolute bottom-6 right-6 h-3 w-3 animate-bounce rounded-full bg-primary" />
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[95vh] max-w-md overflow-auto rounded-2xl p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{item.name}</h2>

          {itemVariations.length > 0 && (
            <div className="mb-5">
              <p className="mb-2 font-medium text-gray-900">Size</p>

              <div className="grid grid-cols-1 gap-3">
                {itemVariations.map((v: MenuVariation) => (
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
                      {Number(v.price) > 0
                        ? `+$${Number(v.price).toFixed(2)}`
                        : "+$0.00"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {filteredModifierLinks.map((groupLink: ModifierLink) => {
            const group = groupLink.modifierGroup;
            const groupId = String(group?.id || "");
            const selectedInGroup = selectedModifiers[groupId] || [];
            const { minSelect, maxSelect, isRequired } =
              getGroupValidation(group);

            return (
              <div key={`${groupLink.variationId || "common"}-${groupId}`} className="mb-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{group?.name}</p>
                    <p className="text-xs text-gray-500">
                      {maxSelect === 1
                        ? isRequired
                          ? "Select 1 required option"
                          : "Select up to 1 option"
                        : maxSelect
                        ? minSelect > 0
                          ? `Select ${minSelect}-${maxSelect}`
                          : `Select up to ${maxSelect}`
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

                <div className="space-y-2">
                  {(group?.modifiers || [])
                    .filter((m: Modifier) => m.isActive !== false)
                    .map((m: Modifier) => {
                      const checked = selectedInGroup.some(
                        (selected: Modifier) => selected.id === m.id
                      );

                      const disableBecauseMaxReached =
                        !checked &&
                        !!maxSelect &&
                        maxSelect > 1 &&
                        selectedInGroup.length >= maxSelect;

                      const effectivePrice = getModifierEffectivePrice(
                        m,
                        item?.id,
                        selectedVariation?.id
                      );

                      return (
                        <label
                          key={m.id}
                          className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-3 text-sm ${
                            disableBecauseMaxReached
                              ? "bg-gray-100 opacity-70"
                              : "bg-gray-50"
                          }`}
                        >
                          <span className="flex items-center gap-2 text-gray-800">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={disableBecauseMaxReached}
                              onChange={() => handleModifierToggle(group, m)}
                              className="accent-[var(--primary)]"
                            />
                            {m.name}
                          </span>

                          <span className="font-medium text-primary">
                            +${effectivePrice.toFixed(2)}
                          </span>
                        </label>
                      );
                    })}
                </div>
              </div>
            );
          })}

          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center rounded-full bg-gray-100 px-3 py-1.5">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="px-2 text-lg text-gray-700"
                disabled={loading}
              >
                <Minus size={16} />
              </button>
              <span className="px-4 text-sm font-semibold text-gray-900">
                {qty}
              </span>
              <button
                onClick={() => setQty(qty + 1)}
                className="px-2 text-lg text-gray-700"
                disabled={loading}
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="text-lg font-semibold text-primary">
              ${totalPrice.toFixed(2)}
            </div>
          </div>

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