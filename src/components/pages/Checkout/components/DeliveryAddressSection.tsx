"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MapPin, Navigation, Plus } from "lucide-react";
import { AddressModal } from "@/components/forms/AddressModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCheckout } from "@/hooks/useCheckout";
import { useAuth } from "@/hooks/useAuth";
import { formatDisplayAddress } from "@/lib/address-display";
import { reverseGeocode } from "@/services/geocoding";
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

      const address = geocode.ok ? geocode.address || {} : {};
      const getAddressValue = (value: unknown) => typeof value === "string" ? value : "";

      setGuestDeliveryAddress({
        ...guestDeliveryAddress,
        street: geocode.displayName || guestDeliveryAddress.street,
        houseNumber: guestDeliveryAddress.houseNumber,
        area:
          getAddressValue(address.suburb) ||
          getAddressValue(address.neighbourhood) ||
          getAddressValue(address.quarter) ||
          getAddressValue(address.village) ||
          guestDeliveryAddress.area,
        city:
          getAddressValue(address.city) ||
          getAddressValue(address.town) ||
          getAddressValue(address.village) ||
          getAddressValue(address.municipality) ||
          guestDeliveryAddress.city,
        state: getAddressValue(address.state) || guestDeliveryAddress.state,
        postalCode: getAddressValue(address.postcode) || guestDeliveryAddress.postalCode,
        country: getAddressValue(address.country) || guestDeliveryAddress.country,
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
            <div className="space-y-2 md:col-span-2">
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
    <section className="space-y-6">
      <AddressModal
        open={addressModalOpen}
        onOpenChange={setAddressModalOpen}
        onSuccess={handleAddressCreated}
      />

      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="text-primary" size={28} />
          <h2 className="text-[24px] font-semibold text-gray-900">
            {t("deliveryAddress")}
          </h2>
        </div>

        <Button
          type="button"
          onClick={() => setAddressModalOpen(true)}
          className="h-9 rounded-full border border-primary/15 bg-primary/5 px-3.5 text-[13px] font-semibold text-primary shadow-none hover:border-primary/30 hover:bg-primary/10"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          {addressT("addNewAddress")}
        </Button>
      </div>

      {/* STATES */}
      {loading ? (
        <p className="text-gray-500">{t("loadingAddresses")}</p>
      ) : addresses.length === 0 ? (
        <p className="text-gray-400">{t("noAddressesFound")}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px] md:gap-[30px]">

          {addresses.map((addr) => {
            const isSelected = selectedAddress === addr.id;

            return (
              <Card
                key={addr.id}
                onClick={() => setSelectedAddress(addr.id)}
                className={`rounded-[10px] p-5 md:p-6 cursor-pointer transition-all
                  ${
                    isSelected
                      ? "bg-primary text-white border-none hover:scale-[1.02]"
                      : "bg-white border-2 border-dashed border-primary text-gray-700 hover:border-primary"
                  }
                `}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <MapPin
                      size={28}
                      className={isSelected ? "" : "text-gray-400"}
                    />
                    {addr.isDefault ? (
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
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
                    className={`text-sm md:text-base font-medium leading-relaxed ${
                      isSelected ? "" : "text-gray-700"
                    }`}
                  >
                    {formatDisplayAddress(addr)}
                  </p>
                </div>
              </Card>
            );
          })}

        </div>
      )}
    </section>
  );
}
