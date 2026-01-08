"use client"

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ProfileTabs({ activeTab }: { activeTab: string }) {
  const router = useRouter();
  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "payment-method", label: "Payment Method" },
    { id: "history", label: "History" },
  ];

  const handleTabChange = (tabId: string) => {
    router.push(`/profile?tab=${tabId}`, { scroll: false });
  };

  return (
    <div className="flex justify-center">
      <div className="bg-[#EFEFEF] p-1 rounded-full flex w-full max-w-[760px]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "flex-1 py-3 px-6 rounded-full font-medium text-base transition-all duration-200",
              activeTab === tab.id
                ? "bg-primary text-white shadow-md"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}