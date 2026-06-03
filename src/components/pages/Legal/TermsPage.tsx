"use client";

import { ShieldCheck, FileWarning } from "lucide-react";
import { useTranslations } from "next-intl";

const TermsPage = () => {
  const t = useTranslations("legal.terms");

  return (
    <div className="bg-[#F7F7F7] min-h-screen py-12 px-6 md:px-12 lg:px-45">

      <div className="max-w-[1000px]">


        <h1 className="text-[32px] md:text-[36px] font-semibold text-gray-900">
          {t("title")}
        </h1>

        <p className="mt-3 text-gray-600 text-[15px] leading-relaxed max-w-[700px]">
          {t("description")}
        </p>

        {/* SECTION 01 */}
        <div className="mt-10">
          <h2 className="text-[#E74C3C] font-semibold text-[14px] mb-3">
            {t("introductionTitle")}
          </h2>

          <p className="text-[14px] text-gray-600 leading-relaxed mb-3">
            {t("introductionParagraphOne")}
          </p>

          <p className="text-[14px] text-gray-600 leading-relaxed">
            {t("introductionParagraphTwo")}
          </p>
        </div>

        {/* SECTION 02 */}
        <div className="mt-10">
          <h2 className="text-[#E74C3C] font-semibold text-[14px] mb-4">
            {t("useTitle")}
          </h2>

          <h3 className="font-semibold text-[14px] text-gray-900 mb-1">
            {t("acceptableUseTitle")}
          </h3>
          <p className="text-[14px] text-gray-600 mb-4">
            {t("acceptableUseDescription")}
          </p>

          <h3 className="font-semibold text-[14px] text-gray-900 mb-1">
            {t("restrictedAccessTitle")}
          </h3>
          <p className="text-[14px] text-gray-600">
            {t("restrictedAccessDescription")}
          </p>
        </div>

        {/* SECTION 03 */}
        <div className="mt-10">
          <h2 className="text-[#E74C3C] font-semibold text-[14px] mb-4">
            {t("liabilityTitle")}
          </h2>

          <div className="flex items-start gap-3 mb-4">
            <FileWarning size={18} className="text-gray-700 mt-[2px]" />
            <div>
              <h3 className="font-semibold text-[14px] text-gray-900">
                {t("noWarrantiesTitle")}
              </h3>
              <p className="text-[14px] text-gray-600">
                {t("noWarrantiesDescription")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="text-gray-700 mt-[2px]" />
            <div>
              <h3 className="font-semibold text-[14px] text-gray-900">
                {t("indemnityTitle")}
              </h3>
              <p className="text-[14px] text-gray-600">
                {t("indemnityDescription")}
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 04 */}
        <div className="mt-10">
          <h2 className="text-[#E74C3C] font-semibold text-[14px] mb-4">
            {t("disputeTitle")}
          </h2>

          <h3 className="font-semibold text-[14px] text-gray-900 mb-1">
            {t("informalNegotiationTitle")}
          </h3>
          <p className="text-[14px] text-gray-600 mb-4">
            {t("informalNegotiationDescription")}
          </p>

          <h3 className="font-semibold text-[14px] text-gray-900 mb-1">
            {t("bindingArbitrationTitle")}
          </h3>
          <p className="text-[14px] text-gray-600">
            {t("bindingArbitrationDescription")}
          </p>
        </div>

      </div>
    </div>
  );
};

export { TermsPage };
