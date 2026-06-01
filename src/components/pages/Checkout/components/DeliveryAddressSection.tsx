"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import useCheckout from "@/hooks/useCheckout";
import { useAuth } from "@/hooks/useAuth";

type AddressRecord = { id: string; street?: string; area?: string; city?: string; state?: string; country?: string };

interface Props {
  selectedAddress: string | null;
  setSelectedAddress: (value: string) => void;
}

export default function DeliveryAddressSection({
  selectedAddress,
  setSelectedAddress,
}: Props) {
  const { token } = useAuth();
  const { get } = useCheckout(token);

  const [addresses, setAddresses] = useState<AddressRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, [token]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await get("/v1/addresses");

      if (!res) return;

      setAddresses(Array.isArray(res.data) ? res.data as AddressRecord[] : []);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <MapPin className="text-primary" size={28} />
        <h2 className="text-[24px] font-semibold text-gray-900">
          Delivery address
        </h2>
      </div>

      {/* STATES */}
      {loading ? (
        <p className="text-gray-500">Loading addresses...</p>
      ) : addresses.length === 0 ? (
        <p className="text-gray-400">No addresses found</p>
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
