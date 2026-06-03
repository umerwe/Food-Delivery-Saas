"use client";

import { MousePointerClick, Zap, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

export default function WhyChooseUsSection() {
  const t = useTranslations("about.whyChooseUs");

  const features = [
    {
      title: t("easyTitle"),
      description: t("easyDescription"),
      icon: MousePointerClick,
    },
    {
      title: t("fastTitle"),
      description: t("fastDescription"),
      icon: Zap,
    },
    {
      title: t("qualityTitle"),
      description: t("qualityDescription"),
      icon: ShieldCheck,
    },
  ];

  const stats = [
    { value: "2M+", label: t("happyCustomers") },
    { value: "98%", label: t("satisfaction") },
    { value: "20+", label: t("branches") },
    { value: "100+", label: t("employees") },
  ];

  return (
    <section className="w-full">

      {/* TOP: WHY CHOOSE US */}
      <div className="py-25 md:py-20 text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
          {t("title")}
        </h2>

        {/* underline */}
        <div className="w-12 h-[3px] bg-[#FF5A2C] mx-auto mt-3 rounded-full" />

        {/* features */}
        <div className="mt-12 max-w-5xl mx-auto px-4 grid md:grid-cols-3 gap-10">
          {features.map((item, index) => {
            const Icon = item.icon;

            return (
              <div key={index} className="flex flex-col items-center text-center">
                <Icon className="w-6 h-6 text-[#FF5A2C]" />

                <h3 className="mt-4 text-base font-semibold text-gray-900">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm text-gray-600 leading-relaxed max-w-xs">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM: STATS BAR */}
      <div className="bg-[#2b2b2b] py-12">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">

          {stats.map((item, index) => (
            <div key={index}>
              <h3 className="text-[#FF5A2C] text-2xl md:text-3xl font-semibold">
                {item.value}
              </h3>

              <p className="mt-2 text-xs tracking-widest uppercase text-white/70">
                {item.label}
              </p>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}
