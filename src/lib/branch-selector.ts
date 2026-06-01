import { readAuthSession, saveAuthSession } from "@/lib/auth";
import type { AuthContextValue, AuthUser } from "@/types/auth";
import type { BranchApiResponse, BranchRecord } from "@/types/branch-selector";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getString = (value: unknown) => (typeof value === "string" ? value : undefined);

const getBoolean = (value: unknown) => (typeof value === "boolean" ? value : undefined);

const getNumber = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const normalizeBranchAddress = (value: unknown): BranchRecord["address"] | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    area: getString(value.area),
    city: getString(value.city),
    state: getString(value.state),
    country: getString(value.country),
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
  }));
};

const normalizeBranchSettings = (value: unknown): BranchRecord["settings"] | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    openingHours: normalizeOpeningHours(value.openingHours),
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
  options: { includeBranch?: boolean } = {}
) {
  const auth = readAuthSession();

  if (auth?.user) {
    saveAuthSession({
      ...auth,
      user: {
        ...auth.user,
        branchId: branch.id,
        branch: options.includeBranch === false ? auth.user.branch : branch,
      },
    });
  }

  if (setUser) {
    setUser((prev: AuthUser | null) => {
      if (!prev) return prev;

      return {
        ...prev,
        branchId: branch.id,
        branch: options.includeBranch === false ? prev.branch : branch,
      };
    });
  }
}

export function getBranchAddressText(branch: BranchRecord) {
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
