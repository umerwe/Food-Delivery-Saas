"use client";

import { useEffect, useState } from "react";
import { Loader2, MapPin, Navigation, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "sonner";
import useApi from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";

type AddressModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  editData?: any;
};

type AddressFormState = {
  street: string;
  city: string;
  state: string;
  country: string;
  area: string;
  lat: string;
  lng: string;
};

const initialForm: AddressFormState = {
  street: "",
  city: "",
  state: "",
  country: "",
  area: "",
  lat: "",
  lng: "",
};

export default function AddressModal({
  open,
  onOpenChange,
  onSuccess,
  editData,
}: AddressModalProps) {
  const { token } = useAuth();
  const { post, patch } = useApi(token);

  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [form, setForm] = useState<AddressFormState>(initialForm);

  useEffect(() => {
    if (!open) return;

    if (editData) {
      setForm({
        street: editData.street || "",
        city: editData.city || "",
        state: editData.state || "",
        country: editData.country || "",
        area: editData.area || "",
        lat: editData.lat ? String(editData.lat) : "",
        lng: editData.lng ? String(editData.lng) : "",
      });
    } else {
      setForm(initialForm);
    }
  }, [editData, open]);

  const handleChange = (field: keyof AddressFormState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGetCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported in this browser");
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

      setForm((prev) => ({
        ...prev,
        lat,
        lng,
      }));

      // Reverse geocoding using OpenStreetMap Nominatim
      // Good for quick integration, but for production use your own geocoding provider/keyed API.
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
      );

      if (!response.ok) {
        toast.success("Location fetched. Please complete address details manually.");
        return;
      }

      const data = await response.json();
      const address = data?.address || {};

      setForm((prev) => ({
        ...prev,
        street:
          data?.display_name ||
          prev.street ||
          "",
        area:
          address?.suburb ||
          address?.neighbourhood ||
          address?.quarter ||
          address?.village ||
          prev.area ||
          "",
        city:
          address?.city ||
          address?.town ||
          address?.village ||
          address?.municipality ||
          prev.city ||
          "",
        state: address?.state || prev.state || "",
        country: address?.country || prev.country || "",
        lat,
        lng,
      }));

      toast.success("Current location fetched successfully");
    } catch (error: any) {
      console.error("Location error:", error);

      if (error?.code === 1) {
        toast.error("Location permission denied");
      } else if (error?.code === 2) {
        toast.error("Unable to detect your location");
      } else if (error?.code === 3) {
        toast.error("Location request timed out");
      } else {
        toast.error("Failed to get current location");
      }
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.street.trim()) {
      toast.error("Street address is required");
      return;
    }

    if (!form.city.trim()) {
      toast.error("City is required");
      return;
    }

    if (!form.country.trim()) {
      toast.error("Country is required");
      return;
    }

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

      toast.success(editData ? "Address updated" : "Address added");
      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Something went wrong");
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
              {editData ? "Edit Address" : "Add New Address"}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[#7A7A7A]">
              {editData
                ? "Update your delivery destination details."
                : "Create a new delivery destination for your culinary journeys."}
            </DialogDescription>
          </DialogHeader>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-5 top-5 rounded-full p-2 text-[#8C8C8C] transition hover:bg-[#F5F5F5] hover:text-black"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>

          <div className="mt-6 space-y-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8A8A8A]">
                  Quick fill
                </p>
                <p className="mt-1 text-[13px] text-[#8A8A8A]">
                  Use your browser location to auto-fill the address.
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
                    Getting location...
                  </>
                ) : (
                  <>
                    <Navigation className="mr-2 h-4 w-4" />
                    Get Current Location
                  </>
                )}
              </Button>
            </div>

            <div className="h-px bg-[#ECECEC]" />

            {/* STREET */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8A8A8A]">
                Street Address
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A3A3A3]" />
                <Input
                  placeholder="123 Gastronomy Lane"
                  value={form.street}
                  onChange={(e) => handleChange("street", e.target.value)}
                  className="h-[56px] rounded-[16px] border-0 bg-[#F6F6F6] pl-11 pr-4 text-[15px] shadow-none focus-visible:ring-1 focus-visible:ring-[#D91F26]"
                />
              </div>
            </div>

            {/* AREA */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8A8A8A]">
                Area
              </label>
              <Input
                placeholder="Apartment, suite, unit, area"
                value={form.area}
                onChange={(e) => handleChange("area", e.target.value)}
                className="h-[56px] rounded-[16px] border-0 bg-[#F6F6F6] px-4 text-[15px] shadow-none focus-visible:ring-1 focus-visible:ring-[#D91F26]"
              />
            </div>

            {/* CITY / STATE */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.4fr_1fr]">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8A8A8A]">
                  City
                </label>
                <Input
                  placeholder="New York"
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  className="h-[56px] rounded-[16px] border-0 bg-[#F6F6F6] px-4 text-[15px] shadow-none focus-visible:ring-1 focus-visible:ring-[#D91F26]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8A8A8A]">
                  State
                </label>
                <Input
                  placeholder="NY"
                  value={form.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  className="h-[56px] rounded-[16px] border-0 bg-[#F6F6F6] px-4 text-[15px] shadow-none focus-visible:ring-1 focus-visible:ring-[#D91F26]"
                />
              </div>
            </div>

            {/* COUNTRY */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8A8A8A]">
                Country
              </label>
              <Input
                placeholder="United States"
                value={form.country}
                onChange={(e) => handleChange("country", e.target.value)}
                className="h-[56px] rounded-[16px] border-0 bg-[#F6F6F6] px-4 text-[15px] shadow-none focus-visible:ring-1 focus-visible:ring-[#D91F26]"
              />
            </div>

            {/* LAT / LNG */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8A8A8A]">
                  Latitude
                </label>
                <Input
                  placeholder="Latitude"
                  value={form.lat}
                  onChange={(e) => handleChange("lat", e.target.value)}
                  className="h-[56px] rounded-[16px] border-0 bg-[#F6F6F6] px-4 text-[15px] shadow-none focus-visible:ring-1 focus-visible:ring-[#D91F26]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8A8A8A]">
                  Longitude
                </label>
                <Input
                  placeholder="Longitude"
                  value={form.lng}
                  onChange={(e) => handleChange("lng", e.target.value)}
                  className="h-[56px] rounded-[16px] border-0 bg-[#F6F6F6] px-4 text-[15px] shadow-none focus-visible:ring-1 focus-visible:ring-[#D91F26]"
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
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading || locating}
                className="h-[52px] min-w-[180px] rounded-full bg-[#D91F26] px-8 text-white shadow-[0_12px_30px_rgba(217,31,38,0.28)] hover:bg-[#c61b22]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editData ? (
                  "Update Address"
                ) : (
                  "Save Address"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}