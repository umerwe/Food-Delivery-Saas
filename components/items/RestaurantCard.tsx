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
  modifierId?: string;
  price?: string | number;
  priceDelta?: string | number;
};

type VariationPriceOverride = {
  id?: string;
  variationId?: string;
  modifierId?: string;
  price?: string | number;
  priceDelta?: string | number;
};

type MenuVariation = {
  id: string;
  categoryId?: string;
  name: string;
  description?: string;
  price?: string | number;
  sortOrder?: number;
  isDefault?: boolean;
  isActive?: boolean;
  modifierPriceOverrides?: VariationPriceOverride[];
};

type Modifier = {
  id: string;
  modifierGroupId?: string;
  restaurantId?: string;
  name: string;
  priceDelta?: string | number;
  sortOrder?: number;
  isActive?: boolean;
  itemPriceOverrides?: ItemPriceOverride[];
  variationPriceOverrides?: VariationPriceOverride[];
};

type RawModifierLink = {
  id?: string;
  modifierGroupId?: string;
  modifierId?: string;
  sortOrder?: number;
  modifier?: Modifier;
};

type ModifierGroup = {
  id: string;
  name: string;
  description?: string;
  minSelect?: number;
  maxSelect?: number;
  isRequired?: boolean;
  sortOrder?: number;
  isActive?: boolean;
  modifiers?: Modifier[];
  modifierLinks?: RawModifierLink[];
};

type ModifierLink = {
  id: string;
  variationId?: string | null;
  sortOrder?: number;
  modifierGroup: ModifierGroup;
};

type SelectedModifiersMap = Record<string, Modifier[]>;

const toNumber = (value: unknown, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const sortBySortOrder = <T extends { sortOrder?: number }>(items: T[]) => {
  return [...items].sort(
    (a, b) => toNumber(a?.sortOrder, 0) - toNumber(b?.sortOrder, 0)
  );
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
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifiersMap>(
    {}
  );
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

    const deduped = new Map<string, MenuVariation>();

    for (const raw of rawVariations) {
      if (!raw?.id) continue;
      if (raw?.isActive === false) continue;

      const id = String(raw.id);

      const normalized: MenuVariation = {
        id,
        categoryId: raw?.categoryId,
        name: String(raw?.name || ""),
        description: raw?.description || "",
        price: raw?.price ?? 0,
        sortOrder: toNumber(raw?.sortOrder, 0),
        isDefault: Boolean(raw?.isDefault),
        isActive: raw?.isActive !== false,
        modifierPriceOverrides: Array.isArray(raw?.modifierPriceOverrides)
          ? raw.modifierPriceOverrides
          : [],
      };

      if (!deduped.has(id)) {
        deduped.set(id, normalized);
      }
    }

    return sortBySortOrder(Array.from(deduped.values()));
  };

  const getNormalizedModifiersFromGroup = (group: any): Modifier[] => {
    const directModifiers = Array.isArray(group?.modifiers) ? group.modifiers : [];

    const fromModifierLinks = Array.isArray(group?.modifierLinks)
      ? group.modifierLinks
          .map((link: any) => link?.modifier)
          .filter(Boolean)
      : [];

    const rawModifiers = [...directModifiers, ...fromModifierLinks];

    const deduped = new Map<string, Modifier>();

    for (const raw of rawModifiers) {
      if (!raw?.id) continue;
      if (raw?.isActive === false) continue;

      const id = String(raw.id);

      const normalized: Modifier = {
        id,
        modifierGroupId: raw?.modifierGroupId,
        restaurantId: raw?.restaurantId,
        name: String(raw?.name || ""),
        priceDelta: raw?.priceDelta ?? 0,
        sortOrder: toNumber(raw?.sortOrder, 0),
        isActive: raw?.isActive !== false,
        itemPriceOverrides: Array.isArray(raw?.itemPriceOverrides)
          ? raw.itemPriceOverrides
          : [],
        variationPriceOverrides: Array.isArray(raw?.variationPriceOverrides)
          ? raw.variationPriceOverrides
          : [],
      };

      if (!deduped.has(id)) {
        deduped.set(id, normalized);
      }
    }

    return sortBySortOrder(Array.from(deduped.values()));
  };

  const normalizeGroup = (group: any): ModifierGroup | null => {
    if (!group?.id) return null;
    if (group?.isActive === false) return null;

    return {
      id: String(group.id),
      name: String(group?.name || ""),
      description: group?.description || "",
      minSelect: group?.minSelect,
      maxSelect: group?.maxSelect,
      isRequired: Boolean(group?.isRequired),
      sortOrder: toNumber(group?.sortOrder, 0),
      isActive: group?.isActive !== false,
      modifiers: getNormalizedModifiersFromGroup(group),
      modifierLinks: Array.isArray(group?.modifierLinks) ? group.modifierLinks : [],
    };
  };

  const getItemModifierLinks = (menuItem: any): ModifierLink[] => {
    const rawItemLinks = Array.isArray(menuItem?.modifierLinks)
      ? menuItem.modifierLinks
      : [];

    const rawCategoryLinks = Array.isArray(menuItem?.category?.modifierLinks)
      ? menuItem.category.modifierLinks
      : [];

    const rawCategoryModifierGroups = Array.isArray(menuItem?.categoryModifierGroups)
      ? menuItem.categoryModifierGroups
      : [];

    const normalizedCategoryGroupLinks: ModifierLink[] = rawCategoryModifierGroups
      .map((group: any, index: number) => {
        const normalizedGroup = normalizeGroup(group);
        if (!normalizedGroup) return null;

        return {
          id: `category-group-${normalizedGroup.id}-${index}`,
          variationId: null,
          sortOrder: toNumber(normalizedGroup.sortOrder, 0),
          modifierGroup: normalizedGroup,
        };
      })
      .filter(Boolean) as ModifierLink[];

    const combinedRawLinks = [...rawItemLinks, ...rawCategoryLinks];

    const normalizedDirectLinks: ModifierLink[] = combinedRawLinks
      .map((link: any, index: number) => {
        const normalizedGroup = normalizeGroup(link?.modifierGroup);
        if (!normalizedGroup) return null;

        return {
          id:
            String(link?.id || "") ||
            `modifier-link-${normalizedGroup.id}-${index}`,
          variationId: link?.variationId ? String(link.variationId) : null,
          sortOrder: toNumber(
            link?.sortOrder ?? normalizedGroup?.sortOrder ?? 0,
            0
          ),
          modifierGroup: normalizedGroup,
        };
      })
      .filter(Boolean) as ModifierLink[];

    const deduped = new Map<string, ModifierLink>();

    for (const link of [...normalizedDirectLinks, ...normalizedCategoryGroupLinks]) {
      const groupId = String(link?.modifierGroup?.id || "");
      if (!groupId) continue;

      const key = `${String(link?.variationId || "common")}::${groupId}`;

      if (!deduped.has(key)) {
        deduped.set(key, link);
      }
    }

    return sortBySortOrder(Array.from(deduped.values()));
  };

  const getDefaultVariation = (menuItem: any) => {
    const variations = getItemVariations(menuItem);
    if (!variations.length) return null;

    return variations.find((v) => v.isDefault) || variations[0];
  };

  const getGroupValidation = (group: ModifierGroup) => {
    const rawMin = toNumber(group?.minSelect, 0);
    const rawMax =
      group?.maxSelect !== undefined && group?.maxSelect !== null
        ? toNumber(group.maxSelect, 0)
        : undefined;
    const isRequired = Boolean(group?.isRequired);

    const minSelect = Math.max(isRequired ? 1 : 0, rawMin);

    return {
      minSelect,
      maxSelect: rawMax,
      isRequired,
    };
  };

  const getVisibleModifierLinks = (
    menuItem: any,
    variation?: MenuVariation | null
  ) => {
    const links = getItemModifierLinks(menuItem);
    const hasVariations = getItemVariations(menuItem).length > 0;

    return links.filter((groupLink) => {
      const groupName = String(groupLink?.modifierGroup?.name || "")
        .trim()
        .toLowerCase();

      if (hasVariations && groupName === "size") {
        return false;
      }

      if (groupLink?.variationId) {
        return String(groupLink.variationId) === String(variation?.id || "");
      }

      return true;
    });
  };

  const itemVariations = useMemo(() => getItemVariations(item), [item]);
  const itemModifierLinks = useMemo(() => getItemModifierLinks(item), [item]);

  const filteredModifierLinks = useMemo(() => {
    return getVisibleModifierLinks(item, selectedVariation);
  }, [item, selectedVariation]);

  const hasOptions = itemVariations.length > 0 || itemModifierLinks.length > 0;

  useEffect(() => {
    setSelectedVariation(getDefaultVariation(item));
  }, [item]);

  useEffect(() => {
    if (!open) {
      setQty(1);
      setSelectedModifiers({});
      setSelectedVariation(getDefaultVariation(item));
    }
  }, [open, item]);

  useEffect(() => {
    const visibleGroupIds = new Set(
      filteredModifierLinks.map((groupLink) =>
        String(groupLink?.modifierGroup?.id || "")
      )
    );

    setSelectedModifiers((prev) => {
      const next: SelectedModifiersMap = {};

      for (const [groupId, modifiers] of Object.entries(prev || {})) {
        if (visibleGroupIds.has(String(groupId))) {
          next[groupId] = modifiers;
        }
      }

      return next;
    });
  }, [filteredModifierLinks]);

  const getModifierEffectivePrice = (
    modifier: Modifier,
    menuItemId?: string,
    variation?: MenuVariation | null
  ) => {
    const variationId = variation?.id ? String(variation.id) : "";

    const variationOverrideFromModifier = Array.isArray(
      modifier?.variationPriceOverrides
    )
      ? modifier.variationPriceOverrides.find(
          (override) =>
            String(override?.variationId || "") === variationId
        )
      : null;

    if (variationOverrideFromModifier) {
      if (
        variationOverrideFromModifier?.priceDelta !== undefined &&
        variationOverrideFromModifier?.priceDelta !== null
      ) {
        return toNumber(variationOverrideFromModifier.priceDelta, 0);
      }

      if (
        variationOverrideFromModifier?.price !== undefined &&
        variationOverrideFromModifier?.price !== null
      ) {
        return toNumber(variationOverrideFromModifier.price, 0);
      }
    }

    const variationOverrideFromSelectedVariation = Array.isArray(
      variation?.modifierPriceOverrides
    )
      ? variation.modifierPriceOverrides.find(
          (override) =>
            String(override?.modifierId || "") === String(modifier?.id || "")
        )
      : null;

    if (variationOverrideFromSelectedVariation) {
      if (
        variationOverrideFromSelectedVariation?.priceDelta !== undefined &&
        variationOverrideFromSelectedVariation?.priceDelta !== null
      ) {
        return toNumber(variationOverrideFromSelectedVariation.priceDelta, 0);
      }

      if (
        variationOverrideFromSelectedVariation?.price !== undefined &&
        variationOverrideFromSelectedVariation?.price !== null
      ) {
        return toNumber(variationOverrideFromSelectedVariation.price, 0);
      }
    }

    const itemOverride = Array.isArray(modifier?.itemPriceOverrides)
      ? modifier.itemPriceOverrides.find(
          (override) =>
            String(override?.menuItemId || "") === String(menuItemId || "")
        )
      : null;

    if (itemOverride) {
      if (itemOverride?.priceDelta !== undefined && itemOverride?.priceDelta !== null) {
        return toNumber(itemOverride.priceDelta, 0);
      }

      if (itemOverride?.price !== undefined && itemOverride?.price !== null) {
        return toNumber(itemOverride.price, 0);
      }
    }

    return toNumber(modifier?.priceDelta, 0);
  };

  const handleModifierToggle = (group: ModifierGroup, modifier: Modifier) => {
    const groupId = String(group.id);
    const current = selectedModifiers[groupId] || [];
    const { maxSelect } = getGroupValidation(group);
    const isSelected = current.some((m) => m.id === modifier.id);

    if (maxSelect === 1) {
      setSelectedModifiers((prev) => ({
        ...prev,
        [groupId]: isSelected ? [] : [modifier],
      }));
      return;
    }

    if (isSelected) {
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

  const basePrice = toNumber(item?.basePrice, 0);
  const variationPrice = selectedVariation ? toNumber(selectedVariation?.price, 0) : 0;

  const modifiersTotal = Object.values(selectedModifiers)
    .flat()
    .reduce((acc, modifier) => {
      return (
        acc +
        getModifierEffectivePrice(modifier, item?.id, selectedVariation)
      );
    }, 0);

  const totalPrice = (basePrice + variationPrice + modifiersTotal) * qty;

  async function handleAddToCart() {
    try {
      setLoading(true);

      if (!validateSelections()) return;

      const groupCode =
        typeof window !== "undefined"
          ? localStorage.getItem("groupOrderCode")
          : null;

      if (!groupCode && !branchId) {
        toast.error("Please select a branch");
        return;
      }

      const basePayload = {
        menuItemId: item?.id,
        quantity: qty,
        variationId: selectedVariation?.id || null,
        modifiers: Object.values(selectedModifiers)
          .flat()
          .map((modifier) => ({
            modifierId: modifier.id,
            quantity: 1,
          })),
      };

      let res: any;

      if (groupCode) {
        const groupOrdersRes = await get("/v1/group-orders");

        const groupOrders = Array.isArray(groupOrdersRes?.data)
          ? groupOrdersRes.data
          : Array.isArray(groupOrdersRes?.data?.data)
          ? groupOrdersRes.data.data
          : [];

        const groupOrder = groupOrders.find(
          (order: any) => order?.inviteCode === groupCode
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

      if (!res || res?.error) {
        toast.error(res?.error || "Failed to add to cart");
        return;
      }

      toast.success("Added to cart");

      setAnimateCart(true);
      setTimeout(() => setAnimateCart(false), 700);

      setOpen(false);
      router.push("/checkout");
    } catch (error) {
      console.error("Add to cart failed:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const handlePlusClick = () => {
    const groupCode =
      typeof window !== "undefined"
        ? localStorage.getItem("groupOrderCode")
        : null;

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
    router.push(`/items/details?itemId=${item?.id}&slug=${item?.slug}`);
  };

  const truncatedDesc =
    item?.description && String(item.description).length > 90
      ? `${String(item.description).slice(0, 90)}...`
      : item?.description || "";

  const hasIngredients =
    item?.ingredients && String(item.ingredients).trim() !== "";

  const hasNutritionalInformation =
    item?.nutritionalInformation &&
    String(item.nutritionalInformation).trim() !== "";

  const hasInfoBoxContent = hasIngredients || hasNutritionalInformation;

  const displayCardPrice =
    basePrice + toNumber(getDefaultVariation(item)?.price, 0);

  return (
    <>
      <div className="group relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-lg">
        <div className="flex justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">{item?.name}</h3>

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
                          {item?.ingredients}
                        </div>
                      ) : null}

                      {hasNutritionalInformation ? (
                        <div>
                          <span className="font-medium text-gray-800">
                            Nutritional Info:
                          </span>{" "}
                          {item?.nutritionalInformation}
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
              src={item?.imageUrl || "/placeholder.png"}
              alt={item?.name || "item"}
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

        {animateCart ? (
          <div className="absolute bottom-6 right-6 h-3 w-3 animate-bounce rounded-full bg-primary" />
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[95vh] max-w-md overflow-auto rounded-2xl p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            {item?.name}
          </h2>

         {itemVariations.length > 0 ? (
  <div className="mb-5">
    <p className="mb-2 font-medium text-gray-900">Size</p>

    <div className="grid grid-cols-1 gap-3">
      {itemVariations.map((variation) => (
        <label
          key={variation.id}
          className={`cursor-pointer rounded-xl border px-4 py-3 transition ${
            selectedVariation?.id === variation.id
              ? "border-primary bg-primary/5"
              : "border-gray-200 bg-white"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name={`size-${item?.id}`}
                checked={selectedVariation?.id === variation.id}
                onChange={() => setSelectedVariation(variation)}
                className="mt-1 accent-[var(--primary)]"
              />

              <div>
                <p className="text-sm font-medium text-gray-800">
                  {variation.name}
                </p>

                {variation.description ? (
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    {variation.description}
                  </p>
                ) : null}
              </div>
            </div>

            <span className="shrink-0 text-sm font-semibold text-primary">
              +${toNumber(variation.price, 0).toFixed(2)}
            </span>
          </div>
        </label>
      ))}
    </div>
  </div>
) : null}

          {filteredModifierLinks.map((groupLink) => {
            const group = groupLink.modifierGroup;
            const groupId = String(group?.id || "");
            const selectedInGroup = selectedModifiers[groupId] || [];
            const { minSelect, maxSelect, isRequired } = getGroupValidation(group);
            const groupModifiers = Array.isArray(group?.modifiers)
              ? group.modifiers.filter((modifier) => modifier?.isActive !== false)
              : [];

            if (!groupModifiers.length) return null;

            return (
              <div
                key={`${groupLink?.variationId || "common"}-${groupId}`}
                className="mb-5"
              >
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
                  {groupModifiers.map((modifier) => {
                    const checked = selectedInGroup.some(
                      (selected) => selected.id === modifier.id
                    );

                    const disableBecauseMaxReached =
                      !checked &&
                      !!maxSelect &&
                      selectedInGroup.length >= maxSelect;

                    const effectivePrice = getModifierEffectivePrice(
                      modifier,
                      item?.id,
                      selectedVariation
                    );

                    const inputType = maxSelect === 1 ? "radio" : "checkbox";

                    return (
                      <label
                        key={modifier.id}
                        className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-3 text-sm ${
                          disableBecauseMaxReached
                            ? "bg-gray-100 opacity-70"
                            : "bg-gray-50"
                        }`}
                      >
                        <span className="flex items-center gap-2 text-gray-800">
                          <input
                            type={inputType}
                            name={`modifier-group-${groupId}`}
                            checked={checked}
                            disabled={disableBecauseMaxReached}
                            onChange={() => handleModifierToggle(group, modifier)}
                            className="accent-[var(--primary)]"
                          />
                          {modifier.name}
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
                onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                className="px-2 text-lg text-gray-700"
                disabled={loading}
              >
                <Minus size={16} />
              </button>

              <span className="px-4 text-sm font-semibold text-gray-900">
                {qty}
              </span>

              <button
                onClick={() => setQty((prev) => prev + 1)}
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
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? "Processing..." : "Add to Cart"}
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}