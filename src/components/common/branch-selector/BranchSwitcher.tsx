"use client";

import { useMemo, useState } from "react";
import { FaChevronDown, FaMapMarkerAlt } from "react-icons/fa";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/hooks/useAuth";
import { BranchSelectorModal } from "./BranchSelectorModal";

type BranchSwitcherProps = {
  restaurantId?: string | number | null;
  endpoint?: string;
  className?: string;
  presentation?: "default" | "navbar";
};

export function BranchSwitcher({
  restaurantId,
  endpoint,
  className = "",
  presentation = "default",
}: BranchSwitcherProps) {
  const t = useTranslations("branchSelector");
  const { user } = useAuthContext();
  const [open, setOpen] = useState(false);

  const resolvedRestaurantId = useMemo(() => {
    return restaurantId || user?.restaurantId || user?.tenantId || null;
  }, [restaurantId, user]);

  const branchName = user?.branch?.name || t("selectBranch");
  const branchArea =
    user?.branch?.address?.area ||
    user?.branch?.address?.city ||
    t("changeBranchShort");
  const isNavbar = presentation === "navbar";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group inline-flex items-center text-left transition-all duration-200 ${
          isNavbar
            ? "h-11 gap-2 rounded-full bg-[#F7F7F8] px-4 text-sm font-semibold text-[#20242A] hover:bg-[#F1F2F4]"
            : "gap-3 rounded-2xl border border-[#E8ECF0] bg-white px-3 py-2 shadow-sm hover:border-[var(--primary)]/35 hover:shadow-[0_10px_24px_rgba(17,24,39,0.08)]"
        } ${className}`}
      >
        <div
          className={
            isNavbar
              ? "flex items-center justify-center text-[var(--primary)]"
              : "flex h-10 w-10 items-center justify-center rounded-xl bg-[color:rgba(206,24,27,0.08)] text-[var(--primary)] transition-all duration-200 group-hover:bg-[var(--primary)] group-hover:text-white"
          }
        >
          <FaMapMarkerAlt className="text-[14px]" />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#111827]">
            {branchName}
          </p>
        </div>

        <FaChevronDown className="ml-1 text-[12px] text-[#6B7280]" />
      </button>

      <BranchSelectorModal
        open={open}
        onClose={() => setOpen(false)}
        restaurantId={resolvedRestaurantId}
        endpoint={endpoint}
        badgeText={t("switchBranch")}
        title={t("changeBranch")}
        description=""
      />
    </>
  );
}
