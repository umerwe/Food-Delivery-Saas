"use client";

import { Rocket, Eye, Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AboutTextCard } from "@/services/public-content";

type MissionVisionValuesProps = {
  items?: AboutTextCard[];
};

export default function MissionVisionValues({ items: dynamicItems }: MissionVisionValuesProps) {
  const t = useTranslations("about.missionVisionValues");

  const fallbackItems = [
  {
    title: t("missionTitle"),
    description: t("missionDescription"),
  },
  {
    title: t("visionTitle"),
    description: t("visionDescription"),
  },
  {
    title: t("valuesTitle"),
    description: t("valuesDescription"),
  },
];
  const icons = [Rocket, Eye, Heart];
  const styles = [
    { bg: "bg-[#FFD6CC]", iconColor: "text-[#FF5A2C]" },
    { bg: "bg-[#D4EEF5]", iconColor: "text-[#3AA6B9]" },
    { bg: "bg-[#FFD6CC]", iconColor: "text-[#FF5A2C]" },
  ];
  const items = dynamicItems?.length ? dynamicItems.slice(0, 3) : fallbackItems;

  return (
    <section className="w-full bg-[#f5f5f5] py-16 md:py-20">
      <div className="mx-auto px-4 md:px-30 grid md:grid-cols-3 gap-6">

        {items.map((item, index) => {
          const Icon = icons[index % icons.length];
          const style = styles[index % styles.length];

          return (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
            >
              {/* Icon Box */}
              <div
                className={`w-12 h-12 flex items-center justify-center rounded-lg ${style.bg}`}
              >
                <Icon className={`w-5 h-5 ${style.iconColor}`} />
              </div>

              {/* Title */}
              <h3 className="mt-5 text-lg font-semibold text-gray-900">
                {item.title}
              </h3>

              {/* Description */}
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
