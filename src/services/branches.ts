import { createDomainApiService } from "@/services/domain-api";
import { normalizeBranchApiResponse, normalizeBranchList } from "@/lib/branch-selector";
import type { BranchApiResponse, BranchRecord } from "@/types/branch-selector";

const branchesService = createDomainApiService();

export const getBranches = branchesService.get;
export const postBranches = branchesService.post;
export const patchBranches = branchesService.patch;
export const deleteBranches = branchesService.del;

export const fetchBranchRecords = async (endpoint: string, token?: string | null): Promise<BranchRecord[]> =>
  normalizeBranchList(await getBranches(endpoint, token));

export const fetchBranchApiResponse = async (
  endpoint: string,
  token?: string | null
): Promise<BranchApiResponse> => normalizeBranchApiResponse(await getBranches(endpoint, token));
