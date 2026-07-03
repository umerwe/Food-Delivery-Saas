"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, Sparkles, Utensils } from "lucide-react";
import { useTranslations } from "next-intl";

import { CuisineItemCard } from "@/components/pages/Cuisines/components/CuisineItemCard";
import { getCuisineBadge, getCuisineImage } from "@/components/pages/Cuisines/components/cuisine-display";
import { useAppLocale } from "@/hooks/useAppLocale";
import { useAuth } from "@/hooks/useAuth";
import { useCustomerCuisineItems, useCustomerCuisines } from "@/hooks/useCuisines";
import { useDomainContext } from "@/hooks/useDomainContext";
import { useHome } from "@/hooks/useHome";
import { resolveHomeBranchId, resolveHomeRestaurantId } from "@/lib/home";
import { resolveCustomerCurrency } from "@/lib/money";

function CuisineDetailContent({ cuisineId }: { cuisineId: string }) {
  const t = useTranslations("cuisines");
  const { user, restaurantId: authRestaurantId } = useAuth();
  const { context } = useDomainContext();
  const { locale } = useAppLocale();
  const restaurantId = resolveHomeRestaurantId(user, authRestaurantId) || context?.restaurantId || "";
  const branchId = resolveHomeBranchId(user) || context?.branchId || "";
  const cuisinesQuery = useCustomerCuisines({ restaurantId, branchId, locale, limit: 50, enabled: Boolean(restaurantId) });
  const itemsQuery = useCustomerCuisineItems({ cuisineId, restaurantId, branchId, locale, limit: 48, enabled: Boolean(restaurantId && cuisineId) });
  const homeQuery = useHome(restaurantId, branchId, Boolean(restaurantId && branchId));
  const cuisine = cuisinesQuery.data?.cuisines.find((entry) => entry.id === cuisineId) ?? null;
  const items = itemsQuery.data?.items ?? [];
  const currency = resolveCustomerCurrency({
    configCurrency: homeQuery.data?.data.config?.currency,
    restaurant: homeQuery.data?.data.restaurant,
  });

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-5 lg:px-8 2xl:px-10">
      <Link href="/cuisines" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
        <ArrowLeft className="h-4 w-4" />
        {t("backToCuisines")}
      </Link>

      <section className="grid overflow-hidden rounded-[28px] border border-[#EADFD6] bg-[#FFFBF7] shadow-[0_18px_48px_rgba(17,24,39,0.06)] lg:grid-cols-[0.9fr_1fr]">
        <div className="relative overflow-hidden px-6 py-8 sm:px-9 lg:py-10">
          <div className="pointer-events-none absolute -bottom-16 right-0 h-52 w-52 rounded-full border border-primary/10" />
          <div className="pointer-events-none absolute -bottom-8 right-10 h-44 w-44 rounded-full border border-primary/10" />

          <span className="inline-flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.16em] text-primary">
            <Sparkles className="h-4 w-4" />
            {cuisine ? getCuisineBadge(cuisine, t("badges.cuisine")) : t("badges.cuisine")}
          </span>
          <h1 className="mt-5 font-serif text-[48px] leading-[0.95] text-gray-950 sm:text-[68px] lg:text-[76px]">
            {cuisine?.name || t("title")}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-7 text-gray-700">
            {cuisine?.description || t("detailDescription")}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 border-y border-[#EADFD6] py-4 text-sm font-semibold text-gray-800">
            <span className="inline-flex items-center gap-2">
              <Utensils className="h-4 w-4 text-gray-500" />
              {t("itemCount", { count: items.length })}
            </span>
            <span className="inline-flex items-center gap-2 text-primary">
              <span className="h-4 w-px bg-[#EADFD6]" aria-hidden="true" />
              {t("itemsTitle")}
            </span>
          </div>
        </div>

        <div className="relative min-h-[320px] overflow-hidden bg-[#F7F0E8] lg:min-h-[430px]">
          <Image
            src={getCuisineImage(cuisine)}
            alt={cuisine?.name || t("title")}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 720px"
            unoptimized
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
          <div className="absolute right-6 top-1/2 hidden w-[190px] -translate-y-1/2 rounded-[18px] bg-white/95 p-5 shadow-[0_20px_46px_rgba(17,24,39,0.14)] sm:block">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-[0_12px_20px_rgba(205,0,11,0.24)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="text-[26px] font-black leading-none text-primary">
              {cuisine ? getCuisineBadge(cuisine, t("badges.cuisine")) : t("badges.cuisine")}
            </p>
            <p className="mt-4 text-xs font-black text-primary">{t("itemsEyebrow")}</p>
            <p className="mt-1 text-xs text-gray-500">{t("itemCount", { count: items.length })}</p>
          </div>
        </div>
      </section>

      <div className="mt-9 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">{t("itemsEyebrow")}</p>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">{t("itemsTitle")}</h2>
        </div>
        <p className="text-sm font-semibold text-gray-500">{t("itemCount", { count: items.length })}</p>
      </div>

      {itemsQuery.isLoading ? (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div key={item} className="h-[360px] animate-pulse rounded-[24px] bg-gray-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-[24px] border border-dashed border-[#EEE4DC] bg-[#FFFBF7] p-10 text-center text-sm text-gray-500">
          {t("emptyItems")}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 rounded-[24px] border border-[#EEE4DC] bg-white/95 p-4 shadow-[0_12px_38px_rgba(17,24,39,0.05)] sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
          {items.map((item) => (
            <CuisineItemCard key={String(item.id)} item={item} currency={currency} />
          ))}
        </div>
      )}
    </main>
  );
}

export function CuisineDetailPage({ cuisineId }: { cuisineId: string }) {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <CuisineDetailContent cuisineId={cuisineId} />
    </Suspense>
  );
}
