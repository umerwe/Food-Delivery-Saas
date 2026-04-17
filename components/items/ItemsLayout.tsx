"use client";

import { useEffect, useRef, useState } from "react";
import CategorySidebar from "./CategorySidebar";
import ItemsListing from "./Items";
import useApi from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";

export default function ItemsLayout({ categoryId }: any) {
  const { token } = useAuth();
  const { get } = useApi(token);

  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingMoreCategories, setLoadingMoreCategories] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreCategories, setHasMoreCategories] = useState(false);

  const requestInFlightRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const getRestaurantId = () => {
    if (typeof window === "undefined") return null;

    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}");
      return auth?.user?.restaurantId || null;
    } catch {
      return null;
    }
  };

  const fetchCategories = async ({
    page = 1,
    searchValue = "",
    append = false,
  }: {
    page?: number;
    searchValue?: string;
    append?: boolean;
  }) => {
    const restaurantId = getRestaurantId();

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
      });

      if (searchValue) {
        params.set("search", searchValue);
      }

      const res = await get(`/v1/menu/categories?${params.toString()}`);

      const fetchedCategories = res?.data || [];
      const meta = res?.meta || {};

      setCategories((prev) => {
        if (!append) return fetchedCategories;

        const existingIds = new Set(prev.map((item: any) => item.id));
        const newItems = fetchedCategories.filter(
          (item: any) => !existingIds.has(item.id)
        );

        return [...prev, ...newItems];
      });

      setCurrentPage(meta?.page || page);
      setHasMoreCategories(Boolean(meta?.hasNext));
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
    if (!token) return;

    fetchCategories({
      page: 1,
      searchValue: debouncedSearch,
      append: false,
    });
  }, [token, debouncedSearch]);

  const handleLoadMoreCategories = async () => {
    if (loadingCategories || loadingMoreCategories || !hasMoreCategories) return;

    await fetchCategories({
      page: currentPage + 1,
      searchValue: debouncedSearch,
      append: true,
    });
  };

  return (
    <div className="flex gap-6 px-4 md:px-10 py-6">
      {/* SIDEBAR */}
      <div className="hidden lg:block w-[260px]">
        <CategorySidebar
          activeCategoryId={categoryId}
          categories={categories}
          loading={loadingCategories}
          loadingMore={loadingMoreCategories}
          hasMore={hasMoreCategories}
          search={search}
          onSearchChange={setSearch}
          onLoadMore={handleLoadMoreCategories}
        />
      </div>

      {/* ITEMS */}
      <div className="flex-1">
        <ItemsListing categoryId={categoryId} categories={categories} />
      </div>
    </div>
  );
}