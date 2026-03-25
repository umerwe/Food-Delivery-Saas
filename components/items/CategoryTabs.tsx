"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useApi from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";

export default function CategoryTabs({ activeCategoryId }: any) {
  const router = useRouter();
  const { token } = useAuth();
  const { get } = useApi(token);

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
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
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchCategories();
  }, [token]);

  if (loading) {
    return <div className="p-4">Loading categories...</div>;
  }

  return (
    <div className="w-full bg-[#FFEDEC] px-4 md:px-10">
      <div className="flex items-center gap-8 overflow-x-auto">

        {categories.map((cat) => {
          const isActive = activeCategoryId === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() =>
                router.push(`/items?categoryId=${cat.id}`)
              }
              className="relative py-4 whitespace-nowrap cursor-pointer"
            >
              <span
                className={`text-sm ${
                  isActive
                    ? "text-orange-500 font-medium"
                    : "text-gray-700"
                }`}
              >
                {cat.name}
              </span>

              {isActive && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-orange-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}