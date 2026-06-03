"use client";

import { FaMapMarkerAlt, FaTimes, FaStore } from "react-icons/fa";
import { useTranslations } from "next-intl";
import type { BranchRecord } from "@/types/branch-selector";

type BranchPopupProps = {
  show: boolean;
  onClose: () => void;
  branches: BranchRecord[];
  loading: boolean;
  onSelect: (branch: BranchRecord) => void;
};

export function BranchPopup({
  show,
  onClose,
  branches,
  loading,
  onSelect,
}: BranchPopupProps) {
  const t = useTranslations("branchSelector");
  const tCommon = useTranslations("common");

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/45 backdrop-blur-[3px] flex items-center justify-center p-4">
      <div className="w-full max-w-[520px] overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_20px_80px_rgba(0,0,0,0.18)]">
        {/* HEADER */}
        <div className="border-b border-gray-100 px-6 pt-6 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF1EC] text-[#EC5834]">
                <FaStore className="text-[16px]" />
              </div>

              <h2 className="text-[22px] font-semibold text-gray-900">
                {t("selectBranch")}
              </h2>

              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                {t("choosePreferredBranch")}
              </p>
            </div>

            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-[#EC5834] hover:bg-[#FFF7F4] hover:text-[#EC5834]"
              aria-label={t("closeBranchPopup")}
            >
              <FaTimes className="text-[14px]" />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="max-h-[420px] overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#F3C5B8] border-t-[#EC5834]" />
              <p className="text-sm font-medium text-gray-700">
                {t("loadingBranches")}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {t("fetchingAvailableLocations")}
              </p>
            </div>
          ) : branches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <FaMapMarkerAlt className="text-[18px]" />
              </div>
              <p className="text-sm font-semibold text-gray-700">
                {t("noActiveBranchesFound")}
              </p>
              <p className="mt-1 max-w-[280px] text-xs leading-relaxed text-gray-400">
                {t("noActiveBranchesDescription")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {branches.map((branch) => (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => onSelect(branch)}
                  className="group flex w-full items-start gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left transition hover:-translate-y-[1px] hover:border-[#EC5834] hover:bg-[#FFF8F5] hover:shadow-sm"
                >
                  <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF1EC] text-[#EC5834] transition group-hover:bg-[#EC5834] group-hover:text-white">
                    <FaMapMarkerAlt className="text-[15px]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-gray-900">
                      {branch.name}
                    </p>

                    <p className="mt-1 text-sm leading-relaxed text-gray-500">
                      {[branch.address?.area, branch.address?.city]
                        .filter(Boolean)
                        .join(", ") || t("branchLocationAvailable")}
                    </p>

                    <span className="mt-3 inline-flex items-center text-[12px] font-semibold text-[#EC5834]">
                      {t("selectThisBranch")}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-2xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            {tCommon("cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
