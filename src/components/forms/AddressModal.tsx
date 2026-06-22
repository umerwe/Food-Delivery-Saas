"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, MapPin, MousePointer2, Navigation, PencilLine, X } from "lucide-react";
import { AddressLocationPicker } from "@/components/common/branch-selector/AddressLocationPicker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { INPUT_BASE_CLASS, LABEL_TEXT_CLASS } from "@/components/common/common-classes";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCheckout } from "@/hooks/useCheckout";
import { reverseGeocode } from "@/services/geocoding";
import { useAuth } from "@/hooks/useAuth";
import { createCheckoutAddressSchema, type CheckoutAddressValues } from "@/validations/checkout";
import type { GoogleAddressDetails, GoogleLatLngLiteral } from "@/types/google-maps";
import { useTranslations } from "next-intl";

type AddressModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (address?: { id?: string | number }) => void;
  editData?: (Partial<CheckoutAddressValues> & { id?: string | number }) | null;
};

const initialForm: CheckoutAddressValues = {
  street: "",
  houseNumber: "",
  postalCode: "",
  city: "",
  state: "",
  country: "",
  area: "",
  lat: "",
  lng: "",
  isDefault: false,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getSavedAddress = (value: unknown): { id?: string | number } | undefined => {
  if (isRecord(value) && isRecord(value.data)) {
    return {
      id:
        typeof value.data.id === "string" || typeof value.data.id === "number"
          ? value.data.id
          : undefined,
    };
  }

  if (isRecord(value)) {
    return {
      id: typeof value.id === "string" || typeof value.id === "number" ? value.id : undefined,
    };
  }

  return undefined;
};

export function AddressModal({
  open,
  onOpenChange,
  onSuccess,
  editData,
}: AddressModalProps) {
  const t = useTranslations("addresses");
  const commonT = useTranslations("common");
  const errorT = useTranslations("errors");
  const validationT = useTranslations("validation");
  const { token } = useAuth();
  const { post, patch } = useCheckout(token);
  const checkoutAddressSchema = useMemo(
    () =>
      createCheckoutAddressSchema({
        streetRequired: validationT("streetRequired"),
        postalCodeRequired: validationT("postalCodeRequired"),
        cityRequired: validationT("cityRequired"),
        stateRequired: validationT("stateRequired"),
        countryRequired: validationT("countryRequired"),
        latitudeRequired: validationT("latitudeRequired"),
        longitudeRequired: validationT("longitudeRequired"),
      }),
    [validationT]
  );

  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const { register, reset, setValue, getValues, handleSubmit, watch, formState: { errors } } = useForm<CheckoutAddressValues>({
    resolver: zodResolver(checkoutAddressSchema),
    defaultValues: initialForm,
  });
  const isDefaultSelected = watch("isDefault");
  const selectedStreet = watch("street");
  const selectedLat = watch("lat");
  const selectedLng = watch("lng");
  const selectedCoordinates = useMemo<GoogleLatLngLiteral | null>(() => {
    const lat = Number(selectedLat);
    const lng = Number(selectedLng);

    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }, [selectedLat, selectedLng]);

  useEffect(() => {
    if (!open) return;

    if (editData) {
      reset({
        street: editData.street || "",
        houseNumber: editData.houseNumber || editData.area || "",
        postalCode: editData.postalCode || "",
        city: editData.city || "",
        state: editData.state || "",
        country: editData.country || "",
        area: editData.houseNumber || editData.area || "",
        lat: editData.lat ? String(editData.lat) : "",
        lng: editData.lng ? String(editData.lng) : "",
        isDefault: Boolean(editData.isDefault),
      });
    } else {
      reset(initialForm);
    }
  }, [editData, open, reset]);

  const setAddressValue = useCallback(
    (field: keyof CheckoutAddressValues, value: string | boolean) => {
      setValue(field, value, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    },
    [setValue]
  );

  const handleLocationSelect = useCallback(
    (coordinates: GoogleLatLngLiteral, label?: string, details?: GoogleAddressDetails) => {
      setAddressValue("lat", String(coordinates.lat));
      setAddressValue("lng", String(coordinates.lng));

      const currentValues = getValues();
      const street = details?.street?.trim() || label?.trim() || "";
      const houseNumber = details?.houseNumber?.trim() || "";
      const postalCode = details?.postalCode?.trim() || "";
      const city = details?.city?.trim() || "";
      const state = details?.state?.trim() || "";
      const country = details?.country?.trim() || "";

      if (street) {
        setAddressValue("street", street);
      }

      if (houseNumber) {
        setAddressValue("houseNumber", houseNumber);
        setAddressValue("area", houseNumber);
      } else if (!currentValues.houseNumber && currentValues.area) {
        setAddressValue("houseNumber", currentValues.area);
      }

      if (postalCode) {
        setAddressValue("postalCode", postalCode);
      }

      if (city) {
        setAddressValue("city", city);
      }

      if (state) {
        setAddressValue("state", state);
      }

      if (country) {
        setAddressValue("country", country);
      }

      setLocationPickerOpen(false);
    },
    [getValues, setAddressValue]
  );

  const handleGetCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error(t("geolocationUnsupported"));
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

      setAddressValue("lat", lat);
      setAddressValue("lng", lng);

      // Reverse geocoding using OpenStreetMap Nominatim
      // Good for quick integration, but for production use your own geocoding provider/keyed API.
      const data = await reverseGeocode(position.coords.latitude, position.coords.longitude);

      if (!data.ok) {
        toast.success(t("locationFetchedManual"));
        return;
      }

      const address = data.address || {};
      const getAddressValue = (value: unknown) => typeof value === "string" ? value : "";

      const currentValues = getValues();
      setAddressValue("street", data.displayName || currentValues.street || "");
      setAddressValue(
        "area",
        getAddressValue(address.suburb) ||
          getAddressValue(address.neighbourhood) ||
          getAddressValue(address.quarter) ||
          getAddressValue(address.village) ||
          currentValues.area ||
          ""
      );
      setAddressValue("houseNumber", currentValues.houseNumber || currentValues.area || "");
      setAddressValue(
        "city",
        getAddressValue(address.city) ||
          getAddressValue(address.town) ||
          getAddressValue(address.village) ||
          getAddressValue(address.municipality) ||
          currentValues.city ||
          ""
      );
      setAddressValue("state", getAddressValue(address.state) || currentValues.state || "");
      setAddressValue("postalCode", getAddressValue(address.postcode) || currentValues.postalCode || "");
      setAddressValue("country", getAddressValue(address.country) || currentValues.country || "");
      setAddressValue("lat", lat);
      setAddressValue("lng", lng);
      setLocationPickerOpen(false);

      toast.success(t("locationFetched"));
    } catch (error) {

      const geolocationError = error instanceof GeolocationPositionError ? error : null;

      if (geolocationError?.code === 1) {
        toast.error(t("locationPermissionDenied"));
      } else if (geolocationError?.code === 2) {
        toast.error(t("unableDetectLocation"));
      } else if (geolocationError?.code === 3) {
        toast.error(t("locationTimedOut"));
      } else {
        toast.error(t("failedGetLocation"));
      }
    } finally {
      setLocating(false);
    }
  };

  const submitAddress = async (form: CheckoutAddressValues) => {

    try {
      setLoading(true);

      const houseNumber = form.houseNumber.trim();
      const payload = {
        street: form.street.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim(),
        houseNumber,
        area: houseNumber,
        postalCode: form.postalCode.trim() || undefined,
        lat: form.lat.trim(),
        lng: form.lng.trim(),
        isDefault: Boolean(form.isDefault),
      };

      const res = editData
        ? await patch(`/v1/addresses/${editData.id}`, payload)
        : await post("/v1/addresses", payload);

      if (res?.error) {
        throw new Error(res.error);
      }

      toast.success(editData ? t("addressUpdated") : t("addressAdded"));
      onSuccess?.(getSavedAddress(res));
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : errorT("somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`flex max-h-[92vh] w-[calc(100vw-24px)] flex-col gap-0 overflow-hidden rounded-[24px] border-0 bg-white p-0 shadow-2xl sm:w-[calc(100vw-48px)] ${
          locationPickerOpen ? "!max-w-[1120px]" : "!max-w-[760px]"
        }`}
        showCloseButton={false}
      >
        <div className="border-b border-gray-100 bg-gradient-to-br from-primary/10 via-white to-orange-50 px-5 py-5 sm:px-6">
          <DialogHeader className="pr-10 text-left">
            <div className="flex min-w-0 gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-primary text-white shadow-lg shadow-primary/25">
                <MapPin size={18} />
              </span>
              <div className="min-w-0">
                <div className="mb-2 inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-primary shadow-sm ring-1 ring-primary/10">
                  {t("deliveryAddress")}
                </div>
                <DialogTitle className="text-[22px] font-semibold leading-tight tracking-tight text-gray-950 sm:text-[26px]">
                  {editData ? t("editAddress") : t("addNewAddress")}
                </DialogTitle>
                <DialogDescription className="mt-2 max-w-[560px] text-sm leading-6 text-gray-600">
                  {editData ? t("editDescription") : t("addDescription")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-5 top-5 rounded-full p-2 text-gray-500 transition hover:bg-white/80 hover:text-gray-950 focus:outline-none focus:ring-2 focus:ring-primary/20"
            aria-label={t("closeModal")}
          >
            <X size={18} />
          </button>
        </div>

        <form noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8FAFC] px-5 py-5 sm:px-6">
            <div className={`grid gap-5 ${locationPickerOpen ? "xl:grid-cols-[minmax(0,1fr)_460px]" : ""}`}>
              <div className="space-y-5">
                <div className="rounded-[22px] border border-gray-100 bg-white p-2 shadow-sm">
                  <div className="grid gap-2 md:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setLocationPickerOpen(true)}
                    className={`flex min-h-[58px] items-center gap-3 rounded-[16px] px-3 py-2.5 text-left transition ${
                      locationPickerOpen
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "bg-transparent text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] ${
                        locationPickerOpen ? "bg-white/15 text-white" : "bg-primary/10 text-primary"
                      }`}
                    >
                      <MousePointer2 className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 text-sm font-semibold">
                      {t("pickFromMap")}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={locating}
                    className="flex min-h-[58px] items-center gap-3 rounded-[16px] px-3 py-2.5 text-left text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] bg-primary/10 text-primary">
                      {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0 text-sm font-semibold">
                      {locating ? t("gettingLocation") : t("getCurrentLocation")}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLocationPickerOpen(false)}
                    className={`flex min-h-[58px] items-center gap-3 rounded-[16px] px-3 py-2.5 text-left transition ${
                      !locationPickerOpen
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "bg-transparent text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] ${
                        !locationPickerOpen ? "bg-white/15 text-white" : "bg-primary/10 text-primary"
                      }`}
                    >
                      <PencilLine className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 text-sm font-semibold">
                      {t("typeManually")}
                    </span>
                  </button>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={isDefaultSelected}
                  onClick={() => {
                    setValue("isDefault", !isDefaultSelected, {
                      shouldDirty: true,
                      shouldTouch: true,
                    });
                  }}
                  className={`flex w-full items-center justify-between gap-4 rounded-[18px] border p-4 text-left shadow-sm transition ${
                    isDefaultSelected
                      ? "border-primary/25 bg-primary/5"
                      : "border-gray-100 bg-white hover:border-gray-200"
                  }`}
                >
                  <span>
                    <span className="block text-sm font-semibold text-gray-950">
                      {t("setAsDefault")}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-gray-500">
                      {t("setAsDefaultDescription")}
                    </span>
                  </span>
                  <span
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${
                      isDefaultSelected ? "bg-primary" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition ${
                        isDefaultSelected ? "translate-x-5" : "translate-x-0"
                      }`}
                    >
                      {isDefaultSelected ? (
                        <Check className="h-3.5 w-3.5 text-primary" />
                      ) : null}
                    </span>
                  </span>
                </button>

                <div className="rounded-[22px] border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className={LABEL_TEXT_CLASS}>
                          {t("streetAddress")}
                        </label>
                        <div className="relative">
                          <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <Input
                            placeholder={t("streetPlaceholder")}
                            {...register("street")}
                            className="h-[56px] rounded-[16px] border-0 bg-[#F6F6F6] pl-11 pr-4 text-[15px] shadow-none focus-visible:ring-1 focus-visible:ring-primary"
                          />
                        </div>
                        {errors.street?.message ? (
                          <p className="text-xs font-medium text-primary">{errors.street.message}</p>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <label className={LABEL_TEXT_CLASS}>
                          {t("houseNumber")}
                        </label>
                        <Input
                          placeholder={t("houseNumberPlaceholder")}
                          {...register("houseNumber")}
                          className={INPUT_BASE_CLASS}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className={LABEL_TEXT_CLASS}>
                          {t("postalCode")}
                        </label>
                        <Input
                          placeholder={t("postalCodePlaceholder")}
                          {...register("postalCode")}
                          className={INPUT_BASE_CLASS}
                        />
                        {errors.postalCode?.message ? (
                          <p className="text-xs font-medium text-primary">{errors.postalCode.message}</p>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <label className={LABEL_TEXT_CLASS}>
                          {t("city")}
                        </label>
                        <Input
                          placeholder={t("cityPlaceholder")}
                          {...register("city")}
                          className={INPUT_BASE_CLASS}
                        />
                        {errors.city?.message ? (
                          <p className="text-xs font-medium text-primary">{errors.city.message}</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className={LABEL_TEXT_CLASS}>
                          {t("state")}
                        </label>
                        <Input
                          placeholder={t("statePlaceholder")}
                          {...register("state")}
                          className={INPUT_BASE_CLASS}
                        />
                        {errors.state?.message ? (
                          <p className="text-xs font-medium text-primary">{errors.state.message}</p>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <label className={LABEL_TEXT_CLASS}>
                          {t("country")}
                        </label>
                        <Input
                          placeholder={t("countryPlaceholder")}
                          {...register("country")}
                          className={INPUT_BASE_CLASS}
                        />
                        {errors.country?.message ? (
                          <p className="text-xs font-medium text-primary">{errors.country.message}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                <input type="hidden" {...register("area")} />
                <input type="hidden" {...register("lat")} />
                <input type="hidden" {...register("lng")} />

                <div className="rounded-[18px] border border-gray-100 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-950">{t("mapLocation")}</p>
                      <p className="mt-1 text-xs leading-5 text-gray-500">
                        {selectedCoordinates
                          ? t("mapLocationSelected", {
                              lat: selectedCoordinates.lat.toFixed(5),
                              lng: selectedCoordinates.lng.toFixed(5),
                            })
                          : t("mapLocationDescription")}
                      </p>
                      {errors.lat?.message || errors.lng?.message ? (
                        <p className="mt-2 text-xs font-medium text-primary">
                          {errors.lat?.message || errors.lng?.message}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              {locationPickerOpen ? (
                <aside className="rounded-[22px] border border-gray-100 bg-white p-4 shadow-sm lg:sticky lg:top-0 lg:self-start">
                  <div className="mb-4 flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-primary text-white shadow-lg shadow-primary/25">
                      <MousePointer2 className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-950">{t("pickFromMap")}</p>
                      <p className="mt-1 text-xs leading-5 text-gray-500">{t("mapPickerDescription")}</p>
                    </div>
                  </div>

                  <AddressLocationPicker
                    coordinates={selectedCoordinates}
                    locationLabel={selectedStreet}
                    onSelectLocation={handleLocationSelect}
                    isLocating={locating}
                    compact={false}
                    showSelectedLabel
                    mapOpen
                    onMapOpenChange={setLocationPickerOpen}
                    showCurrentLocationAction={false}
                    showMapToggle={false}
                  />
                </aside>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-[44px] rounded-[14px] px-5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              {commonT("cancel")}
            </Button>

            <Button
              type="button"
              onClick={handleSubmit(submitAddress)}
              disabled={loading || locating}
              className="h-[44px] min-w-[170px] rounded-[14px] bg-primary px-6 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("saving")}
                </>
              ) : editData ? (
                t("updateAddress")
              ) : (
                t("saveAddress")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
