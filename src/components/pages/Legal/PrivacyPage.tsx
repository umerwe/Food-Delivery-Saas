"use client";

import { useEffect, useMemo, useState } from "react";
import { Ban, Building2, FileText, Loader2, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { getStoredRestaurantId } from "@/lib/auth";
import { fetchPrivacyPolicyContent, type PrivacyPolicyContent } from "@/services/legal-content";

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

    return [address?.street, address?.city, address?.state, address?.country]
      .filter(Boolean)
      .join(", ");
  }, [policy?.legalProfile?.businessAddress]);

  const hasLegalProfile = Boolean(
    policy?.legalProfile?.legalBusinessName ||
      policy?.legalProfile?.taxNumber ||
      legalAddress ||
      policy?.legalProfile?.contractText
  );

  return (
    <div className="min-h-screen py-12 px-6 md:px-12 lg:px-20">
      <div className="md:px-28 mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
        <div>
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

          <div className="mt-10">
            <h2 className="text-[#E74C3C] font-semibold text-[14px] mb-3">
              {t("dataCollectionTitle")}
            </h2>

            <p className="text-[14px] text-gray-600 mb-4">
              {t("dataCollectionDescription")}
            </p>

            <div className="mb-3">
              <p className="font-medium text-sm text-gray-900">
                {t("identityDataTitle")}
              </p>
              <p className="text-sm text-gray-600">
                {t("identityDataDescription")}
              </p>
            </div>

            <div className="mb-4">
              <p className="font-medium text-sm text-gray-900">
                {t("contactDataTitle")}
              </p>
              <p className="text-sm text-gray-600">
                {t("contactDataDescription")}
              </p>
            </div>

            <p className="text-sm text-gray-600">
              {t("technicalDataDescription")}
            </p>
          </div>

          <div className="mt-10">
            <h2 className="text-[#E74C3C] font-semibold text-[14px] mb-3">
              {t("cookiesTitle")}
            </h2>

            <p className="text-sm text-gray-600 mb-4">
              {t("cookiesDescription")}
            </p>

            <div className="border-l-4 border-[#E74C3C] bg-gray-50 p-4 text-sm text-gray-600 mb-4">
              {t("cookiesQuote")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { PrivacyPage };
