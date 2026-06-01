"use client";

import { useCallback, useMemo } from "react";

import { queryKeys } from "@/config/query-keys";
import { useDomainApi, type DomainApiHook } from "@/hooks/useDomainApi";
import {
  addCustomerCartItem,
  addGroupOrderItem,
  clearCustomerCart,
  deleteCustomerCartItem,
  deleteCart,
  fetchCustomerCart,
  fetchCustomerCartItem,
  fetchGroupOrders,
  getCart,
  patchCart,
  postCart,
  updateCustomerCartItem,
  updateCustomerCartItemQuantity,
} from "@/services/cart";
import type { ApiResult } from "@/services/http";
import type { CartItemRecord } from "@/components/pages/Items/components/signature-selection/types";
import type { ApiRecord } from "@/components/pages/Items/types";

type CartMutationPayload = Record<string, unknown>;

const service = {
  get: getCart,
  post: postCart,
  patch: patchCart,
  del: deleteCart,
};

export type CartApi = DomainApiHook & {
  fetchCustomerCart: (args: { customerId: string }) => Promise<{ response: ApiResult; items: CartItemRecord[] }>;
  fetchCustomerCartItem: (args: { customerId: string; cartItemId: string }) => Promise<ApiRecord | null>;
  addCustomerCartItem: (args: { customerId: string; payload: CartMutationPayload }) => Promise<ApiResult>;
  updateCustomerCartItem: (args: { cartItemId: string; payload: CartMutationPayload }) => Promise<ApiResult>;
  clearCustomerCart: (args: { customerId: string }) => Promise<ApiResult>;
  updateCustomerCartItemQuantity: (args: { customerId: string; cartItemId: string; quantity: number }) => Promise<ApiResult>;
  deleteCustomerCartItem: (args: { customerId: string; cartItemId: string }) => Promise<ApiResult>;
  fetchGroupOrders: () => Promise<{ response: ApiResult; groupOrders: ApiRecord[] }>;
  addGroupOrderItem: (args: { groupOrderId: string; payload: CartMutationPayload }) => Promise<ApiResult>;
};

export const useCart = (token: string | null): CartApi => {
  const api = useDomainApi(token, { service, requestKey: queryKeys.cart.request });

  const fetchCart = useCallback(
    ({ customerId }: { customerId: string }) => fetchCustomerCart({ customerId, token }),
    [token]
  );

  const fetchCartItem = useCallback(
    ({ customerId, cartItemId }: { customerId: string; cartItemId: string }) =>
      fetchCustomerCartItem({ customerId, cartItemId, token }),
    [token]
  );

  const addCartItem = useCallback(
    ({ customerId, payload }: { customerId: string; payload: CartMutationPayload }) =>
      addCustomerCartItem({ customerId, payload, token }),
    [token]
  );

  const updateCartItem = useCallback(
    ({ cartItemId, payload }: { cartItemId: string; payload: CartMutationPayload }) =>
      updateCustomerCartItem({ cartItemId, payload, token }),
    [token]
  );

  const clearCart = useCallback(
    ({ customerId }: { customerId: string }) => clearCustomerCart({ customerId, token }),
    [token]
  );

  const updateCartItemQuantity = useCallback(
    ({ customerId, cartItemId, quantity }: { customerId: string; cartItemId: string; quantity: number }) =>
      updateCustomerCartItemQuantity({ customerId, cartItemId, quantity, token }),
    [token]
  );

  const deleteCartItem = useCallback(
    ({ customerId, cartItemId }: { customerId: string; cartItemId: string }) =>
      deleteCustomerCartItem({ customerId, cartItemId, token }),
    [token]
  );

  const fetchGroups = useCallback(() => fetchGroupOrders(token), [token]);

  const addGroupItem = useCallback(
    ({ groupOrderId, payload }: { groupOrderId: string; payload: CartMutationPayload }) =>
      addGroupOrderItem({ groupOrderId, payload, token }),
    [token]
  );

  return useMemo(
    () => ({
      ...api,
      fetchCustomerCart: fetchCart,
      fetchCustomerCartItem: fetchCartItem,
      addCustomerCartItem: addCartItem,
      updateCustomerCartItem: updateCartItem,
      clearCustomerCart: clearCart,
      updateCustomerCartItemQuantity: updateCartItemQuantity,
      deleteCustomerCartItem: deleteCartItem,
      fetchGroupOrders: fetchGroups,
      addGroupOrderItem: addGroupItem,
    }),
    [addCartItem, addGroupItem, api, clearCart, deleteCartItem, fetchCart, fetchCartItem, fetchGroups, updateCartItem, updateCartItemQuantity]
  );
};

export default useCart;
