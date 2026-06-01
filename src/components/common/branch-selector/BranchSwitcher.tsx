"use client";

import { useMemo, useState } from "react";
import { FaChevronDown, FaMapMarkerAlt } from "react-icons/fa";
import { useAuthContext } from "@/hooks/useAuth";
import BranchSelectorModal from "./BranchSelectorModal";

type BranchSwitcherProps = {
  restaurantId?: string | number | null;
  endpoint?: string;
  className?: string;
};

export default function BranchSwitcher({
  restaurantId,
  endpoint,
  className = "",
}: BranchSwitcherProps) {
  const { user } = useAuthContext();
  const [open, setOpen] = useState(false);

  const resolvedRestaurantId = useMemo(() => {
    return restaurantId || user?.restaurantId || user?.tenantId || null;
  }, [restaurantId, user]);

  const branchName = user?.branch?.name || "Select Branch";
  const branchArea =
    user?.branch?.address?.area ||
    user?.branch?.address?.city ||
    "Change branch";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group inline-flex items-center gap-3 rounded-2xl border border-[#E8ECF0] bg-white px-3 py-2 text-left shadow-sm transition-all duration-200 hover:border-[var(--primary)]/35 hover:shadow-[0_10px_24px_rgba(17,24,39,0.08)] ${className}`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:rgba(206,24,27,0.08)] text-[var(--primary)] transition-all duration-200 group-hover:bg-[var(--primary)] group-hover:text-white">
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
        badgeText="Switch Branch"
        title="Change Branch"
        description=""
      />
    </>
  );
}
