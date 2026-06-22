import { createDomainApiService } from "@/services/domain-api";
import type { ApiResult } from "@/services/http";
import type { CartModifierSelectionInput } from "@/types/cart";

export type OrderStatus =
  | "PLACED"
  | "CONFIRMED"
  | "PREPARING"
  | "PICKED_UP"
  | "DELIVERED"
  | "SERVED"
  | "CANCELLED"
  | string;

export type OrderMenuItem = {
  id?: string | number | null;
  name?: string | null;
  imageUrl?: string | null;
  category?: { name?: string | null } | null;
};

export type OrderItem = {
  id: string | number;
  menuItemId?: string | number | null;
  menuItemName?: string | null;
  imageUrl?: string | null;
  quantity: number;
  unitPrice?: number | string | null;
  variationId?: string | number | null;
  restaurantMenuId?: string | number | null;
  dealId?: string | number | null;
  note?: string | null;
  modifiers?: OrderModifierInput[];
  modifierSelections?: OrderModifierSelectionInput[];
  selectedModifiers?: OrderModifierInput[];
  includedItems?: OrderItem[];
  menuItem?: OrderMenuItem | null;
};

export type OrderModifierInput = {
  id?: string | number | null;
  modifierId?: string | number | null;
  modifierGroupId?: string | number | null;
  quantity?: number | string | null;
  modifier?: {
    id?: string | number | null;
  } | null;
  modifiers?: OrderModifierInput[];
};

export type OrderModifierSelectionInput = {
  modifierGroupId?: string | number | null;
  modifiers?: OrderModifierInput[];
};

export type OrderReview = {
  id?: string;
  orderId?: string;
  rating: number;
  comment?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type OrderBranch = {
  id?: string | number | null;
  name?: string | null;
  logoUrl?: string | null;
  coverImage?: string | null;
};

export type OrderRestaurant = {
  id?: string | number | null;
  name?: string | null;
  slug?: string | null;
  logoUrl?: string | null;
  coverImage?: string | null;
};

export type OrderDeliveryAddress = {
  id?: string | number | null;
  street?: string | null;
  area?: string | null;
  postalCode?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  houseNumber?: string | null;
};

export type OrderTransaction = {
  id: string;
  orderId?: string | null;
  paymentMethod?: string | null;
  type?: string | null;
  status?: string | null;
  amount?: number | string | null;
  currency?: string | null;
  providerRef?: string | null;
  note?: string | null;
  processedAt?: string | null;
  createdAt?: string | null;
};

export type Order = {
  id: string;
  orderType?: string | null;
  status: OrderStatus;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  orderTime?: string | null;
  isScheduled?: boolean | null;
  subtotal?: number | string | null;
  deliveryFee?: number | string | null;
  taxAmount?: number | string | null;
  serviceChargeType?: string | null;
  serviceChargeValue?: number | string | null;
  serviceChargeAmount?: number | string | null;
  tipAmount?: number | string | null;
  discountAmount?: number | string | null;
  payableAmount?: number | string | null;
  totalAmount?: number | string | null;
  items?: OrderItem[];
  itemsPreview?: OrderItem[];
  restaurant?: OrderRestaurant | null;
  branch?: OrderBranch | null;
  deliveryAddress?: OrderDeliveryAddress | null;
  transactions?: OrderTransaction[];
  createdAt: string;
  review?: OrderReview | null;
};

export type OrderMeta = {
  page?: number;
  totalPages?: number;
  total?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
};

export type ReorderPayload = {
  menuItemId?: string | number | null;
  restaurantMenuId?: string | number | null;
  variationId?: string | number | null;
  dealId?: string | number | null;
  quantity: number;
  branchId: string | number;
  modifiers?: Array<{ modifierId: string; quantity: number }>;
  modifierSelections?: CartModifierSelectionInput[];
  note?: string;
};

export type DirectOrderPayload = Record<string, unknown> & {
  tipAmount?: number;
};

export type SubmitOrderReviewPayload = {
  rating: number;
  comment?: string;
};

export const canReviewOrder = (order: Pick<Order, "orderType" | "status" | "review">) => {
  if (order.review) {
    return false;
  }

  const orderType = String(order.orderType || "").toUpperCase();
  const status = String(order.status || "").toUpperCase();

  if (orderType === "DELIVERY") {
    return status === "DELIVERED";
  }

  if (orderType === "TAKEAWAY" || orderType === "PICKUP") {
    return status === "PICKED_UP";
  }

  if (orderType === "DINE_IN" || orderType === "DINEIN" || orderType === "TABLE") {
    return status === "SERVED";
  }

  return false;
};

const ordersService = createDomainApiService();

export const getOrders = ordersService.get;
export const postOrders = ordersService.post;
export const patchOrders = ordersService.patch;
export const deleteOrders = ordersService.del;

const getRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const getString = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

const getNumber = (value: unknown, fallback = 1) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeFlatModifiers = (value: unknown): Array<{ modifierId: string; quantity: number }> => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((modifier) => {
      const record = getRecord(modifier);
      const nestedModifier = getRecord(record?.modifier);
      const modifierId = getString(record?.modifierId || record?.id || nestedModifier?.id);

      return {
        modifierId,
        quantity: getNumber(record?.quantity, 1),
      };
    })
    .filter((modifier) => modifier.modifierId);
};

const normalizeModifierSelections = (value: unknown): CartModifierSelectionInput[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((selection) => {
      const record = getRecord(selection);
      const modifierGroupId = getString(record?.modifierGroupId || record?.id);
      const modifiers = normalizeFlatModifiers(record?.modifiers);

      return {
        modifierGroupId,
        modifiers,
      };
    })
    .filter((selection) => selection.modifierGroupId && selection.modifiers.length > 0);
};

const groupSelectedModifiers = (value: unknown): CartModifierSelectionInput[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const grouped = new Map<string, Array<{ modifierId: string; quantity: number }>>();

  value.forEach((modifier) => {
    const record = getRecord(modifier);
    const modifierGroupId = getString(record?.modifierGroupId);
    const nestedModifier = getRecord(record?.modifier);
    const modifierId = getString(record?.modifierId || record?.id || nestedModifier?.id);

    if (!modifierGroupId || !modifierId) {
      return;
    }

    grouped.set(modifierGroupId, [
      ...(grouped.get(modifierGroupId) || []),
      {
        modifierId,
        quantity: getNumber(record?.quantity, 1),
      },
    ]);
  });

  return Array.from(grouped, ([modifierGroupId, modifiers]) => ({
    modifierGroupId,
    modifiers,
  }));
};

const buildItemReorderPayload = ({
  branchId,
  item,
  parentDealId,
}: {
  branchId: string | number;
  item: OrderItem;
  parentDealId?: string | number | null;
}): ReorderPayload | null => {
  const menuItemId = getString(item.menuItemId || item.menuItem?.id);

  if (!menuItemId) {
    return null;
  }

  const explicitModifierSelections = normalizeModifierSelections(item.modifierSelections);
  const groupedSelectedModifiers = normalizeModifierSelections(item.selectedModifiers);
  const selectedModifiersByGroup = groupSelectedModifiers(item.selectedModifiers);
  const modifierSelections =
    explicitModifierSelections.length > 0
      ? explicitModifierSelections
      : groupedSelectedModifiers.length > 0
        ? groupedSelectedModifiers
        : selectedModifiersByGroup;

  const modifiers =
    modifierSelections.length > 0
      ? []
      : normalizeFlatModifiers(item.modifiers).length > 0
        ? normalizeFlatModifiers(item.modifiers)
        : normalizeFlatModifiers(item.selectedModifiers);

  return {
    menuItemId,
    branchId,
    quantity: getNumber(item.quantity, 1),
    ...(item.restaurantMenuId ? { restaurantMenuId: item.restaurantMenuId } : {}),
    ...(item.variationId ? { variationId: item.variationId } : {}),
    ...(parentDealId || item.dealId ? { dealId: parentDealId || item.dealId } : {}),
    ...(item.note ? { note: item.note } : { note: "" }),
    ...(modifierSelections.length > 0 ? { modifierSelections } : {}),
    ...(modifiers.length > 0 ? { modifiers } : {}),
  };
};

export const buildReorderCartPayloads = ({
  order,
  branchId,
}: {
  order: Order;
  branchId: string | number;
}): ReorderPayload[] => {
  const sourceItems = Array.isArray(order.items) && order.items.length > 0
    ? order.items
    : Array.isArray(order.itemsPreview)
      ? order.itemsPreview
      : [];

  return sourceItems.flatMap((item) => {
    const includedItems = Array.isArray(item.includedItems) ? item.includedItems : [];

    if (includedItems.length > 0) {
      return includedItems
        .map((includedItem) =>
          buildItemReorderPayload({
            branchId,
            item: includedItem,
            parentDealId: item.dealId,
          })
        )
        .filter((payload): payload is ReorderPayload => Boolean(payload));
    }

    const payload = buildItemReorderPayload({ branchId, item });

    return payload ? [payload] : [];
  });
};

const normalizeOrderList = (response: ApiResult): Order[] => {
  const dataRecord = getRecord(response.data);
  const nestedData = getRecord(dataRecord?.data);
  const candidate = Array.isArray(response.data)
    ? response.data
    : Array.isArray(dataRecord?.data)
      ? dataRecord.data
      : Array.isArray(dataRecord?.items)
        ? dataRecord.items
        : Array.isArray(nestedData?.items)
          ? nestedData.items
          : [];

  return candidate as Order[];
};

export const fetchOrderById = async ({
  orderId,
  token,
}: {
  orderId: string;
  token?: string | null;
}) => {
  const response = await getOrders(`/v1/orders/${orderId}`, token);

  return {
    response,
    order: !response || response.success === false || !response.data ? null : response.data as Order,
  };
};

export const fetchOrdersPage = async ({
  page,
  limit,
  token,
}: {
  page: number;
  limit: number;
  token?: string | null;
}) => {
  const response = await getOrders(`/v1/orders?page=${page}&limit=${limit}`, token);

  return {
    response,
    orders: response?.success === false ? [] : normalizeOrderList(response),
    meta: response?.meta as OrderMeta | undefined,
  };
};

export const addCartItemForReorder = ({
  customerId,
  payload,
  token,
}: {
  customerId: string;
  payload: ReorderPayload;
  token?: string | null;
}) => postOrders(`/v1/cart/items?customerId=${customerId}`, payload, token);

export const submitOrderReview = ({
  orderId,
  payload,
  token,
}: {
  orderId: string;
  payload: SubmitOrderReviewPayload;
  token?: string | null;
}) => postOrders(`/v1/orders/${orderId}/review`, payload, token);
