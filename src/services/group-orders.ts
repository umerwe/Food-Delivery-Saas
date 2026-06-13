import { createDomainApiService } from "@/services/domain-api";
import type { ApiResult } from "@/services/http";
import type {
  CheckoutGroupOrderPayload,
  CreateGroupOrderPayload,
  GroupOrder,
} from "@/types/group-order";

const groupOrdersService = createDomainApiService();

export const getGroupOrders = groupOrdersService.get;
export const postGroupOrders = groupOrdersService.post;
export const patchGroupOrders = groupOrdersService.patch;
export const deleteGroupOrders = groupOrdersService.del;

const getRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

export const normalizeGroupOrderList = (response: ApiResult): GroupOrder[] => {
  const data = response.data;
  const dataRecord = getRecord(data);
  const nestedData = getRecord(dataRecord?.data);

  const candidate = Array.isArray(data)
    ? data
    : Array.isArray(dataRecord?.data)
      ? dataRecord.data
      : Array.isArray(dataRecord?.items)
        ? dataRecord.items
        : Array.isArray(nestedData?.items)
          ? nestedData.items
          : [];

  return candidate as GroupOrder[];
};

export const fetchGroupOrders = async (token?: string | null) => {
  const response = await getGroupOrders("/v1/group-orders", token);

  return {
    response,
    groupOrders: response?.error ? [] : normalizeGroupOrderList(response),
  };
};

export const searchGroupOrdersByInviteCode = async ({
  inviteCode,
  token,
}: {
  inviteCode: string;
  token?: string | null;
}) => {
  const response = await getGroupOrders(
    `/v1/group-orders?search=${encodeURIComponent(inviteCode)}`,
    token
  );
  const groupOrders = response?.error ? [] : normalizeGroupOrderList(response);

  return {
    response,
    groupOrders,
    groupOrder: groupOrders.find((item) => String(item.inviteCode || "") === String(inviteCode)) || null,
  };
};

export const normalizeCreateGroupOrderPayload = (
  payload: CreateGroupOrderPayload & { restaurantMenuId?: unknown }
): CreateGroupOrderPayload => {
  const normalizedPayload = { ...payload };
  delete normalizedPayload.restaurantMenuId;

  return normalizedPayload;
};

export const createGroupOrder = ({
  payload,
  token,
}: {
  payload: CreateGroupOrderPayload & { restaurantMenuId?: unknown };
  token?: string | null;
}) => postGroupOrders("/v1/group-orders", normalizeCreateGroupOrderPayload(payload), token);

export const joinGroupOrder = ({
  inviteCode,
  token,
}: {
  inviteCode: string;
  token?: string | null;
}) => postGroupOrders("/v1/group-orders/join", { inviteCode }, token);

export const leaveGroupOrder = ({
  orderId,
  token,
}: {
  orderId: string | number;
  token?: string | null;
}) => postGroupOrders(`/v1/group-orders/${orderId}/leave`, {}, token);

export const cancelGroupOrder = ({
  orderId,
  token,
}: {
  orderId: string | number;
  token?: string | null;
}) => patchGroupOrders(`/v1/group-orders/${orderId}/status`, { status: "CANCELLED" }, token);

export const checkoutGroupOrder = ({
  orderId,
  payload,
  token,
}: {
  orderId: string | number;
  payload: CheckoutGroupOrderPayload;
  token?: string | null;
}) => postGroupOrders(`/v1/group-orders/${orderId}/checkout`, payload, token);

export const updateGroupOrderItemQuantity = ({
  orderId,
  itemId,
  quantity,
  token,
}: {
  orderId: string | number;
  itemId: string | number;
  quantity: number;
  token?: string | null;
}) => patchGroupOrders(`/v1/group-orders/${orderId}/items/${itemId}`, { quantity }, token);

export const deleteGroupOrderItem = ({
  orderId,
  itemId,
  token,
}: {
  orderId: string | number;
  itemId: string | number;
  token?: string | null;
}) => deleteGroupOrders(`/v1/group-orders/${orderId}/items/${itemId}`, token);
