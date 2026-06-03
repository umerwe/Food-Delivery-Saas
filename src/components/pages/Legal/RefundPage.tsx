"use client";

import { UploadCloud, Lock } from "lucide-react";
import { useTranslations } from "next-intl";

const RefundPage = () => {
  const t = useTranslations("legal.refund");

  return (
    <div className="min-h-screen py-12 px-6 md:px-12 lg:px-20">
      <div className="md:px-27 mx-auto">

        {/* HEADER */}
        <h1 className="text-[32px] md:text-[36px] font-semibold text-gray-900">
          {t("title")}
        </h1>

        <p className="text-gray-600 text-sm mt-2 max-w-[600px]">
          {t("description")}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-xs font-semibold tracking-wide text-gray-400 uppercase mb-2">
              {t("reviewTimelineTitle")}
            </h3>
            <p className="text-sm text-gray-600">
              {t("reviewTimelineDescription")}
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-xs font-semibold tracking-wide text-gray-400 uppercase mb-2">
              {t("evidenceRequiredTitle")}
            </h3>
            <p className="text-sm text-gray-600">
              {t("evidenceRequiredDescription")}
            </p>
          </div>

        </div>

        {/* FORM */}
        <div className="mt-10 space-y-6">

          {/* ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div>
              <label className="text-xs uppercase tracking-wide text-gray-400">
                {t("orderNumber")}
              </label>
              <input
                placeholder={t("orderNumberPlaceholder")}
                className="w-full mt-2 bg-gray-100 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-gray-400">
                {t("dateOfOrder")}
              </label>
              <input
                placeholder={t("datePlaceholder")}
                className="w-full mt-2 bg-gray-100 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

          </div>

          {/* REASON */}
          <div>
            <label className="text-xs uppercase tracking-wide text-gray-400">
              {t("reasonForRefund")}
            </label>
            <select className="w-full mt-2 bg-gray-100 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500">
              <option>{t("selectReason")}</option>
              <option>{t("wrongItem")}</option>
              <option>{t("qualityIssue")}</option>
              <option>{t("missingItems")}</option>
            </select>
          </div>

          {/* UPLOAD */}
          <div>
            <label className="text-xs uppercase tracking-wide text-gray-400">
              {t("uploadEvidence")}
            </label>

            <div className="mt-2 bg-gray-100 rounded-xl h-[150px] flex flex-col items-center justify-center text-gray-500 text-sm border border-dashed border-gray-300">
              <UploadCloud size={28} className="mb-2 text-gray-400" />
              {t("dragDropPhotos")}{" "}
              <span className="text-gray-700 underline cursor-pointer ml-1">
                {t("browse")}
              </span>
            </div>
          </div>

          {/* MESSAGE */}
          <div>
            <label className="text-xs uppercase tracking-wide text-gray-400">
              {t("messageExplanation")}
            </label>

            <textarea
              placeholder={t("messagePlaceholder")}
              className="w-full mt-2 bg-gray-100 rounded-xl px-4 py-3 text-sm h-32 resize-none outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* SUBMIT */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Lock size={14} />
              {t("secureSubmissionProtocol")}
            </div>

            <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full text-sm font-medium transition">
              {t("submitRequest")}
            </button>
          </div>

        </div>

        {/* BOTTOM SECTION */}
        <div className="mt-14">
          <h3 className="font-semibold text-gray-900 mb-6">
            {t("protocolTitle")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            <div>
              <p className="text-orange-300 text-2xl font-semibold mb-2">01.</p>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                {t("verificationTitle")}
              </p>
              <p className="text-sm text-gray-600">
                {t("verificationDescription")}
              </p>
            </div>

            <div>
              <p className="text-orange-300 text-2xl font-semibold mb-2">02.</p>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                {t("adjudicationTitle")}
              </p>
              <p className="text-sm text-gray-600">
                {t("adjudicationDescription")}
              </p>
            </div>

            <div>
              <p className="text-orange-300 text-2xl font-semibold mb-2">03.</p>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                {t("reimbursementTitle")}
              </p>
              <p className="text-sm text-gray-600">
                {t("reimbursementDescription")}
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export { RefundPage };
