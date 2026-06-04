"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { BadgePercent, CalendarDays, PackageCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getDealImage,
  getDealActionLabel,
  getDealRequirementText,
  getDealTypeLabel,
  canAutoAddFixedDeal,
  canUseInlineFlexibleDealSelection,
  isFixedItemDeal,
  isFlexibleCategoryDeal,
  isFlexibleItemDeal,
} from "@/components/pages/Home/utils/customer-deal-cart";
import {
  formatDealDateRange,
  formatDealPrice,
  getDealItemNames,
  isDealActive,
} from "@/components/pages/Home/utils/customer-deals-formatters";
import type { CustomerDeal, CustomerDealMenuItem } from "@/types/customer-deals";

type CustomerDealsSectionProps = {
  deals: CustomerDeal[];
  isLoading?: boolean;
  addingDealId?: string | null;
  onAddDeal?: (deal: CustomerDeal, selectedMenuItemIds?: string[]) => void;
  onBrowseDeal?: (deal: CustomerDeal) => void;
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

const getMenuItemInitial = (name: string) => name.trim().charAt(0).toUpperCase() || "?";

const getMenuItemPrice = (item: CustomerDealMenuItem) =>
  item.discountedBasePrice ?? item.basePrice;

const hasMenuItemPrice = (value: CustomerDealMenuItem["basePrice"]) =>
  value !== null && value !== undefined && value !== "";

const CustomerDealCard = ({
  deal,
  isAdding,
  onAddDeal,
  onBrowseDeal,
}: {
  deal: CustomerDeal;
  isAdding: boolean;
  onAddDeal?: (deal: CustomerDeal, selectedMenuItemIds?: string[]) => void;
  onBrowseDeal?: (deal: CustomerDeal) => void;
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
    : deal.scopeMenuItems.length > 0;
  const handleAddDeal = useCallback(() => {
    if (
      isFlexibleCategoryDeal(deal) ||
      (isFixedItemDeal(deal) && !canAutoAddFixedDeal(deal)) ||
      (isFlexibleItemDeal(deal) && !canUseInlineFlexibleDealSelection(deal))
    ) {
      onBrowseDeal?.(deal);
      return;
    }

    onAddDeal?.(deal);
  }, [deal, onAddDeal, onBrowseDeal]);
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

const getRequiredQuantity = (deal: CustomerDeal) => {
  const parsed = Number(deal.dealRequiredQuantity);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
};

export const CustomerDealsSection = ({
  deals,
  isLoading = false,
  addingDealId = null,
  onAddDeal,
  onBrowseDeal,
}: CustomerDealsSectionProps) => {
  const t = useTranslations("home.deals");
  const activeDeals = deals.filter(isDealActive).slice(0, 6);
  const [selectedFlexibleDeal, setSelectedFlexibleDeal] = useState<CustomerDeal | null>(null);
  const [selectedMenuItemIds, setSelectedMenuItemIds] = useState<string[]>([]);
  const requiredQuantity = selectedFlexibleDeal ? getRequiredQuantity(selectedFlexibleDeal) : 1;
  const selectedCount = selectedMenuItemIds.length;
  const canAddSelectedItems = Boolean(
    selectedFlexibleDeal && selectedCount >= requiredQuantity
  );
  const selectedFlexibleItems = useMemo(
    () => selectedFlexibleDeal?.scopeMenuItems ?? [],
    [selectedFlexibleDeal]
  );

  const openFlexibleDeal = useCallback((deal: CustomerDeal) => {
    setSelectedFlexibleDeal(deal);
    setSelectedMenuItemIds([]);
  }, []);

  const closeFlexibleDeal = useCallback(() => {
    setSelectedFlexibleDeal(null);
    setSelectedMenuItemIds([]);
  }, []);

  const handleDealClick = useCallback(
    (deal: CustomerDeal, selectedIds?: string[]) => {
      if (isFlexibleItemDeal(deal) && !selectedIds) {
        if (!canUseInlineFlexibleDealSelection(deal)) {
          onBrowseDeal?.(deal);
          return;
        }

        openFlexibleDeal(deal);
        return;
      }

      onAddDeal?.(deal, selectedIds);
    },
    [onAddDeal, onBrowseDeal, openFlexibleDeal]
  );

  const toggleSelectedItem = useCallback((menuItemId: string, checked: boolean) => {
    setSelectedMenuItemIds((current) => {
      if (checked) {
        return current.includes(menuItemId) ? current : [...current, menuItemId];
      }

      return current.filter((id) => id !== menuItemId);
    });
  }, []);

  const addSelectedItems = useCallback(() => {
    if (!selectedFlexibleDeal || !canAddSelectedItems) return;

    onAddDeal?.(selectedFlexibleDeal, selectedMenuItemIds);
    closeFlexibleDeal();
  }, [canAddSelectedItems, closeFlexibleDeal, onAddDeal, selectedFlexibleDeal, selectedMenuItemIds]);

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
            onBrowseDeal={onBrowseDeal}
          />
        ))}
      </div>

      <Dialog
        open={Boolean(selectedFlexibleDeal)}
        onOpenChange={(open) => {
          if (!open) {
            closeFlexibleDeal();
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-auto rounded-[24px] sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedFlexibleDeal?.title}</DialogTitle>
            <DialogDescription>
              {selectedFlexibleDeal
                ? t("selectEligibleItems", {
                    count: requiredQuantity,
                  })
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {selectedFlexibleItems.map((item) => {
              const checked = selectedMenuItemIds.includes(item.id);
              const itemPrice = getMenuItemPrice(item);
              const categoryName = item.category?.name?.trim();
              const description = item.description?.trim();

              return (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-100 p-3 transition-colors hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-primary/10 text-primary">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-lg font-bold">
                        {getMenuItemInitial(item.name)}
                      </span>
                    )}
                  </div>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-gray-900">
                      {item.name}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
                      {hasMenuItemPrice(itemPrice) ? (
                        <span className="text-primary">
                          {formatDealPrice(itemPrice)}
                        </span>
                      ) : null}
                      {categoryName ? <span>{categoryName}</span> : null}
                    </span>
                    {description ? (
                      <span className="mt-1 line-clamp-1 text-xs leading-5 text-gray-500">
                        {description}
                      </span>
                    ) : null}
                  </span>

                  <Checkbox
                    className="size-5"
                    checked={checked}
                    onCheckedChange={(value) => toggleSelectedItem(item.id, value === true)}
                  />
                </label>
              );
            })}
          </div>

          <DialogFooter>
            <Button
              variant="primary"
              className="h-11 w-full px-6 py-2 sm:w-auto"
              disabled={!canAddSelectedItems || Boolean(addingDealId)}
              onClick={addSelectedItems}
            >
              {addingDealId ? t("adding") : t("addSelectedItems")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};
