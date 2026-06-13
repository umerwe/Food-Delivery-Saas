"use client"

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { setStoredCheckoutTypePreference } from "@/lib/checkout-type-preference";

export default function CheckoutTabs({
    activeTab,
    canShowDelivery = true,
    canShowPickup = true,
}: {
    activeTab: string;
    canShowDelivery?: boolean;
    canShowPickup?: boolean;
}) {
    const t = useTranslations("checkout");
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleTabChange = (type: 'delivery' | 'pickup') => {
        setStoredCheckoutTypePreference(type);
        const params = new URLSearchParams(searchParams.toString());
        params.set('type', type);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="flex justify-start mb-[88px]">
            <div className="bg-[#F3F3F3] p-1 rounded-full flex w-full max-w-[428px]">
                {canShowDelivery ? (
                    <button
                        onClick={() => handleTabChange('delivery')}
                        className={cn(
                            "flex-1 py-3 px-6 rounded-full font-medium text-base transition-all",
                            activeTab === 'delivery'
                                ? "bg-primary text-white shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        {t("delivery")}
                    </button>
                ) : null}
                {canShowPickup ? (
                    <button
                        onClick={() => handleTabChange('pickup')}
                        className={cn(
                            "flex-1 py-3 px-6 rounded-full font-medium text-base transition-all",
                            activeTab === 'pickup'
                                ? "bg-primary text-white shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        {t("pickup")}
                    </button>
                ) : null}
            </div>
        </div>
    );
}
