"use client";

import { useEffect, useMemo, useState } from "react";
import { Ban, Building2, FileText, Loader2, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { getStoredRestaurantId } from "@/lib/auth";
import { fetchPrivacyPolicyContent, type PrivacyPolicyContent } from "@/services/legal-content";

const ALLOWED_POLICY_TAGS = new Set([
  "a",
  "b",
  "br",
  "em",
  "font",
  "h1",
  "h2",
  "h3",
  "h4",
  "i",
  "li",
  "ol",
  "p",
  "strong",
  "u",
  "ul",
]);

const ALLOWED_POLICY_ATTRIBUTES = new Set(["color", "href", "rel", "target"]);

const sanitizePolicyHtml = (value: string) => {
  let sanitized = value
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\s*(script|style|iframe|object|embed|svg|math|form)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\/?(script|style|iframe|object|embed|svg|math|form|input|button|textarea|select|meta|link)[^>]*>/gi, "")
    .replace(/\s(on[a-z]+|style|src|srcset)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(href)\s*=\s*(["'])\s*(javascript:|data:)[^"']*\2/gi, "");

  sanitized = sanitized.replace(/<\/?([a-z][a-z0-9-]*)([^>]*)>/gi, (match, tagName: string, rawAttributes: string) => {
    const tag = tagName.toLowerCase();

    if (!ALLOWED_POLICY_TAGS.has(tag)) {
      return "";
    }

    if (match.startsWith("</")) {
      return `</${tag}>`;
    }

    const attributes = Array.from(rawAttributes.matchAll(/\s([a-z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi))
      .map(([, name, doubleQuotedValue, singleQuotedValue, unquotedValue]) => {
        const attributeName = name.toLowerCase();
        const attributeValue = doubleQuotedValue ?? singleQuotedValue ?? unquotedValue ?? "";

        if (!ALLOWED_POLICY_ATTRIBUTES.has(attributeName)) {
          return null;
        }

        if (attributeName === "href" && /^(javascript:|data:)/i.test(attributeValue.trim())) {
          return null;
        }

        if (attributeName === "color" && !/^#[0-9a-f]{3,8}$/i.test(attributeValue.trim())) {
          return null;
        }

        return `${attributeName}="${attributeValue.replace(/"/g, "&quot;")}"`;
      })
      .filter(Boolean)
      .join(" ");

    const safeAttributes = attributes ? ` ${attributes}` : "";

    if (tag === "a") {
      const hasTarget = /\starget=/.test(safeAttributes);
      const hasRel = /\srel=/.test(safeAttributes);

      return `<${tag}${safeAttributes}${hasTarget ? "" : ' target="_blank"'}${hasRel ? "" : ' rel="noopener noreferrer"'}>`;
    }

    return `<${tag}${safeAttributes}>`;
  });

  return sanitized;
};

const PrivacyPage = () => {
  const t = useTranslations("legal.privacy");
  const [policy, setPolicy] = useState<PrivacyPolicyContent | null>(null);
  const [loadingPolicy, setLoadingPolicy] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const restaurantId = searchParams.get("restaurantId") || getStoredRestaurantId();

    if (!restaurantId) {
      return;
    }

    let isMounted = true;

    const loadPolicy = async () => {
      try {
        setLoadingPolicy(true);
        const nextPolicy = await fetchPrivacyPolicyContent(restaurantId);

        if (isMounted) {
          setPolicy(nextPolicy);
        }
      } catch {
        if (isMounted) {
          setPolicy(null);
        }
      } finally {
        if (isMounted) {
          setLoadingPolicy(false);
        }
      }
    };

    void loadPolicy();

    return () => {
      isMounted = false;
    };
  }, []);

  const legalAddress = useMemo(() => {
    const address = policy?.legalProfile?.businessAddress;

    return [
      address?.street,
      address?.shopNumber,
      address?.postalCode,
      address?.city,
      address?.state,
      address?.country,
    ]
      .filter(Boolean)
      .join(", ");
  }, [policy?.legalProfile?.businessAddress]);

  const hasLegalProfile = Boolean(
    policy?.legalProfile?.ownerName ||
      policy?.legalProfile?.legalBusinessName ||
      policy?.legalProfile?.taxNumber ||
      legalAddress ||
      policy?.legalProfile?.contractText
  );
  const safePolicyContent = useMemo(
    () => sanitizePolicyHtml(policy?.content || ""),
    [policy?.content]
  );
  const hasPolicyContent = Boolean(safePolicyContent.trim());

  return (
    <div className="min-h-screen py-12 px-6 md:px-12 lg:px-20">
      <div className="md:px-28 mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
        <div>
          {policy?.restaurantCoverImage ? (
            <div className="relative mb-8 h-52 overflow-hidden rounded-[28px] bg-gray-100 md:h-64">
              <Image
                src={policy.restaurantCoverImage}
                alt={policy?.title || t("title")}
                fill
                sizes="(min-width: 1024px) 900px, 100vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
            </div>
          ) : null}

          <h1 className="text-[32px] md:text-[36px] font-semibold text-gray-900">
            {policy?.title || t("title")}
          </h1>

          <p className="text-sm text-gray-400 mt-2">{t("lastUpdated")}</p>

          {loadingPolicy ? (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-gray-50 px-4 py-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("loadingPolicy")}
            </div>
          ) : null}

          <div className="mt-8">
            <h2 className="text-[#E74C3C] font-semibold text-[14px] mb-3">
              {t("atGlanceTitle")}
            </h2>

            <p className="text-[14px] text-gray-600 mb-4 max-w-[600px]">
              {t("atGlanceDescription")}
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <ShieldCheck size={18} className="text-gray-700 mt-[2px]" />
                <div>
                  <p className="font-medium text-sm text-gray-900">
                    {t("dataSecurityTitle")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("dataSecurityDescription")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Ban size={18} className="text-gray-700 mt-[2px]" />
                <div>
                  <p className="font-medium text-sm text-gray-900">
                    {t("noSaleTitle")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("noSaleDescription")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {hasPolicyContent ? (
            <article
              className="mt-10 space-y-5 text-[15px] leading-7 text-gray-700 [&_a]:font-semibold [&_a]:text-primary [&_a]:underline [&_font[color]]:font-semibold [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:leading-tight [&_h1]:text-gray-950 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:leading-tight [&_h2]:text-gray-950 [&_h3]:pt-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-950 [&_h4]:pt-2 [&_h4]:font-semibold [&_h4]:text-gray-950 [&_li]:ml-5 [&_li]:list-disc [&_ol_li]:list-decimal [&_p]:text-gray-700"
              dangerouslySetInnerHTML={{ __html: safePolicyContent }}
            />
          ) : null}

          {hasLegalProfile ? (
            <div className="mt-10 rounded-[20px] border border-gray-100 bg-[#F9F9F9] p-5 md:p-6">
              <div className="mb-5 flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#E74C3C] shadow-sm">
                  <Building2 className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-[18px] font-semibold text-gray-900">
                    {t("legalProfileTitle")}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {t("legalProfileDescription")}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {policy?.legalProfile?.ownerName ? (
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                      {t("ownerName")}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">
                      {policy.legalProfile.ownerName}
                    </p>
                  </div>
                ) : null}

                {policy?.legalProfile?.legalBusinessName ? (
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                      {t("legalBusinessName")}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">
                      {policy.legalProfile.legalBusinessName}
                    </p>
                  </div>
                ) : null}

                {policy?.legalProfile?.taxNumber ? (
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                      {t("taxNumber")}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">
                      {policy.legalProfile.taxNumber}
                    </p>
                  </div>
                ) : null}

                {legalAddress ? (
                  <div className="rounded-2xl bg-white p-4 md:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                      {t("businessAddress")}
                    </p>
                    <p className="mt-2 text-sm font-medium text-gray-700">
                      {legalAddress}
                    </p>
                  </div>
                ) : null}
              </div>

              {policy?.legalProfile?.contractText ? (
                <div className="mt-4 rounded-2xl bg-white p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <FileText className="h-4 w-4 text-[#E74C3C]" />
                    {t("contractText")}
                  </div>
                  <p className="whitespace-pre-line text-sm leading-6 text-gray-600">
                    {policy.legalProfile.contractText}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export { PrivacyPage };
