"use client";

import { useCallback } from "react";
import Image from "next/image";
import { BadgePercent, CalendarDays, PackageCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  formatDealDateRange,
  formatDealPrice,
  getDealImage,
  getDealItemNames,
  isDealActive,
} from "@/components/pages/Home/utils/customer-deals-formatters";
import type { CustomerDeal } from "@/types/customer-deals";

type CustomerDealsSectionProps = {
  deals: CustomerDeal[];
  isLoading?: boolean;
  addingDealId?: string | null;
  onAddDeal?: (deal: CustomerDeal) => void;
};

const CustomerDealsSkeleton = () => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
    {[1, 2, 3].map((item) => (
      <div
        key={item}
        className="h-[250px] animate-pulse rounded-[24px] bg-gray-100"
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
  onAddDeal?: (deal: CustomerDeal) => void;
}) => {
  const image = getDealImage(deal);
  const itemNames = getDealItemNames(deal.scopeMenuItems);
  const dateRange = formatDealDateRange(deal.startsAt, deal.expiresAt);
  const hasDealItems = deal.scopeMenuItems.length > 0;
  const handleAddDeal = useCallback(() => {
    onAddDeal?.(deal);
  }, [deal, onAddDeal]);

  return (
    <article className="overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-xl shadow-primary/5">
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

      <div className="p-5">
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

        {deal.description ? (
          <p className="mt-2 line-clamp-2 text-sm leading-5 text-gray-500">
            {deal.description}
          </p>
        ) : null}

        {itemNames ? (
          <p className="mt-3 line-clamp-2 text-sm font-medium text-gray-700">
            Includes {itemNames}
          </p>
        ) : null}

        {!hasDealItems ? (
          <p className="mt-3 text-sm font-medium text-red-500">
            This deal has no available items.
          </p>
        ) : null}

        <Button
          variant="primary"
          className="mt-5 w-full"
          disabled={!hasDealItems || isAdding}
          onClick={handleAddDeal}
        >
          {isAdding ? "Adding..." : "Add Deal"}
        </Button>
      </div>
    </article>
  );
};

export const CustomerDealsSection = ({
  deals,
  isLoading = false,
  addingDealId = null,
  onAddDeal,
}: CustomerDealsSectionProps) => {
  const activeDeals = deals.filter(isDealActive).slice(0, 6);

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
            Deals
          </p>
          <h3 className="mt-1 text-2xl font-bold text-gray-900">
            Available Deals
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {activeDeals.map((deal) => (
          <CustomerDealCard
            key={deal.id}
            deal={deal}
            isAdding={addingDealId === deal.id}
            onAddDeal={onAddDeal}
          />
        ))}
      </div>
    </section>
  );
};
