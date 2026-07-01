"use client";

import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import useItems from "@/hooks/useItems";
import { isFlexibleAllItemsDeal } from "@/components/pages/Home/utils/customer-deal-cart";
import type { MenuItem } from "@/components/pages/Items/types";
import type { CustomerDeal, CustomerDealMenuItem, CustomerDealMenuItemOption } from "@/types/customer-deals";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeOptions = (value: unknown): CustomerDealMenuItemOption[] | undefined =>
  Array.isArray(value) ? value.filter(isRecord) : undefined;

export const toDealEligibleMenuItem = (item: MenuItem): CustomerDealMenuItem | null => {
  const id = item.id ? String(item.id) : "";

  if (!id) {
    return null;
  }

  return {
    id,
    name: item.name || "Item",
    slug: item.slug,
    description: item.description,
    imageUrl: item.imageUrl,
    basePrice: item.basePrice ?? item.price,
    discountedBasePrice: item.discountedBasePrice,
    category: {
      id: item.categoryId ? String(item.categoryId) : undefined,
      name: typeof item.category?.name === "string" ? item.category.name : undefined,
    },
    variations: normalizeOptions(item.variations),
    modifierGroups: [],
    modifiers: [],
    modifierLinks: [],
    supportsSplitPizza: item.supportsSplitPizza ?? null,
    minSelect: null,
    maxSelect: item.maxSelect,
    isRequired: false,
    minQuantity: null,
    maxQuantity: item.maxQuantity,
    supportsDealIdCartPayload: item.supportsDealIdCartPayload ?? undefined,
    supportsDealCartPayload: item.supportsDealCartPayload ?? undefined,
    isDealMenuItem: item.isDealMenuItem ?? undefined,
  };
};

export const mergeUniqueDealEligibleItems = (
  groups: CustomerDealMenuItem[][]
): CustomerDealMenuItem[] => {
  const itemsById = new Map<string, CustomerDealMenuItem>();

  groups.flat().forEach((item) => {
    const id = item.id.trim();

    if (id && !itemsById.has(id)) {
      itemsById.set(id, item);
    }
  });

  return Array.from(itemsById.values());
};

export const getDealRequiredSelectionCount = (deal: CustomerDeal | null) => {
  if (!deal) {
    return 1;
  }

  const categoryRuleQuantity = (deal.scopeCategoryRules ?? []).reduce(
    (total, rule) => total + rule.itemLimit,
    0
  );

  if (categoryRuleQuantity > 0) {
    return categoryRuleQuantity;
  }

  const parsed = Number(deal.dealRequiredQuantity);

  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.floor(parsed);
  }

  if (deal.dealSelectionMode === "FIXED_ITEMS" && deal.scopeMenuItems.length > 0) {
    return deal.scopeMenuItems.length;
  }

  return 1;
};

export const canSubmitDealSelection = ({
  selectedCount,
  requiredCount,
}: {
  selectedCount: number;
  requiredCount: number;
}) => selectedCount === requiredCount;

export const useDealEligibleItems = ({
  deal,
  open,
}: {
  deal: CustomerDeal | null;
  open: boolean;
}) => {
  const { token, restaurantId: authRestaurantId, user } = useAuth();
  const { fetchMenuItemsPage } = useItems(token);
  const [categoryItems, setCategoryItems] = useState<CustomerDealMenuItem[]>([]);
  const [allMenuItems, setAllMenuItems] = useState<CustomerDealMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryIds = useMemo(
    () => {
      const ruleCategoryIds = deal?.scopeCategoryRules?.map(({ menuCategoryId }) => menuCategoryId) ?? [];
      const scopedCategoryIds = deal?.scopeCategories.map(({ id }) => id) ?? [];

      return Array.from(new Set([...ruleCategoryIds, ...scopedCategoryIds].filter(Boolean)));
    },
    [deal]
  );
  const categoryIdsKey = categoryIds.join(":");
  const restaurantId = deal?.restaurant?.id || authRestaurantId || "";
  const branchId = user?.branchId || user?.branch?.id || null;
  const shouldFetchAllMenuItems = deal ? isFlexibleAllItemsDeal(deal) : false;

  useEffect(() => {
    let isMounted = true;

    const fetchEligibleItems = async () => {
      if (!open || !deal || (!shouldFetchAllMenuItems && categoryIds.length === 0)) {
        setCategoryItems([]);
        setAllMenuItems([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      if (!restaurantId) {
        setCategoryItems([]);
        setAllMenuItems([]);
        setError("Restaurant is unavailable for this deal.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        if (shouldFetchAllMenuItems) {
          const { items } = await fetchMenuItemsPage({
            restaurantId,
            branchId,
            page: 1,
            limit: 100,
          });

          if (!isMounted) {
            return;
          }

          setCategoryItems([]);
          setAllMenuItems(
            mergeUniqueDealEligibleItems([
              items.map(toDealEligibleMenuItem).filter((item): item is CustomerDealMenuItem => item !== null),
            ])
          );
          return;
        }

        const responses = await Promise.all(
          categoryIds.map((categoryId) =>
            fetchMenuItemsPage({
              restaurantId,
              branchId,
              categoryId,
              page: 1,
              limit: 100,
            })
          )
        );

        if (!isMounted) {
          return;
        }

        const nextItems = mergeUniqueDealEligibleItems(
          responses.map(({ items }) =>
            items.map(toDealEligibleMenuItem).filter((item): item is CustomerDealMenuItem => item !== null)
          )
        );

        setAllMenuItems([]);
        setCategoryItems(nextItems);
      } catch {
        if (isMounted) {
          setCategoryItems([]);
          setAllMenuItems([]);
          setError("Unable to load eligible items for this deal.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchEligibleItems();

    return () => {
      isMounted = false;
    };
  }, [branchId, categoryIds, categoryIdsKey, deal, fetchMenuItemsPage, open, restaurantId, shouldFetchAllMenuItems]);

  const items = shouldFetchAllMenuItems
    ? allMenuItems
    : categoryIds.length > 0
      ? categoryItems
      : deal?.scopeMenuItems ?? [];

  return {
    items,
    isLoading,
    error,
  };
};
