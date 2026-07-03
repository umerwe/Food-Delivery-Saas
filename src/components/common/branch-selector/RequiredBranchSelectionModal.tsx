"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/hooks/useAuth";
import useBranches from "@/hooks/useBranches";
import { BranchSelectorModal } from "./BranchSelectorModal";
import { Branch } from "@/types/branch-selector";
import {
  getDefaultBranchOrderType,
  getSelectedOrderType,
  getSoleActiveBranch,
  persistSelectedBranch,
} from "@/lib/branch-selector";

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
  const { token, user, setUser } = useAuthContext();
  const branchesApi = useBranches(token);
  const fetchBranchPage = branchesApi.fetchBranchPage;
  const [open, setOpen] = useState(false);
  const [dismissedEmptyState, setDismissedEmptyState] = useState(false);
  const [checkedKey, setCheckedKey] = useState<string | null>(null);

  const resolvedRestaurantId = useMemo(() => {
    return restaurantId || user?.restaurantId || user?.tenantId || null;
  }, [restaurantId, user]);

  const shouldShow =
    !!token && !!user && !user?.branchId && !!resolvedRestaurantId;
  const shouldCheckSingleBranch =
    !!token &&
    !!user &&
    !!resolvedRestaurantId &&
    (!user?.branchId || user?.branch?.isOnlyBranch !== true);
  const checkKey = shouldCheckSingleBranch
    ? `${user?.id ?? ""}:${resolvedRestaurantId ?? ""}:${user?.branchId ?? "none"}`
    : null;
  const isCheckingSingleBranch = shouldShow && checkedKey !== checkKey;

  const buildBranchLookupUrl = useCallback(() => {
    const baseUrl = endpoint || `/v1/branches?restaurantId=${resolvedRestaurantId}`;
    const separator = baseUrl.includes("?") ? "&" : "?";

    return `${baseUrl}${separator}page=1&limit=100`;
  }, [endpoint, resolvedRestaurantId]);

  /*
   * Reset dismissal when the auth/restaurant context changes.
   * This prevents a previous empty-state close from hiding the modal forever
   * for a different user or restaurant.
   */
  useEffect(() => {
    setDismissedEmptyState(false);
    setCheckedKey(null);
  }, [user?.id, user?.branchId, resolvedRestaurantId]);

  useEffect(() => {
    if (!shouldCheckSingleBranch || !checkKey) return;

    let cancelled = false;

    const selectSoleBranch = async () => {
      try {
        const response = await fetchBranchPage(buildBranchLookupUrl());
        const soleBranch = getSoleActiveBranch(response);

        if (cancelled) return;

        if (soleBranch) {
          persistSelectedBranch(soleBranch, setUser, {
            orderType: getDefaultBranchOrderType(soleBranch, getSelectedOrderType(user)),
          });
          setDismissedEmptyState(false);
          setOpen(false);
          onSelected?.(soleBranch);
        }
      } catch {
        // Fall through to the normal selector if the lightweight pre-check fails.
      } finally {
        if (!cancelled) {
          setCheckedKey(checkKey);
        }
      }
    };

    selectSoleBranch();

    return () => {
      cancelled = true;
    };
  }, [buildBranchLookupUrl, checkKey, fetchBranchPage, onSelected, setUser, shouldCheckSingleBranch, user]);

  useEffect(() => {
    setOpen(shouldShow && !dismissedEmptyState && !isCheckingSingleBranch);
  }, [shouldShow, dismissedEmptyState, isCheckingSingleBranch]);

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

  if (((!shouldShow || dismissedEmptyState) && !open) || isCheckingSingleBranch) return null;

  return (
    <BranchSelectorModal
      open={open}
      onClose={handleClose}
      restaurantId={resolvedRestaurantId}
      endpoint={endpoint}
      forceSelection
      badgeText={t("branchRequired")}
      title="Choose your nearest branch"
      description=""
      onSelected={handleSelected}
    />
  );
}
