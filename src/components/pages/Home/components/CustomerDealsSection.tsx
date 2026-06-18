"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { BadgePercent } from "lucide-react";
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
  isFlexibleItemDeal,
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
};

const CustomerDealsSkeleton = () => (
  <div className="flex gap-5 overflow-hidden">
    {[1, 2, 3, 4].map((item) => (
      <div
        key={item}
        className="h-[250px] min-w-[280px] animate-pulse rounded-[22px] bg-gray-100 sm:min-w-[320px]"
      />
    ))}
  </div>
);

const fallbackDealImages = [
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=640&q=80",
] as const;

const toNumber = (value: number | string | null | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getDealCategoryRuleHighlights = (deal: CustomerDeal) => {
  const categoryNamesById = new Map(
    deal.scopeCategories.map((category) => [category.id, category.name])
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

const getDealHighlights = (deal: CustomerDeal, itemNames: string, categoryNames: string) => {
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

const getComparableDealPrice = (deal: CustomerDeal) => {
  const scopedTotal = deal.scopeMenuItems.reduce(
    (total, item) => total + toNumber(item.basePrice),
    0
  );

  return scopedTotal > deal.discountValue ? formatDealPrice(scopedTotal) : "";
};

const CustomerDealCard = ({
  deal,
  index,
  isAdding,
  onAddDeal,
}: {
  deal: CustomerDeal;
  index: number;
  isAdding: boolean;
  onAddDeal?: (deal: CustomerDeal, selectedMenuItemIds?: string[]) => void;
}) => {
  const t = useTranslations("home.deals");
  const image = getDealImageForCard(deal, index);
  const itemNames = getDealItemNames(deal.scopeMenuItems);
  const categoryNames = getDealItemNames(deal.scopeCategories);
  const actionLabel = getDealActionLabel(deal);
  const highlights = getDealHighlights(deal, itemNames, categoryNames);
  const comparablePrice = getComparableDealPrice(deal);
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
    <article className="relative flex h-[250px] min-w-0 flex-col overflow-hidden rounded-[18px] border border-gray-100 bg-white p-4 shadow-[0_12px_34px_rgba(17,24,39,0.08)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(17,24,39,0.12)]">
      <div className="flex min-h-0 flex-1 gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          {index === 0 ? (
            <span className="mb-2 w-fit rounded-full bg-[#FFB23F] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white">
              {t("bestSeller")}
            </span>
          ) : null}

          <h3 className="line-clamp-2 text-[15px] font-extrabold leading-tight text-gray-950">
            {deal.title}
          </h3>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-[20px] font-black leading-none text-primary">
              {formatDealPrice(deal.discountValue)}
            </span>
            {comparablePrice ? (
              <span className="text-xs font-semibold text-gray-400 line-through">
                {comparablePrice}
              </span>
            ) : null}
          </div>

          <p className="mt-2 text-[11px] font-bold text-gray-500">
            {getDealRequirementText(deal) || getDealTypeLabel(deal)}
          </p>

          <ul className="mt-3 space-y-1.5 text-[12px] font-medium leading-4 text-gray-700">
            {(highlights.length > 0 ? highlights : [getDealTypeLabel(deal)])
              .slice(0, 3)
              .map((highlight) => (
                <li key={highlight} className="flex min-w-0 items-start gap-2">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-gray-700" />
                  <span className="line-clamp-1">{highlight}</span>
                </li>
              ))}
          </ul>
        </div>

        <div className="relative mt-2 h-[118px] w-[128px] shrink-0 self-center">
          <div className="absolute inset-x-3 bottom-1 h-8 rounded-full bg-black/20 blur-xl" />
          {image ? (
            <Image
              src={image}
              alt={deal.title}
              fill
              sizes="128px"
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

      {!hasDealItems ? (
        <p className="mt-2 text-xs font-semibold text-red-500">
          {t("noAvailableItems")}
        </p>
      ) : null}

      <Button
        variant="default"
        className="mt-4 h-10 w-full rounded-[10px] bg-primary px-3 text-sm font-bold text-white shadow-md shadow-primary/20 hover:bg-primary/90"
        disabled={!hasDealItems || isAdding}
        onClick={handleAddDeal}
      >
        {isAdding ? t("adding") : translatedActionLabel}
      </Button>
    </article>
  );
};

export const CustomerDealsSection = ({
  deals,
  isLoading = false,
  addingDealId = null,
  branchId = null,
  onAddDeal,
}: CustomerDealsSectionProps) => {
  const t = useTranslations("home.deals");
  const activeDeals = deals.filter(isDealActive).slice(0, 6);
  const [selectedChooserDeal, setSelectedChooserDeal] = useState<CustomerDeal | null>(null);
  const [pendingDeal, setPendingDeal] = useState<CustomerDeal | null>(null);
  const pendingDetailItemIds = useMemo(
    () => (pendingDeal ? getDealScopedItemIdsForDetails(pendingDeal) : []),
    [pendingDeal]
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

      const states = deal.scopeMenuItems.map(getDealScopedItemCustomizationState);

      if (states.includes("UNKNOWN")) {
        toast.warning(t("reviewDealItems"));
        return;
      }

      if (states.includes("REQUIRES_MODIFIERS") || getDealActionKind(deal) === "OPEN_CHOOSER") {
        setSelectedChooserDeal(deal);
        return;
      }

      onAddDeal?.(deal);
    },
    [onAddDeal, setSelectedChooserDeal, t]
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
    [resolveDealAction]
  );

  useEffect(() => {
    if (!pendingDeal || pendingDetailItemIds.length === 0 || scopedDetailsQuery.isLoading) {
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
        (item) => item.id.trim() === itemId
      );

      return !pendingItem || getDealScopedItemCustomizationState(pendingItem) === "UNKNOWN";
    });

    if (missingUnknownItemIds.length > 0) {
      setPendingDeal(null);
      toast.warning(t("reviewDealItems"));
      return;
    }

    const resolvedDeal = mergeDealScopedItemDetails(
      pendingDeal,
      scopedDetailsQuery.detailsById
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
      <section className="mx-auto max-w-[1400px] px-4 pb-[30px] pt-[30px] sm:px-6 sm:pb-[60px] sm:pt-[60px]">
        <CustomerDealsSkeleton />
      </section>
    );
  }

  if (activeDeals.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-[1400px] px-4 pb-[30px] pt-[30px] sm:px-6 sm:pb-[60px] sm:pt-[60px]">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h3 className="text-2xl font-extrabold text-gray-950">
            {t("available")}
          </h3>
        </div>
      </div>

      <Carousel
        opts={{ align: "start", dragFree: true }}
        className="min-w-0"
      >
        <CarouselContent className="-ml-5 cursor-grab active:cursor-grabbing">
          {activeDeals.map((deal, index) => (
            <CarouselItem
              key={deal.id}
              className="basis-[82%] pl-5 sm:basis-[48%] lg:basis-1/4"
            >
              <CustomerDealCard
                deal={deal}
                index={index}
                isAdding={addingDealId === deal.id || pendingDeal?.id === deal.id}
                onAddDeal={handleDealClick}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <DealChooserDrawer
        deal={selectedChooserDeal}
        open={Boolean(selectedChooserDeal)}
        branchId={branchId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedChooserDeal(null);
          }
        }}
      />
    </section>
  );
};
