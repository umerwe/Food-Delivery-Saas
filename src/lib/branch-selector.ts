import { readAuthSession, saveAuthSession } from "@/lib/auth";
import type { AuthContextValue, AuthUser } from "@/types/auth";
import type { BranchOrderType, BranchTemporaryClosure, NearbyBranch } from "@/types/branches";
import type { BranchApiResponse, BranchRecord } from "@/types/branch-selector";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getString = (value: unknown) => (typeof value === "string" ? value : undefined);

const getBoolean = (value: unknown) => (typeof value === "boolean" ? value : undefined);

const getNullableString = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value) : null;

const getNumber = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const getNullableNumber = (value: unknown) => {
  const numberValue = getNumber(value);
  return numberValue ?? null;
};

const normalizeBranchAddress = (value: unknown): BranchRecord["address"] | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    id: getString(value.id),
    street: getNullableString(value.street),
    area: getNullableString(value.area),
    city: getNullableString(value.city),
    state: getNullableString(value.state),
    country: getNullableString(value.country),
    postalCode: getNullableString(value.postalCode),
    lat: getNullableString(value.lat),
    lng: getNullableString(value.lng),
  };
};

const normalizeOpeningHours = (value: unknown): NonNullable<BranchRecord["settings"]>["openingHours"] => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.filter(isRecord).map((entry) => ({
    dayOfWeek: getString(entry.dayOfWeek),
    isClosed: getBoolean(entry.isClosed),
    openTime: getString(entry.openTime),
    closeTime: getString(entry.closeTime),
    breakTimes: Array.isArray(entry.breakTimes)
      ? entry.breakTimes.filter(isRecord).map((breakTime) => ({
          startTime: getString(breakTime.startTime),
          endTime: getString(breakTime.endTime),
          note: getString(breakTime.note),
        }))
      : undefined,
    note: getString(entry.note),
  }));
};

const normalizeTemporaryClosure = (value: unknown): BranchTemporaryClosure | null => {
  if (!isRecord(value)) {
    return null;
  }

  return {
    isClosed: getBoolean(value.isClosed),
    closedAt: getNullableString(value.closedAt),
    closedUntil: getNullableString(value.closedUntil),
    reason: getNullableString(value.reason),
    message: getNullableString(value.message),
  };
};

const normalizeBranchSettings = (value: unknown): BranchRecord["settings"] | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    ...value,
    allowedOrderTypes: Array.isArray(value.allowedOrderTypes)
      ? value.allowedOrderTypes
          .map((orderType) => getString(orderType))
          .filter((orderType): orderType is BranchOrderType => Boolean(orderType))
      : undefined,
    deliveryConfig: value.deliveryConfig,
    temporaryClosure: normalizeTemporaryClosure(value.temporaryClosure),
    openingHours: normalizeOpeningHours(value.openingHours),
  };
};

const normalizeAvailability = (value: unknown): BranchRecord["availability"] => {
  if (!isRecord(value)) {
    return null;
  }

  return {
    isAvailable: getBoolean(value.isAvailable),
    isActive: getBoolean(value.isActive),
    isTemporarilyClosed: getBoolean(value.isTemporarilyClosed),
    isHolidayClosed: getBoolean(value.isHolidayClosed),
    status: getString(value.status),
    reason: getNullableString(value.reason),
    temporaryClosure: normalizeTemporaryClosure(value.temporaryClosure),
    holidayOpeningHour: value.holidayOpeningHour,
  };
};

export const normalizeBranch = (value: unknown): BranchRecord | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = getString(value.id);
  const name = getString(value.name);

  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    isActive: getBoolean(value.isActive),
    restaurantId: getString(value.restaurantId) ?? null,
    address: normalizeBranchAddress(value.address),
    settings: normalizeBranchSettings(value.settings),
    distanceKm: getNullableNumber(value.distanceKm),
    availability: normalizeAvailability(value.availability),
  };
};

export const normalizeBranchList = (response: unknown): BranchRecord[] => {
  if (Array.isArray(response)) {
    return response.map(normalizeBranch).filter((branch): branch is BranchRecord => Boolean(branch));
  }

  if (!isRecord(response)) {
    return [];
  }

  const data = response.data;

  if (Array.isArray(data)) {
    return data.map(normalizeBranch).filter((branch): branch is BranchRecord => Boolean(branch));
  }

  if (isRecord(data) && Array.isArray(data.data)) {
    return data.data.map(normalizeBranch).filter((branch): branch is BranchRecord => Boolean(branch));
  }

  if (isRecord(data) && Array.isArray(data.items)) {
    return data.items.map(normalizeBranch).filter((branch): branch is BranchRecord => Boolean(branch));
  }

  if (Array.isArray(response.items)) {
    return response.items.map(normalizeBranch).filter((branch): branch is BranchRecord => Boolean(branch));
  }

  return [];
};

export const normalizeBranchApiResponse = (response: unknown): BranchApiResponse => {
  const data = normalizeBranchList(response);
  const record = isRecord(response) ? response : {};
  const meta = isRecord(record.meta) ? record.meta : {};

  return {
    data,
    meta: {
      total: getNumber(meta.total),
      page: getNumber(meta.page),
      limit: getNumber(meta.limit),
      totalPages: getNumber(meta.totalPages),
      hasNextPage: getBoolean(meta.hasNextPage),
      hasPrevPage: getBoolean(meta.hasPrevPage),
    },
    total: getNumber(record.total),
    page: getNumber(record.page),
    limit: getNumber(record.limit),
    totalPages: getNumber(record.totalPages),
    hasNextPage: getBoolean(record.hasNextPage),
    hasPrevPage: getBoolean(record.hasPrevPage),
  };
};

export const getActiveBranches = (response: unknown) =>
  normalizeBranchList(response).filter((branch) => branch.isActive !== false);

export function persistSelectedBranch(
  branch: BranchRecord,
  setUser?: AuthContextValue["setUser"],
  options: { includeBranch?: boolean; orderType?: BranchOrderType } = {}
) {
  const auth = readAuthSession();
  const selectedBranch = options.orderType
    ? { ...branch, selectedOrderType: options.orderType }
    : branch;

  if (auth?.user) {
    saveAuthSession({
      ...auth,
      user: {
        ...auth.user,
        branchId: branch.id,
        restaurantId: branch.restaurantId ?? auth.user.restaurantId ?? null,
        selectedOrderType: options.orderType ?? auth.user.selectedOrderType ?? null,
        branch: options.includeBranch === false ? auth.user.branch : selectedBranch,
      },
    });
  }

  if (setUser) {
    setUser((prev: AuthUser | null) => {
      if (!prev) return prev;

      return {
        ...prev,
        branchId: branch.id,
        restaurantId: branch.restaurantId ?? prev.restaurantId ?? null,
        selectedOrderType: options.orderType ?? prev.selectedOrderType ?? null,
        branch: options.includeBranch === false ? prev.branch : selectedBranch,
      };
    });
  }
}

export function getBranchAddressText(branch: BranchRecord) {
  return formatBranchAddress(branch);
}

export const branchSupportsPickup = (branch: Pick<BranchRecord, "settings"> | NearbyBranch) =>
  branch.settings?.allowedOrderTypes?.includes("TAKEAWAY") ?? false;

export const branchSupportsDelivery = (branch: Pick<BranchRecord, "settings"> | NearbyBranch) =>
  branch.settings?.allowedOrderTypes?.includes("DELIVERY") ?? false;

export function formatBranchAddress(branch: Pick<BranchRecord, "address"> | NearbyBranch) {
  return (
    [
      branch.address?.street,
      branch.address?.area,
      branch.address?.city,
      branch.address?.state,
      branch.address?.country,
      branch.address?.postalCode,
    ]
      .filter(Boolean)
      .join(", ") || "Branch location available"
  );
}

export function formatBranchDistance(distanceKm?: number | null) {
  if (typeof distanceKm !== "number" || !Number.isFinite(distanceKm)) {
    return "";
  }

  if (distanceKm < 1) {
    return `${Math.max(1, Math.round(distanceKm * 1000))} m away`;
  }

  return `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km away`;
}

export function isBranchCurrentlyAvailable(branch: Pick<BranchRecord, "availability" | "isActive"> | NearbyBranch) {
  if (branch.isActive === false || branch.availability?.isActive === false) {
    return false;
  }

  if (branch.availability?.isAvailable === false) {
    return false;
  }

  const status = branch.availability?.status?.toLowerCase();
  return status !== "closed" && status !== "inactive" && status !== "temporarily_closed";
}

export const nearbyBranchToBranchRecord = (branch: NearbyBranch): BranchRecord => ({
  id: branch.id,
  name: branch.name,
  restaurantId: branch.restaurantId ?? null,
  address: branch.address ?? undefined,
  settings: branch.settings ?? undefined,
  distanceKm: branch.distanceKm ?? null,
  availability: branch.availability ?? null,
  isActive: branch.isActive,
});
