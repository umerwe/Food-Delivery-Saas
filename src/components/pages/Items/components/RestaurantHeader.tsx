"use client";

import Image from "next/image";
import { CalendarDays, MapPin, Clock, Utensils, Loader2, Store, Truck, Coffee } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import useItems from "@/hooks/useItems";
import { useAuth } from "@/hooks/useAuth";
import useBranches from "@/hooks/useBranches";
import { getStoredAuthState } from "@/lib/auth";
import { OpeningHoursDialog } from "@/components/common/popups/OpeningHoursDialog";
import type { AuthRestaurantUser, ItemsCategory, StoredAuthState } from "@/components/pages/Items/types";
import { formatAddress, getBranchHoursDetails, getBranchHoursSummary, getCurrentBranchHoursDetail, getImageUrl, getOperatingHours, getRatingInfo, getRestaurantAddress, getRestaurantName, hasText, resolveHasNext } from "@/components/pages/Items/utils/restaurant-card-utils";
import type { BranchRecord } from "@/types/branch-selector";

const CATEGORY_PAGE_LIMIT = 50;

const getCategoryItemCount = (category: ItemsCategory) => {
  const count = Number(
    category?._count?.items ??
      category?.itemsCount ??
      category?.itemCount ??
      category?.items?.length
  );

  return Number.isFinite(count) && count >= 0 ? count : null;
};

const getSelectedBranchFromSession = (
  authUser: AuthRestaurantUser | null | undefined,
  storedAuth: StoredAuthState | null | undefined
) => authUser?.branch || authUser?.profile?.branch || storedAuth?.user?.branch || storedAuth?.user?.profile?.branch || null;

function BranchHoursDialog({
  branchName,
  branchHours,
  triggerClassName,
  triggerContent,
}: {
  branchName?: string;
  branchHours: ReturnType<typeof getBranchHoursSummary>;
  triggerClassName?: string;
  triggerContent?: ReactNode;
}) {
  const t = useTranslations("items.common");
  const openingDetails = getBranchHoursDetails(branchHours.regularOpeningSchedule);
  const deliveryDetails = getBranchHoursDetails(branchHours.regularDeliverySchedule);
  const holidayDetails = getBranchHoursDetails(branchHours.holidaySchedule);
  const showDeliveryDetails = deliveryDetails.length > 0 && !branchHours.deliveryMatchesOpening;

  return (
    <OpeningHoursDialog
      triggerLabel={t("viewHours")}
      badgeLabel={t("hours")}
      title={t("hoursPopupTitle")}
      description=""
      branchPill={branchName}
      stats={[]}
      sections={[
        {
          id: "opening",
          title: t("openingHours"),
          icon: Store,
          rows: openingDetails.map((day) => ({
            id: `opening-${day.dayOfWeek}`,
            title: day.dayLabel,
            subtitle: t("openingHours"),
            statusLabel: day.isClosed ? t("closed") : t("open"),
            isClosed: Boolean(day.isClosed),
            hoursLabel: day.hoursLabel,
            breakLabels: day.breakLabels,
            closedTitle: t("closed"),
            closedDescription: t("hoursNotConfigured"),
            breakPrefix: t("breakTime", { time: "" }).replace(/\s*$/, ""),
          })),
          emptyTitle: t("hoursNotConfigured"),
        },
        ...(showDeliveryDetails
          ? [{
              id: "delivery",
              title: t("deliveryHours"),
              icon: Truck,
              rows: deliveryDetails.map((day) => ({
                id: `delivery-${day.dayOfWeek}`,
                title: day.dayLabel,
                subtitle: t("deliveryHours"),
                statusLabel: day.isClosed ? t("closed") : t("open"),
                isClosed: Boolean(day.isClosed),
                hoursLabel: day.hoursLabel,
                breakLabels: day.breakLabels,
                closedTitle: t("closed"),
                closedDescription: t("hoursNotConfigured"),
                breakPrefix: t("breakTime", { time: "" }).replace(/\s*$/, ""),
              })),
              emptyTitle: t("hoursNotConfigured"),
            }]
          : []),
        ...(holidayDetails.length > 0
          ? [{
              id: "holiday",
              title: t("holidayHours"),
              icon: CalendarDays,
              rows: holidayDetails.map((day, index) => ({
                id: `holiday-${day.date || day.dayOfWeek || index}`,
                title: day.dayLabel,
                subtitle: t("holidayHours"),
                statusLabel: day.isClosed ? t("closed") : t("open"),
                isClosed: Boolean(day.isClosed),
                hoursLabel: day.hoursLabel,
                breakLabels: day.breakLabels,
                closedTitle: t("closed"),
                closedDescription: t("hoursNotConfigured"),
                breakPrefix: t("breakTime", { time: "" }).replace(/\s*$/, ""),
              })),
              emptyTitle: t("hoursNotConfigured"),
            }]
          : []),
      ]}
      closeLabel={t("close")}
      triggerClassName={triggerClassName}
      triggerContent={triggerContent}
    />
  );
}

const getRangeEndTime = (value: string | undefined) => {
  const [, endTime] = String(value || "").split(" - ");
  return endTime?.trim() || "";
};

export default function RestaurantHeader() {
  const t = useTranslations("items.common");
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId");
  const router = useRouter();

  const { token, restaurantId: authRestaurantId, user } = useAuth();
  const { fetchMenuCategoriesPage } = useItems(token);
  const { fetchBranches } = useBranches(token);

  const [category, setCategory] = useState<ItemsCategory | null>(null);
  const [restaurant, setRestaurant] = useState<{
    name: string;
    address: string;
    operatingHours: string;
    ratingInfo: ReturnType<typeof getRatingInfo>;
    coverImage?: string | null;
    branchName?: string;
    branchHours: ReturnType<typeof getBranchHoursSummary>;
    reservationEnabled: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const storedAuth = useMemo<StoredAuthState | null>(() => getStoredAuthState() as StoredAuthState | null, []);

  const restaurantId = useMemo(() => {
    return (
      authRestaurantId ||
      user?.restaurantId ||
      storedAuth?.user?.restaurantId ||
      ""
    );
  }, [authRestaurantId, user?.restaurantId, storedAuth]);

  const selectedBranchId = useMemo(() => {
    return String(user?.branchId || user?.branch?.id || storedAuth?.user?.branchId || storedAuth?.user?.branch?.id || "");
  }, [user?.branchId, user?.branch?.id, storedAuth]);

  useEffect(() => {
    let cancelled = false;

    const fetchCategory = async () => {
      if (!token || !restaurantId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const sessionBranch = getSelectedBranchFromSession(user as AuthRestaurantUser | null, storedAuth);
        let selectedBranch: BranchRecord | AuthRestaurantUser["branch"] | null = sessionBranch;

        if (selectedBranchId && restaurantId) {
          try {
            const branches = await fetchBranches(
              `/v1/branches?restaurantId=${encodeURIComponent(String(restaurantId))}&page=1&limit=100`
            );

            selectedBranch = branches.find((branch) => String(branch.id) === selectedBranchId) ?? sessionBranch;
          } catch {
            selectedBranch = sessionBranch;
          }
        }

        const branchHours = getBranchHoursSummary(selectedBranch);
        const reservationEnabled = selectedBranch?.settings?.tableReservationsEnabled === true;
        const selectedBranchAddress = formatAddress(selectedBranch?.address);

        const resolvedRestaurant = {
          name: getRestaurantName(user as AuthRestaurantUser | null, storedAuth),
          address: selectedBranchAddress || getRestaurantAddress(user as AuthRestaurantUser | null, storedAuth),
          operatingHours: branchHours.opening.status !== "unknown"
            ? t("hoursAvailable")
            : getOperatingHours(user as AuthRestaurantUser | null, storedAuth),
          ratingInfo: getRatingInfo(user as AuthRestaurantUser | null, storedAuth),
          coverImage:
            storedAuth?.user?.restaurant?.coverImage ||
            storedAuth?.user?.restaurant?.coverImageUrl ||
            storedAuth?.user?.restaurant?.bannerUrl ||
            "",
          branchName: selectedBranch?.name ? String(selectedBranch.name) : undefined,
          branchHours,
          reservationEnabled,
        };

        let page = 1;
        let totalLoaded = 0;
        let selectedCategory: ItemsCategory | null = null;
        let firstCategory: ItemsCategory | null = null;
        let shouldContinue = true;

        while (shouldContinue) {
          const { categories: fetchedCategories, meta } = await fetchMenuCategoriesPage({
            restaurantId: String(restaurantId),
            page,
            limit: CATEGORY_PAGE_LIMIT,
          });

          if (!firstCategory && fetchedCategories.length > 0) {
            firstCategory = fetchedCategories[0] ?? null;
          }

          if (categoryId) {
            selectedCategory = fetchedCategories.find(
              ({ id }) => String(id) === String(categoryId)
            ) ?? null;
          }

          totalLoaded += fetchedCategories.length;

          if (selectedCategory || !categoryId) {
            shouldContinue = false;
          } else {
            shouldContinue = resolveHasNext({
              meta,
              page,
              limit: CATEGORY_PAGE_LIMIT,
              receivedCount: fetchedCategories.length,
              totalLoaded,
            });

            page += 1;
          }

          if (page > 30) {
            shouldContinue = false;
          }
        }

        if (cancelled) return;

        setRestaurant(resolvedRestaurant);
        setCategory(categoryId ? selectedCategory : null);
      } catch (err) {

        if (!cancelled) {
          setRestaurant({
            name: getRestaurantName(user as AuthRestaurantUser | null, storedAuth),
            address: getRestaurantAddress(user as AuthRestaurantUser | null, storedAuth),
            operatingHours: getOperatingHours(user as AuthRestaurantUser | null, storedAuth),
            ratingInfo: getRatingInfo(user as AuthRestaurantUser | null, storedAuth),
            branchName: getSelectedBranchFromSession(user as AuthRestaurantUser | null, storedAuth)?.name || undefined,
            branchHours: getBranchHoursSummary(getSelectedBranchFromSession(user as AuthRestaurantUser | null, storedAuth)),
            reservationEnabled: getSelectedBranchFromSession(user as AuthRestaurantUser | null, storedAuth)?.settings?.tableReservationsEnabled === true,
          });
          setCategory(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchCategory();

    return () => {
      cancelled = true;
    };
  }, [categoryId, token, restaurantId, selectedBranchId, fetchBranches, user, storedAuth, t]);

  const categoryItemCount = category ? getCategoryItemCount(category) : null;
  const bannerImage = getImageUrl(category, restaurant);
  const openingDetails = restaurant?.branchHours
    ? getBranchHoursDetails(restaurant.branchHours.openingSchedule)
    : [];
  const deliveryDetails = restaurant?.branchHours
    ? getBranchHoursDetails(restaurant.branchHours.deliverySchedule)
    : [];
  const currentOpeningDetail = getCurrentBranchHoursDetail(openingDetails);
  const currentDeliveryDetail = getCurrentBranchHoursDetail(deliveryDetails);
  const currentOpeningBreakLabels = currentOpeningDetail?.breakLabels ?? [];
  const currentDeliveryBreakLabels = currentDeliveryDetail?.breakLabels ?? [];
  const openingCloseTime = getRangeEndTime(currentOpeningDetail?.hoursLabel || restaurant?.branchHours.opening.value);
  const openingStatusLabel = restaurant?.branchHours.opening.status === "open"
    ? t("openNow")
    : restaurant?.branchHours.opening.status === "closed"
    ? t("closedNow")
    : t("hoursAvailable");
  const openingSubLabel = restaurant?.branchHours.opening.status === "open" && openingCloseTime
    ? t("closesAt", { time: openingCloseTime })
    : restaurant?.branchHours.opening.value;
  const deliveryHoursLabel = currentDeliveryDetail?.hoursLabel || restaurant?.branchHours.delivery.value;
  const primaryOpeningBreakLabel = currentOpeningBreakLabels[0] ?? "";
  const primaryDeliveryBreakLabel = currentDeliveryBreakLabels[0] ?? primaryOpeningBreakLabel;
  const openingBreakText = primaryOpeningBreakLabel
    ? t("breakTime", { time: primaryOpeningBreakLabel })
    : t("noBreakToday");
  const deliveryBreakText = primaryDeliveryBreakLabel
    ? t("breakTime", { time: primaryDeliveryBreakLabel })
    : t("noBreakToday");

  const title = category?.name ? category.name : t("fullMenu");

  const description = hasText(category?.description)
    ? String(category?.description)
    : category?.name
    ? t("categoryDescription")
    : t("menuDescription");

  if (loading) {
    return (
      <div className="mx-4 mt-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:mx-10">
        <div className="flex min-h-[240px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-6 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm md:mx-10 md:mt-7">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_480px]">
        {/* LEFT CONTENT */}
        <div className="flex min-w-0 flex-col justify-center bg-white px-5 py-5 md:px-7 md:py-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-normal text-primary">
              {category?.name ? t("category") : t("restaurantMenu")}
            </span>

            {categoryItemCount !== null ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-900">
                <Utensils size={13} className="text-gray-500" />
                {t("itemCount", { count: categoryItemCount })}
              </span>
            ) : null}
          </div>

          <h1 className="mt-4 text-[30px] font-semibold leading-tight tracking-normal text-gray-950 md:text-[38px]">
            {title}
          </h1>

          <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-gray-600 md:text-[15px]">
            {description}
          </p>

          <div className="mt-4 grid overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:grid-cols-[1fr_1fr_1fr]">
            <div className="min-w-0 border-b border-gray-200 px-4 py-3 md:border-b-0 md:border-r">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shadow-sm ring-1 ring-emerald-200">
                  <span className="h-3.5 w-3.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.16)]" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-emerald-600">
                    {openingStatusLabel}
                  </span>
                  <span className="mt-1.5 block truncate text-sm font-medium text-gray-700">
                    {openingSubLabel}
                  </span>
                  <span
                    className="mt-2 flex min-w-0 items-center gap-1.5 text-xs font-medium text-gray-600"
                    title={openingBreakText}
                  >
                    <Coffee size={14} className="shrink-0 text-gray-400" />
                    <span className="min-w-0 truncate whitespace-nowrap">
                      {openingBreakText}
                    </span>
                  </span>
                </span>
              </div>
            </div>

            <div className="min-w-0 border-b border-gray-200 px-4 py-3 md:border-b-0 md:border-r">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
                  <Truck size={18} strokeWidth={2.5} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-primary">
                    {t("delivery")}
                  </span>
                  <span className="mt-1.5 block truncate text-sm font-medium text-gray-700">
                    {deliveryHoursLabel}
                  </span>
                  <span
                    className="mt-2 flex min-w-0 items-center gap-1.5 text-xs font-medium text-gray-600"
                    title={deliveryBreakText}
                  >
                    <Coffee size={14} className="shrink-0 text-gray-400" />
                    <span className="min-w-0 truncate whitespace-nowrap">
                      {deliveryBreakText}
                    </span>
                  </span>
                </span>
              </div>
            </div>

            <div className="min-w-0 px-4 py-3">
              <div className="flex items-center gap-3">
                <MapPin size={22} className="shrink-0 text-gray-500" />
                <span className="line-clamp-2 text-sm font-medium leading-5 text-gray-700">
                  {restaurant?.address}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            {restaurant?.branchHours ? (
              <BranchHoursDialog
                branchName={restaurant.branchName}
                branchHours={restaurant.branchHours}
                triggerClassName="inline-flex h-10 min-w-[190px] items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                triggerContent={(
                  <>
                    <Clock size={17} className="shrink-0 text-gray-500" />
                    {t("viewWeeklyHours")}
                  </>
                )}
              />
            ) : null}

            <button
              type="button"
              disabled={!restaurant?.reservationEnabled}
              onClick={() => {
                if (restaurant?.reservationEnabled) {
                  router.push("/reservetable");
                }
              }}
              className="inline-flex h-10 min-w-[190px] items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <CalendarDays size={17} className="shrink-0" />
              {t("reserveTable")}
            </button>
          </div>
        </div>

        {/* RIGHT IMAGE */}
        <div className="relative h-[220px] w-full overflow-hidden bg-gray-100 md:h-[300px] lg:h-auto">
          <Image
            src={bannerImage}
            alt={category?.name || restaurant?.name || t("restaurantMenuImageAlt")}
            fill
            className="object-cover"
            priority
            unoptimized
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/10" />

          {category?.name ? (
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/90 p-4 shadow-sm backdrop-blur">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                {t("currentCategory")}
              </p>
              <p className="mt-1 truncate text-base font-semibold text-gray-900">
                {category.name}
              </p>

              {hasText(category?.description) ? (
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                  {category.description}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
