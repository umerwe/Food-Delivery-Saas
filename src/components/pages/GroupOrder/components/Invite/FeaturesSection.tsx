"use client";

import { Wallet, Clock, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export default function FeaturesSection() {
  const t = useTranslations("groupOrder.invite.features");
  const features = [
    {
      icon: Wallet,
      title: t("smartSplitTitle"),
      description: t("smartSplitDescription"),
    },
    {
      icon: Clock,
      title: t("singleDeliveryTitle"),
      description: t("singleDeliveryDescription"),
    },
    {
      icon: MessageCircle,
      title: t("groupChatTitle"),
      description: t("groupChatDescription"),
    },
  ];

  return (
    <section className="w-full bg-[#f4f4f4] py-16 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">

        {features.map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              key={index}
              className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-sm hover:shadow-md transition"
            >
              {/* ICON */}
              <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 mb-4">
                <Icon className="w-5 h-5 text-[#005F7B]" />
              </div>
              <h3 className="text-md font-medium text-gray-900">
                {item.title}
              </h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                {item.description}
              </p>
            </div>
          );
        })}

      </div>
    </section>
  );
}
