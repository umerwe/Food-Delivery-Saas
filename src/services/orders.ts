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
  name?: string | null;
  slug?: string | null;
  imageUrl?: string | null;
  quantity: number;
  unitPrice?: number | string | null;
  depositAmount?: number | string | null;
  modifiersTotal?: number | string | null;
  lineTotal?: number | string | null;
  variationId?: string | number | null;
  variationName?: string | null;
  restaurantMenuId?: string | number | null;
  dealId?: string | number | null;
  note?: string | null;
  snapshotModifiers?: unknown[];
  snapshotSections?: unknown[];
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
  name?: string | null;
  quantity?: number | string | null;
  unitPrice?: number | string | null;
  total?: number | string | null;
  modifier?: {
    id?: string | number | null;
    name?: string | null;
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
  label?: string | null;
  street?: string | null;
  area?: string | null;
  postalCode?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  houseNumber?: string | null;
  deliveryInstructions?: string | null;
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

export type OrderPricingBreakdownLine = {
  key: string;
  label: string;
  amount: number | string | null;
};

export type OrderPricing = {
  currency?: string | null;
  subtotal?: number | string | null;
  taxAmount?: number | string | null;
  deliveryFee?: number | string | null;
  serviceChargeAmount?: number | string | null;
  tipAmount?: number | string | null;
  discountAmount?: number | string | null;
  loyaltyDiscountAmount?: number | string | null;
  walletAppliedAmount?: number | string | null;
  totalAmount?: number | string | null;
  payableAmount?: number | string | null;
  paidAmount?: number | string | null;
  remainingAmount?: number | string | null;
  refundedAmount?: number | string | null;
  breakdown?: OrderPricingBreakdownLine[];
};

export type OrderCoupon = {
  id?: string | number | null;
  code?: string | null;
  title?: string | null;
};

export type OrderPayment = {
  selectedMethod?: string | null;
  status?: string | null;
  statusLabel?: string | null;
  availableMethods?: string[];
  canChangePaymentMethod?: boolean;
  paidAt?: string | null;
  transactions?: OrderTransaction[];
  refund?: {
    isRefundable?: boolean;
    refundableAmount?: number | string | null;
    refundStatus?: string | null;
    refundTransactions?: OrderTransaction[];
  } | null;
};

export type Order = {
  id: string;
  displayId?: string | null;
  orderType?: string | null;
  status: OrderStatus;
  statusLabel?: string | null;
  statusDescription?: string | null;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  availablePaymentMethods?: string[];
  paymentOptions?: {
    selected?: string | null;
    available?: string[];
  } | null;
  orderTime?: string | null;
  isScheduled?: boolean | null;
  scheduledFor?: string | null;
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
  itemCount?: number | string | null;
  couponId?: string | number | null;
  coupon?: OrderCoupon | null;
  items?: OrderItem[];
  itemsPreview?: OrderItem[];
  restaurant?: OrderRestaurant | null;
  branch?: OrderBranch | null;
  deliveryAddress?: OrderDeliveryAddress | null;
  transactions?: OrderTransaction[];
  pricing?: OrderPricing | null;
  payment?: OrderPayment | null;
  fulfillment?: {
    type?: string | null;
    modeLabel?: string | null;
    deliveryOtp?: string | null;
    showDeliveryOtp?: boolean;
    deliveryAddress?: OrderDeliveryAddress | null;
    pickup?: Record<string, unknown> | null;
    dineIn?: Record<string, unknown> | null;
    deliveryman?: Record<string, unknown> | null;
    estimate?: Record<string, unknown> | null;
    tracking?: Record<string, unknown> | null;
  } | null;
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

const getAmount = (value: unknown, fallback: number | string | null = null) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? value : fallback;
  }

  return fallback;
};

const getBoolean = (value: unknown, fallback = false) =>
  typeof value === "boolean" ? value : fallback;

const normalizeTransaction = (value: unknown): OrderTransaction | null => {
  const record = getRecord(value);

  if (!record) {
    return null;
  }

  const id = getString(record.id);

  if (!id) {
    return null;
  }

  return {
    id,
    orderId: getString(record.orderId) || null,
    paymentMethod: getString(record.paymentMethod) || null,
    type: getString(record.type) || null,
    status: getString(record.status) || null,
    amount: getAmount(record.amount),
    currency: getString(record.currency) || null,
    providerRef: getString(record.providerRef) || null,
    note: getString(record.note) || null,
    processedAt: getString(record.processedAt) || null,
    createdAt: getString(record.createdAt) || null,
  };
};

const normalizeTransactions = (value: unknown): OrderTransaction[] =>
  Array.isArray(value)
    ? value.map(normalizeTransaction).filter((transaction): transaction is OrderTransaction => Boolean(transaction))
    : [];

const normalizeDeliveryAddress = (value: unknown): OrderDeliveryAddress | null => {
  const record = getRecord(value);

  if (!record) {
    return null;
  }

  return {
    id: getString(record.id) || null,
    label: getString(record.label) || null,
    street: getString(record.street) || null,
    area: getString(record.area) || null,
    postalCode: getString(record.postalCode) || null,
    city: getString(record.city) || null,
    state: getString(record.state) || null,
    country: getString(record.country) || null,
    houseNumber: getString(record.houseNumber) || null,
    deliveryInstructions: getString(record.deliveryInstructions) || null,
  };
};

const normalizeOrderItem = (value: unknown): OrderItem | null => {
  const record = getRecord(value);

  if (!record) {
    return null;
  }

  const id = getString(record.id);

  if (!id) {
    return null;
  }

  const menuItem = getRecord(record.menuItem);
  const category = getRecord(menuItem?.category ?? record.category);
  const imageUrl = getString(record.imageUrl || menuItem?.imageUrl);
  const menuItemName = getString(record.menuItemName || record.name || menuItem?.name);

  return {
    id,
    menuItemId: getString(record.menuItemId || menuItem?.id) || null,
    menuItemName: menuItemName || null,
    name: getString(record.name) || null,
    slug: getString(record.slug || menuItem?.slug) || null,
    imageUrl: imageUrl || null,
    quantity: getNumber(record.quantity, 1),
    unitPrice: getAmount(record.unitPrice),
    depositAmount: getAmount(record.depositAmount),
    modifiersTotal: getAmount(record.modifiersTotal),
    lineTotal: getAmount(record.lineTotal),
    variationId: getString(record.variationId) || null,
    variationName: getString(record.variationName) || null,
    restaurantMenuId: getString(record.restaurantMenuId) || null,
    dealId: getString(record.dealId) || null,
    note: getString(record.note) || null,
    snapshotModifiers: Array.isArray(record.snapshotModifiers) ? record.snapshotModifiers : [],
    snapshotSections: Array.isArray(record.snapshotSections) ? record.snapshotSections : [],
    modifiers: Array.isArray(record.modifiers) ? record.modifiers as OrderModifierInput[] : [],
    modifierSelections: Array.isArray(record.modifierSelections)
      ? record.modifierSelections as OrderModifierSelectionInput[]
      : [],
    selectedModifiers: Array.isArray(record.selectedModifiers)
      ? record.selectedModifiers as OrderModifierInput[]
      : [],
    includedItems: Array.isArray(record.includedItems)
      ? record.includedItems.map(normalizeOrderItem).filter((item): item is OrderItem => Boolean(item))
      : [],
    menuItem: {
      id: getString(menuItem?.id || record.menuItemId) || null,
      name: menuItemName || null,
      imageUrl: imageUrl || null,
      category: category
        ? {
          name: getString(category.name) || null,
        }
        : null,
    },
  };
};

const normalizeOrderItems = (value: unknown): OrderItem[] =>
  Array.isArray(value)
    ? value.map(normalizeOrderItem).filter((item): item is OrderItem => Boolean(item))
    : [];

const normalizePricingBreakdown = (value: unknown): OrderPricingBreakdownLine[] =>
  Array.isArray(value)
    ? value.flatMap((line) => {
      const record = getRecord(line);
      const key = getString(record?.key);
      const label = getString(record?.label);

      if (!key && !label) {
        return [];
      }

      return [{
        key: key || label,
        label: label || key,
        amount: getAmount(record?.amount, 0),
      }];
    })
    : [];

const normalizeOrderPricing = (value: unknown, fallback: Record<string, unknown>): OrderPricing | null => {
  const record = getRecord(value);
  const source = record ?? fallback;
  const breakdown = normalizePricingBreakdown(source.breakdown);

  if (!record && breakdown.length === 0 && !("totalAmount" in fallback)) {
    return null;
  }

  return {
    currency: getString(source.currency) || null,
    subtotal: getAmount(source.subtotal),
    taxAmount: getAmount(source.taxAmount),
    deliveryFee: getAmount(source.deliveryFee),
    serviceChargeAmount: getAmount(source.serviceChargeAmount),
    tipAmount: getAmount(source.tipAmount),
    discountAmount: getAmount(source.discountAmount),
    loyaltyDiscountAmount: getAmount(source.loyaltyDiscountAmount),
    walletAppliedAmount: getAmount(source.walletAppliedAmount),
    totalAmount: getAmount(source.totalAmount),
    payableAmount: getAmount(source.payableAmount),
    paidAmount: getAmount(source.paidAmount),
    remainingAmount: getAmount(source.remainingAmount),
    refundedAmount: getAmount(source.refundedAmount),
    breakdown,
  };
};

const normalizeOrderPayment = (value: unknown, fallback: Record<string, unknown>): OrderPayment | null => {
  const record = getRecord(value);
  const refund = getRecord(record?.refund);
  const transactions = normalizeTransactions(record?.transactions ?? fallback.transactions);

  if (!record && transactions.length === 0 && !("paymentMethod" in fallback)) {
    return null;
  }

  return {
    selectedMethod: getString(record?.selectedMethod || getRecord(fallback.paymentOptions)?.selected || fallback.paymentMethod) || null,
    status: getString(record?.status || fallback.paymentStatus) || null,
    statusLabel: getString(record?.statusLabel) || null,
    availableMethods: Array.isArray(record?.availableMethods)
      ? record.availableMethods.map(getString).filter(Boolean)
      : Array.isArray(getRecord(fallback.paymentOptions)?.available)
        ? (getRecord(fallback.paymentOptions)?.available as unknown[]).map(getString).filter(Boolean)
        : Array.isArray(fallback.availablePaymentMethods)
          ? fallback.availablePaymentMethods.map(getString).filter(Boolean)
          : [],
    canChangePaymentMethod: getBoolean(record?.canChangePaymentMethod),
    paidAt: getString(record?.paidAt || fallback.paidAt) || null,
    transactions,
    refund: refund
      ? {
        isRefundable: getBoolean(refund.isRefundable),
        refundableAmount: getAmount(refund.refundableAmount),
        refundStatus: getString(refund.refundStatus) || null,
        refundTransactions: normalizeTransactions(refund.refundTransactions),
      }
      : null,
  };
};

const normalizeOrderCoupon = (value: unknown): OrderCoupon | null => {
  const record = getRecord(value);

  if (!record) {
    return null;
  }

  const id = getString(record.id);
  const code = getString(record.code);
  const title = getString(record.title || record.name);

  if (!id && !code && !title) {
    return null;
  }

  return {
    id: id || null,
    code: code || null,
    title: title || null,
  };
};

export const normalizeOrderDetail = (value: unknown): Order | null => {
  const record = getRecord(value);

  if (!record) {
    return null;
  }

  const id = getString(record.id);

  if (!id) {
    return null;
  }

  const pricing = normalizeOrderPricing(record.pricing, record);
  const payment = normalizeOrderPayment(record.payment, record);
  const fulfillment = getRecord(record.fulfillment);
  const items = normalizeOrderItems(record.items);
  const itemsPreview = normalizeOrderItems(record.itemsPreview);
  const deliveryAddress = normalizeDeliveryAddress(fulfillment?.deliveryAddress ?? record.deliveryAddress);
  const transactions = payment?.transactions?.length
    ? payment.transactions
    : normalizeTransactions(record.transactions);

  return {
    ...record,
    id,
    displayId: getString(record.displayId) || null,
    orderType: getString(record.orderType || fulfillment?.type) || null,
    status: getString(record.status) || "PLACED",
    statusLabel: getString(record.statusLabel) || null,
    statusDescription: getString(record.statusDescription) || null,
    paymentStatus: getString(payment?.status || record.paymentStatus) || null,
    paymentMethod: getString(payment?.selectedMethod || record.paymentMethod) || null,
    availablePaymentMethods: Array.isArray(record.availablePaymentMethods)
      ? record.availablePaymentMethods.map(getString).filter(Boolean)
      : [],
    paymentOptions: getRecord(record.paymentOptions) as Order["paymentOptions"],
    orderTime: getString(record.orderTime) || null,
    isScheduled: getBoolean(record.isScheduled),
    scheduledFor: getString(record.scheduledFor) || null,
    subtotal: pricing?.subtotal ?? getAmount(record.subtotal),
    deliveryFee: pricing?.deliveryFee ?? getAmount(record.deliveryFee),
    taxAmount: pricing?.taxAmount ?? getAmount(record.taxAmount),
    serviceChargeType: getString(record.serviceChargeType) || null,
    serviceChargeValue: getAmount(record.serviceChargeValue),
    serviceChargeAmount: pricing?.serviceChargeAmount ?? getAmount(record.serviceChargeAmount),
    tipAmount: pricing?.tipAmount ?? getAmount(record.tipAmount),
    discountAmount: pricing?.discountAmount ?? getAmount(record.discountAmount),
    payableAmount: pricing?.payableAmount ?? getAmount(record.payableAmount),
    totalAmount: pricing?.totalAmount ?? getAmount(record.totalAmount),
    itemCount: getAmount(record.itemCount),
    couponId: getString(record.couponId) || null,
    coupon: normalizeOrderCoupon(record.coupon),
    items,
    itemsPreview,
    restaurant: getRecord(record.restaurant) as OrderRestaurant | null,
    branch: getRecord(record.branch) as OrderBranch | null,
    deliveryAddress,
    transactions,
    pricing,
    payment,
    fulfillment: fulfillment
      ? {
        type: getString(fulfillment.type) || null,
        modeLabel: getString(fulfillment.modeLabel) || null,
        deliveryOtp: getString(fulfillment.deliveryOtp) || null,
        showDeliveryOtp: getBoolean(fulfillment.showDeliveryOtp),
        deliveryAddress,
        pickup: getRecord(fulfillment.pickup),
        dineIn: getRecord(fulfillment.dineIn),
        deliveryman: getRecord(fulfillment.deliveryman),
        estimate: getRecord(fulfillment.estimate),
        tracking: getRecord(fulfillment.tracking),
      }
      : null,
    createdAt: getString(record.createdAt) || "",
    review: getRecord(record.review) as OrderReview | null,
  } as Order;
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

  return candidate
    .map(normalizeOrderDetail)
    .filter((order): order is Order => Boolean(order));
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
    order: !response || response.success === false || !response.data
      ? null
      : normalizeOrderDetail(response.data),
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

export const reorderOrderToCart = ({
  orderId,
  customerId,
  token,
}: {
  orderId: string;
  customerId?: string | null;
  token?: string | null;
}) => {
  const query = customerId ? `?customerId=${encodeURIComponent(customerId)}` : "";
  return postOrders(`/v1/cart/reorder${query}`, { orderId }, token);
};

export const submitOrderReview = ({
  orderId,
  payload,
  token,
}: {
  orderId: string;
  payload: SubmitOrderReviewPayload;
  token?: string | null;
}) => postOrders(`/v1/orders/${orderId}/review`, payload, token);
