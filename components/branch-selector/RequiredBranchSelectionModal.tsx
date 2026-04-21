"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/context/AuthContext";
import BranchSelectorModal from "./BranchSelectorModal";

import { Branch} from "../types/branch-selector";

type RequiredBranchSelectionModalProps = {
  restaurantId?: string | number | null;
  endpoint?: string;
  onSelected?: (branch: Branch) => void;
};

export default function RequiredBranchSelectionModal({
  restaurantId,
  endpoint,
  onSelected,
}: RequiredBranchSelectionModalProps) {
  const { token, user } = useAuthContext();
  const [open, setOpen] = useState(false);

  const resolvedRestaurantId = useMemo(() => {
    return restaurantId || user?.restaurantId || user?.tenantId || null;
  }, [restaurantId, user]);

  const shouldShow =
    !!token && !!user && !user?.branchId && !!resolvedRestaurantId;

  useEffect(() => {
    setOpen(shouldShow);
  }, [shouldShow]);

  if (!shouldShow && !open) return null;

  return (
    <BranchSelectorModal
      open={open}
      onClose={() => {}}
      restaurantId={resolvedRestaurantId}
      endpoint={endpoint}
      forceSelection
      badgeText="Branch Required"
      title="Choose Your Branch"
      description=""
      onSelected={(branch) => {
        setOpen(false);
        onSelected?.(branch);
      }}
    />
  );
}