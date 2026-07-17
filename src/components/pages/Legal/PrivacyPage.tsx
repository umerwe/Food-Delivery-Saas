"use client";

import { useEffect, useMemo, useState } from "react";
import { Ban, Loader2, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { getStoredRestaurantId } from "@/lib/auth";
import { isRemoteHttpsImageUrl } from "@/lib/image-fallback";
import {
  fetchPrivacyPolicyContent,
  sanitizeLegalHtml,
  type PrivacyPolicyContent,
} from "@/services/legal-content";

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

  const safePolicyContent = useMemo(
    () => sanitizeLegalHtml(policy?.content || ""),
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
                unoptimized={isRemoteHttpsImageUrl(policy.restaurantCoverImage)}
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
              className="mt-10 space-y-5 text-[15px] leading-7 text-gray-700 [&_a]:font-semibold [&_a]:text-primary [&_a]:underline [&_div]:!my-0 [&_div]:min-h-[1.75rem] [&_font[color]]:font-semibold [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:leading-tight [&_h1]:text-gray-950 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:leading-tight [&_h2]:text-gray-950 [&_h3]:pt-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-950 [&_h4]:pt-2 [&_h4]:font-semibold [&_h4]:text-gray-950 [&_li]:ml-5 [&_li]:list-disc [&_ol_li]:list-decimal [&_p]:text-gray-700"
              dangerouslySetInnerHTML={{ __html: safePolicyContent }}
            />
          ) : !loadingPolicy ? (
            <article className="mt-10 space-y-8 text-[15px] leading-7 text-gray-700">
              <section>
                <h2 className="text-2xl font-bold leading-tight text-gray-950">
                  {t("dataCollectionTitle")}
                </h2>
                <p className="mt-4">{t("dataCollectionDescription")}</p>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-gray-100 bg-[#F9F9F9] p-5">
                    <h3 className="font-semibold text-gray-950">{t("identityDataTitle")}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      {t("identityDataDescription")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-[#F9F9F9] p-5">
                    <h3 className="font-semibold text-gray-950">{t("contactDataTitle")}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      {t("contactDataDescription")}
                    </p>
                  </div>
                </div>

                <p className="mt-5">{t("technicalDataDescription")}</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold leading-tight text-gray-950">
                  {t("cookiesTitle")}
                </h2>
                <p className="mt-4">{t("cookiesDescription")}</p>
                <blockquote className="mt-5 rounded-2xl border-l-4 border-[#E74C3C] bg-[#FFF7F5] px-5 py-4 text-sm italic leading-6 text-gray-600">
                  {t("cookiesQuote")}
                </blockquote>
              </section>
            </article>
          ) : null}

        </div>
      </div>
    </div>
  );
};

export { PrivacyPage };
