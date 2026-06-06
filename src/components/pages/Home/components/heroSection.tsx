"use client";

import Image from "next/image";
import { Store } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { useAuthContext } from "@/hooks/useAuth";
import { useNearbyBranches } from "@/hooks/useBranches";
import { useUserLocation } from "@/hooks/useUserLocation";
import { AddressLocationPicker } from "@/components/common/branch-selector/AddressLocationPicker";
import {
  branchSupportsDelivery,
  branchSupportsPickup,
  formatBranchAddress,
  formatBranchDistance,
  isBranchCurrentlyAvailable,
  nearbyBranchToBranchRecord,
  persistSelectedBranch,
} from "@/lib/branch-selector";
import { resolveHttpsImageUrl } from "@/lib/image-fallback";
import type { BranchOrderType, NearbyBranch } from "@/types/branches";

type HeroSectionProps = {
  restaurantName?: string;
  tagline?: string;
  heroImage?: string | null;
};

type BranchSearchMode = "delivery" | "pickup";

const getOrderType = (mode: BranchSearchMode): BranchOrderType =>
  mode === "pickup" ? "TAKEAWAY" : "DELIVERY";

const HeroSection = ({
  restaurantName,
  tagline,
  heroImage = "/hero.png",
}: HeroSectionProps) => {
  const t = useTranslations("home.hero");
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

  const displayRestaurantName = restaurantName || t("defaultTitle");
  const displayTagline = tagline || t("defaultTagline");
  const selectedBranch = user?.branch ?? null;
  const selectedOrderType = user?.selectedOrderType ?? selectedBranch?.selectedOrderType ?? null;
  const selectedOrderLabel = selectedOrderType === "TAKEAWAY" ? "Pickup" : selectedOrderType === "DELIVERY" ? "Delivery" : "";

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

  const handleFindNearbyBranches = () => {
    setShowResults(true);

    if (!coordinates) {
      requestLocation();
    }
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
    <main className="relative flex min-h-[630px] w-full items-center justify-center py-10 md:py-16">
      <div className="absolute inset-0 z-0">
        <Image
          src={resolvedHeroImage}
          alt={t("heroImageAlt")}
          fill
          className="object-cover brightness-75"
          priority
        />
      </div>

      <div className="relative z-10 ml-0 flex w-full max-w-4xl flex-col items-center px-4 md:ml-20">
        <h1 className="mb-2 text-5xl font-extrabold text-white drop-shadow-md md:text-7xl">
          {displayRestaurantName}
        </h1>
        <p className="mb-8 text-[22px] font-medium text-white">
          {displayTagline}
        </p>

        <div className="w-full rounded-2xl bg-white p-6 shadow-xl md:p-8">
          <div className="mb-6 inline-flex rounded-xl bg-[#F5F5F5] p-1">
            {(["delivery", "pickup"] as const).map((nextMode) => (
              <button
                key={nextMode}
                type="button"
                onClick={() => setMode(nextMode)}
                className={`min-w-[116px] rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  mode === nextMode
                    ? "bg-primary text-white shadow-sm"
                    : "text-[#757575] hover:bg-white"
                }`}
              >
                {nextMode === "delivery" ? "Delivery" : "Pickup"}
              </button>
            ))}
          </div>

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
                onClick={handleFindNearbyBranches}
                className="h-10 rounded-xl border border-primary/20 bg-white px-4 text-sm font-semibold text-primary transition hover:bg-primary/5"
              >
                Change
              </button>
            </div>
          ) : null}

          <div ref={branchSearchRef} className="relative">
            <AddressLocationPicker
              coordinates={coordinates}
              locationLabel={locationLabel}
              onSelectLocation={handleSelectSearchLocation}
              onUseCurrentLocation={handleUseCurrentLocation}
              isLocating={permissionState === "requesting"}
            />

            {mode === "delivery" ? (
              <p className="mt-3 text-xs text-[#8A8A8A]">
                Delivery coverage is confirmed at checkout based on your address.
              </p>
            ) : null}

            {showResults ? (
              <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_18px_45px_rgba(0,0,0,0.14)]">
                {permissionState === "denied" || permissionState === "unsupported" ? (
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
        </div>
      </div>
    </main>
  );
};

export default HeroSection;
