"use client";

import Image from "next/image";
import { BadgePercent, Clock3, MapPinned, ShoppingBag, Store, Truck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { useAuthContext } from "@/hooks/useAuth";
import { useNearbyBranches } from "@/hooks/useBranches";
import { useUserLocation } from "@/hooks/useUserLocation";
import { AddressLocationPicker } from "@/components/common/branch-selector/AddressLocationPicker";
import {
  branchSupportsDelivery,
  branchSupportsPickup,
  formatBranchAddress,
  formatBranchDistance,
  getSelectedOrderType,
  isBranchCurrentlyAvailable,
  nearbyBranchToBranchRecord,
  normalizeBranch,
  persistSelectedBranch,
} from "@/lib/branch-selector";
import {
  checkoutTypeToOrderType,
  getStoredCheckoutTypePreference,
  setStoredCheckoutTypePreference,
} from "@/lib/checkout-type-preference";
import { isRemoteHttpsImageUrl, resolveHttpsImageUrl } from "@/lib/image-fallback";
import type { AuthBranch } from "@/types/auth";
import type { BranchOrderType, NearbyBranch } from "@/types/branches";
import type { HomeBranch } from "@/types/home";

type HeroSectionProps = {
  restaurantName?: string;
  tagline?: string;
  title?: string;
  description?: string;
  heroImage?: string | null;
  branch?: AuthBranch | HomeBranch | null;
};

type BranchSearchMode = "delivery" | "pickup";

const getOrderType = (mode: BranchSearchMode): BranchOrderType =>
  mode === "pickup" ? "TAKEAWAY" : "DELIVERY";

export const HeroSection = ({
  title,
  description,
  heroImage = "/hero.png",
  branch,
}: HeroSectionProps) => {
  const t = useTranslations("home.hero");
  const router = useRouter();
  const { user, setUser } = useAuthContext();
  const resolvedHeroImage = resolveHttpsImageUrl(heroImage, "/hero.png");
  const branchSearchRef = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = useState<BranchSearchMode>("delivery");
  const [showResults, setShowResults] = useState(false);
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
    { enabled: showResults }
  );

  const selectedBranch = useMemo(() => normalizeBranch(branch ?? user?.branch), [branch, user?.branch]);
  const isSingleBranchRestaurant = Boolean(selectedBranch?.isOnlyBranch);
  const selectedOrderType = getSelectedOrderType(user) ?? selectedBranch?.selectedOrderType ?? null;
  const selectedOrderLabel = selectedOrderType === "TAKEAWAY" ? "Pickup" : selectedOrderType === "DELIVERY" ? "Delivery" : "";
  const isSelectedBranchAvailable = selectedBranch ? isBranchCurrentlyAvailable(selectedBranch) : true;
  const orderPanelTitle = mode === "delivery"
    ? isSelectedBranchAvailable
      ? t("deliveryPanelTitle")
      : t("scheduleDeliveryPanelTitle")
    : mode === "pickup"
    ? isSelectedBranchAvailable
      ? t("pickupPanelTitle")
      : t("schedulePickupPanelTitle")
    : t("orderPanelTitle");
  const singleBranchPanelTitle = isSelectedBranchAvailable
    ? t("singleBranchPanelTitle")
    : t("singleBranchSchedulePanelTitle");
  const hasOrderTypeRules = Boolean(selectedBranch?.settings?.allowedOrderTypes?.length);
  const showDeliveryOption = !hasOrderTypeRules || (selectedBranch ? branchSupportsDelivery(selectedBranch) : false);
  const showPickupOption = !hasOrderTypeRules || (selectedBranch ? branchSupportsPickup(selectedBranch) : false);
  const availableModes = useMemo(
    () => [
      ...(showDeliveryOption ? ["delivery" as const] : []),
      ...(showPickupOption ? ["pickup" as const] : []),
    ],
    [showDeliveryOption, showPickupOption]
  );

  const filteredBranches = useMemo(
    () =>
      nearbyQuery.branches.filter((branch) =>
        mode === "pickup" ? branchSupportsPickup(branch) : branchSupportsDelivery(branch)
      ),
    [mode, nearbyQuery.branches]
  );

  useEffect(() => {
    if (!showResults) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) return;
      if (branchSearchRef.current?.contains(target)) return;

      setShowResults(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowResults(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showResults]);

  useEffect(() => {
    if (availableModes.length > 0 && !availableModes.includes(mode)) {
      setMode(availableModes[0]);
    }
  }, [availableModes, mode]);

  useEffect(() => {
    const storedMode = getStoredCheckoutTypePreference();

    if (!storedMode || !availableModes.includes(storedMode)) return;

    setMode(storedMode);
  }, [availableModes]);

  const handleModeChange = (nextMode: BranchSearchMode) => {
    setMode(nextMode);
    setStoredCheckoutTypePreference(nextMode);

    if (selectedBranch) {
      persistSelectedBranch({
        ...selectedBranch,
        settings: selectedBranch.settings ?? undefined,
      }, setUser, {
        orderType: checkoutTypeToOrderType(nextMode),
      });
    }
  };

  const handleFindNearbyBranches = () => {
    setShowResults(true);

    if (!coordinates) {
      requestLocation();
    }
  };

  const handleFindFood = () => {
    router.push("/items");
  };

  const handleUseCurrentLocation = () => {
    setShowResults(true);
    requestLocation();
  };

  const handleSelectSearchLocation = (nextCoordinates: { lat: number; lng: number }, label?: string) => {
    acceptCoordinates(nextCoordinates, label || "Selected address");
    setShowResults(true);
  };

  const handleSelectBranch = (branch: NearbyBranch) => {
    const orderType = getOrderType(mode);

    persistSelectedBranch(nearbyBranchToBranchRecord(branch), setUser, {
      orderType,
    });

    toast.success(`${branch.name} selected for ${mode === "pickup" ? "pickup" : "delivery"}.`);
    setShowResults(false);
  };

  return (
    <main className="relative flex min-h-[680px] w-full items-center overflow-hidden pb-12 pt-8 md:pb-16 md:pt-10 lg:min-h-[720px]">
      <div className="absolute inset-0 z-0">
        <Image
          src={resolvedHeroImage}
          alt={t("heroImageAlt")}
          fill
          className="object-cover"
          priority
          unoptimized={isRemoteHttpsImageUrl(resolvedHeroImage)}
        />
      </div>
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/70 via-black/38 to-black/12" />

      <div className="relative z-10 mx-auto grid w-full max-w-[1400px] items-center gap-10 px-4 sm:px-6 md:-translate-y-6 lg:grid-cols-[minmax(0,1fr)_520px] lg:-translate-y-8 lg:px-8">
        <div className="max-w-[720px] text-white">
          {/* Restaurant name intentionally hidden from the banner per design request. */}

          <h1 className="max-w-[680px] text-[46px] font-black leading-[0.95] tracking-normal text-white sm:text-[62px] lg:text-[76px]">
            {title || t("deliveryTitle")}
          </h1>

          <p className="mt-6 max-w-[560px] text-lg font-medium leading-8 text-white/86">
            {description || t("description")}
          </p>

          <div className="mt-6 grid max-w-[680px] gap-2.5 sm:grid-cols-3">
            <div className="rounded-[18px] bg-white/13 p-3 ring-1 ring-white/18 backdrop-blur">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-primary">
                <Clock3 size={16} />
              </div>
              <p className="text-sm font-bold text-white">{t("freshTitle")}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/72">{t("freshDescription")}</p>
            </div>

            <div className="rounded-[18px] bg-white/13 p-3 ring-1 ring-white/18 backdrop-blur">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-primary">
                <MapPinned size={16} />
              </div>
              <p className="text-sm font-bold text-white">{t("trackingTitle")}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/72">{t("trackingDescription")}</p>
            </div>

            <div className="rounded-[18px] bg-white/13 p-3 ring-1 ring-white/18 backdrop-blur">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-primary">
                <BadgePercent size={16} />
              </div>
              <p className="text-sm font-bold text-white">{t("offersTitle")}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/72">{t("offersDescription")}</p>
            </div>
          </div>
        </div>

        <div className="w-full rounded-[30px] bg-white p-5 shadow-[0_24px_80px_rgba(17,24,39,0.22)] ring-1 ring-black/5 md:p-7">
          <div className="mb-5">
            <h2 className="text-2xl font-black tracking-normal text-[#171717]">
              {isSingleBranchRestaurant ? singleBranchPanelTitle : orderPanelTitle}
            </h2>
          </div>

          {availableModes.length > 0 ? (
            <div className="mb-6 grid grid-cols-2 rounded-2xl bg-[#F5F5F5] p-1">
              {availableModes.map((nextMode) => (
                <button
                  key={nextMode}
                  type="button"
                  onClick={() => handleModeChange(nextMode)}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    mode === nextMode
                      ? "bg-primary text-white shadow-sm"
                      : "text-[#757575] hover:bg-white"
                  }`}
                >
                  {nextMode === "delivery" ? <Truck size={17} /> : <ShoppingBag size={17} />}
                  {nextMode === "delivery" ? "Delivery" : "Pickup"}
                </button>
              ))}
            </div>
          ) : null}

          {selectedBranch ? (
            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-primary/15 bg-primary/5 p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary">
                  <Store size={18} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#111827]">
                    {selectedBranch.name}
                  </p>
                  <p className="mt-1 text-xs text-[#6B7280]">
                    {[formatBranchDistance(selectedBranch.distanceKm), selectedOrderLabel].filter(Boolean).join(" - ") || "Selected branch"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={isSingleBranchRestaurant ? handleFindFood : handleFindNearbyBranches}
                className="h-10 rounded-xl border border-primary/20 bg-white px-4 text-sm font-semibold text-primary transition hover:bg-primary/5"
              >
                {isSingleBranchRestaurant ? t("findFood") : "Change"}
              </button>
            </div>
          ) : null}

          {isSingleBranchRestaurant ? null : (
          <div ref={branchSearchRef} className="relative">
            <AddressLocationPicker
              coordinates={coordinates}
              locationLabel={locationLabel}
              onSelectLocation={handleSelectSearchLocation}
              onUseCurrentLocation={handleUseCurrentLocation}
              isLocating={permissionState === "requesting"}
              showSelectedLabel={false}
              actionsBelow
              trailingAction={
                <button
                  type="button"
                  onClick={handleFindFood}
                  className="inline-flex h-[49px] min-w-0 items-center justify-center whitespace-nowrap rounded-xl border border-primary/20 bg-white px-2.5 text-xs font-semibold text-primary transition hover:bg-primary/5 sm:px-4 sm:text-sm"
                >
                  {t("findFood")}
                </button>
              }
            />

            {showResults ? (
              <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_18px_45px_rgba(0,0,0,0.14)]">
                {errorMessage ? (
                  <div className="px-5 py-6 text-sm text-gray-600">
                    {errorMessage || "Location is unavailable. Please choose a branch from the branch selector."}
                  </div>
                ) : nearbyQuery.isFetching ? (
                  <div className="flex items-center justify-center gap-2 px-5 py-8 text-sm text-gray-500">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                    Finding nearby branches...
                  </div>
                ) : filteredBranches.length === 0 && coordinates ? (
                  <div className="px-5 py-8 text-center text-sm text-gray-500">
                    No nearby {mode === "pickup" ? "pickup" : "delivery"} branches found.
                  </div>
                ) : (
                  <div className="max-h-[min(320px,36vh)] divide-y divide-gray-100 overflow-y-auto">
                    {filteredBranches.map((branch) => {
                      const available = isBranchCurrentlyAvailable(branch);

                      return (
                        <button
                          key={branch.id}
                          type="button"
                          onClick={() => handleSelectBranch(branch)}
                          className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition hover:bg-orange-50/50"
                        >
                          <div className="min-w-0">
                            <h4 className="truncate text-sm font-semibold text-gray-900">
                              {branch.name}
                            </h4>
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                              {formatBranchAddress(branch)}
                            </p>
                            <p className="mt-2 text-xs font-semibold text-primary">
                              {[formatBranchDistance(branch.distanceKm), available ? "Available" : branch.availability?.reason || "Availability limited"]
                                .filter(Boolean)
                                .join(" - ")}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            Select
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}
          </div>
          )}
        </div>
      </div>
    </main>
  );
};
