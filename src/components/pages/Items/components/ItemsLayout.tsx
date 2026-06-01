"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CategorySidebar from "./CategorySidebar";
import { ItemsListing } from "./Items";
import useItems from "@/hooks/useItems";
import { useAuth } from "@/hooks/useAuth";
import { getStoredRestaurantId } from "@/lib/auth";
import { getItemsMenuViewMode, setItemsMenuViewMode } from "@/lib/view-preferences";
import type { ApiMeta, ItemsCategory } from "@/components/pages/Items/types";
import { resolveHasNext } from "@/components/pages/Items/utils/restaurant-card-utils";

type MenuViewMode = "multiple" | "onePage";

const CATEGORY_PAGE_LIMIT = 20;

type ItemsLayoutProps = {
  categoryId?: string;
};

export function ItemsLayout({ categoryId }: ItemsLayoutProps) {
  const { token, restaurantId: authRestaurantId, user } = useAuth();
  const { fetchMenuCategoriesPage } = useItems(token);

  const [categories, setCategories] = useState<ItemsCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingMoreCategories, setLoadingMoreCategories] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreCategories, setHasMoreCategories] = useState(false);

  const [activeOnePageCategoryId, setActiveOnePageCategoryId] = useState("");
  const [scrollTarget, setScrollTarget] = useState<{
    id: string;
    nonce: number;
  } | null>(null);

  const [viewMode, setViewMode] = useState<MenuViewMode>(() => {
    return getItemsMenuViewMode();
  });

  const requestInFlightRef = useRef(false);

  const restaurantId = useMemo(() => {
    return (
      authRestaurantId ||
      user?.restaurantId ||
      getStoredRestaurantId() ||
      ""
    );
  }, [authRestaurantId, user?.restaurantId]);

  useEffect(() => {
    setItemsMenuViewMode(viewMode);
  }, [viewMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchCategories = async ({
    page = 1,
    searchValue = "",
    append = false,
  }: {
    page?: number;
    searchValue?: string;
    append?: boolean;
  }) => {
    if (!token || !restaurantId) return;
    if (requestInFlightRef.current) return;

    try {
      requestInFlightRef.current = true;

      if (append) {
        setLoadingMoreCategories(true);
      } else {
        setLoadingCategories(true);
      }

      const { categories: fetchedCategories, meta } = await fetchMenuCategoriesPage({
        restaurantId: String(restaurantId),
        page,
        limit: CATEGORY_PAGE_LIMIT,
        search: searchValue,
      });

      setCategories((prev) => {
        if (!append) return fetchedCategories;

        const existingIds = new Set(prev.map((item) => String(item.id)));

        const newItems = fetchedCategories.filter((item) => {
          return item?.id && !existingIds.has(String(item.id));
        });

        return [...prev, ...newItems];
      });

      const nextTotalLoaded = append
        ? categories.length + fetchedCategories.length
        : fetchedCategories.length;

      setCurrentPage(Number((meta as ApiMeta)?.page ?? page));
      setHasMoreCategories(
        resolveHasNext({
          meta,
          page,
          limit: CATEGORY_PAGE_LIMIT,
          receivedCount: fetchedCategories.length,
          totalLoaded: nextTotalLoaded,
        })
      );
    } catch (err) {

      if (!append) {
        setCategories([]);
      }

      setHasMoreCategories(false);
    } finally {
      requestInFlightRef.current = false;
      setLoadingCategories(false);
      setLoadingMoreCategories(false);
    }
  };

  useEffect(() => {
    if (!token || !restaurantId) return;

    fetchCategories({
      page: 1,
      searchValue: debouncedSearch,
      append: false,
    });
  }, [token, restaurantId, debouncedSearch]);

  useEffect(() => {
    if (!categories.length) {
      setActiveOnePageCategoryId("");
      return;
    }

    const activeStillExists = categories.some(
      (category) => String(category.id) === String(activeOnePageCategoryId)
    );

    if (!activeOnePageCategoryId || !activeStillExists) {
      setActiveOnePageCategoryId(String(categories[0].id));
    }
  }, [categories, activeOnePageCategoryId]);

  const handleLoadMoreCategories = async () => {
    if (loadingCategories || loadingMoreCategories || !hasMoreCategories) {
      return;
    }

    await fetchCategories({
      page: currentPage + 1,
      searchValue: debouncedSearch,
      append: true,
    });
  };

  const activeCategoryId = useMemo(() => {
    if (viewMode === "onePage") {
      return activeOnePageCategoryId || String(categories?.[0]?.id || "");
    }

    return String(categoryId || categories?.[0]?.id || "");
  }, [viewMode, activeOnePageCategoryId, categoryId, categories]);

  const handleViewModeChange = (nextMode: MenuViewMode) => {
    setViewMode(nextMode);

    if (nextMode === "onePage") {
      const id = String(activeCategoryId || categories?.[0]?.id || "");

      if (id) {
        setActiveOnePageCategoryId(id);
        setScrollTarget({
          id,
          nonce: Date.now(),
        });
      }
    }
  };

  const handleCategorySelect = (id: string) => {
    if (viewMode !== "onePage") return;

    setActiveOnePageCategoryId(String(id));
    setScrollTarget({
      id: String(id),
      nonce: Date.now(),
    });
  };

  return (
    <div className="flex min-w-0 flex-col gap-6 px-4 py-6 md:px-10 lg:flex-row lg:items-start">
      {/* SIDEBAR */}
      <aside className="w-full min-w-0 shrink-0 lg:sticky lg:top-24 lg:w-[280px] lg:self-start">
        <CategorySidebar
          activeCategoryId={activeCategoryId}
          categories={categories}
          loading={loadingCategories}
          loadingMore={loadingMoreCategories}
          hasMore={hasMoreCategories}
          search={search}
          onSearchChange={setSearch}
          onLoadMore={handleLoadMoreCategories}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onCategorySelect={handleCategorySelect}
        />
      </aside>

      {/* ITEMS */}
      <main className="min-w-0 flex-1">
        <ItemsListing
          categoryId={categoryId}
          categories={categories}
          viewMode={viewMode}
          scrollTarget={scrollTarget}
          onActiveCategoryChange={setActiveOnePageCategoryId}
        />
      </main>
    </div>
  );
}
