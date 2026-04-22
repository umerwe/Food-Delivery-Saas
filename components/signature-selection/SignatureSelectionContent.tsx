"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Minus,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import useApi from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type SignatureSelectionContentProps = {
  restaurantId?: string | null;
  customerId?: string;
  branchId?: string | null;
  onCartRefresh?: () => void;
};

type ItemPriceOverride = {
  id?: string;
  menuItemId?: string;
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
  name: string;
  priceDelta?: string | number;
  isActive?: boolean;
  itemPriceOverrides?: ItemPriceOverride[];
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

type MenuItem = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  basePrice?: string | number;
  isActive?: boolean;
  categoryId?: string;
  category?: {
    id: string;
    name?: string;
    variations?: MenuVariation[];
    modifierLinks?: ModifierLink[];
  };
  variations?: MenuVariation[];
  modifierLinks?: ModifierLink[];
};

type MenuRecord = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  items?: {
    id: string;
    sortOrder?: number;
    menuItem?: MenuItem;
  }[];
};

export default function SignatureSelectionContent({
  restaurantId,
  customerId,
  branchId,
  onCartRefresh,
}: SignatureSelectionContentProps) {
  const { token } = useAuth();
  const { get, post } = useApi(token);

  const [menus, setMenus] = useState<MenuRecord[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string>("");
  const [loadingMenus, setLoadingMenus] = useState(false);

  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftStart, setScrollLeftStart] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [addingId, setAddingId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedVariation, setSelectedVariation] =
    useState<MenuVariation | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<
    Record<string, Modifier[]>
  >({});
  const [qty, setQty] = useState(1);

  const fetchMenus = async () => {
    if (!restaurantId) return;

    try {
      setLoadingMenus(true);

      const res = await get(`/v1/menus?restaurantId=${restaurantId}`);
      if (!res || res.error) {
        toast.error(res?.error || "Failed to fetch menus");
        return;
      }

      const rawMenus = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : [];

      const menuData: MenuRecord[] = rawMenus.filter(
        (m: MenuRecord) => m?.isActive !== false
      );

      setMenus(menuData);

      if (!activeMenuId && menuData.length > 0) {
        setActiveMenuId(menuData[0].id);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch menus");
    } finally {
      setLoadingMenus(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, [restaurantId]);

  const activeMenu = useMemo(
    () => menus.find((menu) => menu.id === activeMenuId) || menus[0] || null,
    [menus, activeMenuId]
  );

  const getItemVariations = (item?: MenuItem | null): MenuVariation[] => {
    if (!item) return [];

    const rawVariations = [
      ...(Array.isArray(item?.variations) ? item.variations : []),
      ...(Array.isArray(item?.category?.variations)
        ? item.category.variations
        : []),
    ];

    const map = new Map<string, MenuVariation>();

    rawVariations.forEach((variation) => {
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

  const getItemModifierLinks = (item?: MenuItem | null): ModifierLink[] => {
    if (!item) return [];

    const rawLinks = [
      ...(Array.isArray(item?.modifierLinks) ? item.modifierLinks : []),
      ...(Array.isArray(item?.category?.modifierLinks)
        ? item.category.modifierLinks
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

  const getModifierEffectivePrice = (modifier: Modifier, itemId?: string) => {
    const baseDelta = Number(modifier?.priceDelta || 0);

    if (!itemId || !Array.isArray(modifier?.itemPriceOverrides)) {
      return baseDelta;
    }

    const matchedOverride = modifier.itemPriceOverrides.find(
      (override) => String(override?.menuItemId || "") === String(itemId)
    );

    if (!matchedOverride) return baseDelta;

    if (
      matchedOverride?.priceDelta !== undefined &&
      matchedOverride?.priceDelta !== null
    ) {
      return Number(matchedOverride.priceDelta || 0);
    }

    if (matchedOverride?.price !== undefined && matchedOverride?.price !== null) {
      return Number(matchedOverride.price || 0);
    }

    return baseDelta;
  };

  const products = useMemo(() => {
    if (!activeMenu?.items?.length) return [];

    return activeMenu.items
      .filter((entry) => entry?.menuItem && entry.menuItem.isActive !== false)
      .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
      .map((entry) => {
        const item = entry.menuItem as MenuItem;
        const variations = getItemVariations(item);
        const defaultVariation =
          variations.find((v) => v.isDefault) || variations[0] || null;

        return {
          id: item.id,
          name: item.name,
          slug: item.slug,
          price:
            Number(item.basePrice || 0) +
            Number(defaultVariation?.price || 0),
          image: item.imageUrl || "/placeholder.png",
          description: item.description || "",
          variations,
          modifierLinks: getItemModifierLinks(item),
          raw: item,
        };
      });
  }, [activeMenu]);

  const startDragging = (pageX: number) => {
    if (!scrollRef.current) return;
    setIsDown(true);
    setStartX(pageX - scrollRef.current.offsetLeft);
    setScrollLeftStart(scrollRef.current.scrollLeft);
  };

  const stopDragging = () => setIsDown(false);

  const onMouseMove = (pageX: number) => {
    if (!isDown || !scrollRef.current) return;
    const x = pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.1;
    scrollRef.current.scrollLeft = scrollLeftStart - walk;
  };

  const scrollMenu = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = direction === "left" ? -220 : 220;
    scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  const getDefaultVariation = (item: MenuItem) => {
    const variations = getItemVariations(item);
    if (!variations.length) return null;
    return variations.find((v) => v.isDefault) || variations[0];
  };

  const getVisibleModifierLinks = (
    item?: MenuItem | null,
    variation?: MenuVariation | null
  ) => {
    const links = getItemModifierLinks(item);
    const hasVariations = getItemVariations(item).length > 0;

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

  const filteredModifierLinks = useMemo(() => {
    return getVisibleModifierLinks(selectedItem, selectedVariation);
  }, [selectedItem, selectedVariation]);

  const sanitizeSelectedModifiersForVisibleGroups = (
    prev: Record<string, Modifier[]>,
    visibleLinks: ModifierLink[]
  ) => {
    const visibleGroupIds = new Set(
      visibleLinks.map((link) => String(link?.modifierGroup?.id || ""))
    );

    const next: Record<string, Modifier[]> = {};

    Object.entries(prev || {}).forEach(([groupId, modifiers]) => {
      if (!visibleGroupIds.has(String(groupId))) return;
      next[groupId] = modifiers;
    });

    return next;
  };

  useEffect(() => {
    if (!selectedItem) return;

    const visibleLinks = getVisibleModifierLinks(selectedItem, selectedVariation);

    setSelectedModifiers((prev) =>
      sanitizeSelectedModifiersForVisibleGroups(prev, visibleLinks)
    );
  }, [selectedVariation?.id, selectedItem?.id]);

  const openItemModal = (item: MenuItem) => {
    const defaultVariation = getDefaultVariation(item);
    setSelectedItem(item);
    setSelectedVariation(defaultVariation);
    setSelectedModifiers({});
    setQty(1);
    setModalOpen(true);
  };

  const getCalculatedPrice = (
    item: MenuItem,
    variation?: MenuVariation | null,
    modifiersMap?: Record<string, Modifier[]>
  ) => {
    const basePrice = Number(item?.basePrice || 0);
    const variationPrice = variation ? Number(variation.price || 0) : 0;
    const modifiersTotal = Object.values(modifiersMap || {})
      .flat()
      .reduce(
        (acc: number, m: Modifier) =>
          acc + getModifierEffectivePrice(m, item?.id),
        0
      );

    return basePrice + variationPrice + modifiersTotal;
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

  const validateSelections = (
    item: MenuItem,
    modifiersMap: Record<string, Modifier[]>,
    variation?: MenuVariation | null
  ) => {
    const visibleLinks = getVisibleModifierLinks(item, variation);

    for (const link of visibleLinks) {
      const group = link?.modifierGroup;
      const groupId = String(group?.id || "");
      const selected = modifiersMap[groupId] || [];
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

  const addToCart = async (
    item: MenuItem,
    quantity = 1,
    variation?: MenuVariation | null,
    modifiersMap?: Record<string, Modifier[]>
  ) => {
    if (!customerId) {
      toast.error("Customer not found");
      return;
    }

    if (!branchId) {
      toast.error("Please select a branch first");
      return;
    }

    const safeModifiersMap = modifiersMap || {};

    if (!validateSelections(item, safeModifiersMap, variation)) {
      return;
    }

    try {
      setAddingId(item.id);

      const payload = {
        menuItemId: item.id,
        quantity,
        variationId: variation?.id || null,
        branchId,
        modifiers: Object.values(safeModifiersMap)
          .flat()
          .map((m) => ({
            modifierId: m.id,
            quantity: 1,
          })),
      };

      const res = await post(`/v1/cart/items?customerId=${customerId}`, payload);

      if (!res || res.error) {
        toast.error(res?.error || "Failed to add to cart");
        return;
      }

      toast.success("Added to cart");
      setModalOpen(false);
      onCartRefresh?.();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setAddingId(null);
    }
  };

  const handleAddClick = (item: MenuItem) => {
    const variations = getItemVariations(item);
    const modifiers = getItemModifierLinks(item);
    const hasOptions = variations.length > 0 || modifiers.length > 0;

    if (hasOptions) {
      openItemModal(item);
      return;
    }

    addToCart(item, 1, null, {});
  };

  const totalModalPrice = selectedItem
    ? getCalculatedPrice(selectedItem, selectedVariation, selectedModifiers) * qty
    : 0;

  return (
    <>
      <section className="overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8 xl:pr-5">
        <div className="w-full max-w-full">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-[21px] font-semibold leading-tight tracking-[-0.02em] text-[#1f1f1f] sm:text-[32px]">
                Our Signature Selection
              </h1>
              <p className="mt-2 max-w-[560px] text-[13px] leading-6 text-[#8a8a8a] sm:text-sm">
                Every dish is a curated masterpiece, crafted with locally sourced
                ingredients and a passion for culinary excellence.
              </p>
            </div>
          </div>

          <div className="relative mb-7 w-full max-w-full overflow-hidden">
            <button
              onClick={() => scrollMenu("left")}
              className="absolute left-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/90 shadow-[0_6px_20px_rgba(0,0,0,0.06)] backdrop-blur md:flex"
            >
              <ChevronLeft className="h-4 w-4 text-[#555]" />
            </button>

            <div
              ref={scrollRef}
              className={`scrollbar-hide flex w-full max-w-full select-none gap-2.5 overflow-x-auto py-2 md:px-11 ${
                isDown ? "cursor-grabbing" : "cursor-grab"
              }`}
              onMouseDown={(e) => startDragging(e.pageX)}
              onMouseLeave={stopDragging}
              onMouseUp={stopDragging}
              onMouseMove={(e) => onMouseMove(e.pageX)}
              onTouchStart={(e) => startDragging(e.touches[0].pageX)}
              onTouchEnd={stopDragging}
              onTouchMove={(e) => onMouseMove(e.touches[0].pageX)}
            >
              {menus.map((menu) => {
                const active = activeMenu?.id === menu.id;

                return (
                  <button
                    key={menu.id}
                    onClick={() => setActiveMenuId(menu.id)}
                    className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                      active
                        ? "border-primary/15 bg-primary text-primary-foreground shadow-[0_8px_18px_rgba(0,0,0,0.08)]"
                        : "border-black/10 bg-white text-[#444] hover:border-primary/30 hover:text-primary"
                    }`}
                  >
                    {menu.name}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => scrollMenu("right")}
              className="absolute right-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/90 shadow-[0_6px_20px_rgba(0,0,0,0.06)] backdrop-blur md:flex"
            >
              <ChevronRight className="h-4 w-4 text-[#555]" />
            </button>
          </div>

          {loadingMenus ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-black/10 bg-[#fafafa] p-8 text-center">
              <p className="text-sm text-[#777]">No menu items found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {products.map((product) => {
                const nameParts = product.name.split(" ");
                const firstLine = nameParts.slice(0, 2).join(" ");
                const secondLine = nameParts.slice(2).join(" ");

                return (
                  <div
                    key={product.id}
                    className="group min-w-0 overflow-hidden rounded-[20px] border border-black/5 bg-white shadow-[-12px_0_32px_0_rgba(26,28,28,0.09)] transition-all duration-300 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
                  >
                    <div className="relative h-[210px] w-full overflow-hidden bg-[#f5f5f5]">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        unoptimized
                      />
                    </div>

                    <div className="p-4">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <h3 className="min-w-0 flex-1 text-[17px] font-semibold leading-[1.35] tracking-[-0.01em] text-[#202020]">
                          <span className="block break-words">{firstLine}</span>
                          <span className="block break-words">{secondLine}</span>
                        </h3>

                        <span className="shrink-0 pt-0.5 text-[18px] font-semibold text-primary">
                          ${Number(product.price || 0).toFixed(2)}
                        </span>
                      </div>

                      <p className="line-clamp-2 min-h-[44px] text-[13px] leading-[1.65] text-[#8a8a8a]">
                        {product.description}
                      </p>

                      <button
                        onClick={() => handleAddClick(product.raw)}
                        disabled={addingId === product.id}
                        className="mt-4 flex h-11 w-full items-center justify-center rounded-full border border-primary/10 bg-primary text-[13px] font-medium text-primary-foreground shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-95 disabled:opacity-70"
                      >
                        {addingId === product.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "+ Add to Cart"
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <style jsx>{`
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </section>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[95vh] max-w-md overflow-auto rounded-2xl p-6">
          {selectedItem && (
            <>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-gray-900">
                    {selectedItem.name}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Select variation, modifiers, and quantity
                  </p>
                </div>
              </div>

              {!!getItemVariations(selectedItem).length && (
                <div className="mb-5">
                  <p className="mb-2 font-medium text-gray-900">Size</p>

                  <div className="grid grid-cols-1 gap-3">
                    {getItemVariations(selectedItem).map((variation) => (
                      <label
                        key={variation.id}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition ${
                          selectedVariation?.id === variation.id
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name={`size-${selectedItem.id}`}
                            checked={selectedVariation?.id === variation.id}
                            onChange={() => setSelectedVariation(variation)}
                            className="accent-[var(--primary)]"
                          />
                          <span className="text-sm font-medium text-gray-800">
                            {variation.name}
                          </span>
                        </div>

                        <span className="text-sm font-semibold text-primary">
                          {Number(variation.price) > 0
                            ? `+$${Number(variation.price).toFixed(2)}`
                            : "+$0.00"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {filteredModifierLinks.map((link) => {
                const group = link.modifierGroup;
                const groupId = String(group?.id || "");
                const selectedInGroup = selectedModifiers[groupId] || [];
                const { minSelect, maxSelect, isRequired } =
                  getGroupValidation(group);

                return (
                  <div
                    key={`${String(link?.variationId || "common")}-${groupId}`}
                    className="mb-5"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {group?.name}
                        </p>
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

                    <div className="space-y-2">
                      {(group?.modifiers || [])
                        .filter((m) => m.isActive !== false)
                        .map((modifier) => {
                          const checked = selectedInGroup.some(
                            (selected) => selected.id === modifier.id
                          );

                          const disableBecauseMaxReached =
                            !checked &&
                            !!maxSelect &&
                            selectedInGroup.length >= maxSelect;

                          const effectivePrice = getModifierEffectivePrice(
                            modifier,
                            selectedItem.id
                          );

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
                                  type="checkbox"
                                  checked={checked}
                                  disabled={disableBecauseMaxReached}
                                  onChange={() =>
                                    handleModifierToggle(group, modifier)
                                  }
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
                    disabled={addingId === selectedItem.id}
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <span className="px-4 text-sm font-semibold text-gray-900">
                    {qty}
                  </span>

                  <button
                    onClick={() => setQty((prev) => prev + 1)}
                    className="px-2 text-lg text-gray-700"
                    disabled={addingId === selectedItem.id}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-lg font-semibold text-primary">
                  ${totalModalPrice.toFixed(2)}
                </div>
              </div>

              <button
                onClick={() =>
                  addToCart(
                    selectedItem,
                    qty,
                    selectedVariation,
                    selectedModifiers
                  )
                }
                disabled={addingId === selectedItem.id}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {addingId === selectedItem.id && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                {addingId === selectedItem.id ? "Processing..." : "Add to Cart"}
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}