"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/hooks/useAuth";
import { BranchSelectorModal } from "./BranchSelectorModal";
import { Branch } from "@/types/branch-selector";

type RequiredBranchSelectionModalProps = {
  restaurantId?: string | number | null;
  endpoint?: string;
  onSelected?: (branch: Branch) => void;
};

export function RequiredBranchSelectionModal({
  restaurantId,
  endpoint,
  onSelected,
}: RequiredBranchSelectionModalProps) {
  const t = useTranslations("branchSelector");
  const { token, user } = useAuthContext();
  const [open, setOpen] = useState(false);
  const [dismissedEmptyState, setDismissedEmptyState] = useState(false);

  const resolvedRestaurantId = useMemo(() => {
    return restaurantId || user?.restaurantId || user?.tenantId || null;
  }, [restaurantId, user]);

  const shouldShow =
    !!token && !!user && !user?.branchId && !!resolvedRestaurantId;

  /*
   * Reset dismissal when the auth/restaurant context changes.
   * This prevents a previous empty-state close from hiding the modal forever
   * for a different user or restaurant.
   */
  useEffect(() => {
    setDismissedEmptyState(false);
  }, [user?.id, user?.branchId, resolvedRestaurantId]);

  useEffect(() => {
    setOpen(shouldShow && !dismissedEmptyState);
  }, [shouldShow, dismissedEmptyState]);

  const handleClose = () => {
    /*
     * Branch selection is required only when branches exist.
     * If the child modal exposes a close action from the empty state,
     * allow the user to close it and do not immediately reopen it.
     */
    setDismissedEmptyState(true);
    setOpen(false);
  };

  const handleSelected = (branch: Branch) => {
    setDismissedEmptyState(false);
    setOpen(false);
    onSelected?.(branch);
  };

  if ((!shouldShow || dismissedEmptyState) && !open) return null;

  return (
    <BranchSelectorModal
      open={open}
      onClose={handleClose}
      restaurantId={resolvedRestaurantId}
      endpoint={endpoint}
      forceSelection
      badgeText={t("branchRequired")}
      title={t("chooseYourBranch")}
      description=""
      onSelected={handleSelected}
    />
  );
}
