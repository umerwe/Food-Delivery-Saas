"use client";

import { useEffect, useState } from "react";
import FiltersSidebar from "./FiltersSidebar";
import RestaurantCard from "./RestaurantCard";
import useApi from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";

export default function ItemsListing({ categoryId }: any) {
  const { token } = useAuth();
  const { get } = useApi(token);

  const [showFilters, setShowFilters] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH ================= */
  const fetchItems = async (catId: string) => {
    if (!catId || !token) return;

    try {
      setLoading(true);

      const res = await get(
        `/v1/menu/items?categoryId=${catId}`
      );

      setItems(res?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= EFFECT ================= */
  useEffect(() => {
    if (categoryId && token) {
      setItems([]); // 👈 reset to avoid stale UI
      fetchItems(categoryId);
    }
  }, [categoryId, token]);

  return (
    <div className="flex flex-col lg:flex-row bg-rose-50 min-h-screen p-4 md:p-6 lg:p-10">

      {/* MOBILE FILTER */}
      {showFilters && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setShowFilters(false)}
          />

          <div className="fixed top-0 left-0 h-full w-[260px] bg-white z-50 p-4 shadow-lg overflow-y-auto">
            <FiltersSidebar />
          </div>
        </>
      )}

      {/* DESKTOP FILTER */}
      <div className="hidden lg:block w-[260px]">
        <FiltersSidebar />
      </div>

      {/* CONTENT */}
      <div className="flex-1 lg:px-8 py-4 md:py-6">

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-[#4a2c2a]">
            Items for you
          </h2>

          <button
            onClick={() => setShowFilters(true)}
            className="lg:hidden px-4 py-2 bg-[#4a2c2a] text-white rounded-full"
          >
            Filters
          </button>
        </div>

        {/* LOADING */}
        {loading ? (
          <p>Loading items...</p>
        ) : !categoryId ? (
          <p className="text-gray-400">Select a category</p>
        ) : items.length === 0 ? (
          <p className="text-gray-400">No items found</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <RestaurantCard
                key={item.id}
                id={item.id}
                name={item.name}
                image={item.imageUrl}
                rating={4.5}
                time={`${item.prepTimeMinutes} min`}
                price={`Rs ${item.basePrice}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}