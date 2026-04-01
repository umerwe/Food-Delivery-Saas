"use client";

import { useEffect, useState } from "react";
import CategorySidebar from "./CategorySidebar";
import ItemsListing from "./Items";
import useApi from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";

export default function ItemsLayout({ categoryId }: any) {
  const { token } = useAuth();
  const { get } = useApi(token);

  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);

        const auth = JSON.parse(localStorage.getItem("auth") || "{}");
        const restaurantId = auth?.user?.restaurantId;

        if (!restaurantId) return;

        const res = await get(
          `/v1/menu/categories?restaurantId=${restaurantId}`
        );

        setCategories(res?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCategories(false);
      }
    };

    if (token) fetchCategories();
  }, [token]);

  return (
    <div className="flex gap-6 px-4 md:px-10 py-6">
      
      {/* SIDEBAR */}
      <div className="hidden lg:block w-[260px]">
        <CategorySidebar
          activeCategoryId={categoryId}
          categories={categories}
          loading={loadingCategories}
        />
      </div>

      {/* ITEMS */}
      <div className="flex-1">
        <ItemsListing
          categoryId={categoryId}
          categories={categories}
        />
      </div>
    </div>
  );
}