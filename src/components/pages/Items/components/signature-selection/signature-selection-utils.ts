import type { ApiRecord, CartItemRecord, MenuRecord, Modifier, SelectedModifiersMap } from "./types";

export const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const normalizeArray = <T = unknown,>(value: unknown): T[] => {
  if (!value) return [];
  return Array.isArray(value) ? (value as T[]) : [];
};

export const normalizeApiList = <T = unknown,>(res: unknown): T[] => {
  const record = typeof res === "object" && res !== null ? (res as ApiRecord) : {};
  const data = record.data;
  const dataRecord = typeof data === "object" && data !== null ? (data as ApiRecord) : {};

  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(dataRecord.data)) return dataRecord.data as T[];
  if (Array.isArray(dataRecord.items)) return dataRecord.items as T[];
  if (Array.isArray(record.items)) return record.items as T[];
  return [];
};

export const normalizeApiMeta = (res: unknown): ApiRecord => {
  const record = typeof res === "object" && res !== null ? (res as ApiRecord) : {};
  const data = typeof record.data === "object" && record.data !== null ? (record.data as ApiRecord) : {};
  const nestedData = typeof data.data === "object" && data.data !== null ? (data.data as ApiRecord) : {};

  const meta = data.pagination || data.meta || nestedData.pagination || nestedData.meta || record.pagination || record.meta;
  return typeof meta === "object" && meta !== null && !Array.isArray(meta) ? (meta as ApiRecord) : {};
};

export const sortBySortOrder = <T extends { sortOrder?: number }>(items: T[]) =>
  [...items].sort((a, b) => toNumber(a?.sortOrder, 0) - toNumber(b?.sortOrder, 0));

export const groupMenuRecords = (items: MenuRecord[]): MenuRecord[] => {
  const deduped = new Map<string, MenuRecord>();

  items.forEach(({ id, isActive, sortOrder, items: menuItems, ...menu }) => {
    if (!id) return;
    if (isActive === false) return;

    deduped.set(String(id), {
      ...menu,
      id: String(id),
      isActive,
      sortOrder: toNumber(sortOrder, 0),
      items: Array.isArray(menuItems) ? menuItems : [],
    });
  });

  return sortBySortOrder([...deduped.values()]);
};

export const getActiveMenuId = (menus: MenuRecord[], currentId?: string | null) => {
  if (currentId && menus.some(({ id }) => id === currentId)) return currentId;
  return menus[0]?.id ?? "";
};

export const getPriceDisplay = (price: unknown) => toNumber(price, 0).toFixed(2);

export const normalizeSelectedModifiers = (selectedModifiers: SelectedModifiersMap) =>
  Object.values(selectedModifiers)
    .flat()
    .filter(({ id, selectedQuantity }) => id && selectedQuantity > 0)
    .map(({ id, selectedQuantity }) => ({ modifierId: id, quantity: selectedQuantity }));

export const getSelectedModifierTotal = (cartItem: CartItemRecord) => {
  const selectedModifiers = normalizeArray<{ modifierId?: string | number; quantity?: string | number }>(cartItem?.modifiers);
  const modifierGroups = normalizeArray<{ modifiers?: Modifier[] }>(cartItem?.menuItem?.modifierGroups);
  const modifierPriceMap = new Map<string, number>();

  modifierGroups.forEach(({ modifiers }) => {
    normalizeArray<Modifier>(modifiers).forEach(({ id, priceDelta }) => {
      if (!id) return;
      modifierPriceMap.set(String(id), toNumber(priceDelta, 0));
    });
  });

  return selectedModifiers.reduce((acc, { modifierId, quantity }) => {
    const id = String(modifierId ?? "");
    const selectedQuantity = Math.max(1, toNumber(quantity, 1));
    return acc + toNumber(modifierPriceMap.get(id), 0) * selectedQuantity;
  }, 0);
};

export const getCartItemUnitPrice = (cartItem: CartItemRecord) =>
  toNumber(
    cartItem?.price ??
      cartItem?.menuItem?.unitPrice ??
      cartItem?.menuItem?.selectedVariation?.price ??
      cartItem?.menuItem?.basePrice ??
      0,
    0
  );
