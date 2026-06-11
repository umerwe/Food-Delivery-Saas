"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { BadgePercent, CalendarDays, PackageCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
  formatDealDateRange,
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
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
    {[1, 2, 3].map((item) => (
      <div
        key={item}
        className="h-[430px] animate-pulse rounded-[24px] bg-gray-100"
      />
    ))}
  </div>
);

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

const DealInfoPanel = ({
  deal,
  requirementText,
  itemNames,
  categoryNames,
}: {
  deal: CustomerDeal;
  requirementText: string;
  itemNames: string;
  categoryNames: string;
}) => {
  const categoryRules = getDealCategoryRuleHighlights(deal);
  const chips = getDealNameChips(itemNames || categoryNames);

  if (isFlexibleCategoryDeal(deal) && categoryRules.length > 0) {
    return (
      <div className="mt-4 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/10 via-white to-amber-50/80 p-3 shadow-sm shadow-primary/5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-md shadow-primary/20">
            <PackageCheck size={15} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Build your combo
            </p>
            <p className="mt-1 text-sm font-semibold leading-5 text-gray-900">
              Pick the perfect mix from each category.
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {categoryRules.map((rule) => (
            <span
              key={rule.id}
              className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm"
            >
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                {rule.count}x
              </span>
              <span className="max-w-[130px] truncate">{rule.name}</span>
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (!requirementText && chips.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50/80 p-3">
      {requirementText ? (
        <p className="text-sm font-semibold leading-5 text-gray-900">
          {requirementText}
        </p>
      ) : null}

      {chips.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-600 shadow-sm"
            >
              {chip}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
};

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

        <DealInfoPanel
          deal={deal}
          requirementText={
            isFixedItemDeal(deal) && itemNames
              ? t("includes", { items: itemNames })
              : requirementText
          }
          itemNames={itemNames}
          categoryNames={categoryNames}
        />

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
            isAdding={addingDealId === deal.id || pendingDeal?.id === deal.id}
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
