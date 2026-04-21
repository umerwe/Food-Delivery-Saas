"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Minus,
  Plus,
  X,
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

type MenuVariation = {
  id: string;
  name: string;
  price: string | number;
  isDefault?: boolean;
  isActive?: boolean;
};

type Modifier = {
  id: string;
  name: string;
  priceDelta?: string | number;
  isActive?: boolean;
};

type ModifierGroup = {
  id: string;
  name: string;
  modifiers: Modifier[];
};

type ModifierLink = {
  id: string;
  variationId?: string | null;
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

      const menuData: MenuRecord[] = (res?.data || []).filter(
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

  const products = useMemo(() => {
    if (!activeMenu?.items?.length) return [];

    return activeMenu.items
      .filter((entry) => entry?.menuItem && entry.menuItem.isActive !== false)
      .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
      .map((entry) => {
        const item = entry.menuItem as MenuItem;

        return {
          id: item.id,
          name: item.name,
          slug: item.slug,
          price: Number(item.basePrice || 0),
          image: item.imageUrl || "/placeholder.png",
          description: item.description || "",
          variations: (item.variations || []).filter((v) => v.isActive !== false),
          modifierLinks: item.modifierLinks || [],
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
    const variations = (item.variations || []).filter((v) => v.isActive !== false);
    if (!variations.length) return null;
    return variations.find((v) => v.isDefault) || variations[0];
  };

  const filteredModifierLinks = useMemo(() => {
  if (!selectedItem?.modifierLinks?.length) return [];

  return selectedItem.modifierLinks.filter((group) => {
    const groupName = group?.modifierGroup?.name?.trim()?.toLowerCase();

    if ((selectedItem?.variations?.length ?? 0) > 0 && groupName === "size") {
      return false;
    }

    if (group?.variationId && selectedVariation?.id) {
      return group.variationId === selectedVariation.id;
    }

    if (group?.variationId && !selectedVariation?.id) {
      return false;
    }

    return true;
  });
}, [selectedItem, selectedVariation]);

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
      .reduce((acc: number, m: Modifier) => acc + Number(m.priceDelta || 0), 0);

    return basePrice + variationPrice + modifiersTotal;
  };

  const handleModifierChange = (
    groupId: string,
    modifier: Modifier,
    checked: boolean
  ) => {
    setSelectedModifiers((prev) => {
      const current = prev[groupId] || [];

      if (checked) {
        return { ...prev, [groupId]: [...current, modifier] };
      }

      return {
        ...prev,
        [groupId]: current.filter((m) => m.id !== modifier.id),
      };
    });
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

    try {
      setAddingId(item.id);

      const payload = {
        menuItemId: item.id,
        quantity,
        variationId: variation?.id || null,
        branchId,
        modifiers: Object.values(modifiersMap || {})
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
    const variations = (item.variations || []).filter((v) => v.isActive !== false);
    const modifiers = item.modifierLinks || [];
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
                          ${product.price.toFixed(2)}
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

                <button
                  onClick={() => setModalOpen(false)}
                  className="rounded-full p-2 text-[#777] transition hover:bg-[#f5f5f5] hover:text-[#222]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {!!selectedItem.variations?.filter((v) => v.isActive !== false).length && (
                <div className="mb-5">
                  <p className="mb-2 font-medium text-gray-900">Size</p>

                  <div className="grid grid-cols-1 gap-3">
                    {selectedItem.variations
                      ?.filter((v) => v.isActive !== false)
                      .map((variation) => (
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

              {filteredModifierLinks.map((group) => (
                <div key={group.id} className="mb-5">
                  <p className="mb-2 font-medium text-gray-900">
                    {group.modifierGroup?.name}
                  </p>

                  <div className="space-y-2">
                    {(group.modifierGroup?.modifiers || [])
                      .filter((m) => m.isActive !== false)
                      .map((modifier) => {
                        const checked = (
                          selectedModifiers[group.modifierGroup.id] || []
                        ).some((selected) => selected.id === modifier.id);

                        return (
                          <label
                            key={modifier.id}
                            className="flex cursor-pointer items-center justify-between rounded-xl bg-gray-50 px-3 py-3 text-sm"
                          >
                            <span className="flex items-center gap-2 text-gray-800">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) =>
                                  handleModifierChange(
                                    group.modifierGroup.id,
                                    modifier,
                                    e.target.checked
                                  )
                                }
                                className="accent-[var(--primary)]"
                              />
                              {modifier.name}
                            </span>

                            <span className="font-medium text-primary">
                              +${Number(modifier.priceDelta || 0).toFixed(2)}
                            </span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              ))}

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