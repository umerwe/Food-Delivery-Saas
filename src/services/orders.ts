import { createDomainApiService } from "@/services/domain-api";
import type { ApiResult } from "@/services/http";

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
  menuItem?: OrderMenuItem | null;
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
  quantity: number;
  branchId: string | number;
  note: string;
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
