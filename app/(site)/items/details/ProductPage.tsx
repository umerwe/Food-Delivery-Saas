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
  description?: string | null;
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
  description?: string | null;
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

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const sortBySortOrder = <T extends { sortOrder?: number }>(items: T[]) => {
  return [...items].sort(
    (a, b) => toNumber(a?.sortOrder, 0) - toNumber(b?.sortOrder, 0)
  );
};

export default function ProductPage() {
  const params = useSearchParams();
  const slug = params.get("slug");

  const { token } = useAuthContext();
  const { get, post } = useApi(token);
  const router = useRouter();

  const [item, setItem] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);
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
    if (!menuItem) return [];

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
        description: raw?.description ?? "",
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

    const modifiersFromLinks = Array.isArray(group?.modifierLinks)
      ? group.modifierLinks.map((link: any) => link?.modifier).filter(Boolean)
      : [];

    const rawModifiers = [...directModifiers, ...modifiersFromLinks];
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
        description: raw?.description ?? "",
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
    if (!menuItem) return [];

    const rawDirectLinks = [
      ...(Array.isArray(menuItem?.modifierLinks) ? menuItem.modifierLinks : []),
      ...(Array.isArray(menuItem?.category?.modifierLinks)
        ? menuItem.category.modifierLinks
        : []),
    ];

    const rawModifierGroups = [
      ...(Array.isArray(menuItem?.modifierGroups) ? menuItem.modifierGroups : []),
      ...(Array.isArray(menuItem?.categoryModifierGroups)
        ? menuItem.categoryModifierGroups
        : []),
    ];

    const normalizedDirectLinks: ModifierLink[] = rawDirectLinks
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

    const normalizedModifierGroups: ModifierLink[] = rawModifierGroups
      .map((group: any, index: number) => {
        const normalizedGroup = normalizeGroup(group);
        if (!normalizedGroup) return null;

        return {
          id: `group-${normalizedGroup.id}-${index}`,
          variationId: null,
          sortOrder: toNumber(normalizedGroup?.sortOrder, 0),
          modifierGroup: normalizedGroup,
        };
      })
      .filter(Boolean) as ModifierLink[];

    const deduped = new Map<string, ModifierLink>();

    for (const link of [...normalizedDirectLinks, ...normalizedModifierGroups]) {
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
    return variations.find((variation) => variation.isDefault) || variations[0];
  };

  const getVisibleModifierLinks = (
    menuItem: any,
    variation?: MenuVariation | null
  ) => {
    const links = getItemModifierLinks(menuItem);
    const hasVariations = getItemVariations(menuItem).length > 0;

    return links.filter((link) => {
      const groupName = String(link?.modifierGroup?.name || "")
        .trim()
        .toLowerCase();

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
    variation?: MenuVariation | null
  ) => {
    const variationId = String(variation?.id || "");

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

    const variationOverrideFromVariation = Array.isArray(
      variation?.modifierPriceOverrides
    )
      ? variation.modifierPriceOverrides.find(
          (override) =>
            String(override?.modifierId || "") === String(modifier?.id || "")
        )
      : null;

    if (variationOverrideFromVariation) {
      if (
        variationOverrideFromVariation?.priceDelta !== undefined &&
        variationOverrideFromVariation?.priceDelta !== null
      ) {
        return toNumber(variationOverrideFromVariation.priceDelta, 0);
      }

      if (
        variationOverrideFromVariation?.price !== undefined &&
        variationOverrideFromVariation?.price !== null
      ) {
        return toNumber(variationOverrideFromVariation.price, 0);
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

  const getGroupValidation = (group: ModifierGroup) => {
    const rawMin = toNumber(group?.minSelect, 0);
    const rawMax =
      group?.maxSelect !== undefined && group?.maxSelect !== null
        ? toNumber(group.maxSelect, 0)
        : undefined;
    const isRequired = Boolean(group?.isRequired);

    return {
      minSelect: Math.max(isRequired ? 1 : 0, rawMin),
      maxSelect: rawMax,
      isRequired,
    };
  };

  const fetchItem = async () => {
    if (!slug) {
      setPageLoading(false);
      return;
    }

    try {
      setPageLoading(true);

      const res = await get(`/v1/menu/items?search=${slug}`);

      if (!res || res?.error) {
        toast.error(res?.error || "Failed to fetch item");
        setItem(null);
        return;
      }

      const items = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : [];

      if (!items.length) {
        setItem(null);
        return;
      }

      const data = items[0];
      setItem(data);
      setSelectedVariation(getDefaultVariation(data));
      setSelectedModifiers({});
      setQty(1);
      setInstructions("");
    } catch (error) {
      console.error("Failed to fetch item:", error);
      toast.error("Failed to fetch item");
      setItem(null);
    } finally {
      setPageLoading(false);
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
      filteredModifierLinks.map((link) => String(link?.modifierGroup?.id || ""))
    );

    setSelectedModifiers((prev) => {
      const next: Record<string, Modifier[]> = {};

      for (const [groupId, modifiers] of Object.entries(prev || {})) {
        if (visibleGroupIds.has(String(groupId))) {
          next[groupId] = modifiers;
        }
      }

      return next;
    });
  }, [filteredModifierLinks, item]);

  const handleModifierToggle = (group: ModifierGroup, modifier: Modifier) => {
    const groupId = String(group.id);
    const current = selectedModifiers[groupId] || [];
    const { maxSelect } = getGroupValidation(group);
    const alreadySelected = current.some((selected) => selected.id === modifier.id);

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
        [groupId]: current.filter((selected) => selected.id !== modifier.id),
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
      return acc + getModifierEffectivePrice(modifier, item?.id, selectedVariation);
    }, 0);

  const totalPrice = (basePrice + variationPrice + modifiersTotal) * qty;

  const handleAddToCart = async () => {
    try {
      setLoading(true);

      if (!item?.id) {
        toast.error("Item not found");
        return;
      }

      if (!validateSelections()) {
        return;
      }

      const groupCode =
        typeof window !== "undefined"
          ? localStorage.getItem("groupOrderCode")
          : null;

      const basePayload = {
        menuItemId: item.id,
        quantity: qty,
        variationId: selectedVariation?.id || null,
        modifiers: Object.values(selectedModifiers)
          .flat()
          .map((modifier) => ({
            modifierId: modifier.id,
            quantity: 1,
          })),
        note: instructions?.trim() || "",
      };

      let res: any;

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
          (order: any) => order?.inviteCode === groupCode
        );

        if (!groupOrder) {
          toast.error("Invalid group order");
          return;
        }

        res = await post(`/v1/group-orders/${groupOrder.id}/items`, basePayload);
      } else {
        if (!customerId) {
          toast.error("Customer not found");
          return;
        }

        if (!branchId) {
          toast.error("Please select a branch first");
          return;
        }

        res = await post(`/v1/cart/items?customerId=${customerId}`, {
          ...basePayload,
          branchId,
        });
      }

      if (!res || res?.error) {
        toast.error(res?.error || res?.message || "Failed to add");
        return;
      }

      toast.success(groupCode ? "Added to group order" : "Added to cart");

      if (groupCode) {
        router.push("/group-order/lobby");
      } else {
        router.push("/checkout");
      }
    } catch (error) {
      console.error("Add to cart failed:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!item) {
    return (
      <>
        <div className="mx-auto px-4 py-16 text-center sm:px-6 md:px-10 lg:px-40">
          <h2 className="text-xl font-semibold text-gray-900">Item not found</h2>
          <p className="mt-2 text-sm text-gray-500">
            We could not find the requested menu item.
          </p>
        </div>
        <TestimonialsSection />
      </>
    );
  }

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
              src={item?.imageUrl || "/placeholder.png"}
              alt={item?.name || "Product image"}
              width={600}
              height={600}
              className="h-[250px] w-full object-cover sm:h-[350px] md:h-auto"
              unoptimized
            />
          </div>

          <div className="text-xs text-gray-400">
            {item?.prepTimeMinutes ? (
              <p>Prep Time: {item.prepTimeMinutes} mins</p>
            ) : null}
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
                    {item.dietaryFlags.map((flag: string) => (
                      <span
                        key={flag}
                        className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700"
                      >
                        {flag}
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
                    {item.allergenFlags.map((flag: string) => (
                      <span
                        key={flag}
                        className="rounded-full bg-red-100 px-3 py-1 text-xs text-red-600"
                      >
                        {flag}
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
              {item?.category?.name || "Best Seller"}
            </p>

            <h1 className="mt-1 text-xl font-bold sm:text-2xl md:text-3xl">
              {item?.name}
            </h1>

            <div className="mt-2 flex gap-2 text-sm text-gray-500">
              <span className="font-medium text-primary">★ 4.8</span>
              <span>(150 reviews)</span>
              <span>• 20–25 mins delivery</span>
            </div>
          </div>

          <p className="text-sm text-gray-600">{item?.description}</p>

          <div className="text-2xl font-bold text-primary">
            ${totalPrice.toFixed(2)}
          </div>

       {itemVariations.length > 0 ? (
  <div>
    <p className="mb-2 font-medium">Size</p>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {itemVariations.map((variation) => (
        <label
          key={variation.id}
          className={`cursor-pointer rounded-xl border px-4 py-3 ${
            selectedVariation?.id === variation.id
              ? "border-primary bg-primary/5"
              : "border-gray-200"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="size"
                checked={selectedVariation?.id === variation.id}
                onChange={() => setSelectedVariation(variation)}
                className="mt-1 accent-[var(--primary)]"
              />

              <div>
                <p className="font-medium text-gray-900">{variation.name}</p>

                {variation.description ? (
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    {variation.description}
                  </p>
                ) : null}
              </div>
            </div>

            <span className="shrink-0 text-primary font-medium">
              +${toNumber(variation.price, 0).toFixed(2)}
            </span>
          </div>
        </label>
      ))}
    </div>
  </div>
) : null}

          {filteredModifierLinks.map((link) => {
            const group = link.modifierGroup;
            const groupId = String(group?.id || "");
            const selectedInGroup = selectedModifiers[groupId] || [];
            const { minSelect, maxSelect, isRequired } = getGroupValidation(group);

            const groupModifiers = Array.isArray(group?.modifiers)
              ? group.modifiers.filter((modifier) => modifier?.isActive !== false)
              : [];

            if (!groupModifiers.length) return null;

            return (
              <div key={`${String(link?.variationId || "common")}-${groupId}`}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{group?.name}</p>
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

                <div className="grid grid-cols-2 gap-2">
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
                        className={`flex justify-between rounded-lg px-3 py-2 text-sm ${
                          disableBecauseMaxReached
                            ? "bg-gray-100 opacity-70"
                            : "bg-gray-50"
                        }`}
                      >
                        <div className="flex gap-2">
                          <input
                            type={inputType}
                            name={`modifier-group-${groupId}`}
                            checked={checked}
                            disabled={disableBecauseMaxReached}
                            onChange={() =>
                              handleModifierToggle(group, modifier)
                            }
                          />
                          <span>{modifier.name}</span>
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
              className="h-24 w-full rounded-xl bg-gray-100 p-3 text-sm outline-none"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-full bg-gray-100">
              <button
                onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                className="px-3 py-2"
                disabled={loading}
              >
                <Minus size={16} />
              </button>

              <span className="px-4">{qty}</span>

              <button
                onClick={() => setQty((prev) => prev + 1)}
                className="px-3 py-2"
                disabled={loading}
              >
                <Plus size={16} />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3 text-white disabled:opacity-70"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
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