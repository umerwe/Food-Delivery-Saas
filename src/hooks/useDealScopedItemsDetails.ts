"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/config/query-keys";
import { fetchMenuItemDetailsByIds } from "@/services/items";
import type { MenuItem } from "@/components/pages/Items/types";
import type { CustomerDealMenuItem, CustomerDealMenuItemOption } from "@/types/customer-deals";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeOptions = (value: unknown): CustomerDealMenuItemOption[] | undefined =>
  Array.isArray(value) ? value.filter(isRecord) : undefined;

const toDealScopedMenuItem = (item: MenuItem): CustomerDealMenuItem | null => {
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
    modifierGroups: normalizeOptions(item.modifierGroups),
    modifiers: normalizeOptions(item.modifiers),
    modifierLinks: normalizeOptions(item.modifierLinks),
    supportsSplitPizza: item.supportsSplitPizza ?? null,
    minSelect: item.minSelect,
    maxSelect: item.maxSelect,
    isRequired: item.isRequired,
    minQuantity: item.minQuantity,
    maxQuantity: item.maxQuantity,
    supportsDealIdCartPayload: item.supportsDealIdCartPayload ?? undefined,
    supportsDealCartPayload: item.supportsDealCartPayload ?? undefined,
    isDealMenuItem: item.isDealMenuItem ?? undefined,
  };
};

export const useDealScopedItemsDetails = ({
  itemIds,
  items = [],
  enabled,
}: {
  itemIds: string[];
  items?: CustomerDealMenuItem[];
  enabled: boolean;
}) => {
  const { token } = useAuth();
  const uniqueItemIds = useMemo(
    () => Array.from(new Set(itemIds.map((id) => id.trim()).filter(Boolean))),
    [itemIds]
  );
  const itemIdsKey = uniqueItemIds.join(":");
  const itemSearchTermsById = useMemo(
    () =>
      Object.fromEntries(
        items
          .map((item) => {
            const id = item.id.trim();

            return [
              id,
              [item.slug ?? "", item.name].map((term) => term.trim()).filter(Boolean),
            ] as const;
          })
          .filter(([id]) => id)
      ),
    [items]
  );

  const query = useQuery({
    queryKey: queryKeys.items.dealScopedDetails(uniqueItemIds, itemSearchTermsById),
    enabled: enabled && uniqueItemIds.length > 0 && Boolean(token),
    queryFn: async () => {
      const details = await fetchMenuItemDetailsByIds({
        itemIds: uniqueItemIds,
        itemSearchTermsById,
        token,
      });
      const entries = Object.entries(details)
        .map(([itemId, item]) => {
          const normalized = toDealScopedMenuItem(item);

          return normalized ? [itemId, normalized] as const : null;
        })
        .filter((entry): entry is readonly [string, CustomerDealMenuItem] => entry !== null);

      return Object.fromEntries(entries);
    },
  });

  return {
    ...query,
    itemIdsKey,
    detailsById: query.data ?? {},
  };
};
