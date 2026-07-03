"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Sparkles, Utensils } from "lucide-react";
import { useTranslations } from "next-intl";

import type { CustomerCuisine } from "@/services/cuisines";
import { getCuisineBadge, getCuisineImage, getCuisinePromotion } from "@/components/pages/Cuisines/components/cuisine-display";

export function CuisineCard({ cuisine }: { cuisine: CustomerCuisine }) {
  const t = useTranslations("cuisines");
  const promotion = getCuisinePromotion(cuisine);
  const badge = getCuisineBadge(cuisine, t("badges.cuisine"));

  return (
    <Link
      href={`/cuisines/${encodeURIComponent(cuisine.id)}`}
      className="group flex h-full w-full min-w-0 flex-col overflow-hidden rounded-[26px] border border-gray-100 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.08)] transition-shadow hover:shadow-[0_20px_48px_rgba(15,23,42,0.12)]"
    >
      <div className="relative h-44 bg-primary/5">
        <Image
          src={getCuisineImage(cuisine)}
          alt={cuisine.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wide text-primary shadow-sm">
          <Sparkles className="h-3 w-3" />
          {badge}
        </span>
        {promotion ? (
          <span className="absolute bottom-4 left-4 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-white shadow-lg">
            {promotion.description || t("badges.promotion")}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-1 text-lg font-black text-gray-950">{cuisine.name}</h3>
            <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-gray-500">
              {cuisine.description || t("fallbackDescription")}
            </p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/20 text-primary transition group-hover:bg-primary group-hover:text-white">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-dashed border-gray-100 pt-4 text-sm">
          <span className="inline-flex items-center gap-1 font-semibold text-gray-500">
            <Utensils className="h-4 w-4" />
            {cuisine.itemCount ? t("itemCount", { count: cuisine.itemCount }) : t("exploreItems")}
          </span>
          <span className="font-bold text-primary">{t("viewCuisine")}</span>
        </div>
      </div>
    </Link>
  );
}
