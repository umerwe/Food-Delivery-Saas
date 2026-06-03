"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MapPin, Navigation, X } from "lucide-react";
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
import useCheckout from "@/hooks/useCheckout";
import { reverseGeocode } from "@/services/geocoding";
import { useAuth } from "@/hooks/useAuth";
import { createCheckoutAddressSchema, type CheckoutAddressValues } from "@/validations/checkout";
import { useTranslations } from "next-intl";

type AddressModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (address?: { id?: string | number }) => void;
  editData?: (Partial<CheckoutAddressValues> & { id?: string | number }) | null;
};

const initialForm: CheckoutAddressValues = {
  street: "",
  city: "",
  state: "",
  country: "",
  area: "",
  lat: "",
  lng: "",
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

export default function AddressModal({
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
        cityRequired: validationT("cityRequired"),
        countryRequired: validationT("countryRequired"),
      }),
    [validationT]
  );

  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const { register, reset, setValue, getValues, handleSubmit } = useForm<CheckoutAddressValues>({
    resolver: zodResolver(checkoutAddressSchema),
    defaultValues: initialForm,
  });

  useEffect(() => {
    if (!open) return;

    if (editData) {
      reset({
        street: editData.street || "",
        city: editData.city || "",
        state: editData.state || "",
        country: editData.country || "",
        area: editData.area || "",
        lat: editData.lat ? String(editData.lat) : "",
        lng: editData.lng ? String(editData.lng) : "",
      });
    } else {
      reset(initialForm);
    }
  }, [editData, open, reset]);

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

      setValue("lat", lat);
      setValue("lng", lng);

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
      setValue("street", data.displayName || currentValues.street || "");
      setValue(
        "area",
        getAddressValue(address.suburb) ||
          getAddressValue(address.neighbourhood) ||
          getAddressValue(address.quarter) ||
          getAddressValue(address.village) ||
          currentValues.area ||
          ""
      );
      setValue(
        "city",
        getAddressValue(address.city) ||
          getAddressValue(address.town) ||
          getAddressValue(address.village) ||
          getAddressValue(address.municipality) ||
          currentValues.city ||
          ""
      );
      setValue("state", getAddressValue(address.state) || currentValues.state || "");
      setValue("country", getAddressValue(address.country) || currentValues.country || "");
      setValue("lat", lat);
      setValue("lng", lng);

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

      const payload = {
        street: form.street.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim(),
        area: form.area.trim(),
        lat: form.lat.trim(),
        lng: form.lng.trim(),
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
    <Dialog open={open} onOpenChange={onOpenChange} >
      <DialogContent className="w-[95vw] max-w-[760px] rounded-[28px] border-0 p-0 overflow-hidden bg-white max-h-[95vh] overflow-auto" showCloseButton={false}>
        <div className="h-[4px] w-full bg-[#D91F26]" />

        <div className="px-5 py-5 md:px-8 md:py-8">
          <DialogHeader className="space-y-1 pr-8">
            <DialogTitle className="text-[28px] font-bold leading-tight text-[#171717]">
              {editData ? t("editAddress") : t("addNewAddress")}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[#7A7A7A]">
              {editData
                ? t("editDescription")
                : t("addDescription")}
            </DialogDescription>
          </DialogHeader>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-5 top-5 rounded-full p-2 text-[#8C8C8C] transition hover:bg-[#F5F5F5] hover:text-black"
            aria-label={t("closeModal")}
          >
            <X size={18} />
          </button>

          <form noValidate className="mt-6 space-y-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className={LABEL_TEXT_CLASS}>
                  {t("quickFill")}
                </p>
                <p className="mt-1 text-[13px] text-[#8A8A8A]">
                  {t("quickFillDescription")}
                </p>
              </div>

              <Button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={locating}
                className="h-[44px] rounded-full bg-[#111111] px-5 text-white hover:bg-[#222222]"
              >
                {locating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("gettingLocation")}
                  </>
                ) : (
                  <>
                    <Navigation className="mr-2 h-4 w-4" />
                    {t("getCurrentLocation")}
                  </>
                )}
              </Button>
            </div>

            <div className="h-px bg-[#ECECEC]" />

            {/* STREET */}
            <div className="space-y-2">
              <label className={LABEL_TEXT_CLASS}>
                {t("streetAddress")}
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A3A3A3]" />
                <Input
                  placeholder={t("streetPlaceholder")}
                  {...register("street")}
                  className="h-[56px] rounded-[16px] border-0 bg-[#F6F6F6] pl-11 pr-4 text-[15px] shadow-none focus-visible:ring-1 focus-visible:ring-[#D91F26]"
                />
              </div>
            </div>

            {/* AREA */}
            <div className="space-y-2">
              <label className={LABEL_TEXT_CLASS}>
                {t("area")}
              </label>
              <Input
                placeholder={t("areaPlaceholder")}
                {...register("area")}
                className={INPUT_BASE_CLASS}
              />
            </div>

            {/* CITY / STATE */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.4fr_1fr]">
              <div className="space-y-2">
                <label className={LABEL_TEXT_CLASS}>
                  {t("city")}
                </label>
                <Input
                  placeholder={t("cityPlaceholder")}
                  {...register("city")}
                  className={INPUT_BASE_CLASS}
                />
              </div>

              <div className="space-y-2">
                <label className={LABEL_TEXT_CLASS}>
                  {t("state")}
                </label>
                <Input
                  placeholder={t("statePlaceholder")}
                  {...register("state")}
                  className={INPUT_BASE_CLASS}
                />
              </div>
            </div>

            {/* COUNTRY */}
            <div className="space-y-2">
              <label className={LABEL_TEXT_CLASS}>
                {t("country")}
              </label>
              <Input
                placeholder={t("countryPlaceholder")}
                {...register("country")}
                className={INPUT_BASE_CLASS}
              />
            </div>

            {/* LAT / LNG */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className={LABEL_TEXT_CLASS}>
                  {t("latitude")}
                </label>
                <Input
                  placeholder={t("latitude")}
                  {...register("lat")}
                  className={INPUT_BASE_CLASS}
                />
              </div>

              <div className="space-y-2">
                <label className={LABEL_TEXT_CLASS}>
                  {t("longitude")}
                </label>
                <Input
                  placeholder={t("longitude")}
                  {...register("lng")}
                  className={INPUT_BASE_CLASS}
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[#ECECEC] pt-6 sm:flex-row sm:items-center sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="h-[52px] rounded-full px-6 text-[#4B4B4B] hover:bg-[#F4F4F4]"
              >
                {commonT("cancel")}
              </Button>

              <Button
                type="button"
                onClick={handleSubmit(submitAddress)}
                disabled={loading || locating}
                className="h-[52px] min-w-[180px] rounded-full bg-[#D91F26] px-8 text-white shadow-[0_12px_30px_rgba(217,31,38,0.28)] hover:bg-[#c61b22]"
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
