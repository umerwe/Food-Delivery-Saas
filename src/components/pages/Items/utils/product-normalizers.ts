import type { MenuItem } from "@/components/pages/Items/types";

export const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const normalizeArray = <T = unknown>(value: unknown): T[] => {
  if (!value) return [];
  return Array.isArray(value) ? (value as T[]) : [];
};

export const normalizeApiList = <T = unknown>(res: unknown): T[] => {
  const record = typeof res === "object" && res !== null ? (res as Record<string, unknown>) : {};
  const data = record.data;
  const dataRecord = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};

  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(dataRecord.data)) return dataRecord.data as T[];
  if (Array.isArray(dataRecord.items)) return dataRecord.items as T[];
  if (Array.isArray(record.items)) return record.items as T[];
  return [];
};

export const sortBySortOrder = <T extends { sortOrder?: number }>(items: T[]) =>
  [...items].sort((a, b) => toNumber(a?.sortOrder, 0) - toNumber(b?.sortOrder, 0));

export const getItemQuantityLimits = (menuItem: MenuItem | null | undefined) => {
  const minQuantity = Math.max(1, toNumber(menuItem?.minQuantity, 1));
  const rawMaxQuantity = toNumber(menuItem?.maxQuantity, 99);

  return {
    minQuantity,
    maxQuantity: rawMaxQuantity > 0 ? rawMaxQuantity : 99,
  };
};

export const getProductDetailsQuantityLimits = (menuItem: MenuItem | null | undefined) => {
  const minQuantity = Math.max(1, toNumber(menuItem?.minQuantity, 1));
  const rawMaxQuantity = toNumber(menuItem?.maxQuantity, 0);
  const maxQuantity = rawMaxQuantity > 0 ? Math.max(minQuantity, rawMaxQuantity) : undefined;

  return {
    minQuantity,
    maxQuantity,
  };
};

export const getDepositAmount = (menuItem: MenuItem | null | undefined) =>
  toNumber(menuItem?.depositAmount, 0);

export const getSplitPizzaSelectedSectionId = (value: unknown) => {
  const id = typeof value === "string" || typeof value === "number" ? String(value) : "";
  return id.trim();
};
