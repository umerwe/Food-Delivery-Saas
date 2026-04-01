"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function CategorySidebar({
  activeCategoryId,
  categories = [],
  loading,
}: any) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filteredCategories = categories.filter((cat: any) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl py-4 pr-4">

      <h2 className="font-semibold text-xl mb-4">Full menu</h2>

      {/* SEARCH */}
      <div className="relative mb-4">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#EC5834]"
        />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Menu"
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 text-sm outline-none"
        />
      </div>

      {/* LIST */}
      <div className="space-y-2 pr-1">
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Loading...
          </p>
        ) : filteredCategories.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            No categories found
          </p>
        ) : (
          filteredCategories.map((cat: any) => {
            const isActive = activeCategoryId === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() =>
                  router.push(`/items?categoryId=${cat.id}`)
                }
                className={`w-full text-left px-5 py-3 rounded-full transition font-medium ${
                  isActive
                    ? "bg-[#EC5834] text-white"
                    : "text-gray-800 hover:bg-gray-100"
                }`}
              >
                {cat.name}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}