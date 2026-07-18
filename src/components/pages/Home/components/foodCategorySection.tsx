"use client";

import Image from "next/image";
import {
  BadgePercent,
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Send,
  Sparkles,
  Store,
  Tag,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { useRouter } from "next/navigation";
import type { UseEmblaCarouselType } from "embla-carousel-react";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { useAppLocale } from "@/hooks/useAppLocale";
import { useHome } from "@/hooks/useHome";
import { useHomeCategories, useHomePromotions } from "@/hooks/useHomeCategories";
import { resolveHomeBranchId, resolveHomeRestaurantId } from "@/lib/home";
import { formatMoney, resolveCustomerCurrency } from "@/lib/money";
import type { HomeCategory, PromotionCampaign } from "@/types/home";

type CarouselApi = UseEmblaCarouselType[1];

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatDiscount = (
  promotion: PromotionCampaign,
  fallbackLabel: string,
  currency?: string | null
) => {
  const value = toNumber(promotion.discountValue, 0);

  if (promotion.discountType === "PERCENTAGE") {
    return `${value}% OFF`;
  }

  if (promotion.discountType === "FLAT") {
    return `${formatMoney(value, currency)} OFF`;
  }

  return fallbackLabel;
};

const formatAmount = (value: unknown, currency?: string | null) => {
  const amount = toNumber(value, 0);
  return amount > 0 ? formatMoney(amount, currency) : "";
};

const formatDate = (value?: string) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  });
};

const getScopeText = (
  promotion: PromotionCampaign,
  formatMessage: (key: string, values?: Record<string, number>) => string
) => {
  const itemCount = Array.isArray(promotion.scopeMenuItems)
    ? promotion.scopeMenuItems.length
    : 0;

  const categoryCount = Array.isArray(promotion.scopeCategories)
    ? promotion.scopeCategories.length
    : 0;

  if (promotion.applyMode === "ORDER_TOTAL") {
    return formatMessage("fullOrder");
  }

  if (itemCount && categoryCount) {
    return formatMessage("itemAndCategoryCount", { itemCount, categoryCount });
  }

  if (itemCount) {
    return formatMessage("itemCount", { count: itemCount });
  }

  if (categoryCount) {
    return formatMessage("categoryCount", { count: categoryCount });
  }

  return formatMessage("eligibleItems");
};

const getPromotionImage = (promotion: PromotionCampaign) => {
  const categoryImage = promotion.scopeCategories?.find((entry) =>
    String(entry?.imageUrl || "").startsWith("http")
  )?.imageUrl;

  if (categoryImage) return categoryImage;

  const itemImage = promotion.scopeMenuItems?.find((entry) =>
    String(entry?.imageUrl || "").startsWith("http")
  )?.imageUrl;

  if (itemImage) return itemImage;

  const coverImage = String(promotion.restaurant?.coverImage || "");

  if (coverImage.startsWith("http")) return coverImage;

  return "";
};

const PromotionBannerSkeleton = () => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-[250px] animate-pulse rounded-[24px] bg-gray-100"
        />
      ))}
    </div>
  );
};

function NoPromotionsState({ onExploreMenu }: { onExploreMenu: () => void }) {
  const t = useTranslations("home.promotions");
  const router = useRouter();

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-dashed border-primary/20 bg-[linear-gradient(115deg,#fffafa_0%,#fff_48%,#fffafa_100%)] px-6 py-10 sm:px-10 lg:min-h-[390px] lg:px-14 lg:py-12">
      <div className="pointer-events-none absolute -bottom-28 -right-24 h-72 w-72 rounded-full bg-primary/[0.025] blur-2xl" />

      <div className="relative mx-auto grid max-w-[1020px] items-center gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
        <div className="relative mx-auto flex h-[250px] w-[250px] items-center justify-center sm:h-[300px] sm:w-[300px] lg:h-[320px] lg:w-[320px]">
          <div className="absolute inset-3 rounded-full bg-primary/[0.045]" />
          <Send
            aria-hidden="true"
            className="absolute right-3 top-6 z-10 h-12 w-12 rotate-[-14deg] fill-primary/55 text-primary/55 sm:right-0 sm:top-4"
            strokeWidth={1.4}
          />
          <span className="absolute right-5 top-20 h-16 w-20 rounded-[50%] border-t-2 border-dashed border-primary/25 sm:right-2 sm:top-20" />
          <Image
            src="/no-promotions-shopping-bag.webp"
            alt=""
            width={900}
            height={794}
            sizes="(min-width: 1024px) 320px, 250px"
            className="relative z-[1] h-auto w-[92%] mix-blend-multiply"
          />
        </div>

        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/[0.075] px-4 py-2 text-sm font-semibold text-primary">
            <Tag aria-hidden="true" size={18} />
            {t("noPromotionsBadge")}
          </div>

          <h3 className="mt-5 text-[30px] font-extrabold leading-[1.12] tracking-[-0.02em] text-gray-950 sm:text-[36px] lg:max-w-[520px] lg:text-[40px]">
            {t("noActivePromotions")}
          </h3>

          <p className="mx-auto mt-4 max-w-[560px] text-base leading-7 text-gray-500 sm:text-[17px] lg:mx-0">
            {t("noActivePromotionsDescription")}
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Button
              type="button"
              variant="primary"
              className="h-13 rounded-full px-7 text-base font-semibold shadow-[0_10px_24px_rgba(220,0,30,0.16)]"
              onClick={onExploreMenu}
            >
              <Utensils aria-hidden="true" size={19} />
              {t("exploreMenu")}
              <ChevronRight aria-hidden="true" size={18} strokeWidth={2.5} />
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-13 rounded-full border-primary/35 px-7 text-base font-semibold text-primary hover:bg-primary/[0.04] hover:text-primary"
              onClick={() => router.push("/notifications")}
            >
              <Bell aria-hidden="true" size={19} />
              {t("notifyMe")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PromotionBannerCard({
  promotion,
  index,
  currency,
}: {
  promotion: PromotionCampaign;
  index: number;
  currency?: string | null;
}) {
  const t = useTranslations("home.promotions");
  const router = useRouter();

  const image = getPromotionImage(promotion);
  const startsAt = formatDate(promotion.startsAt);
  const expiresAt = formatDate(promotion.expiresAt);
  const minOrder = formatAmount(promotion.minOrderAmount, currency);
  const maxDiscount = formatAmount(promotion.maxDiscountAmount, currency);

  const gradients = [
    "from-primary via-primary/90 to-[#111827]",
    "from-[#111827] via-primary to-primary/70",
    "from-primary/90 via-[#7C3AED] to-[#111827]",
  ];

  const gradientClass = gradients[index % gradients.length];

  const handleOpenPromotion = () => {
    const firstCategoryId = promotion.scopeCategories?.[0]?.id;

    if (promotion.id) {
      router.push(`/promotions?promotionId=${encodeURIComponent(promotion.id)}`);
      return;
    }

    if (firstCategoryId) {
      router.push(`/items?categoryId=${firstCategoryId}`);
      return;
    }

    router.push("/items");
  };

  return (
    <button
      type="button"
      onClick={handleOpenPromotion}
      className={`group relative min-h-[250px] overflow-hidden rounded-[24px] bg-gradient-to-br ${gradientClass} p-5 text-left text-white shadow-xl shadow-primary/10 transition hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-primary/40`}
    >
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white" />
        <div className="absolute -bottom-20 left-1/2 h-48 w-48 rounded-full bg-white/70" />
      </div>

      {image ? (
        <div className="absolute bottom-4 right-4 h-[110px] w-[110px] overflow-hidden rounded-[24px] border border-white/20 bg-white/10 shadow-2xl transition group-hover:scale-105">
          <Image
            src={image}
            alt={promotion.title || t("specialPromotion")}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="absolute bottom-4 right-4 flex h-[110px] w-[110px] items-center justify-center rounded-[24px] border border-white/20 bg-white/10 shadow-2xl transition group-hover:scale-105">
          <BadgePercent size={44} />
        </div>
      )}

      <div className="relative z-10 flex min-h-[210px] max-w-[74%] flex-col">
        <div className="mb-4 flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-white/20">
          <Sparkles size={13} />
          {t("activeDeal")}
        </div>

        <div className="mb-3 w-fit rounded-[18px] bg-white px-4 py-2 text-primary shadow-lg">
          <p className="text-[22px] font-black leading-none sm:text-[26px]">
            {formatDiscount(promotion, t("specialOffer"), currency)}
          </p>
        </div>

        <h3 className="line-clamp-2 text-[19px] font-bold leading-tight sm:text-[22px]">
          {promotion.title || t("specialPromotion")}
        </h3>

        {promotion.description ? (
          <p className="mt-2 line-clamp-2 text-sm leading-5 text-white/80">
            {promotion.description}
          </p>
        ) : null}

        <div className="mt-auto space-y-2 pt-4">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium ring-1 ring-white/15">
              <Tag size={12} />
              {getScopeText(promotion, t)}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium ring-1 ring-white/15">
              <Store size={12} />
              {promotion.branch?.name || t("allBranches")}
            </span>
          </div>

          {(startsAt || expiresAt) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium ring-1 ring-white/15">
              <CalendarDays size={12} />
              {startsAt || t("now")} {expiresAt ? `- ${expiresAt}` : ""}
            </span>
          )}

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/75">
            {minOrder ? <span>{t("minOrder", { amount: minOrder })}</span> : null}
            {maxDiscount ? <span>{t("maxDiscount", { amount: maxDiscount })}</span> : null}
          </div>
        </div>
      </div>
    </button>
  );
}

export function FoodCategorySection() {
  const tCategories = useTranslations("home.categories");
  const tPromotions = useTranslations("home.promotions");
  const router = useRouter();
  const { token, user, restaurantId: authRestaurantId } = useAuth();
  const { locale } = useAppLocale();
  const restaurantId = resolveHomeRestaurantId(user, authRestaurantId);
  const branchId = resolveHomeBranchId(user);
  const categoriesQuery = useHomeCategories(restaurantId, locale, Boolean(token));
  const promotionsQuery = useHomePromotions(restaurantId, branchId, Boolean(token));
  const homeQuery = useHome(restaurantId, branchId, Boolean(token && restaurantId && branchId));
  const currency = resolveCustomerCurrency({
    configCurrency: homeQuery.data?.data.config?.currency,
    restaurant: homeQuery.data?.data.restaurant,
  });
  const categories = categoriesQuery.data ?? [];
  const promotions = promotionsQuery.data ?? [];
  const loading = categoriesQuery.isLoading;
  const promotionsLoading = promotionsQuery.isLoading;

  const carouselApi = useRef<CarouselApi>(null);
  const scrollLeft = () => {
    carouselApi.current?.scrollPrev();
  };

  const scrollRight = () => {
    carouselApi.current?.scrollNext();
  };

  return (
    <section className="relative z-20 mx-auto -mt-15 max-w-[1400px] px-4 sm:-mt-20 sm:px-6">
      <div className="rounded-[30px] bg-white px-4 py-5 sm:px-6 sm:py-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {tCategories("title")}
          </h2>

          <div className="flex items-center gap-3 sm:gap-[16.5px]">
            <Button
              variant="link"
              className="p-0 text-sm font-medium text-primary sm:text-base"
              onClick={() => router.push("/items")}
            >
              {tCategories("viewAllCategories")}
              <ChevronRight className="h-[16px] w-[10px]" strokeWidth={3} />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 overflow-hidden sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex min-h-[128px] flex-col items-center justify-center gap-3 rounded-[24px]">
                <div className="h-16 w-16 animate-pulse rounded-full bg-gray-200" />
                <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="rounded-2xl bg-[#FAFAFA] px-4 py-6 text-sm text-gray-400">{tCategories("empty")}</p>
        ) : (
          <div className="relative px-10 md:px-12">
            <button
              type="button"
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white text-[#212121] transition hover:bg-primary hover:text-white md:h-12 md:w-12"
              aria-label={tCategories("previous")}
            >
              <ChevronLeft size={20} />
            </button>

            <Carousel
              className="w-full"
              setApi={(api) => {
                carouselApi.current = api;
              }}
            >
              <CarouselContent className="-ml-4">
                {categories.map((item: HomeCategory) => {
                  const image =
                    item.imageUrl && item.imageUrl.startsWith("http")
                      ? item.imageUrl
                      : "/burger.png";

                  return (
                    <CarouselItem
                      key={item.id}
                      className="basis-1/2 pl-4 sm:basis-1/4 lg:basis-1/6 xl:basis-[12.5%]"
                      onClick={() => router.push(`/items?categoryId=${item.id}`)}
                    >
                      <div className="group flex min-h-[132px] cursor-pointer flex-col items-center justify-center gap-3 rounded-[22px] px-2 py-3 text-center transition hover:-translate-y-1">
                        <div className="relative h-[81px] w-[81px] overflow-hidden rounded-full transition group-hover:scale-105">
                          <Image
                            src={image}
                            alt={item.name}
                            fill
                            className="object-cover object-top"
                            unoptimized
                          />
                        </div>

                        <span className="line-clamp-2 text-center text-sm font-medium leading-5 text-gray-900">
                          {item.name}
                        </span>
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
            </Carousel>

            <button
              type="button"
              onClick={scrollRight}
              className="absolute right-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white text-[#212121] transition hover:bg-primary hover:text-white md:h-12 md:w-12"
              aria-label={tCategories("next")}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      <div className="mb-4 mt-12 flex items-end justify-between gap-4 sm:mt-16">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            {tPromotions("liveOffers")}
          </p>
          <h3 className="mt-1 text-2xl font-bold text-gray-900">
            {tPromotions("dealsPickedForYou")}
          </h3>
        </div>

        <Button
          variant="link"
          className="p-0 text-sm font-semibold text-primary"
          onClick={() => router.push("/items")}
        >
          {tPromotions("exploreMenu")}
          <ChevronRight size={16} />
        </Button>
      </div>

      {promotionsLoading ? (
        <PromotionBannerSkeleton />
      ) : promotions.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {promotions.slice(0, 6).map((promotion, index) => (
            <PromotionBannerCard
              key={promotion.id}
              promotion={promotion}
              index={index}
              currency={currency}
            />
          ))}
        </div>
      ) : (
        <NoPromotionsState onExploreMenu={() => router.push("/items")} />
      )}
    </section>
  );
}
