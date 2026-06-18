"use client";

import { ReactNode, useMemo } from "react";
import {
  FaFingerprint,
  FaTruck,
  FaUniversity,
  FaGavel,
} from "react-icons/fa";
import { useTranslations } from "next-intl";
import type { HelpSupportContent } from "@/services/public-content";

type HelpCenterSectionProps = {
  supportContent?: HelpSupportContent;
};

const sanitizeSupportHtml = (value: string) => {
  let sanitized = value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(["']).*?\1/gi, "")
    .replace(/\s(?:href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\1/gi, "");

  sanitized = sanitized.replace(/<\/?([a-z][a-z0-9-]*)([^>]*)>/gi, (match, tagName: string, rawAttributes: string) => {
    const tag = tagName.toLowerCase();
    const allowedTags = new Set(["p", "br", "strong", "b", "em", "i", "ul", "ol", "li", "a"]);

    if (!allowedTags.has(tag)) {
      return "";
    }

    if (tag !== "a" || match.startsWith("</")) {
      return match.startsWith("</") ? `</${tag}>` : `<${tag}>`;
    }

    const hrefMatch = rawAttributes.match(/\shref\s*=\s*(["'])(.*?)\1/i);
    const href = hrefMatch?.[2]?.trim();

    if (!href || (!href.startsWith("https://") && !href.startsWith("mailto:") && !href.startsWith("tel:"))) {
      return "<a>";
    }

    return `<a href="${href}" target="_blank" rel="noopener noreferrer">`;
  });

  return sanitized;
};

export default function HelpCenterSection({ supportContent }: HelpCenterSectionProps) {
  const t = useTranslations("contact.helpCenter");
  const safeSupportContent = useMemo(
    () => sanitizeSupportHtml(supportContent?.content ?? ""),
    [supportContent?.content]
  );

  return (
    <section className="bg-[#F4F4F4] py-16 px-6 md:px-12 lg:px-20">
      <div className="max-w-[1150px] mx-auto">

        {/* HEADER */}
        <div className="mb-12 max-w-[600px]">
          <h1 className="text-[40px] font-semibold text-gray-900 leading-tight">
            {supportContent?.title || t("title")}
          </h1>

          <p className="text-gray-500 mt-3 text-[15px] leading-relaxed">
            {t("description")}
          </p>

          {safeSupportContent ? (
            <div
              className="mt-4 text-[15px] leading-relaxed text-gray-600 [&_a]:font-semibold [&_a]:text-primary [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-3"
              dangerouslySetInnerHTML={{ __html: safeSupportContent }}
            />
          ) : null}
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
