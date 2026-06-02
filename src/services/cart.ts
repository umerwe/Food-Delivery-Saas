import { createDomainApiService } from "@/services/domain-api";
import { normalizeApiList, normalizeArray } from "@/components/pages/Items/utils/product-normalizers";
import type { ApiRecord } from "@/components/pages/Items/types";
import type { CartItemRecord } from "@/components/pages/Items/components/signature-selection/types";

type CartMutationPayload = Record<string, unknown>;

const cartService = createDomainApiService();

export const getCart = cartService.get;
export const postCart = cartService.post;
export const patchCart = cartService.patch;
export const deleteCart = cartService.del;

const getRecord = (value: unknown): ApiRecord | null =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? value as ApiRecord : null;

export const fetchCustomerCart = async ({
  customerId,
  token,
}: {
  customerId: string;
  token?: string | null;
}) => {
  const response = await getCart(`/v1/cart?customerId=${customerId}`, token);

  if (!response || response.error) {
    return { response, items: [] as CartItemRecord[] };
  }

  const resData = getRecord(response.data);
  const nestedData = getRecord(resData?.data);
  const cart = resData?.items ? resData : nestedData ?? resData;

  return {
    response,
    items: normalizeArray<CartItemRecord>(cart?.items),
  };
};

export const fetchCustomerCartItem = async ({
  customerId,
  cartItemId,
  token,
}: {
  customerId: string;
  cartItemId: string;
  token?: string | null;
}) => {
  const response = await getCart(`/v1/cart?customerId=${customerId}`, token);
  const resData = getRecord(response.data);
  const nestedData = getRecord(resData?.data);
  const cart = resData?.items ? resData : nestedData ?? resData;
  const items = normalizeArray<ApiRecord>(cart?.items);

  return items.find(({ id }) => String(id || "") === String(cartItemId)) ?? null;
};

export const addCustomerCartItem = ({
  customerId,
  payload,
  token,
}: {
  customerId: string;
  payload: CartMutationPayload;
  token?: string | null;
}) => postCart(`/v1/cart/items?customerId=${customerId}`, payload, token);

export const quoteCustomerCart = ({
  customerId,
  token,
}: {
  customerId: string;
  token?: string | null;
}) => postCart(`/v1/cart/quote?customerId=${customerId}`, {}, token);

export const updateCustomerCartItem = ({
  cartItemId,
  payload,
  token,
}: {
  cartItemId: string;
  payload: CartMutationPayload;
  token?: string | null;
}) => patchCart(`/v1/cart/items/${cartItemId}`, payload, token);

export const clearCustomerCart = ({ customerId, token }: { customerId: string; token?: string | null }) =>
  deleteCart(`/v1/cart?customerId=${customerId}`, token);

export const updateCustomerCartItemQuantity = ({
  customerId,
  cartItemId,
  quantity,
  token,
}: {
  customerId: string;
  cartItemId: string;
  quantity: number;
  token?: string | null;
}) => patchCart(`/v1/cart/items/${cartItemId}?customerId=${customerId}`, { quantity }, token);

export const deleteCustomerCartItem = ({
  customerId,
  cartItemId,
  token,
}: {
  customerId: string;
  cartItemId: string;
  token?: string | null;
}) => deleteCart(`/v1/cart/items/${cartItemId}?customerId=${customerId}`, token);

export const fetchGroupOrders = async (token?: string | null) => {
  const response = await getCart("/v1/group-orders", token);

  return {
    response,
    groupOrders: normalizeApiList<ApiRecord>(response),
  };
};

export const addGroupOrderItem = ({
  groupOrderId,
  payload,
  token,
}: {
  groupOrderId: string;
  payload: CartMutationPayload;
  token?: string | null;
}) => postCart(`/v1/group-orders/${groupOrderId}/items`, payload, token);
