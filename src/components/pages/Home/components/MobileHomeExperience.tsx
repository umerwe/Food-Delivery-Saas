"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, ChevronRight, MapPin, Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { getDealImage } from "@/components/pages/Home/utils/customer-deal-cart";
import { isDealActive } from "@/components/pages/Home/utils/customer-deals-formatters";
import { PromotionalItemsSection } from "@/components/pages/Home/components/PromotionalItemsSection";
import { Button } from "@/components/ui/button";
import { resolveHttpsImageUrl } from "@/lib/image-fallback";
import type { Branding } from "@/types/branding";
import type { HomeCategory } from "@/types/home";
import type { CustomerDeal } from "@/types/customer-deals";
import type { MenuItem } from "@/components/pages/Items/types";

type MobileHomeExperienceProps = {
  restaurantName: string;
  tagline: string;
  heroImage?: string | null;
  branding: Branding;
  branch: { name?: string | null } | null;
  categories: HomeCategory[];
  categoriesLoading: boolean;
  promotionalItems: MenuItem[];
  promotionalItemsLoading: boolean;
  deals: CustomerDeal[];
  currency?: string | null;
};

const getCategoryImage = (category: HomeCategory) =>
  category.imageUrl && category.imageUrl.startsWith("http")
    ? category.imageUrl
    : "/burger.png";

const getFeaturedDeal = (deals: CustomerDeal[]) =>
  deals.find(isDealActive) ?? deals[0] ?? null;

const getFeaturedTitle = (deal: CustomerDeal | null) =>
  deal?.title || "Fresh deals near you";

const getFeaturedSubtitle = (deal: CustomerDeal | null, tagline: string) =>
  deal?.description || tagline || "Order your favorites with fast delivery.";

export function MobileHomeExperience({
  restaurantName,
  tagline,
  heroImage,
  branding,
  branch,
  categories,
  categoriesLoading,
  promotionalItems,
  promotionalItemsLoading,
  deals,
  currency,
}: MobileHomeExperienceProps) {
  const router = useRouter();
  const activeDeals = deals.filter(isDealActive).slice(0, 8);
  const featuredDeal = getFeaturedDeal(deals);
  const featuredImage = featuredDeal ? getDealImage(featuredDeal) : null;
  const bannerImage = resolveHttpsImageUrl(
    featuredImage || heroImage || branding.assets.bannerImage,
    "/burger.png"
  );
  const branchLabel = branch?.name || restaurantName;
  const visibleCategories = categories.slice(0, 10);

  return (
    <div className="min-h-screen bg-[#f7f3ef] pb-8 md:hidden">
      <section className="relative overflow-hidden rounded-b-[34px] bg-primary px-5 pb-8 pt-5 text-white shadow-[0_18px_45px_rgba(206,24,27,0.24)]">
        <div className="absolute -right-14 top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -left-20 bottom-0 h-44 w-44 rounded-full bg-black/10" />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              Deliver to
            </p>
            <div className="mt-1 flex max-w-[250px] items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <p className="truncate text-sm font-bold">{branchLabel}</p>
            </div>
          </div>

          <Link
            href="/notifications"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </Link>
        </div>

        <div className="relative z-10 mt-6">
          <p className="text-[15px] font-medium text-white/80">
            What would you like today?
          </p>
          <h1 className="mt-1 line-clamp-2 max-w-[300px] text-[30px] font-black leading-[1.08]">
            {restaurantName}
          </h1>
        </div>

        <button
          type="button"
          onClick={() => router.push("/items")}
          className="relative z-10 mt-6 flex h-12 w-full items-center gap-3 rounded-full bg-white px-4 text-left text-sm font-semibold text-gray-500 shadow-[0_16px_38px_rgba(31,41,55,0.18)]"
        >
          <Search className="h-5 w-5 text-primary" />
          <span className="truncate">Search food, drinks, deals...</span>
        </button>
      </section>

      <main className="-mt-3 space-y-8 px-4">
        <section className="relative z-10 overflow-hidden rounded-[28px] bg-[#2b1714] p-5 text-white shadow-[0_18px_45px_rgba(31,23,18,0.18)]">
          <div className="relative z-10 max-w-[60%]">
            <span className="inline-flex rounded-full bg-white/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
              Today only
            </span>
            <h2 className="mt-4 text-[23px] font-black leading-[1.08]">
              {getFeaturedTitle(featuredDeal)}
            </h2>
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/70">
              {getFeaturedSubtitle(featuredDeal, tagline)}
            </p>
            <Button
              type="button"
              variant="primary"
              className="mt-5 h-10 rounded-full bg-white px-5 text-primary hover:bg-white/90"
              onClick={() => router.push("/items")}
            >
              Order now
            </Button>
          </div>

          <div className="absolute -right-6 bottom-2 h-[150px] w-[150px] overflow-hidden rounded-full border-[10px] border-white/10 bg-white/10">
            <Image
              src={bannerImage}
              alt={getFeaturedTitle(featuredDeal)}
              fill
              className="object-cover"
              sizes="150px"
              unoptimized
            />
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-950">Categories</h2>
            <Link
              href="/items"
              className="flex items-center gap-1 text-sm font-bold text-primary"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {categoriesLoading ? (
            <div className="flex gap-3 overflow-hidden">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-[98px] min-w-[78px] animate-pulse rounded-[24px] bg-white" />
              ))}
            </div>
          ) : visibleCategories.length > 0 ? (
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {visibleCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => router.push(`/items?categoryId=${category.id}`)}
                  className="flex min-w-[84px] flex-col items-center gap-2 rounded-[24px] bg-white px-3 py-3 shadow-[0_12px_26px_rgba(31,41,55,0.07)]"
                >
                  <span className="relative h-12 w-12 overflow-hidden rounded-full bg-primary/10">
                    <Image
                      src={getCategoryImage(category)}
                      alt={category.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                      unoptimized
                    />
                  </span>
                  <span className="line-clamp-2 text-center text-[12px] font-medium leading-4 text-gray-900">
                    {category.name}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] bg-white px-4 py-5 text-sm font-medium text-gray-500">
              Categories will appear here once available.
            </div>
          )}
        </section>

        <PromotionalItemsSection
          items={promotionalItems}
          isLoading={promotionalItemsLoading}
          currency={currency}
          compact
        />

        {activeDeals.length === 0 && promotionalItems.length === 0 && !promotionalItemsLoading ? (
          <section>
            <div className="rounded-[28px] bg-white p-6 text-center shadow-[0_16px_34px_rgba(31,41,55,0.07)]">
              <h3 className="text-base font-black text-gray-950">
                Browse the menu
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Fresh recommendations will appear here when deals are available.
              </p>
              <Button
                type="button"
                variant="primary"
                className="mt-5 h-11 rounded-full px-6"
                onClick={() => router.push("/items")}
              >
                Explore food
              </Button>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
