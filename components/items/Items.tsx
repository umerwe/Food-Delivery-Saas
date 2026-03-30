"use client";

import { useEffect, useState, useMemo } from "react";
import RestaurantCard from "./RestaurantCard";
import useApi from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";

export default function ItemsListing({ categoryId, categories }: any) {
  const { token } = useAuth();
  const { get } = useApi(token);

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = async (catId: string) => {
    if (!catId || !token) return;

    try {
      setLoading(true);

      const res = await get(`/v1/menu/items?categoryId=${catId}`);
      setItems(res?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (categoryId && token) {
      setItems([]);
      fetchItems(categoryId);
    }
  }, [categoryId, token]);

  /* ✅ FIND CATEGORY NAME FROM SHARED STATE */
  const activeCategory = useMemo(() => {
    return categories.find((c: any) => c.id === categoryId);
  }, [categories, categoryId]);

  return (
    <div>
      {/* ✅ REAL CATEGORY TITLE */}
      <h2 className="text-xl font-semibold mb-6 mt-4">
        {activeCategory?.name || "Menu"}
      </h2>

      {loading ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-400">No items found</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {items.map((item) => (
            <RestaurantCard
              key={item.id}
              id={item.id}
              name={item.name}
              image={item.imageUrl}
              time={`${item.prepTimeMinutes} min`}
              price={item.basePrice}
            />
          ))}
        </div>
      )}
    </div>
  );
}