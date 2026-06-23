"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock3, Star } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { FavoriteHeartButton } from "@/components/common/favorites/FavoriteHeartButton";
import { Button } from "@/components/ui/button";
import { getItemImageUrl, toNumber } from "@/components/pages/Items/utils/restaurant-card-utils";
import { formatMoney } from "@/lib/money";
import type { MenuItem, PromotionInfo } from "@/components/pages/Items/types";

type PromotionalItemsSectionProps = {
  items: MenuItem[];
  isLoading?: boolean;
  currency?: string | null;
  compact?: boolean;
};

const getPromotion = (item: MenuItem): PromotionInfo | null =>
  item.happyHour ?? item.promotion ?? null;

const getFinalPrice = (item: MenuItem) =>
  toNumber(
    item.happyHourDiscountedBasePrice ??
      item.discountedBasePrice ??
      item.happyHour?.discountedPrice ??
      item.promotion?.discountedAmount ??
      item.discountedPrice ??
      item.basePrice ??
      item.price,
    0,
  );

const getBasePrice = (item: MenuItem) =>
  toNumber(
    item.happyHour?.originalPrice ??
      item.promotion?.originalPrice ??
      item.basePrice ??
      item.price,
    0,
  );

const getDiscountBadge = (
  promotion?: PromotionInfo | null,
  fallback?: string,
) => {
  if (!promotion) {
    return fallback ?? "";
  }

  const discountValue = toNumber(promotion.discountValue, 0);

  if (promotion.title?.trim()) {
    return promotion.title;
  }

  if (promotion.discountType === "PERCENTAGE" && discountValue > 0) {
    return `${discountValue}% off`;
  }

  return fallback ?? "Special Offer";
};

const getItemHref = (item: MenuItem) => {
  const itemId = String(item.id ?? "");
  const slug = item.slug ? `&slug=${encodeURIComponent(item.slug)}` : "";

  return itemId ? `/items/details?itemId=${encodeURIComponent(itemId)}${slug}` : "/items";
};

const PromotionalItemsSkeleton = ({ compact }: { compact?: boolean }) => (
  <div className={compact ? "flex gap-4 overflow-hidden" : "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"}>
    {[1, 2, 3, 4].map((item) => (
      <div
        key={item}
        className={
          compact
            ? "h-[318px] min-w-[238px] animate-pulse rounded-[28px] bg-white"
            : "h-[360px] animate-pulse rounded-[24px] bg-gray-100"
        }
      />
    ))}
  </div>
);

function PromotionalItemCard({
  item,
  currency,
  compact = false,
  featured = false,
}: {
  item: MenuItem;
  currency?: string | null;
  compact?: boolean;
  featured?: boolean;
}) {
  const t = useTranslations("home.promotionalItems");
  const promotion = getPromotion(item);
  const finalPrice = getFinalPrice(item);
  const basePrice = getBasePrice(item);
  const oldPrice = finalPrice < basePrice ? basePrice : null;
  const badgeText = getDiscountBadge(promotion, t("specialOffer"));
  const image = getItemImageUrl(item);
  const title = item.name?.trim() || t("menuItem");
  const description =
    item.description?.trim() || promotion?.description?.trim() || t("fallbackDescription");

  return (
    <div className={compact ? "" : "relative flex h-full w-full pt-4"}>
      {featured && !compact ? (
        <span className="absolute left-1/2 top-1 z-20 inline-flex -translate-x-1/2 items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-[11px] font-black uppercase leading-none text-white shadow-[0_8px_16px_rgba(205,0,11,0.2)]">
          <Star className="h-3 w-3 fill-current" aria-hidden="true" />
          {t("topDeal")}
        </span>
      ) : null}
      <article
        className={
          compact
            ? "h-[318px] w-[238px] shrink-0 overflow-hidden rounded-[28px] bg-white shadow-[0_16px_34px_rgba(31,41,55,0.09)]"
            : `group flex h-[360px] w-full min-w-0 flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_12px_34px_rgba(17,24,39,0.08)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(17,24,39,0.12)] ${
                featured ? "border border-primary" : "border border-gray-100"
              }`
        }
      >
      <Link href={getItemHref(item)} className="flex h-full min-w-0 flex-col text-left">
        <div className={compact ? "relative h-[132px] bg-primary/5" : "relative h-[178px] bg-[#F7F3EF]"}>
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.02]"
            sizes={compact ? "238px" : "(max-width: 768px) 92vw, 320px"}
            unoptimized
          />

          <span className="absolute left-3 top-3 max-w-[calc(100%-64px)] truncate rounded-full bg-white px-3 py-1 text-[11px] font-black text-primary shadow-sm">
            {badgeText}
          </span>

          <FavoriteHeartButton
            menuItemId={item.id}
            className="absolute right-3 top-3 h-9 w-9"
          />
        </div>

        <div className={compact ? "flex min-w-0 flex-1 flex-col p-4" : "flex min-w-0 flex-1 flex-col p-5"}>
          <h3
            className={
              compact
                ? "line-clamp-1 text-[16px] font-black text-gray-950"
                : "line-clamp-2 text-[18px] font-extrabold leading-[1.25] text-gray-950"
            }
          >
            {title}
          </h3>

          <p
            className={
              compact
                ? "mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-gray-500"
                : "mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-gray-500"
            }
          >
            {description}
          </p>

          <div className={compact ? "mt-auto flex min-w-0 items-center justify-between gap-2 pt-4" : "mt-auto flex min-w-0 items-end justify-between gap-3 pt-5"}>
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
              {oldPrice ? (
                <span className="text-xs font-semibold text-gray-400 line-through">
                  {formatMoney(oldPrice, currency)}
                </span>
              ) : null}
              <span className={compact ? "truncate text-base font-black text-primary" : "text-[22px] font-black leading-none text-primary"}>
                {formatMoney(finalPrice, currency)}
              </span>
            </div>

            {compact ? (
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-gray-400">
                <Clock3 className="h-4 w-4" />
                {t("quickOrder")}
              </span>
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/20 text-primary transition group-hover:bg-primary group-hover:text-white">
                <ArrowUpRight size={17} aria-hidden="true" />
              </span>
            )}
          </div>
        </div>
      </Link>
      </article>
    </div>
  );
}

export function PromotionalItemsSection({
  items,
  isLoading = false,
  currency,
  compact = false,
}: PromotionalItemsSectionProps) {
  const t = useTranslations("home.promotionalItems");

  if (isLoading) {
    return (
      <section className={compact ? "mb-8 min-w-0" : "mx-auto max-w-[1400px] px-4 pb-[30px] pt-[30px] sm:px-6 sm:pb-[50px] sm:pt-[50px]"}>
        <PromotionalItemsSkeleton compact={compact} />
      </section>
    );
  }

  if (items.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <section className="mb-8 min-w-0">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              {t("eyebrow")}
            </p>
            <h2 className="mt-1 text-xl font-black text-gray-950">
              {t("title")}
            </h2>
          </div>
          <Link
            href="/items"
            className="flex items-center gap-1 text-sm font-bold text-primary"
          >
            {t("seeAll")}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => (
            <PromotionalItemCard
              key={String(item.id)}
              item={item}
              currency={currency}
              compact
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1400px] px-4 pb-[34px] pt-[42px] sm:px-6 sm:pb-[58px] sm:pt-[58px]">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            {t("eyebrow")}
          </p>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">
            {t("title")}
          </h2>
        </div>

        <Button asChild variant="link" className="p-0 text-sm font-semibold text-primary">
          <Link href="/items">
            {t("exploreMenu")}
            <ArrowUpRight size={16} />
          </Link>
        </Button>
      </div>

      <Carousel opts={{ align: "start", dragFree: true }} className="min-w-0">
        <CarouselContent className="-ml-5 cursor-grab pb-8 active:cursor-grabbing">
          {items.map((item, index) => (
            <CarouselItem
              key={String(item.id)}
              className="flex basis-[92%] pl-5 sm:basis-[62%] md:basis-[48%] xl:basis-1/3 2xl:basis-1/4"
            >
              <PromotionalItemCard
                item={item}
                currency={currency}
                featured={index === 1}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}
