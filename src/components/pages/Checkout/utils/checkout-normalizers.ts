import type {
  CartAppliedPromotion,
  CartChargeBreakdown,
  CartChargeLine,
  CartQuote as NormalizedCartQuote,
} from "@/types/cart";

export type ApiRecord = Record<string, unknown>;

export type BackendErrorState = {
  context: string;
  message: string;
  code?: string;
  path?: string;
  timestamp?: string;
};

export type CartModifier = {
  id?: string;
  modifierId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  priceDelta?: number | string | null;
  total: number;
};

export type CartSection = {
  slot: string;
  label: string;
  menuItemId?: string | number;
  menuItemName: string;
  unitPrice: number;
};

export type CartIncludedItem = {
  type?: string;
  id?: string | number;
  menuItemId?: string | number;
  variationId?: string | number;
  name: string;
  quantity: number;
  menuItem?: ApiRecord;
  selectedModifiers: CartModifier[];
};

export type CartItem = {
  id?: string | number;
  type?: string;
  menuItemId?: string | number;
  restaurantMenuId?: string | number;
  cartItemIds?: string[];
  menuItemIds?: string[];
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
  selectedVariation?: ApiRecord | null;
  variationId?: string | number;
  selectedModifiers: CartModifier[];
  selectedSections: CartSection[];
  sections: CartSection[];
  menuItem?: ApiRecord;
  note: string;
  prepTimeMinutes: number;
  depositAmount?: unknown;
  depositTotal?: unknown;
  pickupPrice?: unknown;
  pickupUnitPrice?: unknown;
  takeawayPriceAdjustment?: unknown;
  deliveryPriceAdjustment?: unknown;
  dealId?: string | null;
  deal?: ApiRecord;
  promotion?: ApiRecord | null;
  happyHour?: ApiRecord | null;
  promotionDiscountAmount?: number;
  discountedUnitPrice?: number | null;
  discountedLineTotal?: number | null;
  includedItems?: CartIncludedItem[];
};

export type CartResponse = {
  items: ApiRecord[];
  quote: NormalizedCartQuote | null;
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

const getServiceChargeType = (value: unknown) =>
  typeof value === "string" && value.trim() ? value : null;

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
  const category = asRecord(menuItem.category);
  const flatModifiers = [
    ...normalizeArray<ApiRecord>(menuItem.modifiers),
    ...normalizeArray<ApiRecord>(category.modifiers),
  ];
  const flatModifier = flatModifiers.find(({ id }) => String(id || "") === modifierId);

  if (flatModifier) {
    return {
      name: getStringValue(flatModifier.name, "Add-on"),
      unitPrice: toNumber(flatModifier.priceDelta, 0),
    };
  }

  const modifierGroups = [
    ...normalizeArray<ApiRecord>(menuItem.modifierGroups),
    ...normalizeArray<ApiRecord>(category.modifierGroups),
    ...normalizeArray<ApiRecord>(menuItem.categoryModifierGroups),
    ...normalizeArray<ApiRecord>(category.categoryModifierGroups),
  ];

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

const normalizeGroupedModifiers = (
  cartItem: ApiRecord,
  selections: ApiRecord[]
): CartModifier[] => {
  return selections.flatMap((selection) => {
    const groupName = getStringValue(selection.groupName || selection.name, "");

    return normalizeArray<ApiRecord>(selection.modifiers).map((modifier) => {
      const nestedModifier = asRecord(modifier.modifier);
      const modifierId = String(
        modifier.modifierId || nestedModifier.id || modifier.id || ""
      );
      const quantity = Math.max(1, toNumber(modifier.quantity, 1));
      const fallbackModifier = getModifierPriceFromGroups(cartItem, modifierId);
      const unitPrice = toNumber(
        modifier.unitPrice ?? modifier.priceDelta ?? nestedModifier.priceDelta,
        fallbackModifier.unitPrice
      );
      const modifierName = getStringValue(
        modifier.name || nestedModifier.name,
        fallbackModifier.name
      );

      return {
        id: getStringValue(modifier.id),
        modifierId,
        name: groupName ? `${groupName}: ${modifierName}` : modifierName,
        quantity,
        unitPrice,
        priceDelta: (modifier.priceDelta ?? nestedModifier.priceDelta) as
          | number
          | string
          | null
          | undefined,
        total: toNumber(modifier.total, unitPrice * quantity),
      };
    });
  });
};

export const getSelectedModifiers = (cartItemInput: unknown): CartModifier[] => {
  const cartItem = asRecord(cartItemInput);

  if (Array.isArray(cartItem.selectedModifiers)) {
    const selectedModifiers = normalizeArray<ApiRecord>(cartItem.selectedModifiers);

    if (selectedModifiers.some((modifier) => Array.isArray(modifier.modifiers))) {
      return normalizeGroupedModifiers(cartItem, selectedModifiers);
    }

    return selectedModifiers.map((modifier) => {
      const quantity = Math.max(1, toNumber(modifier.quantity, 1));
      const unitPrice = toNumber(modifier.unitPrice ?? modifier.priceDelta, 0);
      const total = toNumber(modifier.total, unitPrice * quantity);

      return {
        id: getStringValue(modifier.id),
        modifierId: getStringValue(modifier.modifierId),
        name: getStringValue(modifier.name, "Add-on"),
        quantity,
        unitPrice,
        priceDelta: modifier.priceDelta as number | string | null | undefined,
        total,
      };
    });
  }

  if (Array.isArray(cartItem.modifierSelections)) {
    return normalizeGroupedModifiers(
      cartItem,
      normalizeArray<ApiRecord>(cartItem.modifierSelections)
    );
  }

  return normalizeArray<ApiRecord>(cartItem.modifiers).map((modifier) => {
    const modifierId = String(modifier.modifierId || "");
    const quantity = Math.max(1, toNumber(modifier.quantity, 1));
    const fallbackModifier = getModifierPriceFromGroups(cartItem, modifierId);
    const unitPrice = fallbackModifier.unitPrice;

    return {
      id: getStringValue(modifier.id),
      modifierId,
      name: fallbackModifier.name,
      quantity,
      unitPrice,
      priceDelta: modifier.priceDelta as number | string | null | undefined,
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

const normalizeIncludedDealItem = (itemInput: unknown): CartIncludedItem => {
  const item = asRecord(itemInput);
  const menuItem = asRecord(item.menuItem);

  return {
    type: getStringValue(item.type) || undefined,
    id: item.id as string | number | undefined,
    menuItemId: item.menuItemId as string | number | undefined,
    variationId: item.variationId as string | number | undefined,
    name: getStringValue(menuItem.name || item.name, "Included item"),
    quantity: Math.max(1, toNumber(item.quantity, 1)),
    menuItem,
    selectedModifiers: getSelectedModifiers(item),
  };
};

const getCartItemRestaurantMenuId = (item: ApiRecord, menuItem: ApiRecord) => {
  const restaurantMenu = asRecord(item.restaurantMenu || menuItem.restaurantMenu);
  const menuLinks = [
    ...normalizeArray<ApiRecord>(item.menuLinks),
    ...normalizeArray<ApiRecord>(menuItem.menuLinks),
  ];
  const linkedMenu = menuLinks.find((link) =>
    link.restaurantMenuId || link.menuId || asRecord(link.restaurantMenu).id
  );

  return (
    item.restaurantMenuId ||
    restaurantMenu.id ||
    menuItem.restaurantMenuId ||
    linkedMenu?.restaurantMenuId ||
    linkedMenu?.menuId ||
    asRecord(linkedMenu?.restaurantMenu).id
  ) as string | number | undefined;
};

export const normalizeCartItem = (itemInput: unknown): CartItem => {
  const item = asRecord(itemInput);
  const type = getStringValue(item.type, "ITEM").toUpperCase();
  const dealId = typeof item.dealId === "string" ? item.dealId : null;
  const deal = asRecord(item.deal);
  const menuItem = asRecord(item.menuItem);
  const category = asRecord(menuItem.category);
  const itemSelectedVariation = asRecord(item.selectedVariation);
  const menuItemSelectedVariation = asRecord(menuItem.selectedVariation);
  const selectedVariation = Object.keys(itemSelectedVariation).length
    ? itemSelectedVariation
    : menuItemSelectedVariation;
  const quantity = Math.max(1, toNumber(item.quantity, 1));
  const selectedModifiers = getSelectedModifiers(item);
  const selectedSections = getSelectedSections(item);
  const prepTimeMinutes = Math.max(
    0,
    toNumber(item.prepTimeMinutes ?? menuItem.prepTimeMinutes, 0)
  );

  const fallbackModifiersTotal = selectedModifiers.reduce((acc, modifier) => acc + toNumber(modifier.total, 0), 0);
  const highestSplitPizzaHalfPrice = selectedSections.reduce(
    (highestPrice, section) => Math.max(highestPrice, toNumber(section.unitPrice, 0)),
    0
  );

  const itemUnitPrice = toNumber(
    item.unitPrice ?? (highestSplitPizzaHalfPrice > 0 ? highestSplitPizzaHalfPrice : undefined) ?? deal.fixedPrice ?? menuItem.unitPrice ?? selectedVariation.price ?? item.price,
    0
  );
  const modifiersTotal = toNumber(item.modifiersTotal, fallbackModifiersTotal);
  const unitPriceWithModifiers = toNumber(item.unitPriceWithModifiers, itemUnitPrice + modifiersTotal);
  const lineTotal = toNumber(item.lineTotal, unitPriceWithModifiers * quantity);

  return {
    id: item.id as string | number | undefined,
    type,
    menuItemId: item.menuItemId as string | number | undefined,
    restaurantMenuId: getCartItemRestaurantMenuId(item, menuItem),
    cartItemIds: normalizeArray<string>(item.cartItemIds),
    menuItemIds: normalizeArray<string>(item.menuItemIds),
    categoryId: category.id as string | number | undefined,
    slug: type === "DEAL" ? "" : getStringValue(menuItem.slug),
    quantity,
    name: type === "DEAL"
      ? getStringValue(deal.title || item.name, "Deal")
      : getStringValue(menuItem.name || item.name || item.menuItemName, "Untitled Item"),
    price: unitPriceWithModifiers,
    unitPrice: itemUnitPrice,
    itemUnitPrice,
    modifiersTotal,
    unitPriceWithModifiers,
    lineTotal,
    desc: type === "DEAL"
      ? getStringValue(deal.description)
      : getStringValue(menuItem.description || item.description),
    img: type === "DEAL"
      ? getStringValue(deal.imageUrl)
      : getStringValue(menuItem.imageUrl || item.imageUrl),
    selectedVariationName: dealId
      ? ""
      : getStringValue(selectedVariation.displayText || selectedVariation.name),
    selectedVariation: dealId ? null : selectedVariation,
    variationId: dealId
      ? undefined
      : (item.variationId || selectedVariation.id) as string | number | undefined,
    selectedModifiers,
    selectedSections,
    sections: selectedSections,
    menuItem,
    note: getStringValue(item.note),
    prepTimeMinutes,
    depositAmount: item.depositAmount ?? menuItem.depositAmount,
    depositTotal: item.depositTotal,
    pickupPrice: item.pickupPrice ?? menuItem.pickupPrice,
    pickupUnitPrice: item.pickupUnitPrice,
    takeawayPriceAdjustment: menuItem.takeawayPriceAdjustment,
    deliveryPriceAdjustment: menuItem.deliveryPriceAdjustment,
    dealId,
    deal,
    promotion: Object.keys(asRecord(item.promotion)).length ? asRecord(item.promotion) : null,
    happyHour: Object.keys(asRecord(item.happyHour)).length ? asRecord(item.happyHour) : null,
    promotionDiscountAmount: Math.max(0, toNumber(item.promotionDiscountAmount, 0)),
    discountedUnitPrice: item.discountedUnitPrice === null || item.discountedUnitPrice === undefined
      ? null
      : Math.max(0, toNumber(item.discountedUnitPrice, 0)),
    discountedLineTotal: item.discountedLineTotal === null || item.discountedLineTotal === undefined
      ? null
      : Math.max(0, toNumber(item.discountedLineTotal, 0)),
    includedItems: normalizeArray<ApiRecord>(item.includedItems).map(normalizeIncludedDealItem),
  };
};

export const getCartItemLineTotal = (
  item: {
    lineTotal?: unknown;
    unitPriceWithModifiers?: unknown;
    price?: unknown;
    quantity?: unknown;
  }
) => {
  const quantity = Math.max(1, toNumber(item.quantity, 1));
  const explicitLineTotal = toNumber(item.lineTotal, Number.NaN);

  if (Number.isFinite(explicitLineTotal)) {
    return explicitLineTotal;
  }

  const unitPriceWithModifiers = toNumber(item.unitPriceWithModifiers, Number.NaN);

  if (Number.isFinite(unitPriceWithModifiers)) {
    return unitPriceWithModifiers * quantity;
  }

  return toNumber(item.price, 0) * quantity;
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

export const normalizeCartAppliedPromotion = (value: unknown): CartAppliedPromotion | null => {
  const promotion = asRecord(value);
  const id = getStringValue(promotion.id);
  const title = getStringValue(promotion.title);

  if (!id && !title) {
    return null;
  }

  return {
    id,
    title,
    applyMode: getStringValue(promotion.applyMode) || undefined,
    autoApply: typeof promotion.autoApply === "boolean" ? promotion.autoApply : undefined,
    discountType: getStringValue(promotion.discountType) || undefined,
    discountValue: toNumber(promotion.discountValue, 0),
    discountAmount: toNumber(promotion.discountAmount, 0),
  };
};

const normalizeChargeLine = (value: unknown): CartChargeLine | null => {
  const line = asRecord(value);

  if (!Object.keys(line).length) {
    return null;
  }

  const code = getStringValue(line.code);
  const label = getStringValue(line.label);

  return {
    ...(code ? { code } : {}),
    ...(label ? { label } : {}),
    percentage: toNumber(line.percentage, 0),
    amount: toNumber(line.amount, 0),
  };
};

const normalizeChargeLines = (value: unknown) =>
  Array.isArray(value)
    ? value.map(normalizeChargeLine).filter((line): line is CartChargeLine => Boolean(line))
    : [];

const normalizeCartChargeBreakdown = (value: unknown): CartChargeBreakdown | undefined => {
  const breakdown = asRecord(value);

  if (!Object.keys(breakdown).length) {
    return undefined;
  }

  const taxes = normalizeChargeLines(breakdown.taxes);
  const serviceCharges = normalizeChargeLines(breakdown.serviceCharges);
  const availableTaxTypes = Array.isArray(breakdown.availableTaxTypes)
    ? breakdown.availableTaxTypes
        .map((taxType) => {
          const record = asRecord(taxType);

          if (!Object.keys(record).length) {
            return null;
          }

          const code = getStringValue(record.code);
          const label = getStringValue(record.label);

          return {
            ...(code ? { code } : {}),
            ...(label ? { label } : {}),
            percentage: toNumber(record.percentage, 0),
            isActive: typeof record.isActive === "boolean" ? record.isActive : undefined,
            isDefault: typeof record.isDefault === "boolean" ? record.isDefault : undefined,
          };
        })
        .filter((taxType): taxType is NonNullable<typeof taxType> => Boolean(taxType))
    : [];

  return {
    taxes,
    availableTaxTypes,
    totalTaxAmount: toNumber(breakdown.totalTaxAmount, 0),
    serviceCharges,
    totalServiceChargeAmount: toNumber(breakdown.totalServiceChargeAmount, 0),
  };
};

export const normalizeCartQuote = (value: unknown): NormalizedCartQuote | null => {
  const quote = asRecord(value);

  if (!Object.keys(quote).length) {
    return null;
  }

  const couponCode = getStringValue(quote.couponCode);

  return {
    subtotal: toNumber(quote.subtotal, 0),
    taxAmount: toNumber(quote.taxAmount, 0),
    deliveryFee: toNumber(quote.deliveryFee, 0),
    serviceChargeType: getServiceChargeType(quote.serviceChargeType),
    serviceChargeValue: quote.serviceChargeValue === null || quote.serviceChargeValue === undefined
      ? null
      : toNumber(quote.serviceChargeValue, 0),
    serviceChargeAmount: toNumber(quote.serviceChargeAmount, 0),
    tipAmount: toNumber(quote.tipAmount, 0),
    discountAmount: toNumber(quote.discountAmount, 0),
    ...(couponCode ? { couponCode } : {}),
    loyaltyDiscountAmount: toNumber(quote.loyaltyDiscountAmount, 0),
    loyaltyPointsRedeemed: toNumber(quote.loyaltyPointsRedeemed, 0),
    walletAppliedAmount: toNumber(quote.walletAppliedAmount, 0),
    totalAmount: toNumber(quote.totalAmount, 0),
    payableAmount: toNumber(quote.payableAmount, toNumber(quote.totalAmount, 0)),
    appliedPromotion: normalizeCartAppliedPromotion(quote.appliedPromotion),
    chargeBreakdown: normalizeCartChargeBreakdown(quote.chargeBreakdown),
  };
};

export const getAppliedPromotionDiscountLine = (
  quote?: {
    subtotal?: unknown;
    discountAmount?: unknown;
    totalAmount?: unknown;
    appliedPromotion?: {
      id?: string;
      title?: string;
      discountAmount?: unknown;
      discountValue?: unknown;
    } | null;
  } | null
) => {
  const promotion = quote?.appliedPromotion ?? null;
  const discountAmount = Math.max(
    0,
    toNumber(quote?.discountAmount ?? promotion?.discountAmount, 0)
  );

  if (!promotion && discountAmount <= 0) {
    return null;
  }

  return {
    label: promotion?.title || "Deal discount",
    amount: discountAmount,
    discountValue: promotion?.discountValue,
  };
};

const isQuoteRecord = (record: ApiRecord) =>
  "subtotal" in record ||
  "totalAmount" in record ||
  "payableAmount" in record ||
  "deliveryFee" in record ||
  "taxAmount" in record ||
  "chargeBreakdown" in record ||
  "appliedPromotion" in record;

const isDisplayCartItemRecord = (item: ApiRecord) =>
  Boolean(
    item.id ||
      item.cartItemId ||
      item.deal ||
      item.menuItem ||
      Array.isArray(item.selectedModifiers) ||
      Array.isArray(item.selectedSections)
  );

export const normalizeCartResponse = (res: unknown): CartResponse => {
  const record = asRecord(res);
  const data = asRecord(record.data);
  const nestedData = asRecord(data.data);
  const cartData = asRecord(data.cart);
  const cart = data.items || data.quote
    ? data
    : nestedData.items || nestedData.quote
      ? nestedData
      : cartData.items || cartData.quote
        ? cartData
        : data;
  const items = normalizeArray<ApiRecord>(cart.items);
  const hasDisplayCartItems = items.some(isDisplayCartItemRecord);

  return {
    items: hasDisplayCartItems ? items : [],
    quote: normalizeCartQuote(cart.quote) ?? (isQuoteRecord(cart) ? normalizeCartQuote(cart) : null),
  };
};
