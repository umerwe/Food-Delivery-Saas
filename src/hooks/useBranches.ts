"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/config/query-keys";
import { useDomainApi } from "@/hooks/useDomainApi";
import {
  deleteBranches,
  fetchBranchApiResponse,
  fetchBranchRecords,
  getNearbyBranches,
  getBranches,
  patchBranches,
  postBranches,
} from "@/services/branches";
import type { NearbyBranchesParams } from "@/types/branches";
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

type UseNearbyBranchesOptions = {
  enabled?: boolean;
};

type NullableNearbyBranchesParams = {
  lat?: number | null;
  lng?: number | null;
  page?: number;
  limit?: number;
};

const isValidCoordinate = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const useNearbyBranches = (
  params: NullableNearbyBranchesParams | null,
  options: UseNearbyBranchesOptions = {}
) => {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const lat = params?.lat ?? null;
  const lng = params?.lng ?? null;
  const canQuery = isValidCoordinate(lat) && isValidCoordinate(lng);

  const queryParams: NearbyBranchesParams | null = canQuery
    ? {
        lat,
        lng,
        page,
        limit,
      }
    : null;

  const query = useQuery({
    queryKey: queryKeys.branches.nearby({ lat, lng, page, limit }),
    enabled: canQuery && (options.enabled ?? true),
    queryFn: () => {
      if (!queryParams) {
        throw new Error("Both lat and lng are required to fetch nearby branches.");
      }

      return getNearbyBranches(queryParams);
    },
    placeholderData: (previousData) => previousData,
  });

  return {
    ...query,
    branches: query.data?.branches ?? [],
    meta: query.data?.meta,
  };
};

export default useBranches;
