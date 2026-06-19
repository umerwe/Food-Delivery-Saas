"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaCheckCircle,
  FaMapMarkerAlt,
  FaSearch,
  FaStore,
  FaTimes,
} from "react-icons/fa";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import useBranches, { useNearbyBranches } from "@/hooks/useBranches";
import { useAuthContext } from "@/hooks/useAuth";
import type { Branch, BranchApiResponse } from "@/types/branch-selector";
import {
  branchSupportsDelivery,
  branchSupportsPickup,
  formatBranchDistance,
  getBranchAddressText,
  isBranchCurrentlyAvailable,
  nearbyBranchToBranchRecord,
  persistSelectedBranch,
} from "@/lib/branch-selector";
import {
  getStoredCheckoutTypePreference,
  setStoredCheckoutTypePreference,
} from "@/lib/checkout-type-preference";
import { usePathname } from "next/navigation";
import { useUserLocation } from "@/hooks/useUserLocation";
import { AddressLocationPicker } from "@/components/common/branch-selector/AddressLocationPicker";

type BranchSearchMode = "delivery" | "pickup";

type BranchSelectorModalProps = {
  open: boolean;
  onClose: () => void;
  restaurantId?: string | number | null;
  endpoint?: string;
  title?: string;
  badgeText?: string;
  description?: string;
  forceSelection?: boolean;
  onSelected?: (branch: Branch) => void;
};

export function BranchSelectorModal({
  open,
  onClose,
  restaurantId,
  endpoint,
  title,
  badgeText,
  description,
  forceSelection = false,
  onSelected,
}: BranchSelectorModalProps) {
  const t = useTranslations("branchSelector");
  const tCommon = useTranslations("common");
  const { token, user, setUser } = useAuthContext();
  const api = useBranches(token);
  const getRef = useRef(api.fetchBranchPage);
  const pathname = usePathname();
  const isBlockedRoute = pathname === "/login" || pathname === "/auth/login";

  useEffect(() => {
    getRef.current = api.fetchBranchPage;
  }, [api.fetchBranchPage]);

  const [loading, setLoading] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchMode, setBranchMode] = useState<BranchSearchMode>("delivery");
  const [useNearbyResults, setUseNearbyResults] = useState(false);
  const {
    coordinates,
    locationLabel,
    permissionState,
    errorMessage,
    requestLocation,
    acceptCoordinates,
  } = useUserLocation();
  const nearbyQuery = useNearbyBranches(
    coordinates
      ? {
          lat: coordinates.lat,
          lng: coordinates.lng,
          page: 1,
          limit: 20,
        }
      : null,
    { enabled: open && useNearbyResults }
  );

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBranches, setTotalBranches] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!open) return;

    const storedMode = getStoredCheckoutTypePreference();

    if (storedMode) {
      setBranchMode(storedMode);
    }
  }, [open]);

  const resolvedRestaurantId = useMemo(() => {
    return restaurantId || user?.restaurantId || user?.tenantId || null;
  }, [restaurantId, user]);

  const canFetch =
    !!token && !!user && !!resolvedRestaurantId && open && !isBlockedRoute;

  const hasActiveSearch = Boolean(search.trim() || searchInput.trim());
  const resolvedTitle = title || "Choose your nearest branch";
  const resolvedDescription =
    description ??
    "";
  const nearbyBranches = useMemo(
    () =>
      nearbyQuery.branches
        .filter((branch) =>
          branchMode === "pickup"
            ? branchSupportsPickup(branch)
            : branchSupportsDelivery(branch)
        )
        .map(nearbyBranchToBranchRecord),
    [branchMode, nearbyQuery.branches]
  );
  const shouldShowNearbyBranches = useNearbyResults && Boolean(coordinates);
  const displayedBranches = shouldShowNearbyBranches ? nearbyBranches : branches;
  const isLoadingBranches =
    shouldShowNearbyBranches || permissionState === "requesting"
      ? permissionState === "requesting" || nearbyQuery.isFetching
      : loading;
  const displayedTotalBranches = shouldShowNearbyBranches ? displayedBranches.length : totalBranches;

  const buildUrl = useCallback(() => {
    const baseUrl =
      endpoint || `/v1/branches?restaurantId=${resolvedRestaurantId}`;

    const separator = baseUrl.includes("?") ? "&" : "?";

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));

    if (search.trim()) {
      params.set("search", search.trim());
    }

    return `${baseUrl}${separator}${params.toString()}`;
  }, [endpoint, resolvedRestaurantId, page, limit, search]);

  const fetchBranches = useCallback(async () => {
    if (!canFetch) return;

    try {
      setLoading(true);

      const url = buildUrl();
      const res: BranchApiResponse = await getRef.current(url);

      const list = Array.isArray(res?.data) ? res.data : [];
      const activeBranches = list.filter((branch: Branch) => {
        return branch?.isActive !== false;
      });

      const meta = res?.meta || {};
      const nextTotalPages = meta.totalPages ?? res?.totalPages ?? 1;
      const nextTotal = meta.total ?? res?.total ?? activeBranches.length;
      const nextHasNextPage =
        meta.hasNextPage ?? res?.hasNextPage ?? page < nextTotalPages;
      const nextHasPrevPage =
        meta.hasPrevPage ?? res?.hasPrevPage ?? page > 1;

      setBranches(activeBranches);
      setTotalPages(Math.max(1, nextTotalPages));
      setTotalBranches(nextTotal);
      setHasNextPage(nextHasNextPage);
      setHasPrevPage(nextHasPrevPage);
    } catch (error) {
      toast.error(t("failedToLoadBranches"));
      setBranches([]);
      setTotalPages(1);
      setTotalBranches(0);
      setHasNextPage(false);
      setHasPrevPage(false);
    } finally {
      setLoading(false);
    }
  }, [buildUrl, canFetch, page, t]);

  useEffect(() => {
    if (!open) return;
    fetchBranches();
  }, [open, fetchBranches]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  const handleSelect = async (branch: Branch) => {
    try {
      setSelectingId(branch.id);

      persistSelectedBranch(branch, setUser, {
        orderType: branchMode === "pickup" ? "TAKEAWAY" : "DELIVERY",
      });

      toast.success(t("branchSelected", { name: branch.name }));
      onSelected?.(branch);
      onClose();
    } catch (error) {
      toast.error(t("failedToSetBranch"));
    } finally {
      setSelectingId(null);
    }
  };

  const handleBranchModeChange = (mode: BranchSearchMode) => {
    setBranchMode(mode);
    setStoredCheckoutTypePreference(mode);
  };

  const handlePrevPage = () => {
    if (loading || page <= 1) return;
    setPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    if (loading || (!hasNextPage && page >= totalPages)) return;
    setPage((prev) => prev + 1);
  };

  const handleBackdropClose = () => {
    if (forceSelection) return;
    onClose();
  };

  const handleClearSearch = () => {
    setPage(1);
    setSearch("");
    setSearchInput("");
    setUseNearbyResults(false);
  };

  const handleUseCurrentLocation = () => {
    setUseNearbyResults(true);
    requestLocation();
  };

  const handleSelectSearchLocation = (nextCoordinates: { lat: number; lng: number }, label?: string) => {
    acceptCoordinates(nextCoordinates, label || "Selected address");
    setUseNearbyResults(true);
  };

  const handleEmptyClose = () => {
    /*
     * Even when forceSelection is true, allow closing the modal if there are
     * no selectable branches. Otherwise the user gets trapped in an empty modal.
     */
    onClose();
  };

  if (!open || !user || !token || isBlockedRoute) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-[#0A0D12]/55 p-4 backdrop-blur-[10px]">
      <div className="absolute inset-0" onClick={handleBackdropClose} />

      <div className="relative flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-[32px] border border-white/20 bg-white shadow-[0_30px_100px_rgba(2,6,23,0.22)] lg:max-h-[86vh] lg:max-w-[1120px]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-[var(--primary)]/12 via-[var(--primary)]/5 to-transparent" />
        <div className="pointer-events-none absolute right-[-60px] top-[-60px] h-40 w-40 rounded-full bg-[var(--primary)]/5 blur-3xl" />

        <div className="relative shrink-0 border-b border-[#EEF1F4] px-6 pb-6 pt-6 md:px-8 md:pb-7 md:pt-7">
          {!forceSelection ? (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#6B7280] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
              aria-label={t("closeBranchSelector")}
            >
              <FaTimes className="text-[13px]" />
            </button>
          ) : null}

          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-[color:rgba(206,24,27,0.08)] text-[var(--primary)] shadow-[0_8px_24px_rgba(206,24,27,0.08)]">
              <FaStore className="text-[20px]" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(206,24,27,0.14)] bg-[color:rgba(206,24,27,0.06)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
                {badgeText || t("branchSelection")}
              </div>

              <h2 className="mt-3 text-[24px] font-bold tracking-[-0.03em] text-[#111827] md:text-[28px]">
                {resolvedTitle}
              </h2>

              {resolvedDescription ? (
                <p className="mt-2 max-w-[540px] text-sm leading-6 text-[#6B7280] md:text-[15px]">
                  {resolvedDescription}
                </p>
              ) : null}
            </div>
          </div>

        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="border-b border-[#EEF1F4] px-6 py-5 md:px-8 lg:border-b-0 lg:border-r lg:px-6 lg:py-6">
            <div className="mb-4 inline-flex rounded-2xl bg-[#F9FAFB] p-1">
              {(["delivery", "pickup"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleBranchModeChange(mode)}
                  className={`min-w-[112px] rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    branchMode === mode
                      ? "bg-[var(--primary)] text-white shadow-sm"
                      : "text-[#6B7280] hover:bg-white"
                  }`}
                >
                  {mode === "delivery" ? "Delivery" : "Pickup"}
                </button>
              ))}
            </div>

            <AddressLocationPicker
              coordinates={coordinates}
              locationLabel={locationLabel}
              onSelectLocation={handleSelectSearchLocation}
              onUseCurrentLocation={handleUseCurrentLocation}
              isLocating={permissionState === "requesting"}
              compact
              actionsBelow
            />

            {errorMessage ? (
              <p className="mt-4 rounded-2xl bg-[#F9FAFB] px-4 py-3 text-xs leading-5 text-[#6B7280]">
                {errorMessage || "Location is unavailable right now. You can still search and choose a branch manually."}
              </p>
            ) : null}
          </div>

          <div className="flex min-h-0 flex-col">
            <div className="border-b border-[#EEF1F4] bg-white px-6 py-4 md:px-8">
              <div className="relative">
                <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#9CA3AF]" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => {
                    setUseNearbyResults(false);
                    setSearchInput(e.target.value);
                  }}
                  placeholder="Manual branch fallback search"
                  className="h-12 w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] pl-11 pr-4 text-sm text-[#111827] outline-none transition-all duration-200 placeholder:text-[#9CA3AF] focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-[color:rgba(206,24,27,0.08)]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 md:px-8">
              {isLoadingBranches ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-5 h-12 w-12 animate-spin rounded-full border-[3px] border-[color:rgba(206,24,27,0.14)] border-t-[var(--primary)]" />
                  <p className="text-sm font-semibold text-[#111827]">
                    {permissionState === "requesting" ? "Finding your location" : t("loadingAvailableBranches")}
                  </p>
                  <p className="mt-1 text-xs text-[#9CA3AF]">
                    {shouldShowNearbyBranches ? "Sorting nearby branches by distance" : t("fetchingRestaurantBranches")}
                  </p>
                </div>
              ) : displayedBranches.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-[#E5E7EB] bg-[#F9FAFB] px-6 py-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-[var(--primary)] shadow-sm">
                    <FaMapMarkerAlt className="text-[20px]" />
                  </div>

                  <h3 className="text-base font-semibold text-[#111827]">
                    {t("noMatchingBranchesFound")}
                  </h3>

                  <p className="mx-auto mt-2 max-w-[360px] text-sm leading-6 text-[#6B7280]">
                    {t("noMatchingBranchesDescription")}
                  </p>

                  <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    {hasActiveSearch ? (
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        className="inline-flex h-11 min-w-[140px] items-center justify-center rounded-full border border-[color:rgba(206,24,27,0.18)] bg-white px-5 text-sm font-semibold text-[var(--primary)] transition hover:bg-[color:rgba(206,24,27,0.04)]"
                      >
                        {t("clearSearch")}
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={handleEmptyClose}
                      className="inline-flex h-11 min-w-[140px] items-center justify-center rounded-full bg-[var(--primary)] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--primary)]/90"
                    >
                      {tCommon("close")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 pb-2 lg:grid-cols-2">
                  {displayedBranches.map((branch) => {
                    const addressText = getBranchAddressText(branch);
                    const isSelecting = selectingId === branch.id;
                    const isCurrent = user?.branchId === branch.id;
                    const supportsDelivery = branchSupportsDelivery(branch);
                    const supportsPickup = branchSupportsPickup(branch);
                    const available = isBranchCurrentlyAvailable(branch);
                    const supportText = [
                      supportsDelivery ? "Delivery" : "",
                      supportsPickup ? "Pickup" : "",
                    ].filter(Boolean).join(" + ");

                    return (
                      <button
                        key={branch.id}
                        type="button"
                        onClick={() => handleSelect(branch)}
                        disabled={!!selectingId}
                        className="group relative flex h-full w-full items-start gap-4 rounded-[24px] border border-[#E8ECF0] bg-white px-4 py-4 text-left transition-all duration-200 hover:-translate-y-[1px] hover:border-[var(--primary)]/35 hover:bg-[color:rgba(206,24,27,0.02)] hover:shadow-[0_16px_32px_rgba(17,24,39,0.08)] disabled:cursor-not-allowed disabled:opacity-70 md:px-5 md:py-5"
                      >
                        <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[color:rgba(206,24,27,0.08)] text-[var(--primary)] transition-all duration-200 group-hover:bg-[var(--primary)] group-hover:text-white">
                          {isSelecting ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <FaMapMarkerAlt className="text-[16px]" />
                          )}
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-[16px] font-semibold text-[#111827]">
                                {branch.name}
                              </p>
                              <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#6B7280]">
                                {addressText}
                              </p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {formatBranchDistance(branch.distanceKm) ? (
                                  <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-[11px] font-semibold text-[#4B5563]">
                                    {formatBranchDistance(branch.distanceKm)}
                                  </span>
                                ) : null}
                                {supportText ? (
                                  <span className="rounded-full bg-[color:rgba(206,24,27,0.07)] px-3 py-1 text-[11px] font-semibold text-[var(--primary)]">
                                    {supportText}
                                  </span>
                                ) : null}
                                <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-[11px] font-semibold text-[#4B5563]">
                                  {available ? t("available") : branch.availability?.reason || "Availability limited"}
                                </span>
                              </div>
                            </div>

                            <div className="hidden shrink-0 rounded-full border border-[color:rgba(206,24,27,0.12)] bg-[color:rgba(206,24,27,0.06)] px-3 py-1 text-[11px] font-semibold text-[var(--primary)] md:block">
                              {isCurrent ? t("current") : t("available")}
                            </div>
                          </div>

                          <div className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--primary)]">
                            <FaCheckCircle className="text-[12px]" />
                            {isCurrent ? t("selectedBranch") : t("selectThisBranch")}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-[#EEF1F4] bg-[#FCFCFD] px-6 py-4 md:px-8">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-center md:text-left">
                  <p className="text-xs font-medium text-[#6B7280]">
                    {displayedTotalBranches > 0
                      ? t("showingPageOf", {
                          page,
                          totalPages: shouldShowNearbyBranches ? 1 : Math.max(totalPages, 1),
                        })
                      : forceSelection
                        ? t("noSelectableBranch")
                        : t("browseAndSwitchBranch")}
                  </p>

                  {displayedTotalBranches > 0 ? (
                    <p className="mt-1 text-[11px] text-[#9CA3AF]">
                      {displayedTotalBranches === 1
                        ? t("branchFound", { count: displayedTotalBranches })
                        : t("branchesFound", { count: displayedTotalBranches })}
                    </p>
                  ) : null}
                </div>

                {!shouldShowNearbyBranches && totalBranches > 0 && totalPages > 1 ? (
                  <div className="flex items-center justify-center gap-2 md:justify-end">
                    <button
                      type="button"
                      onClick={handlePrevPage}
                      disabled={loading || !hasPrevPage}
                      className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#374151] transition-all duration-200 hover:border-[var(--primary)] hover:text-[var(--primary)] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {tCommon("previous")}
                    </button>

                    <div className="min-w-[44px] rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-center text-sm font-semibold text-[#374151]">
                      {page}
                    </div>

                    <button
                      type="button"
                      onClick={handleNextPage}
                      disabled={loading || !hasNextPage}
                      className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#374151] transition-all duration-200 hover:border-[var(--primary)] hover:text-[var(--primary)] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {tCommon("next")}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
