"use client";

import Image from "next/image";
import {
  BadgePercent,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Store,
  Tag,
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
import { useHomeCategories, useHomePromotions } from "@/hooks/useHomeCategories";
import { resolveHomeBranchId, resolveHomeRestaurantId } from "@/lib/home";
import type { HomeCategory, PromotionCampaign } from "@/types/home";

type CarouselApi = UseEmblaCarouselType[1];

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatDiscount = (promotion: PromotionCampaign, fallbackLabel: string) => {
  const value = toNumber(promotion.discountValue, 0);

  if (promotion.discountType === "PERCENTAGE") {
    return `${value}% OFF`;
  }

  if (promotion.discountType === "FLAT") {
    return `$${value} OFF`;
  }

  return fallbackLabel;
};

const formatAmount = (value: unknown) => {
  const amount = toNumber(value, 0);
  return amount > 0 ? `$${amount}` : "";
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

function PromotionBannerCard({
  promotion,
  index,
}: {
  promotion: PromotionCampaign;
  index: number;
}) {
  const t = useTranslations("home.promotions");
  const router = useRouter();

  const image = getPromotionImage(promotion);
  const startsAt = formatDate(promotion.startsAt);
  const expiresAt = formatDate(promotion.expiresAt);
  const minOrder = formatAmount(promotion.minOrderAmount);
  const maxDiscount = formatAmount(promotion.maxDiscountAmount);

  const gradients = [
    "from-primary via-primary/90 to-[#111827]",
    "from-[#111827] via-primary to-primary/70",
    "from-primary/90 via-[#7C3AED] to-[#111827]",
  ];

  const gradientClass = gradients[index % gradients.length];

  const handleOpenPromotion = () => {
    const firstItemId = promotion.scopeMenuItems?.[0]?.id;
    const firstCategoryId = promotion.scopeCategories?.[0]?.id;

    if (firstItemId) {
      router.push(`/items/details?itemId=${firstItemId}`);
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
            {formatDiscount(promotion, t("specialOffer"))}
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
  const restaurantId = resolveHomeRestaurantId(user, authRestaurantId);
  const branchId = resolveHomeBranchId(user);
  const categoriesQuery = useHomeCategories(restaurantId, Boolean(token));
  const promotionsQuery = useHomePromotions(restaurantId, branchId, Boolean(token));
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
    <section className="mx-auto max-w-[1400px] px-4 pt-[40px] sm:px-6 sm:pt-[80px]">
      <div className="mb-[30px] flex items-center justify-between sm:mb-[60px]">
        <h2 className="text-[24px] font-semibold text-[#212121] sm:text-[32px] lg:text-[42px]">
          {tCategories("title")}
        </h2>

        <div className="flex items-center gap-3 sm:gap-[16.5px]">
          <Button
            variant="link"
            className="p-0 text-sm font-bold text-primary sm:text-lg"
            onClick={() => router.push("/items")}
          >
            {tCategories("viewAll")}
            <ChevronRight className="h-[16px] w-[10px]" strokeWidth={3} />
          </Button>

          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              onClick={scrollLeft}
              className="flex h-[50px] w-[50px] cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/20 lg:h-[76px] lg:w-[76px]"
            >
              <ChevronLeft size={24} className="lg:h-[40px] lg:w-[40px]" />
            </button>

            <button
              type="button"
              onClick={scrollRight}
              className="flex h-[50px] w-[50px] cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/20 lg:h-[76px] lg:w-[76px]"
            >
              <ChevronRight size={24} className="lg:h-[40px] lg:w-[40px]" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-hidden sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <div className="h-[120px] w-[120px] animate-pulse rounded-full bg-gray-200 sm:h-[180px] sm:w-[180px]" />
              <div className="h-[16px] w-[80px] animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <p className="text-sm text-gray-400">{tCategories("empty")}</p>
      ) : (
        <Carousel
          className="w-full"
          setApi={(api) => {
            carouselApi.current = api;
          }}
        >
          <CarouselContent>
            {categories.map((item: HomeCategory) => {
              const image =
                item.imageUrl && item.imageUrl.startsWith("http")
                  ? item.imageUrl
                  : "/burger.png";

              return (
                <CarouselItem
                  key={item.id}
                  className="basis-1/2 pl-3 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
                  onClick={() => router.push(`/items?categoryId=${item.id}`)}
                >
                  <div className="group flex cursor-pointer flex-col items-center gap-3 sm:gap-4">
                    <div className="relative h-[120px] w-[120px] overflow-hidden rounded-full border-2 border-transparent transition-all group-hover:border-primary sm:h-[160px] sm:w-[160px] sm:border-4 lg:h-[200px] lg:w-[200px]">
                      <Image
                        src={image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>

                    <span className="text-center text-sm font-bold text-gray-800 sm:text-base lg:text-lg">
                      {item.name}
                    </span>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
      )}

      <div className="mb-[50px] mt-[30px] flex flex-col justify-center gap-3 sm:mb-[80px] sm:mt-[60px] sm:flex-row sm:justify-end">
        <Button
          variant="ghost"
          className="w-full rounded-full border border-primary/15 bg-primary/5 text-primary transition hover:bg-primary/10 sm:w-auto"
          onClick={() => router.push("/group-order")}
        >
          {tCategories("groupOrder")}
        </Button>

        <Button
          variant="ghost"
          className="w-full rounded-full border border-gray-200 bg-white text-gray-800 shadow-sm transition hover:border-primary/25 hover:bg-primary/5 hover:text-primary sm:w-auto"
          onClick={() => router.push("/menu")}
        >
          <Store className="h-4 w-4" />
          {tCategories("menu")}
        </Button>

        <Button
          variant="primary"
          className="w-full sm:w-auto"
          onClick={() => router.push("/categories")}
        >
          {tCategories("orderNow")}
        </Button>
      </div>

      <div className="mb-4 flex items-end justify-between gap-4">
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
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BadgePercent size={24} />
          </div>

          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            {tPromotions("noActivePromotions")}
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            {tPromotions("noActivePromotionsDescription")}
          </p>
        </div>
      )}
    </section>
  );
}
