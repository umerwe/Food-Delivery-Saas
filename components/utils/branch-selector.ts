import { Branch } from "../types/branch-selector";

export function persistSelectedBranch(branch: Branch, setUser?: any) {
  const authRaw = localStorage.getItem("auth");
  const auth = authRaw ? JSON.parse(authRaw) : null;

  if (auth?.user) {
    auth.user.branchId = branch.id;
    auth.user.branch = branch;
    localStorage.setItem("auth", JSON.stringify(auth));
  }

  if (setUser) {
    setUser((prev: any) => {
      if (!prev) return prev;

      return {
        ...prev,
        branchId: branch.id,
        branch,
      };
    });
  }
}

export function getBranchAddressText(branch: Branch) {
  return (
    [
      branch.address?.area,
      branch.address?.city,
      branch.address?.state,
      branch.address?.country,
    ]
      .filter(Boolean)
      .join(", ") || "Branch location available"
  );
}