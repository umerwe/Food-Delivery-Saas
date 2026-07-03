"use client";

import { Suspense, useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { CuisineCard } from "@/components/pages/Cuisines/components/CuisineCard";
import { useAppLocale } from "@/hooks/useAppLocale";
import { useAuth } from "@/hooks/useAuth";
import { useCustomerCuisines } from "@/hooks/useCuisines";
import { useDomainContext } from "@/hooks/useDomainContext";
import { resolveHomeBranchId, resolveHomeRestaurantId } from "@/lib/home";

function CuisinesPageContent() {
  const t = useTranslations("cuisines");
  const { user, restaurantId: authRestaurantId } = useAuth();
  const { context } = useDomainContext();
  const { locale } = useAppLocale();
  const [search, setSearch] = useState("");
  const restaurantId = resolveHomeRestaurantId(user, authRestaurantId) || context?.restaurantId || "";
  const branchId = resolveHomeBranchId(user) || context?.branchId || "";
  const params = useMemo(
    () => ({ restaurantId, branchId, locale, limit: 24, search, sortBy: "sortOrder", sortOrder: "ASC" as const }),
    [branchId, locale, restaurantId, search],
  );
  const cuisinesQuery = useCustomerCuisines({ ...params, enabled: Boolean(restaurantId) });
  const cuisines = cuisinesQuery.data?.cuisines ?? [];

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-5 lg:px-8 2xl:px-10">
      <section className="grid overflow-hidden rounded-[28px] border border-[#EADFD6] bg-[#FFFBF7] shadow-[0_18px_48px_rgba(17,24,39,0.06)] lg:grid-cols-[0.9fr_1fr]">
        <div className="relative overflow-hidden px-6 py-8 sm:px-9 lg:py-10">
          <div className="pointer-events-none absolute -bottom-16 right-0 h-52 w-52 rounded-full border border-primary/10" />
          <div className="pointer-events-none absolute -bottom-8 right-10 h-44 w-44 rounded-full border border-primary/10" />

          <span className="inline-flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.16em] text-primary">
            <Sparkles className="h-4 w-4" />
            {t("eyebrow")}
          </span>
          <h1 className="mt-5 font-serif text-[48px] leading-[0.95] text-gray-950 sm:text-[68px] lg:text-[76px]">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-7 text-gray-700">
            {t("description")}
          </p>
        </div>

        <div className="relative flex min-h-[320px] items-end overflow-hidden bg-[#F7F0E8] p-6 lg:min-h-[430px]">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/10" />
          <div className="absolute left-8 top-8 h-36 w-36 rounded-full bg-white/70 blur-sm" />
          <div className="relative w-full rounded-[22px] bg-white/95 p-5 shadow-[0_20px_46px_rgba(17,24,39,0.14)]">
            <p className="text-sm font-bold text-gray-950">{t("browseTitle")}</p>
            <p className="mt-1 text-xs leading-5 text-gray-500">{t("browseDescription")}</p>
            <label className="relative mt-4 block w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("searchPlaceholder")}
                className="h-11 w-full rounded-full border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:bg-white"
              />
            </label>
          </div>
        </div>
      </section>

      {cuisinesQuery.isLoading ? (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div key={item} className="h-[340px] animate-pulse rounded-[26px] bg-gray-100" />
          ))}
        </div>
      ) : cuisines.length === 0 ? (
        <div className="mt-8 rounded-[24px] border border-dashed border-[#EEE4DC] bg-[#FFFBF7] p-10 text-center text-sm text-gray-500">
          {t("empty")}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 rounded-[24px] border border-[#EEE4DC] bg-white/95 p-4 shadow-[0_12px_38px_rgba(17,24,39,0.05)] sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
          {cuisines.map((cuisine) => (
            <CuisineCard key={cuisine.id} cuisine={cuisine} />
          ))}
        </div>
      )}
    </main>
  );
}

export function CuisinesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <CuisinesPageContent />
    </Suspense>
  );
}
