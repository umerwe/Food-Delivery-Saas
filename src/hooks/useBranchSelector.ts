"use client";

import { useState } from "react";
import { toast } from "sonner";
import useBranches from "@/hooks/useBranches";
import { useAuthContext } from "@/hooks/useAuth";
import { persistSelectedBranch } from "@/lib/branch-selector";
import type { BranchRecord } from "@/types/branch-selector";
import { useTranslations } from "next-intl";

export default function useBranchSelector(onSelect?: () => void) {
  const t = useTranslations("branchSelector");
  const { token, setUser } = useAuthContext();
  const { fetchBranches } = useBranches(token);

  const [showBranchPopup, setShowBranchPopup] = useState(false);
  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const fetchBranchOptions = async () => {
    try {
      setLoadingBranches(true);

      const activeBranches = (await fetchBranches(`/v1/branches`)).filter((branch) => branch.isActive !== false);

      setBranches(activeBranches);
      setShowBranchPopup(true);
    } catch {
      toast.error(t("failedToLoadBranches"));
    } finally {
      setLoadingBranches(false);
    }
  };

  const selectBranch = async (branch: BranchRecord) => {
    try {
      persistSelectedBranch(branch, setUser, { includeBranch: false });

      toast.success(t("branchSelected", { name: branch.name }));
      setShowBranchPopup(false);

      if (onSelect) onSelect();

    } catch {
      toast.error(t("failedToSetBranch"));
    }
  };

  return {
    showBranchPopup,
    setShowBranchPopup,
    branches,
    loadingBranches,
    fetchBranches: fetchBranchOptions,
    selectBranch,
  };
}
