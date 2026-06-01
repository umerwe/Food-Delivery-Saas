"use client";

import { useCallback, useMemo } from "react";

import { queryKeys } from "@/config/query-keys";
import { useDomainApi } from "@/hooks/useDomainApi";
import {
  deleteBranches,
  fetchBranchApiResponse,
  fetchBranchRecords,
  getBranches,
  patchBranches,
  postBranches,
} from "@/services/branches";
import type { BranchApiResponse, BranchRecord } from "@/types/branch-selector";

const service = {
  get: getBranches,
  post: postBranches,
  patch: patchBranches,
  del: deleteBranches,
};

export type BranchesApi = ReturnType<typeof useDomainApi> & {
  fetchBranches: (endpoint: string) => Promise<BranchRecord[]>;
  fetchBranchPage: (endpoint: string) => Promise<BranchApiResponse>;
};

export const useBranches = (token: string | null): BranchesApi => {
  const api = useDomainApi(token, { service, requestKey: queryKeys.branches.request });

  const fetchBranches = useCallback(
    (endpoint: string) => fetchBranchRecords(endpoint, token),
    [token]
  );

  const fetchBranchPage = useCallback(
    (endpoint: string) => fetchBranchApiResponse(endpoint, token),
    [token]
  );

  return useMemo(
    () => ({
      ...api,
      fetchBranches,
      fetchBranchPage,
    }),
    [api, fetchBranchPage, fetchBranches]
  );
};

export default useBranches;
