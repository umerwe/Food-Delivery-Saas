"use client";

import { ReactNode } from "react";
import {
  FaFingerprint,
  FaTruck,
  FaUniversity,
  FaGavel,
} from "react-icons/fa";
import { useTranslations } from "next-intl";

export default function HelpCenterSection() {
  const t = useTranslations("contact.helpCenter");

  return (
    <section className="bg-[#F4F4F4] py-16 px-6 md:px-12 lg:px-20">
      <div className="max-w-[1150px] mx-auto">

        {/* HEADER */}
        <div className="mb-12 max-w-[600px]">
          <h1 className="text-[40px] font-semibold text-gray-900 leading-tight">
            {t("title")}
          </h1>

          <p className="text-gray-500 mt-3 text-[15px] leading-relaxed">
            {t("description")}
          </p>
        </div>

        {/* CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          <HelpCard
            icon={<FaFingerprint />}
            title={t("accountTitle")}
            description={t("accountDescription")}
            cta={t("explore")}
          />

          <HelpCard
            icon={<FaTruck />}
            title={t("deliveryTitle")}
            description={t("deliveryDescription")}
            cta={t("explore")}
          />

          <HelpCard
            icon={<FaUniversity />}
            title={t("paymentTitle")}
            description={t("paymentDescription")}
            cta={t("explore")}
          />

          <HelpCard
            icon={<FaGavel />}
            title={t("legalTitle")}
            description={t("legalDescription")}
            cta={t("explore")}
          />

        </div>
      </div>
    </section>
  );
}

/*  REUSABLE CARD */
type HelpCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  cta: string;
};

function HelpCard({ icon, title, description, cta }: HelpCardProps) {
  return (
    <div className="bg-white rounded-[14px] p-6 shadow-sm hover:shadow-md transition duration-300 border border-gray-100">

      {/* ICON */}
      <div className="text-primary text-[18px] mb-4">
        {icon}
      </div>
      <h3 className="text-[13px] font-semibold text-gray-900 tracking-wide mb-3">
        {title}
      </h3>
      <p className="text-gray-500 text-[13px] leading-relaxed mb-6">
        {description}
      </p>

      {/* CTA */}
      <button className="text-primary text-[12px] font-semibold tracking-wide flex items-center gap-1 hover:gap-2 transition-all">
        {cta}
      </button>
    </div>
  );
}
