"use client";

import { Ban, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

const PrivacyPage = () => {
  const t = useTranslations("legal.privacy");

  return (
    <div className="min-h-screen py-12 px-6 md:px-12 lg:px-20">
      <div className="md:px-28 mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
        <div>
          <h1 className="text-[32px] md:text-[36px] font-semibold text-gray-900">
            {t("title")}
          </h1>

          <p className="text-sm text-gray-400 mt-2">{t("lastUpdated")}</p>

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
