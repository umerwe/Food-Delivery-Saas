"use client";

import Image from "next/image";
import { Star, MapPin, Clock, Utensils, Loader2, Store, Truck, Coffee } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import useItems from "@/hooks/useItems";
import { useAuth } from "@/hooks/useAuth";
import useBranches from "@/hooks/useBranches";
import { getStoredAuthState } from "@/lib/auth";
import { OpeningHoursDialog } from "@/components/common/popups/OpeningHoursDialog";
import type { AuthRestaurantUser, ItemsCategory, StoredAuthState } from "@/components/pages/Items/types";
import { getBranchHoursDetails, getBranchHoursSummary, getCurrentBranchHoursDetail, getImageUrl, getOperatingHours, getRatingInfo, getRestaurantAddress, getRestaurantName, hasText, resolveHasNext } from "@/components/pages/Items/utils/restaurant-card-utils";
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
}: {
  branchName?: string;
  branchHours: ReturnType<typeof getBranchHoursSummary>;
}) {
  const t = useTranslations("items.common");
  const openingDetails = getBranchHoursDetails(branchHours.openingSchedule);
  const deliveryDetails = getBranchHoursDetails(branchHours.deliverySchedule);
  const hasOpeningDetails = openingDetails.length > 0;
  const visibleDetails = branchHours.showDeliveryHours
    ? [...openingDetails, ...deliveryDetails]
    : openingDetails;
  const entriesCount = visibleDetails.length;
  const openDaysCount = visibleDetails.filter((day) => !day.isClosed).length;
  const closedDaysCount = visibleDetails.filter((day) => day.isClosed).length;

  return (
    <OpeningHoursDialog
      triggerLabel={t("viewHours")}
      badgeLabel={t("hoursAvailable")}
      title={t("hoursPopupTitle")}
      description={t("hoursPopupNote")}
      branchPill={branchName}
      stats={[
        { label: t("entries"), value: entriesCount },
        { label: t("open"), value: openDaysCount },
        { label: t("closed"), value: closedDaysCount },
      ]}
      infoTitle={t("hoursAvailable")}
      infoDescription={t("hoursPopupNote")}
      sections={[
        {
          id: "opening",
          title: t("openingHours"),
          description: t("openingHoursDescription"),
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
        ...(branchHours.showDeliveryHours
          ? [{
              id: "delivery",
              title: t("deliveryHours"),
              description: t("deliveryHoursDescription"),
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
      ]}
      closeLabel={t("close")}
    />
  );
}

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

        const resolvedRestaurant = {
          name: getRestaurantName(user as AuthRestaurantUser | null, storedAuth),
          address: getRestaurantAddress(user as AuthRestaurantUser | null, storedAuth),
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
  const ratingInfo = restaurant?.ratingInfo;
  const bannerImage = getImageUrl(category, restaurant);
  const openingDetails = restaurant?.branchHours
    ? getBranchHoursDetails(restaurant.branchHours.openingSchedule)
    : [];
  const deliveryDetails = restaurant?.branchHours
    ? getBranchHoursDetails(restaurant.branchHours.deliverySchedule)
    : [];
  const currentOpeningBreakLabels = getCurrentBranchHoursDetail(openingDetails)?.breakLabels ?? [];
  const currentDeliveryBreakLabels = getCurrentBranchHoursDetail(deliveryDetails)?.breakLabels ?? [];

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
    <div className="mx-4 mt-6 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm md:mx-10">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_520px]">
        {/* LEFT CONTENT */}
        <div className="flex min-w-0 flex-col justify-center p-6 md:p-8 lg:p-10">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              {category?.name ? t("category") : t("restaurantMenu")}
            </span>

            {categoryItemCount !== null ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                <Utensils size={13} />
                {t("itemCount", { count: categoryItemCount })}
              </span>
            ) : null}
          </div>

          <h1 className="text-2xl font-semibold leading-tight tracking-[-0.02em] text-gray-950 md:text-4xl">
            {title}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 md:text-base">
            {description}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-gray-600">
            {ratingInfo ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-1.5 text-yellow-700">
                <Star className="fill-yellow-500 text-yellow-500" size={16} />
                <span className="font-semibold">
                  {ratingInfo.rating.toFixed(1)}
                </span>

                {ratingInfo.reviews ? (
                  <span className="text-yellow-700/80">
                    · {t("reviewCount", { count: ratingInfo.reviews })}
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5">
              <Clock size={15} className="text-gray-500" />
              <span>{restaurant?.operatingHours}</span>
              {restaurant?.branchHours ? (
                <BranchHoursDialog
                  branchName={restaurant.branchName}
                  branchHours={restaurant.branchHours}
                />
              ) : null}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-primary text-white shadow-sm">
                  <Store size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-primary">
                    {t("openingHours")}
                  </span>
                  <span className="mt-1 block text-base font-semibold text-gray-950">
                    {restaurant?.branchHours.opening.value}
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    {restaurant?.branchHours.opening.label}
                    {restaurant?.branchName ? ` · ${restaurant.branchName}` : ""}
                  </span>
                  {currentOpeningBreakLabels.length > 0 ? (
                    <span className="mt-2 flex flex-col gap-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                        {t("breakWindows")}
                      </span>
                      {currentOpeningBreakLabels.map((breakLabel) => (
                        <span
                          key={breakLabel}
                          className="inline-flex w-fit items-center gap-1.5 rounded-[12px] border border-gray-200 bg-[#FAFAFA] px-2.5 py-1 text-xs font-medium text-gray-700"
                        >
                          <Coffee size={12} className="shrink-0 text-gray-400" />
                          {t("breakTime", { time: breakLabel })}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </span>
              </div>
            </div>

            {restaurant?.branchHours.showDeliveryHoursCard ? (
              <div className="rounded-[22px] border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-primary text-white shadow-sm">
                    <Truck size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold uppercase tracking-wide text-primary">
                      {t("deliveryHours")}
                    </span>
                    <span className="mt-1 block text-base font-semibold text-gray-950">
                      {restaurant.branchHours.delivery.value}
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      {restaurant.branchHours.delivery.label}
                      {restaurant.branchName ? ` · ${restaurant.branchName}` : ""}
                    </span>
                    {currentDeliveryBreakLabels.length > 0 ? (
                      <span className="mt-2 flex flex-col gap-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                          {t("breakWindows")}
                        </span>
                        {currentDeliveryBreakLabels.map((breakLabel) => (
                          <span
                            key={breakLabel}
                            className="inline-flex w-fit items-center gap-1.5 rounded-[12px] border border-gray-200 bg-[#FAFAFA] px-2.5 py-1 text-xs font-medium text-gray-700"
                          >
                            <Coffee size={12} className="shrink-0 text-gray-400" />
                            {t("breakTime", { time: breakLabel })}
                          </span>
                        ))}
                      </span>
                    ) : null}
                  </span>
                </div>
              </div>
            ) : null}

          </div>

          <div className="mt-5 space-y-2 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-gray-500" />
              <span>{restaurant?.address}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!restaurant?.reservationEnabled}
              onClick={() => {
                if (restaurant?.reservationEnabled) {
                  router.push("/reservetable");
                }
              }}
              className="rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {t("reserveTable")}
            </button>

            <div className="text-xs text-gray-400">
              {restaurant?.name ? t("servingFrom", { name: restaurant.name }) : null}
            </div>
          </div>
        </div>

        {/* RIGHT IMAGE */}
        <div className="relative h-[260px] w-full overflow-hidden bg-gray-100 md:h-[340px] lg:h-auto">
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
