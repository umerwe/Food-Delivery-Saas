"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { BadgePercent, CalendarDays, PackageCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { DealChooserDrawer } from "@/components/pages/Home/components/deals/DealChooserDrawer";
import {
  getDealImage,
  getDealActionLabel,
  getDealRequirementText,
  getDealTypeLabel,
  getDealActionKind,
  isFixedItemDeal,
  isFlexibleAllItemsDeal,
  isFlexibleCategoryDeal,
  isFlexibleItemDeal,
} from "@/components/pages/Home/utils/customer-deal-cart";
import {
  formatDealDateRange,
  formatDealPrice,
  getDealItemNames,
  isDealActive,
} from "@/components/pages/Home/utils/customer-deals-formatters";
import type { CustomerDeal } from "@/types/customer-deals";

type CustomerDealsSectionProps = {
  deals: CustomerDeal[];
  isLoading?: boolean;
  addingDealId?: string | null;
  branchId?: string | null;
  onAddDeal?: (deal: CustomerDeal, selectedMenuItemIds?: string[]) => void;
};

const CustomerDealsSkeleton = () => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
    {[1, 2, 3].map((item) => (
      <div
        key={item}
        className="h-[430px] animate-pulse rounded-[24px] bg-gray-100"
      />
    ))}
  </div>
);

const CustomerDealCard = ({
  deal,
  isAdding,
  onAddDeal,
}: {
  deal: CustomerDeal;
  isAdding: boolean;
  onAddDeal?: (deal: CustomerDeal, selectedMenuItemIds?: string[]) => void;
}) => {
  const t = useTranslations("home.deals");
  const image = getDealImage(deal);
  const itemNames = getDealItemNames(deal.scopeMenuItems);
  const categoryNames = getDealItemNames(deal.scopeCategories);
  const requirementText = getDealRequirementText(deal);
  const dateRange = formatDealDateRange(deal.startsAt, deal.expiresAt);
  const actionLabel = getDealActionLabel(deal);
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
    <article className="flex h-full min-h-[430px] flex-col overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-xl shadow-primary/5">
      <div className="relative h-[150px] bg-primary/5">
        {image ? (
          <Image
            src={image}
            alt={deal.title}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-primary">
            <BadgePercent size={42} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
            <PackageCheck size={12} />
            {formatDealPrice(deal.discountValue)}
          </span>

          {dateRange ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">
              <CalendarDays size={12} />
              {dateRange}
            </span>
          ) : null}
        </div>

        <h3 className="line-clamp-2 text-lg font-bold text-gray-900">
          {deal.title}
        </h3>

        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-primary">
          {getDealTypeLabel(deal)}
        </p>

        {deal.description ? (
          <p className="mt-2 line-clamp-2 text-sm leading-5 text-gray-500">
            {deal.description}
          </p>
        ) : null}

        {isFixedItemDeal(deal) && requirementText ? (
          <p className="mt-3 line-clamp-2 text-sm font-medium text-gray-700">
            {requirementText}
          </p>
        ) : null}

        {isFixedItemDeal(deal) && itemNames ? (
          <p className="mt-3 line-clamp-2 text-sm font-medium text-gray-700">
            {t("includes", { items: itemNames })}
          </p>
        ) : null}

        {isFlexibleItemDeal(deal) ? (
          <p className="mt-3 line-clamp-2 text-sm font-medium text-gray-700">
            {requirementText}
          </p>
        ) : null}

        {isFlexibleCategoryDeal(deal) ? (
          <p className="mt-3 line-clamp-2 text-sm font-medium text-gray-700">
            {requirementText}
            {categoryNames ? `: ${categoryNames}` : ""}
          </p>
        ) : null}

        {isFlexibleAllItemsDeal(deal) ? (
          <p className="mt-3 line-clamp-2 text-sm font-medium text-gray-700">
            {requirementText}
          </p>
        ) : null}

        {!hasDealItems ? (
          <p className="mt-3 text-sm font-medium text-red-500">
            {t("noAvailableItems")}
          </p>
        ) : null}

        <div className="mt-auto pt-5">
          <Button
            variant="primary"
            className="h-10 w-full px-3 text-xs"
            disabled={!hasDealItems || isAdding}
            onClick={handleAddDeal}
          >
            {isAdding ? t("adding") : translatedActionLabel}
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
}: CustomerDealsSectionProps) => {
  const t = useTranslations("home.deals");
  const activeDeals = deals.filter(isDealActive).slice(0, 6);
  const [selectedChooserDeal, setSelectedChooserDeal] = useState<CustomerDeal | null>(null);

  const handleDealClick = useCallback(
    (deal: CustomerDeal) => {
      if (getDealActionKind(deal) === "OPEN_CHOOSER") {
        setSelectedChooserDeal(deal);
        return;
      }

      onAddDeal?.(deal);
    },
    [onAddDeal, setSelectedChooserDeal]
  );

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
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            {t("label")}
          </p>
          <h3 className="mt-1 text-2xl font-bold text-gray-900">
            {t("available")}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {activeDeals.map((deal) => (
          <CustomerDealCard
            key={deal.id}
            deal={deal}
            isAdding={addingDealId === deal.id}
            onAddDeal={handleDealClick}
          />
        ))}
      </div>

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
