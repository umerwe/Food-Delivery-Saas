"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgePercent,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  Filter,
  Loader2,
  Plus,
  Star,
  Tag,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FavoriteHeartButton } from "@/components/common/favorites/FavoriteHeartButton";
import { useAppLocale } from "@/hooks/useAppLocale";
import { useAuth } from "@/hooks/useAuth";
import { useHome } from "@/hooks/useHome";
import { useHomePromotionalItems, useHomePromotions } from "@/hooks/useHomeCategories";
import { resolveHomeBranchId, resolveHomeRestaurantId } from "@/lib/home";
import { formatMoney, resolveCustomerCurrency } from "@/lib/money";
import { getItemImageUrl, toNumber } from "@/components/pages/Items/utils/restaurant-card-utils";
import type { MenuItem, PromotionInfo } from "@/components/pages/Items/types";
import type { PromotionCampaign } from "@/types/home";

type SortKey = "popular" | "priceAsc" | "priceDesc";

const ALL_ITEMS_FILTER = "all";

const hasText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const formatDiscount = (
  promotion: PromotionCampaign,
  fallbackLabel: string,
  currency?: string | null,
) => {
  const value = toNumber(promotion.discountValue, 0);

  if (promotion.discountType === "PERCENTAGE" && value > 0) {
    return `${value}% OFF`;
  }

  if (promotion.discountType === "FLAT" && value > 0) {
    return `${formatMoney(value, currency)} OFF`;
  }

  if (promotion.discountType === "FIXED_PRICE" && value > 0) {
    return formatMoney(value, currency);
  }

  return fallbackLabel;
};

const getPromotionIds = (promotion?: PromotionInfo | null) =>
  [promotion?.promotionId, promotion?.id]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

const getPromotionMenuItems = ({
  promotion,
  promotionId,
  promotionalItems,
}: {
  promotion?: PromotionCampaign;
  promotionId: string;
  promotionalItems: MenuItem[];
}) => {
  const scopedIds = new Set(
    (promotion?.scopeMenuItems ?? [])
      .map((item) => String(item?.id || "").trim())
      .filter(Boolean),
  );

  const matchingPromotionalItems = promotionalItems.filter((item) => {
    const ids = [
      ...getPromotionIds(item.promotion),
      ...getPromotionIds(item.happyHour),
    ];

    return ids.includes(promotionId) || scopedIds.has(String(item.id || ""));
  });

  if (matchingPromotionalItems.length > 0) {
    return matchingPromotionalItems;
  }

  return (promotion?.scopeMenuItems ?? []).filter((item): item is MenuItem =>
    Boolean(item?.id),
  );
};

const getPromotionImage = (promotion: PromotionCampaign, items: MenuItem[]) => {
  const candidates = [
    promotion.imageUrl,
    promotion.thumbnailUrl,
    items.find((item) => hasText(item.imageUrl))?.imageUrl,
    promotion.scopeMenuItems?.find((item) => hasText(item.imageUrl))?.imageUrl,
    promotion.scopeCategories?.find((category) => hasText(category.imageUrl))?.imageUrl,
    promotion.restaurant?.coverImage,
  ];

  return candidates.find(hasText) || "/placeholder.png";
};

const formatDate = (value: string | undefined, locale?: string | null) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(locale || undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateRange = (
  startsAt: string | undefined,
  expiresAt: string | undefined,
  locale?: string | null,
) => {
  const start = formatDate(startsAt, locale);
  const end = formatDate(expiresAt, locale);

  if (start && end) return `${start} - ${end}`;
  return start || end;
};

const getPromotionCode = (promotion: PromotionCampaign) =>
  [promotion.code, promotion.couponCode]
    .map((value) => String(value || "").trim())
    .find(Boolean) || "";

const getCategoryName = (item: MenuItem) => {
  const directName = item.category?.name;

  if (hasText(directName)) {
    return directName;
  }

  return "";
};

const getCategoryOptions = (promotion: PromotionCampaign, items: MenuItem[]) => {
  const map = new Map<string, { id: string; label: string; count: number }>();

  for (const category of promotion.scopeCategories ?? []) {
    const id = String(category.id || category.name || "").trim();
    const label = String(category.name || "").trim();

    if (id && label) {
      map.set(id, { id, label, count: 0 });
    }
  }

  for (const item of items) {
    const id = String(item.categoryId || getCategoryName(item) || "").trim();
    const label = getCategoryName(item);

    if (!id || !label) continue;

    const existing = map.get(id);
    map.set(id, {
      id,
      label,
      count: (existing?.count ?? 0) + 1,
    });
  }

  return Array.from(map.values()).filter((category) => category.count > 0);
};

const getItemPromotion = (item: MenuItem): PromotionInfo | null =>
  item.happyHour ?? item.promotion ?? null;

const getBasePrice = (item: MenuItem) =>
  toNumber(
    item.happyHour?.originalPrice ??
      item.promotion?.originalPrice ??
      item.basePrice ??
      item.price,
    0,
  );

const getFinalPrice = (item: MenuItem) => {
  const basePrice = getBasePrice(item);
  const promotion = getItemPromotion(item);
  const discountValue = toNumber(promotion?.discountValue, 0);
  const backendDiscountAmount = toNumber(promotion?.discountAmount, 0);
  const maxDiscountAmount = toNumber(promotion?.maxDiscountAmount, 0);
  let discountAmount = 0;

  if (backendDiscountAmount > 0) {
    discountAmount = backendDiscountAmount;
  } else if (promotion?.discountType === "PERCENTAGE") {
    discountAmount = (basePrice * discountValue) / 100;
  } else if (promotion?.discountType === "FLAT") {
    discountAmount = discountValue;
  }

  if (maxDiscountAmount > 0) {
    discountAmount = Math.min(discountAmount, maxDiscountAmount);
  }

  return Math.max(0, basePrice - Math.min(Math.max(discountAmount, 0), basePrice));
};

const getItemHref = (item: MenuItem) => {
  const itemId = String(item.id ?? "");
  const slug = item.slug ? `&slug=${encodeURIComponent(item.slug)}` : "";

  return itemId ? `/items/details?itemId=${encodeURIComponent(itemId)}${slug}` : "/items";
};

const getDiscountBadge = (
  item: MenuItem,
  fallback: string,
  currency?: string | null,
) => {
  const promotion = getItemPromotion(item);
  const discountValue = toNumber(promotion?.discountValue, 0);

  if (promotion?.discountType === "PERCENTAGE" && discountValue > 0) {
    return `${discountValue}% OFF`;
  }

  if (promotion?.discountType === "FLAT" && discountValue > 0) {
    return `${formatMoney(discountValue, currency)} OFF`;
  }

  if (hasText(promotion?.title)) {
    return promotion.title;
  }

  return fallback;
};

function PromotionOfferCard({
  item,
  currency,
  featured = false,
}: {
  item: MenuItem;
  currency?: string | null;
  featured?: boolean;
}) {
  const t = useTranslations("home.promotions");
  const image = getItemImageUrl(item);
  const title = item.name?.trim() || t("menuItem");
  const description = item.description?.trim() || t("fallbackItemDescription");
  const finalPrice = getFinalPrice(item);
  const basePrice = getBasePrice(item);
  const oldPrice = finalPrice < basePrice ? basePrice : null;
  const badge = getDiscountBadge(item, t("specialOffer"), currency);
  const href = getItemHref(item);

  if (featured) {
    return (
      <article className="relative grid min-h-[248px] overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-[0_16px_42px_rgba(17,24,39,0.08)] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative z-10 flex min-w-0 flex-col p-5 sm:p-6">
          <span className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
            <Star className="h-3.5 w-3.5 fill-current" />
            {t("chefsPick")}
          </span>

          <h2 className="line-clamp-2 font-serif text-[24px] leading-[1.05] text-gray-950 sm:text-[30px]">
            {title}
          </h2>
          <p className="mt-3 line-clamp-3 max-w-sm text-sm leading-5 text-gray-600">
            {description}
          </p>

          <div className="mt-auto flex flex-col gap-4 pt-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-baseline gap-2">
              <span className="text-[20px] font-semibold text-gray-950">
                {formatMoney(finalPrice, currency)}
              </span>
              {oldPrice ? (
                <span className="text-sm font-semibold text-gray-400 line-through">
                  {formatMoney(oldPrice, currency)}
                </span>
              ) : null}
              <span className="max-w-full truncate rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                {badge}
              </span>
            </div>

            <Button
              asChild
              variant="outline"
              className="h-9 w-fit max-w-full shrink-0 rounded-full border-primary/25 px-4 text-xs font-semibold text-primary hover:bg-primary hover:text-white"
            >
              <Link href={href} className="min-w-0">
                <span className="truncate">{t("viewDetails")}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative min-h-[190px] bg-[#F8F2EA]">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 540px"
            unoptimized
          />
          <FavoriteHeartButton
            menuItemId={item.id}
            className="absolute right-4 top-4 h-10 w-10 border border-gray-100"
          />
          <Button
            asChild
            size="icon"
            className="absolute bottom-5 right-5 h-11 w-11 rounded-full bg-primary text-white shadow-[0_10px_20px_rgba(205,0,11,0.28)] hover:bg-primary/90"
          >
            <Link href={href} aria-label={t("viewDetails")}>
              <Plus className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </article>
    );
  }

  return (
    <article className="relative flex min-h-[112px] overflow-hidden rounded-[18px] border border-gray-100 bg-white p-4 shadow-[0_12px_30px_rgba(17,24,39,0.06)]">
      <div className="min-w-0 flex-1 pr-3">
        <h3 className="line-clamp-1 text-sm font-semibold text-gray-950">
          {title}
        </h3>
        <p className="mt-1 line-clamp-2 max-w-[220px] text-xs leading-4 text-gray-500">
          {description}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-semibold text-gray-950">
            {formatMoney(finalPrice, currency)}
          </span>
          {oldPrice ? (
            <span className="text-xs font-semibold text-gray-400 line-through">
              {formatMoney(oldPrice, currency)}
            </span>
          ) : null}
          <span className="max-w-[120px] truncate rounded-full bg-green-100 px-2 py-1 text-[10px] font-semibold text-green-700">
            {badge}
          </span>
        </div>
      </div>

      <Link
        href={href}
        className="relative h-[84px] w-[96px] shrink-0 overflow-hidden rounded-full bg-[#F8F2EA]"
        aria-label={title}
      >
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
          sizes="96px"
          unoptimized
        />
      </Link>

      <FavoriteHeartButton
        menuItemId={item.id}
        className="absolute right-3 top-3 h-8 w-8 border border-gray-100"
      />

      <Button
        asChild
        size="icon"
        className="absolute bottom-3 right-3 h-9 w-9 rounded-full bg-primary text-white shadow-[0_8px_16px_rgba(205,0,11,0.24)] hover:bg-primary/90"
      >
        <Link href={href} aria-label={t("viewDetails")}>
          <Plus className="h-4 w-4" />
        </Link>
      </Button>
    </article>
  );
}

function PromotionItemsPageContent() {
  const t = useTranslations("home.promotions");
  const router = useRouter();
  const searchParams = useSearchParams();
  const promotionId = searchParams.get("promotionId") || "";
  const { locale } = useAppLocale();
  const { token, user, restaurantId: authRestaurantId, loading: authLoading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState(ALL_ITEMS_FILTER);
  const [sortKey, setSortKey] = useState<SortKey>("popular");
  const [copiedCode, setCopiedCode] = useState("");

  const restaurantId = useMemo(
    () => resolveHomeRestaurantId(user, authRestaurantId),
    [authRestaurantId, user],
  );
  const branchId = useMemo(() => resolveHomeBranchId(user), [user]);

  const promotionsQuery = useHomePromotions(restaurantId, branchId, Boolean(token && promotionId));
  const promotionalItemsQuery = useHomePromotionalItems({
    restaurantId,
    branchId,
    locale,
    limit: 25,
    enabled: Boolean(token && promotionId),
  });
  const homeQuery = useHome(restaurantId, branchId, Boolean(token && restaurantId && branchId));

  const promotion = useMemo(
    () => promotionsQuery.data?.find((entry) => entry.id === promotionId),
    [promotionId, promotionsQuery.data],
  );

  const items = useMemo(
    () =>
      getPromotionMenuItems({
        promotion,
        promotionId,
        promotionalItems: promotionalItemsQuery.data ?? [],
      }),
    [promotion, promotionId, promotionalItemsQuery.data],
  );

  const currency = resolveCustomerCurrency({
    configCurrency: homeQuery.data?.data.config?.currency,
    restaurant: homeQuery.data?.data.restaurant,
  });

  const categoryOptions = useMemo(
    () => (promotion ? getCategoryOptions(promotion, items) : []),
    [items, promotion],
  );

  const visibleItems = useMemo(() => {
    const filtered =
      selectedCategory === ALL_ITEMS_FILTER
        ? items
        : items.filter((item) => {
            const id = String(item.categoryId || getCategoryName(item) || "").trim();
            return id === selectedCategory;
          });

    return [...filtered].sort((a, b) => {
      if (sortKey === "priceAsc") return getFinalPrice(a) - getFinalPrice(b);
      if (sortKey === "priceDesc") return getFinalPrice(b) - getFinalPrice(a);
      return 0;
    });
  }, [items, selectedCategory, sortKey]);

  const isLoading =
    authLoading ||
    promotionsQuery.isLoading ||
    promotionalItemsQuery.isLoading;

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth/login");
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    if (!promotionId) {
      router.replace("/items");
    }
  }, [promotionId, router]);

  useEffect(() => {
    if (isLoading || !promotion) return;

    if (items.length === 0) {
      const firstCategoryId = promotion.scopeCategories?.[0]?.id;
      router.replace(firstCategoryId ? `/items?categoryId=${firstCategoryId}` : "/items");
    }
  }, [isLoading, items.length, promotion, router]);

  useEffect(() => {
    setSelectedCategory(ALL_ITEMS_FILTER);
  }, [promotionId]);

  const handleCopyCode = async (code: string) => {
    if (!code) return;

    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(t("codeCopied"));
  };

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-[1200px] items-center justify-center px-4">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!promotion || items.length === 0) {
    return (
      <div className="mx-auto max-w-[900px] px-4 py-16 text-center sm:px-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <BadgePercent size={24} />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-950">
          {t("promotionItemsUnavailable")}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
          {t("promotionItemsUnavailableDescription")}
        </p>
        <Button asChild className="mt-6 rounded-full bg-primary px-6 text-white hover:bg-primary/90">
          <Link href="/items">{t("exploreMenu")}</Link>
        </Button>
      </div>
    );
  }

  const promotionImage = getPromotionImage(promotion, items);
  const discountLabel = formatDiscount(promotion, t("specialOffer"), currency);
  const dateRange = formatDateRange(promotion.startsAt, promotion.expiresAt, locale);
  const couponCode = getPromotionCode(promotion);
  const minOrder = toNumber(promotion.minOrderAmount, 0);
  const maxDiscount = toNumber(promotion.maxDiscountAmount, 0);
  const featuredItem = visibleItems[0];
  const compactItems = visibleItems.slice(featuredItem ? 1 : 0, featuredItem ? 5 : 4);
  const remainingItems = visibleItems.slice(featuredItem ? 5 : 4);

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-5 lg:px-8 2xl:px-10">
      <Button asChild variant="link" className="mb-5 h-auto p-0 text-sm font-semibold text-primary">
        <Link href="/">
          <ArrowLeft className="h-4 w-4" />
          {t("backToOffers")}
        </Link>
      </Button>

      <section className="grid overflow-hidden rounded-[28px] border border-[#EADFD6] bg-[#FFFBF7] shadow-[0_18px_48px_rgba(17,24,39,0.06)] lg:grid-cols-[0.9fr_1fr]">
        <div className="relative overflow-hidden px-6 py-8 sm:px-9 lg:py-10">
          <div className="pointer-events-none absolute -bottom-16 right-0 h-52 w-52 rounded-full border border-primary/10" />
          <div className="pointer-events-none absolute -bottom-8 right-10 h-44 w-44 rounded-full border border-primary/10" />

          <span className="inline-flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.16em] text-primary">
            <BadgePercent className="h-4 w-4" />
            {t("todaysDiningPerk")}
          </span>

          <h1 className="mt-5 font-serif text-[48px] leading-[0.95] text-gray-950 sm:text-[68px] lg:text-[76px]">
            {promotion.title || t("specialPromotion")}
          </h1>
          {promotion.description ? (
            <p className="mt-4 max-w-2xl text-lg leading-7 text-gray-700">
              {promotion.description}
            </p>
          ) : null}

          <div className="mt-7 flex flex-wrap gap-3">
            {minOrder > 0 ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/80 px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm">
                <Tag className="h-4 w-4 text-primary" />
                {t("minOrder", { amount: formatMoney(minOrder, currency) })}
              </span>
            ) : null}
            {maxDiscount > 0 ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/80 px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm">
                <BadgePercent className="h-4 w-4 text-primary" />
                {t("maxDiscount", { amount: formatMoney(maxDiscount, currency) })}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/80 px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm">
              <Clock3 className="h-4 w-4 text-primary" />
              {t("onePerCustomer")}
            </span>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 border-y border-[#EADFD6] py-4 text-sm font-semibold text-gray-800">
            {dateRange ? (
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-gray-500" />
                {dateRange}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-2 text-primary">
              <span className="h-4 w-px bg-[#EADFD6]" aria-hidden="true" />
              {t("promotionItemsCount", { count: items.length })}
            </span>
          </div>

          {couponCode ? (
            <div className="mt-6 flex flex-col gap-3 rounded-[18px] border border-dashed border-primary/45 bg-white/75 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Tag className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-primary">
                    {t("couponCode")}
                  </p>
                  <p className="text-base font-black text-primary">{couponCode}</p>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => void handleCopyCode(couponCode)}
                className="h-10 rounded-full bg-primary px-7 text-xs font-black uppercase text-white hover:bg-primary/90"
              >
                {copiedCode === couponCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedCode === couponCode ? t("copied") : t("copyCode")}
              </Button>
            </div>
          ) : null}
        </div>

        <div className="relative min-h-[320px] overflow-hidden bg-[#F7F0E8] lg:min-h-[430px]">
          <Image
            src={promotionImage}
            alt={promotion.title || t("specialPromotion")}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 720px"
            unoptimized
            priority
          />
          <div className="absolute right-6 top-1/2 hidden w-[190px] -translate-y-1/2 rounded-[18px] bg-white/95 p-5 shadow-[0_20px_46px_rgba(17,24,39,0.14)] sm:block">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-[0_12px_20px_rgba(205,0,11,0.24)]">
              <Clock3 className="h-5 w-5" />
            </div>
            <p className="text-[26px] font-black leading-none text-primary">{discountLabel}</p>
            <p className="mt-4 text-xs font-black text-primary">{t("limitedTimeOffer")}</p>
            <p className="mt-1 text-xs text-gray-500">{t("dontMissOut")}</p>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-[24px] border border-[#EEE4DC] bg-white/95 p-4 shadow-[0_12px_38px_rgba(17,24,39,0.05)] sm:p-5">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategory(ALL_ITEMS_FILTER)}
              className={`shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition ${
                selectedCategory === ALL_ITEMS_FILTER
                  ? "bg-primary text-white shadow-[0_10px_20px_rgba(205,0,11,0.18)]"
                  : "border border-gray-100 bg-white text-gray-600 hover:border-primary/25 hover:text-primary"
              }`}
            >
              {t("allItems", { count: items.length })}
            </button>
            {categoryOptions.slice(0, 6).map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  selectedCategory === category.id
                    ? "bg-primary text-white shadow-[0_10px_20px_rgba(205,0,11,0.18)]"
                    : "border border-gray-100 bg-white text-gray-600 hover:border-primary/25 hover:text-primary"
                }`}
              >
                {category.label} <span className="ml-1 text-xs opacity-70">{category.count}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <label className="relative">
              <span className="sr-only">{t("sortItems")}</span>
              <select
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as SortKey)}
                className="h-10 appearance-none rounded-xl border border-gray-100 bg-white pl-4 pr-10 text-sm font-semibold text-gray-700 shadow-sm outline-none transition hover:border-primary/25 focus:border-primary/40"
              >
                <option value="popular">{t("popular")}</option>
                <option value="priceAsc">{t("priceLowToHigh")}</option>
                <option value="priceDesc">{t("priceHighToLow")}</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            </label>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-100 bg-white text-primary shadow-sm"
              aria-label={t("filterItems")}
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>

        {visibleItems.length === 0 ? (
          <div className="rounded-[20px] bg-gray-50 px-5 py-12 text-center">
            <p className="text-sm font-semibold text-gray-700">{t("noFilteredItems")}</p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_1.04fr]">
            {featuredItem ? (
              <PromotionOfferCard
                item={featuredItem}
                currency={currency}
                featured
              />
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              {compactItems.map((item) => (
                <PromotionOfferCard
                  key={String(item.id)}
                  item={item}
                  currency={currency}
                />
              ))}
            </div>
          </div>
        )}

        {remainingItems.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {remainingItems.map((item) => (
              <PromotionOfferCard
                key={String(item.id)}
                item={item}
                currency={currency}
              />
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

export function PromotionItemsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <PromotionItemsPageContent />
    </Suspense>
  );
}
