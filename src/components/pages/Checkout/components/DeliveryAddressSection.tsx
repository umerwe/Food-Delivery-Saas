"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, MapPin, Navigation, Plus } from "lucide-react";
import { AddressModal } from "@/components/forms/AddressModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHorizontalDragScroll } from "@/components/pages/Checkout/hooks/use-horizontal-drag-scroll";
import { useCheckout } from "@/hooks/useCheckout";
import { useAuth } from "@/hooks/useAuth";
import { formatDisplayAddress } from "@/lib/address-display";
import { parseReverseGeocodeAddress, reverseGeocode } from "@/services/geocoding";
import {
  fetchAddresses as fetchProfileAddresses,
  type AddressRecord,
} from "@/services/profile";
import type { CheckoutAddressValues } from "@/validations/checkout";
import { useTranslations } from "next-intl";

interface Props {
  selectedAddress: string | null;
  setSelectedAddress: (value: string) => void;
  isGuest?: boolean;
  guestDeliveryAddress: CheckoutAddressValues;
  setGuestDeliveryAddress: (value: CheckoutAddressValues) => void;
}

export function DeliveryAddressSection({
  selectedAddress,
  setSelectedAddress,
  isGuest = false,
  guestDeliveryAddress,
  setGuestDeliveryAddress,
}: Props) {
  const t = useTranslations("checkout");
  const addressT = useTranslations("addresses");
  const { token } = useAuth();
  const { get } = useCheckout(token);

  const [addresses, setAddresses] = useState<AddressRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const {
    railRef: addressRailRef,
    canScrollLeft,
    canScrollRight,
    updateScrollState,
    dragScrollHandlers,
  } = useHorizontalDragScroll<HTMLDivElement>();

  const updateGuestAddressField = (field: keyof CheckoutAddressValues, value: string) => {
    setGuestDeliveryAddress({
      ...guestDeliveryAddress,
      [field]: value,
    });
  };

  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const addressList = await fetchProfileAddresses({ get });

      setAddresses(addressList);
      if (!selectedAddress) {
        const defaultAddress = addressList.find((item) => item.isDefault);

        if (defaultAddress) {
          setSelectedAddress(defaultAddress.id);
        }
      }

      return addressList;
    } catch (err) {
      return [];
    } finally {
      setLoading(false);
    }
  }, [get, selectedAddress, setSelectedAddress]);

  useEffect(() => {
    if (isGuest) return;

    void fetchAddresses();
  }, [fetchAddresses, isGuest]);

  useEffect(() => {
    requestAnimationFrame(updateScrollState);
  }, [addresses.length, updateScrollState]);

  const handleGetCurrentLocation = async () => {
    if (!navigator.geolocation) {
      return;
    }

    try {
      setLocating(true);

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const lat = position.coords.latitude.toString();
      const lng = position.coords.longitude.toString();
      const geocode = await reverseGeocode(position.coords.latitude, position.coords.longitude);

      const parsedAddress = geocode.ok
        ? parseReverseGeocodeAddress(geocode.address || {}, geocode.displayName)
        : null;

      setGuestDeliveryAddress({
        ...guestDeliveryAddress,
        street: parsedAddress?.street || guestDeliveryAddress.street,
        houseNumber: parsedAddress?.houseNumber || guestDeliveryAddress.houseNumber,
        area:
          parsedAddress?.houseNumber ||
          parsedAddress?.area ||
          guestDeliveryAddress.area,
        city: parsedAddress?.city || guestDeliveryAddress.city,
        state: parsedAddress?.state || guestDeliveryAddress.state,
        postalCode: parsedAddress?.postalCode || guestDeliveryAddress.postalCode,
        country: parsedAddress?.country || guestDeliveryAddress.country,
        lat,
        lng,
      });
    } catch (err) {
    } finally {
      setLocating(false);
    }
  };

  const handleAddressCreated = async (address?: { id?: string | number }) => {
    const previousAddressIds = new Set(addresses.map((item) => item.id));
    const addressList = await fetchAddresses();
    const savedAddressId = address?.id ? String(address.id) : "";
    const newAddress =
      addressList.find((item) => item.id === savedAddressId) ||
      addressList.find((item) => !previousAddressIds.has(item.id));

    if (newAddress) {
      setSelectedAddress(newAddress.id);
    }
  };

  const scrollAddressPage = (direction: "left" | "right") => {
    const rail = addressRailRef.current;

    if (!rail) return;

    rail.scrollBy({
      left: direction === "left" ? -rail.clientWidth : rail.clientWidth,
      behavior: "smooth",
    });
    window.setTimeout(updateScrollState, 220);
  };

  if (isGuest) {
    return (
      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="text-primary" size={28} />
            <div>
              <h2 className="text-[24px] font-semibold text-gray-900">
                {t("guestDeliveryAddress")}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {t("guestDeliveryAddressDescription")}
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={locating}
            className="h-9 rounded-full border border-primary/15 bg-primary/5 px-3.5 text-[13px] font-semibold text-primary shadow-none hover:border-primary/30 hover:bg-primary/10"
          >
            {locating ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Navigation className="mr-1.5 h-3.5 w-3.5" />
            )}
            {locating ? t("gettingLocation") : t("useCurrentLocation")}
          </Button>
        </div>

        <div className="rounded-[22px] border border-gray-100 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">{t("street")}</label>
              <Input
                value={guestDeliveryAddress.street}
                onChange={(event) => updateGuestAddressField("street", event.target.value)}
                placeholder={t("streetPlaceholder")}
                className="h-12 rounded-xl border-gray-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">{addressT("houseNumber")}</label>
              <Input
                value={guestDeliveryAddress.houseNumber}
                onChange={(event) => updateGuestAddressField("houseNumber", event.target.value)}
                placeholder={addressT("houseNumberPlaceholder")}
                className="h-12 rounded-xl border-gray-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">{t("postalCode")}</label>
              <Input
                value={guestDeliveryAddress.postalCode}
                onChange={(event) => updateGuestAddressField("postalCode", event.target.value)}
                placeholder={t("postalCodePlaceholder")}
                className="h-12 rounded-xl border-gray-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">{t("city")}</label>
              <Input
                value={guestDeliveryAddress.city}
                onChange={(event) => updateGuestAddressField("city", event.target.value)}
                placeholder={t("cityPlaceholder")}
                className="h-12 rounded-xl border-gray-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">{t("state")}</label>
              <Input
                value={guestDeliveryAddress.state}
                onChange={(event) => updateGuestAddressField("state", event.target.value)}
                placeholder={t("statePlaceholder")}
                className="h-12 rounded-xl border-gray-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">{t("country")}</label>
              <Input
                value={guestDeliveryAddress.country}
                onChange={(event) => updateGuestAddressField("country", event.target.value)}
                placeholder={t("countryPlaceholder")}
                className="h-12 rounded-xl border-gray-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{t("latitude")}</label>
                <Input
                  value={guestDeliveryAddress.lat}
                  onChange={(event) => updateGuestAddressField("lat", event.target.value)}
                  placeholder={t("latitude")}
                  className="h-12 rounded-xl border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{t("longitude")}</label>
                <Input
                  value={guestDeliveryAddress.lng}
                  onChange={(event) => updateGuestAddressField("lng", event.target.value)}
                  placeholder={t("longitude")}
                  className="h-12 rounded-xl border-gray-200"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <AddressModal
        open={addressModalOpen}
        onOpenChange={setAddressModalOpen}
        onSuccess={handleAddressCreated}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[24px] font-semibold text-gray-900">
          Where should we deliver?
        </h2>

        <Button
          type="button"
          onClick={() => setAddressModalOpen(true)}
          className="h-9 rounded-[12px] border border-primary/10 bg-primary/5 px-4 text-[13px] font-bold text-primary shadow-none hover:border-primary/30 hover:bg-primary/10"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5 stroke-[3]" />
          {addressT("addNewAddress")}
        </Button>
      </div>

      {/* STATES */}
      {loading ? (
        <p className="text-gray-500">{t("loadingAddresses")}</p>
      ) : addresses.length === 0 ? (
        <p className="text-gray-400">{t("noAddressesFound")}</p>
      ) : (
        <div className="grid grid-cols-[56px_minmax(0,1fr)_56px] items-center gap-4 overflow-visible pt-1">
          <div className="flex justify-start">
            {canScrollLeft ? (
              <button
                type="button"
                aria-label="Previous delivery addresses"
                onClick={() => scrollAddressPage("left")}
                className="flex size-11 items-center justify-center rounded-[12px] bg-white text-gray-900 shadow-[0_12px_30px_rgba(15,23,42,0.14)] transition hover:-translate-y-0.5 hover:text-primary"
              >
                <ChevronLeft size={22} strokeWidth={2.5} />
              </button>
            ) : null}
          </div>
          <div className="min-w-0 overflow-visible py-1">
            <div className="-mx-8 overflow-visible px-8 py-7 sm:-mx-10 sm:px-10">
            <div
              ref={addressRailRef}
              role="listbox"
              aria-label="Saved delivery addresses"
              tabIndex={0}
              {...dragScrollHandlers}
              className="grid auto-cols-[calc((100%_-_1.25rem)/2)] grid-flow-col grid-rows-1 gap-5 overflow-x-auto scroll-smooth px-4 pb-10 pt-5 [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
            >

          {addresses.map((addr) => {
            const isSelected = selectedAddress === addr.id;
            const addressLabel = formatDisplayAddress(addr);
            const addressTitle = addr.houseNumber || addr.area || addr.city || addressT("deliveryAddress");

            return (
              <button
                key={addr.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => setSelectedAddress(addr.id)}
                className={`min-h-[124px] w-full snap-start rounded-[18px] border p-6 text-left shadow-[0_20px_48px_rgba(15,23,42,0.13)] transition-all duration-200
                  ${
                    isSelected
                      ? "border-primary bg-primary text-white shadow-[0_22px_52px_rgba(211,18,26,0.30)] hover:-translate-y-0.5"
                      : "border-gray-100 bg-white text-gray-900 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_24px_56px_rgba(15,23,42,0.16)]"
                  }
                `}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    {isSelected ? (
                      <span className="flex items-center gap-2 text-sm font-bold text-white">
                        <span className="flex size-6 items-center justify-center rounded-full border-2 border-white/80">
                          <MapPin size={13} strokeWidth={3} />
                        </span>
                        {addressTitle}
                      </span>
                    ) : null}
                    {addr.isDefault ? (
                      <span
                        className={`ml-auto rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          isSelected
                            ? "bg-white/15 text-white"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {addressT("defaultAddress")}
                      </span>
                    ) : null}
                  </div>

                  <p
                    className={`line-clamp-3 text-sm font-semibold leading-relaxed ${
                      isSelected ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {addressLabel}
                  </p>
                </div>
              </button>
            );
          })}
            </div>
            </div>
          </div>
          <div className="flex justify-end">
          {canScrollRight ? (
            <button
              type="button"
              aria-label="Next delivery addresses"
              onClick={() => scrollAddressPage("right")}
              className="flex size-11 items-center justify-center rounded-[12px] bg-white text-gray-900 shadow-[0_12px_30px_rgba(15,23,42,0.14)] transition hover:-translate-y-0.5 hover:text-primary"
            >
              <ChevronRight size={22} strokeWidth={2.5} />
            </button>
          ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
