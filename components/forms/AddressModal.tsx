"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "sonner";
import useApi from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";

export default function AddressModal({
  open,
  onOpenChange,
  onSuccess,
  editData,
}: any) {
  const { token } = useAuth();
  const { post, patch } = useApi(token);

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    street: "",
    city: "",
    state: "",
    country: "",
    area: "",
    lat: "",
    lng: "",
  });

  useEffect(() => {
    if (editData) {
      setForm({
        street: editData.street || "",
        city: editData.city || "",
        state: editData.state || "",
        country: editData.country || "",
        area: editData.area || "",
        lat: editData.lat || "",
        lng: editData.lng || "",
      });
    } else {
      setForm({
        street: "",
        city: "",
        state: "",
        country: "",
        area: "",
        lat: "",
        lng: "",
      });
    }
  }, [editData]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (editData) {
        await patch(`/v1/addresses/${editData.id}`, form);
        toast.success("Address updated");
      } else {
        await post("/v1/addresses", form);
        toast.success("Address added");
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl p-6">

        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {editData ? "Edit Address" : "Add New Address"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-4">

          {/* STREET */}
          <Input
            placeholder="Street Address"
            value={form.street}
            onChange={(e) => handleChange("street", e.target.value)}
          />

          {/* AREA + CITY */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Area"
              value={form.area}
              onChange={(e) => handleChange("area", e.target.value)}
            />
            <Input
              placeholder="City"
              value={form.city}
              onChange={(e) => handleChange("city", e.target.value)}
            />
          </div>

          {/* STATE + COUNTRY */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="State"
              value={form.state}
              onChange={(e) => handleChange("state", e.target.value)}
            />
            <Input
              placeholder="Country"
              value={form.country}
              onChange={(e) => handleChange("country", e.target.value)}
            />
          </div>

          {/* LAT LNG */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Latitude"
              value={form.lat}
              onChange={(e) => handleChange("lat", e.target.value)}
            />
            <Input
              placeholder="Longitude"
              value={form.lng}
              onChange={(e) => handleChange("lng", e.target.value)}
            />
          </div>

          {/* ACTION BUTTON */}
          <Button
            className="w-full h-[48px] rounded-lg"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : editData
              ? "Update Address"
              : "Save Address"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}