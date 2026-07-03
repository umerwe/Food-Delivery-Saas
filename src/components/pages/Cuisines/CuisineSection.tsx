"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { CuisineCard } from "@/components/pages/Cuisines/components/CuisineCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { useAppLocale } from "@/hooks/useAppLocale";
import { useAuth } from "@/hooks/useAuth";
import { useCustomerCuisines, usePromotionalCuisines } from "@/hooks/useCuisines";
import { useDomainContext } from "@/hooks/useDomainContext";
import { resolveHomeBranchId, resolveHomeRestaurantId } from "@/lib/home";
import type { CustomerCuisine } from "@/services/cuisines";

const CuisineSkeleton = () => (
  <div className="flex gap-5 overflow-hidden pb-8">
    {[1, 2, 3, 4].map((item) => (
      <div
        key={item}
        className="h-[340px] min-w-[92%] animate-pulse rounded-[26px] bg-gray-100 sm:min-w-[62%] md:min-w-[48%] xl:min-w-[33.333%] 2xl:min-w-[25%]"
      />
    ))}
  </div>
);

const mergeCuisines = (featured: CustomerCuisine[], regular: CustomerCuisine[]) => {
  const seen = new Set<string>();
  const merged: CustomerCuisine[] = [];

  [...featured, ...regular].forEach((cuisine) => {
    if (seen.has(cuisine.id)) return;
    seen.add(cuisine.id);
    merged.push(cuisine);
  });

  return merged;
};

export function CuisineSection() {
  const t = useTranslations("cuisines.home");
  const { user, restaurantId: authRestaurantId } = useAuth();
  const { context } = useDomainContext();
  const { locale } = useAppLocale();
  const restaurantId = resolveHomeRestaurantId(user, authRestaurantId) || context?.restaurantId || "";
  const branchId = resolveHomeBranchId(user) || context?.branchId || "";
  const params = { restaurantId, branchId, locale, limit: 8 };
  const cuisinesQuery = useCustomerCuisines({ ...params, enabled: Boolean(restaurantId) });
  const promotionalQuery = usePromotionalCuisines({ ...params, limit: 4, enabled: Boolean(restaurantId) });
  const cuisines = mergeCuisines(
    promotionalQuery.data?.cuisines ?? [],
    cuisinesQuery.data?.cuisines ?? [],
  ).slice(0, 8);
  const loading = cuisinesQuery.isLoading || promotionalQuery.isLoading;

  if (!loading && cuisines.length === 0) return null;

  return (
    <section id="cuisines" className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            {t("eyebrow")}
          </p>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">{t("title")}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            {t("description")}
          </p>
        </div>
        <Link href="/cuisines" className="hidden items-center gap-1 text-sm font-semibold text-primary sm:flex">
          {t("viewAll")}
          <ArrowUpRight size={16} />
        </Link>
      </div>

      {loading ? (
        <CuisineSkeleton />
      ) : (
        <Carousel opts={{ align: "start", dragFree: true }} className="min-w-0">
          <CarouselContent className="-ml-5 cursor-grab pb-8 active:cursor-grabbing">
            {cuisines.map((cuisine) => (
              <CarouselItem
                key={cuisine.id}
                className="flex min-w-0 basis-[92%] pl-5 sm:basis-[62%] md:basis-[48%] xl:basis-1/3 2xl:basis-1/4"
              >
                <CuisineCard cuisine={cuisine} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      )}

      <Link href="/cuisines" className="mt-5 flex items-center justify-center gap-1 text-sm font-semibold text-primary sm:hidden">
        {t("viewAll")}
        <ArrowUpRight size={16} />
      </Link>
    </section>
  );
}
