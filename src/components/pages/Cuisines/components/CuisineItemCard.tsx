"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { FavoriteHeartButton } from "@/components/common/favorites/FavoriteHeartButton";
import { getItemImageUrl } from "@/components/pages/Items/utils/restaurant-card-utils";
import {
  getMenuItemBasePrice,
  getMenuItemFinalPrice,
  getMenuItemPromotionBadge,
} from "@/components/pages/Cuisines/components/cuisine-display";
import { formatMoney } from "@/lib/money";
import type { MenuItem } from "@/components/pages/Items/types";

const getItemHref = (item: MenuItem) => {
  const itemId = String(item.id ?? "");
  const slug = item.slug ? `&slug=${encodeURIComponent(item.slug)}` : "";

  return itemId ? `/items/details?itemId=${encodeURIComponent(itemId)}${slug}` : "/items";
};

export function CuisineItemCard({ item, currency }: { item: MenuItem; currency?: string | null }) {
  const t = useTranslations("cuisines");
  const finalPrice = getMenuItemFinalPrice(item);
  const basePrice = getMenuItemBasePrice(item);
  const oldPrice = finalPrice < basePrice ? basePrice : null;
  const badge = getMenuItemPromotionBadge(item, t("badges.promotion"), currency);

  return (
    <article className="group overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-[0_12px_34px_rgba(17,24,39,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(17,24,39,0.12)]">
      <Link href={getItemHref(item)} className="flex h-full flex-col text-left">
        <div className="relative h-[178px] bg-[#F7F3EF]">
          <Image
            src={getItemImageUrl(item)}
            alt={item.name || t("menuItem")}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.02]"
            unoptimized
          />
          {badge ? (
            <span className="absolute left-3 top-3 max-w-[calc(100%-64px)] truncate rounded-full bg-white px-3 py-1 text-[11px] font-black text-primary shadow-sm">
              {badge}
            </span>
          ) : null}
          <FavoriteHeartButton menuItemId={item.id} className="absolute right-3 top-3 h-9 w-9" />
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="line-clamp-2 text-[18px] font-extrabold leading-[1.25] text-gray-950">
            {item.name || t("menuItem")}
          </h3>
          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-gray-500">
            {item.description || t("itemFallbackDescription")}
          </p>
          <div className="mt-auto flex items-end justify-between gap-3 pt-5">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              {oldPrice ? (
                <span className="text-xs font-semibold text-gray-400 line-through">
                  {formatMoney(oldPrice, currency)}
                </span>
              ) : null}
              <span className="text-[22px] font-black leading-none text-primary">
                {formatMoney(finalPrice, currency)}
              </span>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/20 text-primary transition group-hover:bg-primary group-hover:text-white">
              <ArrowUpRight size={17} aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
