"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, BadgePercent } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { DealChooserDrawer } from "@/components/pages/Home/components/deals/DealChooserDrawer";
import {
  getDealImage,
  getDealActionLabel,
  getDealRequirementText,
  getDealTypeLabel,
  getDealActionKind,
  getDealScopedItemIdsForDetails,
  getDealScopedItemCustomizationState,
  isFixedItemDeal,
  isFlexibleAllItemsDeal,
  isFlexibleCategoryDeal,
  mergeDealScopedItemDetails,
} from "@/components/pages/Home/utils/customer-deal-cart";
import {
  formatDealPrice,
  getDealItemNames,
  isDealActive,
} from "@/components/pages/Home/utils/customer-deals-formatters";
import { useDealScopedItemsDetails } from "@/hooks/useDealScopedItemsDetails";
import type { CustomerDeal } from "@/types/customer-deals";

type CustomerDealsSectionProps = {
  deals: CustomerDeal[];
  isLoading?: boolean;
  addingDealId?: string | null;
  branchId?: string | null;
  onAddDeal?: (deal: CustomerDeal, selectedMenuItemIds?: string[]) => void;
  compact?: boolean;
  currency?: string | null;
};

const CustomerDealsSkeleton = ({ compact = false }: { compact?: boolean }) => (
  <div
    className={
      compact ? "flex gap-4 overflow-hidden" : "flex gap-5 overflow-hidden"
    }
  >
    {[1, 2, 3, 4].map((item) => (
      <div
        key={item}
        className={
          compact
            ? "h-[428px] min-w-[270px] animate-pulse rounded-[22px] border border-[#EFE6DB] bg-[#FBFAF6] sm:min-w-[320px]"
            : "h-[250px] min-w-[280px] animate-pulse rounded-[22px] bg-gray-100 sm:min-w-[320px]"
        }
      />
    ))}
  </div>
);

const fallbackDealImages = [
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=960&q=90",
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=960&q=90",
  "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=960&q=90",
  "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=960&q=90",
] as const;

const toNumber = (value: number | string | null | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getDealCategoryRuleHighlights = (deal: CustomerDeal) => {
  const categoryNamesById = new Map(
    deal.scopeCategories.map((category) => [category.id, category.name]),
  );

  return (deal.scopeCategoryRules ?? [])
    .map((rule) => ({
      id: rule.menuCategoryId,
      count: rule.itemLimit,
      name: categoryNamesById.get(rule.menuCategoryId) || "Category",
    }))
    .filter(({ id, count }) => id && count > 0);
};

const getDealNameChips = (names: string) =>
  names
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .slice(0, 3);

const getDealHighlights = (
  deal: CustomerDeal,
  itemNames: string,
  categoryNames: string,
) => {
  const categoryRules = getDealCategoryRuleHighlights(deal);
  const chips = getDealNameChips(itemNames || categoryNames);

  if (isFlexibleCategoryDeal(deal) && categoryRules.length > 0) {
    return categoryRules
      .map((rule) => `${rule.count} ${rule.name}`)
      .slice(0, 3);
  }

  return chips;
};

const getDealImageForCard = (deal: CustomerDeal, index: number) => {
  const image = getDealImage(deal);

  return image || fallbackDealImages[index % fallbackDealImages.length];
};

const getComparableDealPrice = (deal: CustomerDeal, currency?: string | null) => {
  const scopedTotal = deal.scopeMenuItems.reduce(
    (total, item) => total + toNumber(item.basePrice),
    0,
  );

  return scopedTotal > deal.discountValue ? formatDealPrice(scopedTotal, currency) : "";
};

const CustomerDealCard = ({
  deal,
  index,
  isAdding,
  currency,
  onAddDeal,
}: {
  deal: CustomerDeal;
  index: number;
  isAdding: boolean;
  currency?: string | null;
  onAddDeal?: (deal: CustomerDeal, selectedMenuItemIds?: string[]) => void;
}) => {
  const t = useTranslations("home.deals");
  const image = getDealImageForCard(deal, index);
  const itemNames = getDealItemNames(deal.scopeMenuItems);
  const categoryNames = getDealItemNames(deal.scopeCategories);
  const actionLabel = getDealActionLabel(deal);
  const highlights = getDealHighlights(deal, itemNames, categoryNames);
  const comparablePrice = getComparableDealPrice(deal, currency);
  const hasDealItems = isFlexibleCategoryDeal(deal)
    ? deal.scopeCategories.length > 0
    : isFlexibleAllItemsDeal(deal) || deal.scopeMenuItems.length > 0;
  const handleAddDeal = useCallback(() => {
    onAddDeal?.(deal);
  }, [deal, onAddDeal]);
  const translatedActionLabel =
    actionLabel === "Browse Items"
      ? t("browseItems")
      : actionLabel === "Choose Items"
        ? t("chooseItems")
        : t("addDeal");

  return (
    <article className="relative flex h-full min-h-[300px] min-w-0 flex-col overflow-hidden rounded-[18px] border border-gray-100 bg-white p-5 shadow-[0_12px_34px_rgba(17,24,39,0.08)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(17,24,39,0.12)]">
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_112px] gap-4 sm:grid-cols-[minmax(0,1fr)_132px]">
        <div className="flex min-w-0 flex-1 flex-col">
          {index === 0 ? (
            <span className="mb-3 w-fit max-w-full rounded-full bg-[#FFB23F] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white">
              {t("bestSeller")}
            </span>
          ) : null}

          <h3 className="line-clamp-2 break-words text-[17px] font-extrabold leading-[1.25] text-gray-950">
            {deal.title}
          </h3>

          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-[22px] font-black leading-tight text-primary">
              {formatDealPrice(deal.discountValue, currency)}
            </span>
            {comparablePrice ? (
              <span className="text-xs font-semibold text-gray-400 line-through">
                {comparablePrice}
              </span>
            ) : null}
          </div>

          <p className="mt-2 line-clamp-2 break-words text-[12px] font-bold leading-5 text-gray-500">
            {getDealRequirementText(deal) || getDealTypeLabel(deal)}
          </p>

          <ul className="mt-3 space-y-1.5 text-[13px] font-medium leading-5 text-gray-700">
            {(highlights.length > 0 ? highlights : [getDealTypeLabel(deal)])
              .slice(0, 3)
              .map((highlight) => (
                <li key={highlight} className="flex min-w-0 items-start gap-2">
                  <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-gray-700" />
                  <span className="line-clamp-2 min-w-0 break-words">
                    {highlight}
                  </span>
                </li>
              ))}
          </ul>
        </div>

        <div className="relative mt-2 h-[124px] w-full self-center sm:h-[138px]">
          <div className="absolute inset-x-3 bottom-1 h-8 rounded-full bg-black/20 blur-xl" />
          {image ? (
            <Image
              src={image}
              alt={deal.title}
              fill
              sizes="(max-width: 640px) 112px, 132px"
              className="object-contain drop-shadow-[0_18px_18px_rgba(17,24,39,0.22)]"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-full bg-primary/10 text-primary">
              <BadgePercent size={42} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto pt-5">
        <p
          className={`mb-2 min-h-4 text-xs font-semibold ${
            hasDealItems ? "invisible" : "text-red-500"
          }`}
          aria-hidden={hasDealItems}
        >
          {hasDealItems ? "" : t("noAvailableItems")}
        </p>

        <Button
          variant="default"
          className="h-12 w-full rounded-[10px] bg-primary px-3 text-base font-bold text-white shadow-md shadow-primary/20 hover:bg-primary/90"
          disabled={!hasDealItems || isAdding}
          onClick={handleAddDeal}
        >
          {isAdding ? t("adding") : translatedActionLabel}
        </Button>
      </div>
    </article>
  );
};

const CustomerDealMenuCard = ({
  deal,
  index,
  isAdding,
  currency,
  onAddDeal,
}: {
  deal: CustomerDeal;
  index: number;
  isAdding: boolean;
  currency?: string | null;
  onAddDeal?: (deal: CustomerDeal, selectedMenuItemIds?: string[]) => void;
}) => {
  const t = useTranslations("home.deals");
  const image = getDealImageForCard(deal, index);
  const itemNames = getDealItemNames(deal.scopeMenuItems);
  const categoryNames = getDealItemNames(deal.scopeCategories);
  const actionLabel = getDealActionLabel(deal);
  const highlights = getDealHighlights(deal, itemNames, categoryNames);
  const comparablePrice = getComparableDealPrice(deal, currency);
  const isFeatured = index === 1;
  const hasDealItems = isFlexibleCategoryDeal(deal)
    ? deal.scopeCategories.length > 0
    : isFlexibleAllItemsDeal(deal) || deal.scopeMenuItems.length > 0;
  const handleAddDeal = useCallback(() => {
    onAddDeal?.(deal);
  }, [deal, onAddDeal]);
  const translatedActionLabel =
    actionLabel === "Browse Items"
      ? t("browseItems")
      : actionLabel === "Choose Items"
        ? t("chooseItems")
        : t("addDeal");

  return (
    <article
      className={`group relative flex h-[428px] w-full min-w-0 flex-col overflow-hidden rounded-[24px] border p-2.5 transition duration-300 ease-out ${
        isFeatured
          ? "border-[#A33A47]/80 bg-[linear-gradient(155deg,#8B1D2B_0%,#77131F_100%)] text-[#FFF7EF] shadow-[0_14px_30px_rgba(79,24,33,0.13)]"
          : "border-[#EEE4D9] bg-[#FFFDF9] text-[#40312D] shadow-[0_12px_28px_rgba(64,48,33,0.055)] hover:-translate-y-0.5 hover:shadow-[0_17px_34px_rgba(64,48,33,0.08)]"
      }`}
    >
      <div
        className={`relative h-[188px] shrink-0 overflow-hidden rounded-[17px] border ${
          isFeatured
            ? "border-[#A9434E]/70 bg-[#56101A]"
            : "border-white/90 bg-[#F2EBE2]"
        }`}
      >
        <span
          className={`absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold ${
            isFeatured
              ? "bg-[#E1BC73] text-[#5B1720] shadow-[0_6px_14px_rgba(53,13,20,0.12)]"
              : "bg-[#FFFAF7] text-[#AA5360] shadow-[0_6px_14px_rgba(74,47,31,0.09)]"
          }`}
        >
          {String(index + 1).padStart(2, "0")}
        </span>

        {index === 0 ? (
          <span className="absolute right-3 top-3 z-10 rounded-full bg-[#A51F30] px-3 py-1.5 text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-white shadow-[0_6px_14px_rgba(92,16,25,0.14)]">
            {t("bestSeller")}
          </span>
        ) : null}

        {image ? (
          <Image
            src={image}
            alt={deal.title}
            fill
            sizes="(max-width: 640px) 86vw, (max-width: 1024px) 44vw, 350px"
            className="object-cover object-center transition duration-500 ease-out group-hover:scale-[1.015]"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-primary">
            <BadgePercent size={42} />
          </div>
        )}
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col px-2.5 pb-1.5 pt-4">
        <p
          className={`line-clamp-1 text-[10px] font-bold uppercase leading-[1.2] tracking-[0.12em] ${
            isFeatured ? "text-[#E2BD72]" : "text-[#A97747]"
          }`}
        >
          {getDealTypeLabel(deal)}
        </p>

        <h3 className="mt-2 line-clamp-1 break-words text-[18px] font-semibold leading-[1.2] tracking-[-0.018em] sm:text-[19px]">
          {deal.title}
        </h3>

        <p
          className={`mt-2 line-clamp-2 h-10 break-words text-[12px] font-normal leading-[19px] ${
            isFeatured ? "text-[#EBCFC4]" : "text-[#887A70]"
          }`}
        >
          {getDealRequirementText(deal) || getDealTypeLabel(deal)}
        </p>

        <div className="mt-3 flex h-7 flex-nowrap gap-1.5 overflow-hidden">
          {(highlights.length > 0 ? highlights : [getDealTypeLabel(deal)])
            .slice(0, 2)
            .map((highlight) => (
              <span
                key={highlight}
                className={`max-w-[48%] truncate rounded-full px-2.5 py-1 text-[10px] font-semibold leading-[18px] ${
                  isFeatured
                    ? "bg-white/[0.11] text-[#FFF4EA]"
                    : "bg-[#F0EAE2] text-[#74675E]"
                }`}
              >
                {highlight}
              </span>
            ))}
        </div>

        <div
          className={`mt-auto flex items-end justify-between gap-3 border-t pt-3 ${
            isFeatured ? "border-white/[0.16]" : "border-[#EBE0D5]"
          }`}
        >
          <div className="min-w-0">
            <p
              className={`text-[10px] font-semibold uppercase leading-[1.1] tracking-[0.1em] ${
                isFeatured ? "text-[#D6B8AF]" : "text-[#B3A498]"
              }`}
            >
              {comparablePrice ? t("from") : t("completeMenu")}
            </p>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
              <span
                className={`text-[22px] font-normal leading-none tracking-[-0.035em] ${
                  isFeatured ? "text-[#E1BC73]" : "text-[#A51F30]"
                }`}
              >
                {formatDealPrice(deal.discountValue, currency)}
              </span>
              {comparablePrice ? (
                <span
                  className={`text-[10px] font-semibold line-through ${
                    isFeatured ? "text-white/40" : "text-[#B6A79B]"
                  }`}
                >
                  {comparablePrice}
                </span>
              ) : null}
            </div>
          </div>

          <Button
            variant="default"
            size="icon"
            className={`h-9 w-9 shrink-0 rounded-full border shadow-none transition duration-200 ${
              isFeatured
                ? "border-[#E1BC73] bg-[#E1BC73] text-[#5B1720] hover:bg-[#E8C985]"
                : "border-[#EBCFCB] bg-white/40 text-[#A51F30] hover:border-[#A51F30] hover:bg-[#A51F30] hover:text-white"
            }`}
            disabled={!hasDealItems || isAdding}
            onClick={handleAddDeal}
            aria-label={
              !hasDealItems
                ? t("noAvailableItems")
                : isAdding
                  ? t("adding")
                  : translatedActionLabel
            }
          >
            {isAdding ? (
              <BadgePercent size={16} />
            ) : (
              <ArrowUpRight size={17} aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>
    </article>
  );
};

export const CustomerDealsSection = ({
  deals,
  isLoading = false,
  addingDealId = null,
  branchId = null,
  onAddDeal,
  compact = false,
  currency,
}: CustomerDealsSectionProps) => {
  const t = useTranslations("home.deals");
  const activeDeals = useMemo(() => {
    const visibleDeals = deals.filter(isDealActive);

    return compact ? visibleDeals : visibleDeals.slice(0, 6);
  }, [compact, deals]);
  const sectionClassName = compact
    ? "mb-8 min-w-0"
    : "mx-auto max-w-[1400px] px-4 pb-[30px] pt-[30px] sm:px-6 sm:pb-[60px] sm:pt-[60px]";
  const headingClassName = compact
    ? "text-[25px] font-bold leading-[1.06] tracking-[-0.035em] text-[#3E2C28] sm:text-[33px]"
    : "text-2xl font-extrabold text-gray-950";
  const [selectedChooserDeal, setSelectedChooserDeal] =
    useState<CustomerDeal | null>(null);
  const [pendingDeal, setPendingDeal] = useState<CustomerDeal | null>(null);
  const pendingDetailItemIds = useMemo(
    () => (pendingDeal ? getDealScopedItemIdsForDetails(pendingDeal) : []),
    [pendingDeal],
  );
  const scopedDetailsQuery = useDealScopedItemsDetails({
    itemIds: pendingDetailItemIds,
    items: pendingDeal?.scopeMenuItems ?? [],
    enabled: Boolean(pendingDeal && pendingDetailItemIds.length > 0),
  });

  const resolveDealAction = useCallback(
    (deal: CustomerDeal) => {
      if (isFixedItemDeal(deal)) {
        onAddDeal?.(deal);
        return;
      }

      const states = deal.scopeMenuItems.map(
        getDealScopedItemCustomizationState,
      );

      if (states.includes("UNKNOWN")) {
        toast.warning(t("reviewDealItems"));
        return;
      }

      if (
        states.includes("REQUIRES_MODIFIERS") ||
        getDealActionKind(deal) === "OPEN_CHOOSER"
      ) {
        setSelectedChooserDeal(deal);
        return;
      }

      onAddDeal?.(deal);
    },
    [onAddDeal, setSelectedChooserDeal, t],
  );

  const handleDealClick = useCallback(
    (deal: CustomerDeal) => {
      const detailItemIds = getDealScopedItemIdsForDetails(deal);

      if (detailItemIds.length > 0) {
        setPendingDeal(deal);
        return;
      }

      resolveDealAction(deal);
    },
    [resolveDealAction],
  );

  useEffect(() => {
    if (
      !pendingDeal ||
      pendingDetailItemIds.length === 0 ||
      scopedDetailsQuery.isLoading
    ) {
      return;
    }

    if (scopedDetailsQuery.isError) {
      setPendingDeal(null);
      toast.warning(t("reviewDealItems"));
      return;
    }

    const missingUnknownItemIds = pendingDetailItemIds.filter((itemId) => {
      if (scopedDetailsQuery.detailsById[itemId]) {
        return false;
      }

      const pendingItem = pendingDeal.scopeMenuItems.find(
        (item) => item.id.trim() === itemId,
      );

      return (
        !pendingItem ||
        getDealScopedItemCustomizationState(pendingItem) === "UNKNOWN"
      );
    });

    if (missingUnknownItemIds.length > 0) {
      setPendingDeal(null);
      toast.warning(t("reviewDealItems"));
      return;
    }

    const resolvedDeal = mergeDealScopedItemDetails(
      pendingDeal,
      scopedDetailsQuery.detailsById,
    );

    setPendingDeal(null);
    resolveDealAction(resolvedDeal);
  }, [
    pendingDeal,
    pendingDetailItemIds.length,
    resolveDealAction,
    scopedDetailsQuery.detailsById,
    scopedDetailsQuery.isError,
    scopedDetailsQuery.isLoading,
    t,
  ]);

  if (isLoading) {
    return (
      <section className={sectionClassName}>
        <CustomerDealsSkeleton compact={compact} />
      </section>
    );
  }

  if (activeDeals.length === 0) {
    return null;
  }

  const chooserDrawer = (
    <DealChooserDrawer
      deal={selectedChooserDeal}
      open={Boolean(selectedChooserDeal)}
      branchId={branchId}
      currency={currency}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedChooserDeal(null);
        }
      }}
    />
  );

  if (compact) {
    return (
      <section className={sectionClassName}>
        <div className="relative overflow-hidden rounded-[36px] border border-[#F0E8DF] bg-[linear-gradient(108deg,#FAF7F2_0%,#FCFAF7_56%,#F6F0E9_100%)] px-5 pb-8 pt-7 shadow-[0_20px_54px_rgba(64,48,33,0.09)] sm:px-7 sm:pb-10 lg:px-9 lg:pb-[54px] lg:pt-8">
          <div className="pointer-events-none absolute -right-[98px] -top-[111px] hidden h-[232px] w-[232px] rounded-full border border-[#DDCDBD]/50 bg-white/[0.04] shadow-[0_0_0_22px_rgba(231,220,208,0.14)] md:block" />

          <div className="relative z-10 mb-5 flex items-end justify-between gap-4 sm:mb-6">
            <div className="min-w-0">
              <p className="mb-2.5 text-[11px] font-bold uppercase leading-[1.25] tracking-[0.18em] text-[#A51F30] sm:text-[12px]">
                {t("specialMenusLimited")}
              </p>
              <h3 className={headingClassName}>{t("available")}</h3>
            </div>
          </div>

          <Carousel
            opts={{ align: "start", dragFree: true }}
            className="relative z-10 min-w-0"
          >
            <CarouselContent className="-ml-4 cursor-grab active:cursor-grabbing">
              {activeDeals.map((deal, index) => (
                <CarouselItem
                  key={deal.id}
                  className="flex basis-[88%] pl-4 sm:basis-[52%] lg:basis-1/3"
                >
                  <CustomerDealMenuCard
                    deal={deal}
                    index={index}
                    isAdding={
                      addingDealId === deal.id || pendingDeal?.id === deal.id
                    }
                    currency={currency}
                    onAddDeal={handleDealClick}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {chooserDrawer}
      </section>
    );
  }

  return (
    <section className={sectionClassName}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h3 className={headingClassName}>{t("available")}</h3>
        </div>
      </div>

      <Carousel opts={{ align: "start", dragFree: true }} className="min-w-0">
        <CarouselContent className="-ml-5 cursor-grab active:cursor-grabbing">
          {activeDeals.map((deal, index) => (
            <CarouselItem
              key={deal.id}
              className="flex basis-[92%] pl-5 sm:basis-[62%] md:basis-[48%] xl:basis-1/3 2xl:basis-1/4"
            >
              <CustomerDealCard
                deal={deal}
                index={index}
                isAdding={
                  addingDealId === deal.id || pendingDeal?.id === deal.id
                }
                currency={currency}
                onAddDeal={handleDealClick}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {chooserDrawer}
    </section>
  );
};
