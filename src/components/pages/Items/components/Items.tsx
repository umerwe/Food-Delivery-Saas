"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RestaurantCard } from "./RestaurantCard";
import useItems from "@/hooks/useItems";
import { useAuth } from "@/hooks/useAuth";
import { getStoredRestaurantId } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ItemsCategory, MenuItem } from "@/components/pages/Items/types";
import { mergeUniqueById, resolveHasNext } from "@/components/pages/Items/utils/restaurant-card-utils";

type MenuViewMode = "multiple" | "onePage";
type ItemsContentSource = "category" | "menu";

type ScrollTarget = {
  id: string;
  nonce: number;
} | null;

type ItemsSection = Omit<ItemsCategory, "items"> & {
  items?: Array<{
    id?: string | number | null;
    sortOrder?: string | number | null;
    menuItem?: MenuItem | null;
  }>;
};

type ItemsListingProps = {
  activeSectionId?: string;
  sections?: ItemsSection[];
  contentSource?: ItemsContentSource;
  viewMode?: MenuViewMode;
  scrollTarget?: ScrollTarget;
  onActiveCategoryChange?: (categoryId: string) => void;
};

type CategoryItemsState = {
  items: MenuItem[];
  page: number;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  loadedOnce: boolean;
};

const ITEMS_PAGE_LIMIT = 12;

const createEmptyCategoryState = (): CategoryItemsState => ({
  items: [],
  page: 0,
  hasMore: false,
  loading: false,
  loadingMore: false,
  loadedOnce: false,
});

const getSortOrder = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getMenuSectionItems = (section?: ItemsSection | null): MenuItem[] => {
  if (!Array.isArray(section?.items)) return [];

  return section.items
    .filter((entry) => entry?.menuItem && entry.menuItem.isActive !== false)
    .sort((a, b) => getSortOrder(a?.sortOrder) - getSortOrder(b?.sortOrder))
    .map((entry) => entry.menuItem)
    .filter((item): item is MenuItem => Boolean(item?.id));
};

export function ItemsListing({
  activeSectionId = "",
  sections = [],
  contentSource = "category",
  viewMode = "multiple",
  scrollTarget,
  onActiveCategoryChange,
}: ItemsListingProps) {
  const t = useTranslations("items.common");
  const { token, restaurantId: authRestaurantId, user } = useAuth();
  const { fetchMenuItemsPage } = useItems(token);

  const [categoryItemsMap, setCategoryItemsMap] = useState<
    Record<string, CategoryItemsState>
  >({});

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const inFlightRequestsRef = useRef<Set<string>>(new Set());

  const restaurantId = useMemo(() => {
    return (
      authRestaurantId ||
      user?.restaurantId ||
      getStoredRestaurantId() ||
      ""
    );
  }, [authRestaurantId, user?.restaurantId]);

  const categoryIdsKey = useMemo(() => {
    return sections.map((category) => String(category?.id || "")).join("|");
  }, [sections]);

  const activeCategoryId = useMemo(() => {
    return String(activeSectionId || sections?.[0]?.id || "");
  }, [activeSectionId, sections]);

  const activeCategory = useMemo(() => {
    return (
      sections.find(({ id }) => String(id || "") === activeCategoryId) || sections?.[0]
    );
  }, [sections, activeCategoryId]);

  const fetchCategoryItems = async ({
    categoryId,
    page = 1,
    append = false,
  }: {
    categoryId: string;
    page?: number;
    append?: boolean;
  }) => {
    if (!categoryId || !token || !restaurantId) return;

    const requestKey = `${categoryId}:${page}`;

    if (inFlightRequestsRef.current.has(requestKey)) return;

    try {
      inFlightRequestsRef.current.add(requestKey);

      queueMicrotask(() => {
        setCategoryItemsMap((prev) => {
          const existing = prev[categoryId] || createEmptyCategoryState();

          return {
            ...prev,
            [categoryId]: {
              ...existing,
              loading: !append,
              loadingMore: append,
              loadedOnce: append ? existing.loadedOnce : false,
            },
          };
        });
      });

      const { items: fetchedItems, meta } = await fetchMenuItemsPage({
        restaurantId: String(restaurantId),
        categoryId: String(categoryId),
        page,
        limit: ITEMS_PAGE_LIMIT,
      });

      queueMicrotask(() => {
        setCategoryItemsMap((prev) => {
          const existing = prev[categoryId] || createEmptyCategoryState();

          const nextItems = append
            ? mergeUniqueById(existing.items, fetchedItems)
            : fetchedItems;

          return {
            ...prev,
            [categoryId]: {
              items: nextItems,
              page: Number(meta?.page ?? page),
              hasMore: resolveHasNext({
                meta,
                page,
                limit: ITEMS_PAGE_LIMIT,
                receivedCount: fetchedItems.length,
                totalLoaded: nextItems.length,
              }),
              loading: false,
              loadingMore: false,
              loadedOnce: true,
            },
          };
        });
      });
    } catch (err) {

      queueMicrotask(() => {
        setCategoryItemsMap((prev) => {
          const existing = prev[categoryId] || createEmptyCategoryState();

          return {
            ...prev,
            [categoryId]: {
              ...existing,
              loading: false,
              loadingMore: false,
              loadedOnce: true,
              hasMore: false,
            },
          };
        });
      });
    } finally {
      inFlightRequestsRef.current.delete(requestKey);
    }
  };

  /* ================= MULTIPLE MODE: LOAD ACTIVE CATEGORY ================= */

  useEffect(() => {
    if (contentSource !== "category") return;
    if (viewMode !== "multiple") return;
    if (!activeCategoryId || !token || !restaurantId) return;

    const state = categoryItemsMap[activeCategoryId];

    if (state?.loadedOnce || state?.loading) return;

    queueMicrotask(() => {
      fetchCategoryItems({
        categoryId: activeCategoryId,
        page: 1,
        append: false,
      });
    });
  }, [contentSource, viewMode, activeCategoryId, token, restaurantId]);

  /* ================= ONE PAGE MODE: LOAD EACH DISPLAYED CATEGORY ================= */

  useEffect(() => {
    if (contentSource !== "category") return;
    if (viewMode !== "onePage") return;
    if (!sections.length || !token || !restaurantId) return;

    sections.forEach((category) => {
      const id = String(category?.id || "");
      if (!id) return;

      const state = categoryItemsMap[id];

      if (state?.loadedOnce || state?.loading) return;

      queueMicrotask(() => {
        fetchCategoryItems({
          categoryId: id,
          page: 1,
          append: false,
        });
      });
    });
  }, [contentSource, viewMode, categoryIdsKey, token, restaurantId]);

  /* ================= PRUNE OLD CATEGORY STATES AFTER SEARCH ================= */

  useEffect(() => {
    if (contentSource !== "category") return;
    if (!sections.length) return;

    const validIds = new Set(sections.map((category) => String(category.id)));

    queueMicrotask(() => {
      setCategoryItemsMap((prev) => {
        const next: Record<string, CategoryItemsState> = {};

        Object.entries(prev).forEach(([id, state]) => {
          if (validIds.has(String(id))) {
            next[id] = state;
          }
        });

        return next;
      });
    });
  }, [contentSource, categoryIdsKey, sections]);

  /* ================= ONE PAGE SCROLL TARGET ================= */

  useEffect(() => {
    if (viewMode !== "onePage") return;
    if (!scrollTarget?.id) return;

    const el = sectionRefs.current[String(scrollTarget.id)];

    if (!el) return;

    window.requestAnimationFrame(() => {
      el.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [viewMode, scrollTarget?.id, scrollTarget?.nonce]);

  /* ================= ONE PAGE ACTIVE CATEGORY TRACKING ================= */

  useEffect(() => {
    if (viewMode !== "onePage") return;
    if (!sections.length) return;

    let frameId: number | null = null;
    let observer: IntersectionObserver | null = null;

    const categoryIds = sections
      .map((category) => String(category?.id || ""))
      .filter(Boolean);

    if (!categoryIds.length) return;

    const getScrollParents = () => {
      const firstSection = categoryIds
        .map((id) => sectionRefs.current[id])
        .find(Boolean);

      const parents: Array<HTMLElement | Window> = [window];
      let parent = firstSection?.parentElement || null;

      while (parent && parent !== document.body) {
        const style = window.getComputedStyle(parent);
        const overflowY = style.overflowY;

        if (
          /(auto|scroll|overlay)/.test(overflowY) &&
          parent.scrollHeight > parent.clientHeight
        ) {
          parents.push(parent);
        }

        parent = parent.parentElement;
      }

      return parents;
    };

    const getScrollableBottomState = () => {
      const scrollParents = getScrollParents();

      for (const parent of scrollParents) {
        if (parent === window) {
          const scrollTop = window.scrollY || window.pageYOffset || 0;
          const viewportHeight =
            window.innerHeight || document.documentElement.clientHeight || 0;

          const documentHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.offsetHeight
          );

          if (scrollTop + viewportHeight >= documentHeight - 140) {
            return true;
          }

          continue;
        }

        const element = parent as HTMLElement;

        if (
          element.scrollTop + element.clientHeight >=
          element.scrollHeight - 140
        ) {
          return true;
        }
      }

      return false;
    };

    const updateActiveCategory = () => {
      frameId = null;

      const availableIds = categoryIds.filter((id) => sectionRefs.current[id]);

      if (!availableIds.length) return;

      const lastCategoryId = availableIds[availableIds.length - 1];

      if (getScrollableBottomState()) {
        onActiveCategoryChange?.(lastCategoryId);
        return;
      }

      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight || 0;

      /*
       * This line represents the reading position below the sticky header.
       * It works better than viewport center because restaurant sections can
       * be short, image heights can change after load, and some layouts scroll
       * inside an overflow container instead of the window.
       */
      const activationY = Math.min(
        260,
        Math.max(120, viewportHeight * 0.28)
      );

      let nextActiveId = availableIds[0];

      for (const id of availableIds) {
        const section = sectionRefs.current[id];

        if (!section) continue;

        const rect = section.getBoundingClientRect();

        if (rect.top <= activationY) {
          nextActiveId = id;
          continue;
        }

        break;
      }

      onActiveCategoryChange?.(nextActiveId);
    };

    const scheduleUpdate = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(updateActiveCategory);
    };

    const scrollParents = getScrollParents();

    scrollParents.forEach((parent) => {
      parent.addEventListener("scroll", scheduleUpdate, { passive: true });
    });

    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("orientationchange", scheduleUpdate);

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        () => {
          scheduleUpdate();
        },
        {
          root: null,
          rootMargin: "-96px 0px -60% 0px",
          threshold: [0, 0.01, 0.1, 0.25, 0.5, 0.75, 1],
        }
      );

      for (const id of categoryIds) {
        const section = sectionRefs.current[id];

        if (!section) continue;

        observer.observe(section);
      }
    }

    scheduleUpdate();

    const lateLayoutTimer = window.setTimeout(scheduleUpdate, 450);

    return () => {
      scrollParents.forEach((parent) => {
        parent.removeEventListener("scroll", scheduleUpdate);
      });

      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("orientationchange", scheduleUpdate);
      window.clearTimeout(lateLayoutTimer);

      if (observer) {
        observer.disconnect();
      }

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [viewMode, categoryIdsKey, sections, onActiveCategoryChange]);

  const handleLoadMoreItems = (categoryId: string) => {
    const state = categoryItemsMap[categoryId] || createEmptyCategoryState();

    if (state.loading || state.loadingMore || !state.hasMore) return;

    fetchCategoryItems({
      categoryId,
      page: state.page + 1,
      append: true,
    });
  };

  const renderItemsGrid = ({
    categoryId,
    emptyLabel = t("noItems"),
  }: {
    categoryId: string;
    emptyLabel?: string;
  }) => {
    const state = categoryItemsMap[categoryId] || createEmptyCategoryState();

    if (state.loading && !state.items.length) {
      return (
        <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white text-sm text-gray-500">
          <Loader2 size={18} className="mr-2 animate-spin text-primary" />
          {t("loadingItems")}
        </div>
      );
    }

    if (state.loadedOnce && state.items.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
          {emptyLabel}
        </div>
      );
    }

    return (
      <>
        <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2">
          {state.items.map((item) => (
            <RestaurantCard key={item.id} item={item} />
          ))}
        </div>

        {state.hasMore ? (
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => handleLoadMoreItems(categoryId)}
              disabled={state.loadingMore}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-primary px-6 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {state.loadingMore ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t("loadingMore")}
                </>
              ) : (
                t("loadMoreItems")
              )}
            </button>
          </div>
        ) : null}
      </>
    );
  };

  const renderMenuItemsGrid = (items: MenuItem[], emptyLabel = t("noItems")) => {
    if (!items.length) {
      return (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
          {emptyLabel}
        </div>
      );
    }

    return (
      <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2">
        {items.map((item) => (
          <RestaurantCard key={item.id} item={item} />
        ))}
      </div>
    );
  };

  if (viewMode === "onePage") {
    return (
      <div className="min-w-0 space-y-10">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">{t("fullMenu")}</h2>
          <p className="mt-1 text-sm text-gray-500">
            {contentSource === "menu" ? t("menusDescription") : t("menuDescription")}
          </p>
        </div>

        {sections.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
            {contentSource === "menu" ? t("noMenus") : t("noCategories")}
          </div>
        ) : (
          sections.map((category) => {
            const id = String(category?.id || "");
            const state = categoryItemsMap[id] || createEmptyCategoryState();
            const menuItems = contentSource === "menu" ? getMenuSectionItems(category) : [];

            if (!id) return null;

            return (
              <section
                key={id}
                ref={(el) => {
                  sectionRefs.current[id] = el;
                }}
                data-category-id={id}
                className="scroll-mt-32"
              >
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {category?.name || t("category")}
                    </h2>

                    {category?.description ? (
                      <p className="mt-1 text-sm text-gray-500">
                        {category.description}
                      </p>
                    ) : null}
                  </div>

                  <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
                    {t("itemCount", {
                      count: contentSource === "menu" ? menuItems.length : state.items.length,
                    })}
                  </span>
                </div>

                {contentSource === "menu"
                  ? renderMenuItemsGrid(menuItems, t("noItemsInMenu"))
                  : renderItemsGrid({
                      categoryId: id,
                      emptyLabel: t("noItemsInCategory"),
                    })}
              </section>
            );
          })
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 mt-1">
        <h2 className="text-xl font-semibold text-gray-900">
          {activeCategory?.name || t("menu")}
        </h2>

        {activeCategory?.description ? (
          <p className="mt-1 text-sm text-gray-500">
            {activeCategory.description}
          </p>
        ) : null}
      </div>

      {!activeCategoryId ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
          {contentSource === "menu" ? t("selectMenu") : t("selectCategory")}
        </div>
      ) : contentSource === "menu" ? (
        renderMenuItemsGrid(getMenuSectionItems(activeCategory), t("noItemsInMenu"))
      ) : (
        renderItemsGrid({
          categoryId: activeCategoryId,
          emptyLabel: t("noItems"),
        })
      )}
    </div>
  );
}
