"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CategorySidebar from "./CategorySidebar";
import ItemsListing from "./Items";
import useApi from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";

type MenuViewMode = "multiple" | "onePage";

const CATEGORY_PAGE_LIMIT = 20;

const normalizeApiArray = (res: any) => {
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data?.items)) return res.data.items;
  if (Array.isArray(res?.items)) return res.items;
  return [];
};

const normalizeApiMeta = (res: any) => {
  return (
    res?.data?.pagination ||
    res?.data?.meta ||
    res?.data?.data?.pagination ||
    res?.data?.data?.meta ||
    res?.pagination ||
    res?.meta ||
    {}
  );
};

const resolveHasNext = ({
  meta,
  page,
  limit,
  receivedCount,
  totalLoaded,
}: {
  meta: any;
  page: number;
  limit: number;
  receivedCount: number;
  totalLoaded: number;
}) => {
  if (typeof meta?.hasNext === "boolean") return meta.hasNext;
  if (typeof meta?.hasMore === "boolean") return meta.hasMore;

  const total = Number(meta?.total ?? 0);
  const totalPages = Number(meta?.totalPages ?? meta?.pages ?? 0);
  const currentPage = Number(meta?.page ?? page);

  if (totalPages > 0) return currentPage < totalPages;
  if (total > 0) return totalLoaded < total;

  return receivedCount >= limit;
};

export default function ItemsLayout({ categoryId }: any) {
  const { token, restaurantId: authRestaurantId, user } = useAuth();
  const { get } = useApi(token);

  const [categories, setCategories] = useState<any[]>([]);
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
    if (typeof window === "undefined") return "multiple";

    const stored = localStorage.getItem("menuViewMode");

    return stored === "onePage" || stored === "multiple"
      ? stored
      : "multiple";
  });

  const requestInFlightRef = useRef(false);

  const getStoredRestaurantId = () => {
    if (typeof window === "undefined") return null;

    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}");
      return auth?.user?.restaurantId || null;
    } catch {
      return null;
    }
  };

  const restaurantId = useMemo(() => {
    return (
      authRestaurantId ||
      user?.restaurantId ||
      getStoredRestaurantId() ||
      ""
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authRestaurantId, user?.restaurantId]);

  useEffect(() => {
    localStorage.setItem("menuViewMode", viewMode);
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

      const params = new URLSearchParams({
        restaurantId: String(restaurantId),
        page: String(page),
        limit: String(CATEGORY_PAGE_LIMIT),
        sortBy: "sortOrder",
        sortOrder: "ASC",
      });

      if (searchValue) {
        params.set("search", searchValue);
      }

      const res = await get(`/v1/menu/categories?${params.toString()}`);

      const fetchedCategories = normalizeApiArray(res);
      const meta = normalizeApiMeta(res);

      setCategories((prev) => {
        if (!append) return fetchedCategories;

        const existingIds = new Set(prev.map((item: any) => String(item.id)));

        const newItems = fetchedCategories.filter((item: any) => {
          return item?.id && !existingIds.has(String(item.id));
        });

        return [...prev, ...newItems];
      });

      const nextTotalLoaded = append
        ? categories.length + fetchedCategories.length
        : fetchedCategories.length;

      setCurrentPage(Number(meta?.page ?? page));
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
      console.error("Failed to fetch categories:", err);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="flex flex-col gap-6 px-4 py-6 md:px-10 lg:flex-row">
      {/* SIDEBAR */}
      <aside className="w-full shrink-0 lg:sticky lg:top-6 lg:w-[280px] lg:self-start">
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