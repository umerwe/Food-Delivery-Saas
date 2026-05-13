"use client";

import { useRouter } from "next/navigation";
import { List, Loader2, Menu, Search } from "lucide-react";

type MenuViewMode = "multiple" | "onePage";

type CategorySidebarProps = {
  activeCategoryId?: string;
  categories?: any[];
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  search?: string;
  onSearchChange?: (value: string) => void;
  onLoadMore?: () => void;
  viewMode?: MenuViewMode;
  onViewModeChange?: (mode: MenuViewMode) => void;
  onCategorySelect?: (id: string) => void;
};

export default function CategorySidebar({
  activeCategoryId,
  categories = [],
  loading,
  loadingMore,
  hasMore,
  search,
  onSearchChange,
  onLoadMore,
  viewMode = "multiple",
  onViewModeChange,
  onCategorySelect,
}: CategorySidebarProps) {
  const router = useRouter();

  const handleCategoryClick = (id: string) => {
    if (viewMode === "onePage") {
      onCategorySelect?.(String(id));
      return;
    }

    router.push(`/items?categoryId=${id}`);
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Full menu</h2>
          <p className="mt-1 text-xs text-gray-500">
            Browse by category or view the full menu.
          </p>
        </div>
      </div>

      {/* VIEW MODE CONTROL */}
      <div className="mb-4 rounded-2xl bg-gray-100 p-1">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => onViewModeChange?.("multiple")}
            className={`flex h-10 items-center justify-center gap-2 rounded-xl text-xs font-semibold transition ${
              viewMode === "multiple"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500 hover:bg-white/70 hover:text-gray-800"
            }`}
          >
            <Menu size={15} />
            By Category
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange?.("onePage")}
            className={`flex h-10 items-center justify-center gap-2 rounded-xl text-xs font-semibold transition ${
              viewMode === "onePage"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500 hover:bg-white/70 hover:text-gray-800"
            }`}
          >
            <List size={15} />
            1 Page
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="relative mb-4">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-primary"
        />

        <input
          value={search || ""}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="Search categories"
          className="h-11 w-full rounded-xl bg-gray-100 pl-10 pr-4 text-sm text-gray-800 outline-none transition focus:bg-white focus:ring-2 focus:ring-primary/15"
        />
      </div>

      {/* LIST */}
      <div className="max-h-[calc(100vh-260px)] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-400">
            <Loader2 size={16} className="animate-spin" />
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">
            No categories found
          </p>
        ) : (
          <>
            {categories.map((cat: any) => {
              const id = String(cat?.id || "");
              const isActive = String(activeCategoryId || "") === id;

              if (!id) return null;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleCategoryClick(id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-full px-5 py-3 text-left text-sm font-medium transition ${
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  <span className="min-w-0 truncate">{cat.name}</span>

                  {viewMode === "onePage" && isActive ? (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-white" />
                  ) : null}
                </button>
              );
            })}

            {hasMore ? (
              <button
                type="button"
                onClick={onLoadMore}
                disabled={loadingMore}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-primary px-5 py-3 text-sm font-medium text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingMore ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More Categories"
                )}
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}