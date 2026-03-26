"use client";

import { useState } from "react";
import { toast } from "sonner";
import useApi from "@/hooks/useApi";
import { useAuthContext } from "@/context/AuthContext";

export default function useBranchSelector(onSelect?: () => void) {
  const { token } = useAuthContext();
  const { get } = useApi(token);

  const [showBranchPopup, setShowBranchPopup] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const fetchBranches = async () => {
    try {
      setLoadingBranches(true);

      const res = await get(`/v1/branches`);

      const activeBranches =
        res?.data?.filter((b: any) => b.isActive) || [];

      setBranches(activeBranches);
      setShowBranchPopup(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load branches");
    } finally {
      setLoadingBranches(false);
    }
  };

  const selectBranch = async (branch: any) => {
    try {
      const authRaw = localStorage.getItem("auth");
      const auth = authRaw ? JSON.parse(authRaw) : null;

      if (auth?.user) {
        auth.user.branchId = branch.id;
        localStorage.setItem("auth", JSON.stringify(auth));
      }

      toast.success("Branch selected");
      setShowBranchPopup(false);

      // 🔥 resume flow
      if (onSelect) onSelect();

    } catch (err) {
      console.error(err);
      toast.error("Failed to set branch");
    }
  };

  return {
    showBranchPopup,
    setShowBranchPopup,
    branches,
    loadingBranches,
    fetchBranches,
    selectBranch,
  };
}