import { createDomainApiService } from "@/services/domain-api";
import type { ApiResult } from "@/services/http";

export type OrderStatus = "PLACED" | "CONFIRMED" | "PREPARING" | "PICKED_UP" | "DELIVERED" | "CANCELLED" | string;

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
  rating: number;
};

export type OrderBranch = {
  id?: string | number | null;
  name?: string | null;
};

export type Order = {
  id: string;
  orderType?: string | null;
  status: OrderStatus;
  subtotal?: number | string | null;
  deliveryFee?: number | string | null;
  taxAmount?: number | string | null;
  discountAmount?: number | string | null;
  totalAmount?: number | string | null;
  items?: OrderItem[];
  itemsPreview?: OrderItem[];
  branch?: OrderBranch | null;
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
