"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPin, Plus } from "lucide-react";
import AddressModal from "@/components/forms/AddressModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import useCheckout from "@/hooks/useCheckout";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchAddresses as fetchProfileAddresses,
  type AddressRecord,
} from "@/services/profile";
import { useTranslations } from "next-intl";

interface Props {
  selectedAddress: string | null;
  setSelectedAddress: (value: string) => void;
}

export default function DeliveryAddressSection({
  selectedAddress,
  setSelectedAddress,
}: Props) {
  const t = useTranslations("checkout");
  const addressT = useTranslations("addresses");
  const { token } = useAuth();
  const { get } = useCheckout(token);

  const [addresses, setAddresses] = useState<AddressRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const addressList = await fetchProfileAddresses({ get });

      setAddresses(addressList);

      return addressList;
    } catch (err) {
      return [];
    } finally {
      setLoading(false);
    }
  }, [get]);

  useEffect(() => {
    void fetchAddresses();
  }, [fetchAddresses]);

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
            const fullAddress = `${addr.street}, ${addr.area}, ${addr.city}, ${addr.state}, ${addr.country}`;

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
                  <MapPin
                    size={28}
                    className={isSelected ? "" : "text-gray-400"}
                  />

                  <p
                    className={`text-sm md:text-base font-medium leading-relaxed ${
                      isSelected ? "" : "text-gray-700"
                    }`}
                  >
                    {fullAddress}
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
