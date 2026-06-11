import { createDomainApiService } from "@/services/domain-api";
import { getRequest } from "@/services/http";
import { normalizeBranchApiResponse, normalizeBranchList } from "@/lib/branch-selector";
import type { BranchTemporaryClosure, NearbyBranch, NearbyBranchesParams, NearbyBranchesResponse } from "@/types/branches";
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getString = (value: unknown) => (typeof value === "string" ? value : undefined);

const getBoolean = (value: unknown) => (typeof value === "boolean" ? value : undefined);

const getNumber = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const getCoordinate = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? value : null;

const normalizeTemporaryClosure = (value: unknown): BranchTemporaryClosure | null => {
  if (!isRecord(value)) {
    return null;
  }

  return {
    isClosed: getBoolean(value.isClosed),
    closedAt: getString(value.closedAt) ?? null,
    closedUntil: getString(value.closedUntil) ?? null,
    reason: getString(value.reason) ?? null,
    message: getString(value.message) ?? null,
  };
};

const normalizeNearbyBranch = (value: unknown): NearbyBranch | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = getString(value.id);
  const name = getString(value.name);

  if (!id || !name) {
    return null;
  }

  const address = isRecord(value.address)
    ? {
        id: getString(value.address.id),
        street: getString(value.address.street) ?? null,
        area: getString(value.address.area) ?? null,
        city: getString(value.address.city) ?? null,
        state: getString(value.address.state) ?? null,
        country: getString(value.address.country) ?? null,
        postalCode: getString(value.address.postalCode) ?? null,
        lat: getCoordinate(value.address.lat),
        lng: getCoordinate(value.address.lng),
      }
    : null;

  const settings = isRecord(value.settings)
    ? {
        ...value.settings,
        allowedOrderTypes: Array.isArray(value.settings.allowedOrderTypes)
          ? value.settings.allowedOrderTypes
              .map((orderType) => getString(orderType))
              .filter((orderType): orderType is string => Boolean(orderType))
          : undefined,
        deliveryConfig: value.settings.deliveryConfig,
        temporaryClosure: normalizeTemporaryClosure(value.settings.temporaryClosure),
      }
    : null;

  const availability = isRecord(value.availability)
    ? {
        isAvailable: getBoolean(value.availability.isAvailable),
        isActive: getBoolean(value.availability.isActive),
        isTemporarilyClosed: getBoolean(value.availability.isTemporarilyClosed),
        isHolidayClosed: getBoolean(value.availability.isHolidayClosed),
        status: getString(value.availability.status),
        reason: getString(value.availability.reason) ?? null,
        temporaryClosure: normalizeTemporaryClosure(value.availability.temporaryClosure),
        holidayOpeningHour: value.availability.holidayOpeningHour,
      }
    : null;

  return {
    id,
    name,
    restaurantId: getString(value.restaurantId) ?? null,
    address,
    settings,
    distanceKm: getNumber(value.distanceKm) ?? null,
    availability,
    isActive: getBoolean(value.isActive),
  };
};

const getBranchesPayload = (response: unknown) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (!isRecord(response)) {
    return [];
  }

  if (Array.isArray(response.branches)) {
    return response.branches;
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (isRecord(response.data) && Array.isArray(response.data.branches)) {
    return response.data.branches;
  }

  if (isRecord(response.data) && Array.isArray(response.data.data)) {
    return response.data.data;
  }

  return [];
};

const getMetaPayload = (response: unknown) => {
  if (!isRecord(response)) {
    return undefined;
  }

  const meta = isRecord(response.meta)
    ? response.meta
    : isRecord(response.data) && isRecord(response.data.meta)
      ? response.data.meta
      : undefined;

  if (!meta) {
    return undefined;
  }

  return {
    page: getNumber(meta.page) ?? 1,
    limit: getNumber(meta.limit) ?? 20,
    total: getNumber(meta.total),
    totalPages: getNumber(meta.totalPages),
    hasNext: getBoolean(meta.hasNext) ?? getBoolean(meta.hasNextPage),
    hasPrevious: getBoolean(meta.hasPrevious) ?? getBoolean(meta.hasPrevPage),
  };
};

export const getNearbyBranches = async ({
  lat,
  lng,
  page = 1,
  limit = 20,
}: NearbyBranchesParams): Promise<NearbyBranchesResponse> => {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Both lat and lng are required to fetch nearby branches.");
  }

  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    page: String(page),
    limit: String(limit),
  });

  const response = await getRequest(`/branches?${params.toString()}`);
  const branches = getBranchesPayload(response)
    .map(normalizeNearbyBranch)
    .filter((branch): branch is NearbyBranch => Boolean(branch));

  return {
    branches,
    meta: getMetaPayload(response) ?? { page, limit },
  };
};
