export type ApiRecord = Record<string, unknown>;

export type BackendErrorState = {
  context: string;
  message: string;
  code?: string;
  path?: string;
  timestamp?: string;
};

export type CartModifier = {
  modifierId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type CartSection = {
  slot: string;
  label: string;
  menuItemId?: string | number;
  menuItemName: string;
  unitPrice: number;
};

export type CartItem = {
  id?: string | number;
  menuItemId?: string | number;
  categoryId?: string | number;
  slug?: string;
  quantity: number;
  name: string;
  price: number;
  unitPrice: number;
  itemUnitPrice: number;
  modifiersTotal: number;
  unitPriceWithModifiers: number;
  lineTotal: number;
  desc: string;
  img: string;
  selectedVariationName: string;
  selectedVariation?: ApiRecord;
  variationId?: string | number;
  selectedModifiers: CartModifier[];
  selectedSections: CartSection[];
  sections: CartSection[];
  menuItem?: ApiRecord;
  note: string;
  depositAmount?: unknown;
  depositTotal?: unknown;
  pickupPrice?: unknown;
  pickupUnitPrice?: unknown;
  takeawayPriceAdjustment?: unknown;
  deliveryPriceAdjustment?: unknown;
};

export type CartResponse = {
  items: ApiRecord[];
  quote: ApiRecord | null;
};

export const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const asRecord = (value: unknown): ApiRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as ApiRecord)
    : {};

export const normalizeArray = <T = unknown,>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

const getNestedRecord = (record: ApiRecord, key: string) => asRecord(record[key]);

const getStringValue = (value: unknown, fallback = "") => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
};

export const getBackendErrorMessage = (res: unknown, fallback = "Something went wrong") => {
  const record = asRecord(res);
  const error = record.error;
  const errorRecord = asRecord(error);
  const data = getNestedRecord(record, "data");
  const dataError = data.error;
  const dataErrorRecord = asRecord(dataError);
  const responseData = getNestedRecord(getNestedRecord(record, "response"), "data");
  const responseError = responseData.error;
  const responseErrorRecord = asRecord(responseError);

  const candidates = [
    data.message,
    dataErrorRecord.message,
    typeof dataError === "string" ? dataError : "",
    responseData.message,
    responseErrorRecord.message,
    responseError,
    record.message,
    errorRecord.message,
    typeof error === "string" ? error : "",
  ];

  const message = candidates.find((entry) => typeof entry === "string" && entry.trim());
  return String(message || fallback);
};

export const getBackendErrorCode = (res: unknown) => {
  const record = asRecord(res);
  const error = asRecord(record.error);
  const dataError = asRecord(getNestedRecord(record, "data").error);
  const responseError = asRecord(getNestedRecord(getNestedRecord(record, "response"), "data").error);
  return getStringValue(error.code || dataError.code || responseError.code);
};

export const getBackendErrorMeta = (res: unknown): ApiRecord => {
  const record = asRecord(res);
  const data = getNestedRecord(record, "data");
  const responseData = getNestedRecord(getNestedRecord(record, "response"), "data");
  return asRecord(record.meta || data.meta || responseData.meta);
};

export const hasBackendError = (res: unknown) => {
  const record = asRecord(res);
  return !res || record.success === false || Boolean(record.error);
};

const getModifierPriceFromGroups = (cartItem: ApiRecord, modifierId: string) => {
  const menuItem = asRecord(cartItem.menuItem);
  const modifierGroups = normalizeArray<ApiRecord>(menuItem.modifierGroups);

  for (const group of modifierGroups) {
    const modifiers = normalizeArray<ApiRecord>(group.modifiers);
    const modifier = modifiers.find(({ id }) => String(id || "") === modifierId);

    if (modifier) {
      return {
        name: getStringValue(modifier.name, "Add-on"),
        unitPrice: toNumber(modifier.priceDelta, 0),
      };
    }
  }

  return { name: "Add-on", unitPrice: 0 };
};

export const getSelectedModifiers = (cartItemInput: unknown): CartModifier[] => {
  const cartItem = asRecord(cartItemInput);

  if (Array.isArray(cartItem.selectedModifiers)) {
    return normalizeArray<ApiRecord>(cartItem.selectedModifiers).map((modifier) => {
      const quantity = Math.max(1, toNumber(modifier.quantity, 1));
      const unitPrice = toNumber(modifier.unitPrice, 0);
      const total = toNumber(modifier.total, unitPrice * quantity);

      return {
        modifierId: getStringValue(modifier.modifierId),
        name: getStringValue(modifier.name, "Add-on"),
        quantity,
        unitPrice,
        total,
      };
    });
  }

  return normalizeArray<ApiRecord>(cartItem.modifiers).map((modifier) => {
    const modifierId = String(modifier.modifierId || "");
    const quantity = Math.max(1, toNumber(modifier.quantity, 1));
    const fallbackModifier = getModifierPriceFromGroups(cartItem, modifierId);
    const unitPrice = fallbackModifier.unitPrice;

    return {
      modifierId,
      name: fallbackModifier.name,
      quantity,
      unitPrice,
      total: unitPrice * quantity,
    };
  });
};

const getSelectedSectionLabel = (slot?: string) => {
  const normalizedSlot = String(slot || "").toUpperCase();
  if (normalizedSlot === "LEFT") return "Left half";
  if (normalizedSlot === "RIGHT") return "Right half";
  return normalizedSlot ? `${normalizedSlot} half` : "Selected half";
};

export const getSelectedSections = (cartItemInput: unknown): CartSection[] => {
  const cartItem = asRecord(cartItemInput);
  const menuItem = asRecord(cartItem.menuItem);
  const splitPizza = asRecord(menuItem.splitPizza);
  const rawSelectedSections = normalizeArray<ApiRecord>(cartItem.selectedSections);
  const rawSections = normalizeArray<ApiRecord>(cartItem.sections);
  const allowedFlavors = normalizeArray<ApiRecord>(splitPizza.allowedFlavors);

  const selectedSectionBySlot = rawSelectedSections.reduce<Record<string, ApiRecord>>((acc, section) => {
    const slot = String(section.slot || "").toUpperCase();
    if (slot) acc[slot] = section;
    return acc;
  }, {});

  const resolveMenuItemName = (section: ApiRecord, selectedSection?: ApiRecord) => {
    const selectedMenuItem = asRecord(selectedSection?.menuItem);
    const sectionMenuItem = asRecord(section.menuItem);
    const directName =
      selectedSection?.menuItemName || selectedMenuItem.name || section.menuItemName || sectionMenuItem.name;
    if (directName) return String(directName);

    const menuItemId = section.menuItemId || selectedSection?.menuItemId;
    if (String(menuItemId || "") === String(menuItem.id || "")) {
      return getStringValue(menuItem.name, "Selected pizza");
    }

    const flavor = allowedFlavors.find(({ id }) => String(id || "") === String(menuItemId || ""));
    return getStringValue(flavor?.name, "Selected pizza");
  };

  const resolveUnitPrice = (section: ApiRecord, selectedSection?: ApiRecord) =>
    toNumber(selectedSection?.unitPrice ?? selectedSection?.price ?? section.unitPrice ?? section.price, 0);

  const sourceSections = rawSelectedSections.length ? rawSelectedSections : rawSections;

  return sourceSections
    .map((section) => {
      const slot = String(section.slot || "").toUpperCase();
      const selectedSection = selectedSectionBySlot[slot];
      const menuItemId = section.menuItemId || selectedSection?.menuItemId;

      return {
        slot,
        label: getSelectedSectionLabel(slot),
        menuItemId: typeof menuItemId === "string" || typeof menuItemId === "number" ? menuItemId : undefined,
        menuItemName: resolveMenuItemName(section, selectedSection),
        unitPrice: resolveUnitPrice(section, selectedSection),
      };
    })
    .filter(({ slot, menuItemId }) => slot || menuItemId);
};

export const normalizeCartItem = (itemInput: unknown): CartItem => {
  const item = asRecord(itemInput);
  const menuItem = asRecord(item.menuItem);
  const category = asRecord(menuItem.category);
  const selectedVariation = asRecord(menuItem.selectedVariation);
  const quantity = Math.max(1, toNumber(item.quantity, 1));
  const selectedModifiers = getSelectedModifiers(item);
  const selectedSections = getSelectedSections(item);

  const fallbackModifiersTotal = selectedModifiers.reduce((acc, modifier) => acc + toNumber(modifier.total, 0), 0);
  const highestSplitPizzaHalfPrice = selectedSections.reduce(
    (highestPrice, section) => Math.max(highestPrice, toNumber(section.unitPrice, 0)),
    0
  );

  const itemUnitPrice = toNumber(
    item.unitPrice ?? (highestSplitPizzaHalfPrice > 0 ? highestSplitPizzaHalfPrice : undefined) ?? menuItem.unitPrice ?? selectedVariation.price ?? item.price,
    0
  );
  const modifiersTotal = toNumber(item.modifiersTotal, fallbackModifiersTotal);
  const unitPriceWithModifiers = toNumber(item.unitPriceWithModifiers, itemUnitPrice + modifiersTotal);
  const lineTotal = toNumber(item.lineTotal, unitPriceWithModifiers * quantity);

  return {
    id: item.id as string | number | undefined,
    menuItemId: item.menuItemId as string | number | undefined,
    categoryId: category.id as string | number | undefined,
    slug: getStringValue(menuItem.slug),
    quantity,
    name: getStringValue(menuItem.name, "Untitled Item"),
    price: unitPriceWithModifiers,
    unitPrice: itemUnitPrice,
    itemUnitPrice,
    modifiersTotal,
    unitPriceWithModifiers,
    lineTotal,
    desc: getStringValue(menuItem.description),
    img: getStringValue(menuItem.imageUrl),
    selectedVariationName: getStringValue(selectedVariation.displayText || selectedVariation.name),
    selectedVariation,
    variationId: (item.variationId || selectedVariation.id) as string | number | undefined,
    selectedModifiers,
    selectedSections,
    sections: selectedSections,
    menuItem,
    note: getStringValue(item.note),
    depositAmount: item.depositAmount ?? menuItem.depositAmount,
    depositTotal: item.depositTotal,
    pickupPrice: item.pickupPrice ?? menuItem.pickupPrice,
    pickupUnitPrice: item.pickupUnitPrice,
    takeawayPriceAdjustment: menuItem.takeawayPriceAdjustment,
    deliveryPriceAdjustment: menuItem.deliveryPriceAdjustment,
  };
};

export const recalculateCartItemQuantity = (item: CartItem, quantity: number): CartItem => {
  const safeQuantity = Math.max(1, toNumber(quantity, 1));
  const unitPriceWithModifiers = toNumber(item.unitPriceWithModifiers ?? item.price, 0);
  const depositUnitAmount = toNumber(item.depositAmount, 0);
  const depositTotal = depositUnitAmount * safeQuantity;

  return {
    ...item,
    quantity: safeQuantity,
    depositTotal,
    lineTotal: unitPriceWithModifiers * safeQuantity + depositTotal,
  };
};

export const normalizeCartResponse = (res: unknown): CartResponse => {
  const record = asRecord(res);
  const data = asRecord(record.data);
  const nestedData = asRecord(data.data);
  const cart = data.items || data.quote ? data : nestedData.items || nestedData.quote ? nestedData : data;

  return {
    items: normalizeArray<ApiRecord>(cart.items),
    quote: asRecord(cart.quote),
  };
};
