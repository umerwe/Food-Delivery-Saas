import { createDomainApiService } from "@/services/domain-api";
import { normalizeApiArray, normalizeApiMeta } from "@/components/pages/Items/utils/restaurant-card-utils";
import type { ApiMeta, ItemsCategory, MenuItem } from "@/components/pages/Items/types";

const itemsService = createDomainApiService();

export const getItems = itemsService.get;
export const postItems = itemsService.post;
export const patchItems = itemsService.patch;
export const deleteItems = itemsService.del;

export const fetchMenuItems = async (endpoint: string, token?: string | null) => {
  const response = await getItems(endpoint, token);

  return {
    response,
    items: normalizeApiArray<MenuItem>(response),
  };
};

export const fetchMenuItemsPage = async ({
  restaurantId,
  categoryId,
  page,
  limit,
  token,
}: {
  restaurantId: string;
  categoryId?: string;
  page: number;
  limit: number;
  token?: string | null;
}) => {
  const params = new URLSearchParams({
    restaurantId,
    page: String(page),
    limit: String(limit),
    sortBy: "sortOrder",
    sortOrder: "ASC",
  });

  if (categoryId) {
    params.set("categoryId", categoryId);
  }

  const response = await getItems(`/v1/menu/items?${params.toString()}`, token);

  return {
    response,
    items: normalizeApiArray<MenuItem>(response),
    meta: normalizeApiMeta(response),
  };
};

export const fetchMenuItemDetailsByIds = async ({
  itemIds,
  itemSearchTermsById = {},
  token,
}: {
  itemIds: string[];
  itemSearchTermsById?: Record<string, string[]>;
  token?: string | null;
}) => {
  const uniqueIds = Array.from(
    new Set(itemIds.map((id) => id.trim()).filter(Boolean))
  );

  const responses = await Promise.all(
    uniqueIds.map(async (itemId) => {
      const searchTerms = Array.from(
        new Set(
          [itemId, ...(itemSearchTermsById[itemId] ?? [])]
            .map((term) => term.trim())
            .filter(Boolean)
        )
      );
      let matchedItem: MenuItem | null = null;

      for (const searchTerm of searchTerms) {
        const response = await getItems(
          `/v1/menu/items?search=${encodeURIComponent(searchTerm)}`,
          token
        );
        const items = normalizeApiArray<MenuItem>(response);
        const normalizedSearchTerm = searchTerm.toLowerCase();

        matchedItem =
          items.find((item) => String(item?.id || "") === itemId) ||
          items.find((item) => String(item?.slug || "").toLowerCase() === normalizedSearchTerm) ||
          items.find((item) => String(item?.name || "").toLowerCase() === normalizedSearchTerm) ||
          null;

        if (matchedItem) {
          break;
        }
      }

      return [itemId, matchedItem] as const;
    })
  );

  return Object.fromEntries(
    responses.filter((entry): entry is readonly [string, MenuItem] => entry[1] !== null)
  );
};

export const fetchSplitPizzaMenuItems = async ({
  restaurantId,
  search,
  page,
  token,
}: {
  restaurantId?: string | number | null;
  search: string;
  page: number;
  token?: string | null;
}): Promise<{ data: MenuItem[]; meta?: ApiMeta }> => {
  const queryParams = new URLSearchParams();

  queryParams.set("page", String(page));
  queryParams.set("supportsSplitPizza", "true");

  if (restaurantId) {
    queryParams.set("restaurantId", String(restaurantId));
  }

  const resolvedSearch = search?.trim();

  if (resolvedSearch) {
    queryParams.set("search", resolvedSearch);
  }

  const response = await getItems(`/v1/menu/items?${queryParams.toString()}`, token);

  return {
    data: normalizeApiArray<MenuItem>(response).filter((menuItem) => Boolean(menuItem?.id)),
    meta: normalizeApiMeta(response),
  };
};

export const fetchMenuCategoriesPage = async ({
  restaurantId,
  page,
  limit,
  search,
  token,
}: {
  restaurantId: string;
  page: number;
  limit: number;
  search?: string;
  token?: string | null;
}) => {
  const params = new URLSearchParams({
    restaurantId,
    page: String(page),
    limit: String(limit),
    sortBy: "sortOrder",
    sortOrder: "ASC",
  });

  if (search) {
    params.set("search", search);
  }

  const response = await getItems(`/v1/menu/categories?${params.toString()}`, token);

  return {
    response,
    categories: normalizeApiArray<ItemsCategory>(response),
    meta: normalizeApiMeta(response),
  };
};
