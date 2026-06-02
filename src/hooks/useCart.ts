"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuthContext } from "@/components/providers/auth-provider";
import { buildDealCartItemsInput } from "@/components/pages/Home/utils/customer-deal-cart";
import { queryKeys } from "@/config/query-keys";
import { useDomainApi, type DomainApiHook } from "@/hooks/useDomainApi";
import { getApiErrorMessage } from "@/lib/errors";
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
  quoteCustomerCart,
  updateCustomerCartItem,
  updateCustomerCartItemQuantity,
} from "@/services/cart";
import type { ApiResult } from "@/services/http";
import type { CartItemRecord } from "@/components/pages/Items/components/signature-selection/types";
import type { ApiRecord } from "@/components/pages/Items/types";
import type { CustomerDeal } from "@/types/customer-deals";

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
  quoteCustomerCart: (args: { customerId: string }) => Promise<ApiResult>;
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

  const refreshCartQuote = useCallback(
    ({ customerId }: { customerId: string }) => quoteCustomerCart({ customerId, token }),
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
      quoteCustomerCart: refreshCartQuote,
      updateCustomerCartItem: updateCartItem,
      clearCustomerCart: clearCart,
      updateCustomerCartItemQuantity: updateCartItemQuantity,
      deleteCustomerCartItem: deleteCartItem,
      fetchGroupOrders: fetchGroups,
      addGroupOrderItem: addGroupItem,
    }),
    [addCartItem, addGroupItem, api, clearCart, deleteCartItem, fetchCart, fetchCartItem, fetchGroups, refreshCartQuote, updateCartItem, updateCartItemQuantity]
  );
};

export const useAddDealToCart = (branchId?: string | null) => {
  const { token, user } = useAuthContext();
  const queryClient = useQueryClient();
  const { addCustomerCartItem: addCartItem, quoteCustomerCart: refreshCartQuote } = useCart(token);
  const customerId = user?.id ?? "";

  return useMutation({
    mutationFn: async (deal: CustomerDeal) => {
      if (!customerId) {
        throw new Error("Customer not found");
      }

      if (!branchId) {
        throw new Error("Please select a branch first");
      }

      if (deal.scopeMenuItems.length < 1) {
        throw new Error("This deal has no available items.");
      }

      const payloads = buildDealCartItemsInput(deal, branchId);

      if (payloads.length < 1) {
        throw new Error("This deal has no available items.");
      }

      for (const payload of payloads) {
        const response = await addCartItem({
          customerId,
          payload,
        });

        if (!response || response.error || response.success === false) {
          throw new Error(getApiErrorMessage(response, "Failed to add deal item to cart"));
        }
      }

      const quoteResponse = await refreshCartQuote({ customerId });

      if (!quoteResponse || quoteResponse.error || quoteResponse.success === false) {
        throw new Error(getApiErrorMessage(quoteResponse, "Failed to refresh cart quote"));
      }

      return quoteResponse;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.cart.current }),
        queryClient.invalidateQueries({ queryKey: queryKeys.checkout.all }),
        queryClient.invalidateQueries({
          predicate: ({ queryKey }) => queryKey[0] === "cart" || queryKey[0] === "checkout",
        }),
      ]);
      toast.success("Deal items added to cart");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to add deal to cart"));
    },
  });
};
