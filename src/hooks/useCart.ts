"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { useAuthContext } from "@/components/providers/auth-provider";
import {
  buildFixedDealCartItemsInput,
  buildSelectedFlexibleDealCartItemsInput,
  isFixedItemDeal,
} from "@/components/pages/Home/utils/customer-deal-cart";
import { queryKeys } from "@/config/query-keys";
import { useDomainApi, type DomainApiHook } from "@/hooks/useDomainApi";
import { getApiErrorMessage } from "@/lib/errors";
import {
  addCustomerCartItem,
  addGroupOrderItem,
  clearCustomerCart,
  deleteCustomerCartItem,
  deleteCustomerCartDeal,
  deleteCart,
  fetchCustomerCart,
  fetchCustomerCartItem,
  fetchGroupOrders,
  getCart,
  patchCart,
  postCart,
  quoteCustomerCart,
  updateCustomerCart,
  updateCustomerCartItem,
  updateCustomerCartItemQuantity,
  updateCustomerCartDealQuantity,
  type CartUpdatePayload,
} from "@/services/cart";
import type { ApiResult } from "@/services/http";
import type { CartItemRecord } from "@/components/pages/Items/components/signature-selection/types";
import type { ApiRecord } from "@/components/pages/Items/types";
import type { CustomerDeal, CustomerDealMenuItem } from "@/types/customer-deals";
import type { AddCartItemPayload, CartQuote } from "@/types/cart";

type CartMutationPayload = AddCartItemPayload | Record<string, unknown>;

export type AddDealToCartInput = {
  deal: CustomerDeal;
  selectedMenuItemIds?: string[];
  eligibleMenuItems?: CustomerDealMenuItem[];
  cartItemPayloads?: AddCartItemPayload[];
};

const service = {
  get: getCart,
  post: postCart,
  patch: patchCart,
  del: deleteCart,
};

export type CartApi = DomainApiHook & {
  fetchCustomerCart: (args: { customerId: string }) => Promise<{ response: ApiResult; items: CartItemRecord[]; quote: CartQuote | null }>;
  fetchCustomerCartItem: (args: { customerId: string; cartItemId: string }) => Promise<ApiRecord | null>;
  addCustomerCartItem: (args: { customerId: string; payload: CartMutationPayload }) => Promise<ApiResult>;
  quoteCustomerCart: (args: { customerId: string }) => Promise<ApiResult>;
  updateCustomerCart: (args: { customerId: string; payload: CartUpdatePayload }) => Promise<ApiResult>;
  updateCustomerCartItem: (args: { cartItemId: string; payload: CartMutationPayload }) => Promise<ApiResult>;
  clearCustomerCart: (args: { customerId: string }) => Promise<ApiResult>;
  updateCustomerCartItemQuantity: (args: { customerId: string; cartItemId: string; quantity: number }) => Promise<ApiResult>;
  updateCustomerCartDealQuantity: (args: { customerId: string; dealId: string; quantity: number }) => Promise<ApiResult>;
  deleteCustomerCartItem: (args: { customerId: string; cartItemId: string }) => Promise<ApiResult>;
  deleteCustomerCartDeal: (args: { customerId: string; dealId: string }) => Promise<ApiResult>;
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

  const updateCart = useCallback(
    ({ customerId, payload }: { customerId: string; payload: CartUpdatePayload }) =>
      updateCustomerCart({ customerId, payload, token }),
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

  const updateCartDealQuantity = useCallback(
    ({ customerId, dealId, quantity }: { customerId: string; dealId: string; quantity: number }) =>
      updateCustomerCartDealQuantity({ customerId, dealId, quantity, token }),
    [token]
  );

  const deleteCartItem = useCallback(
    ({ customerId, cartItemId }: { customerId: string; cartItemId: string }) =>
      deleteCustomerCartItem({ customerId, cartItemId, token }),
    [token]
  );

  const deleteCartDeal = useCallback(
    ({ customerId, dealId }: { customerId: string; dealId: string }) =>
      deleteCustomerCartDeal({ customerId, dealId, token }),
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
      updateCustomerCart: updateCart,
      updateCustomerCartItem: updateCartItem,
      clearCustomerCart: clearCart,
      updateCustomerCartItemQuantity: updateCartItemQuantity,
      updateCustomerCartDealQuantity: updateCartDealQuantity,
      deleteCustomerCartItem: deleteCartItem,
      deleteCustomerCartDeal: deleteCartDeal,
      fetchGroupOrders: fetchGroups,
      addGroupOrderItem: addGroupItem,
    }),
    [addCartItem, addGroupItem, api, clearCart, deleteCartDeal, deleteCartItem, fetchCart, fetchCartItem, fetchGroups, refreshCartQuote, updateCart, updateCartDealQuantity, updateCartItem, updateCartItemQuantity]
  );
};

export const useAddDealToCart = (branchId?: string | null) => {
  const t = useTranslations("cart");
  const { token, user } = useAuthContext();
  const queryClient = useQueryClient();
  const { addCustomerCartItem: addCartItem, quoteCustomerCart: refreshCartQuote } = useCart(token);
  const customerId = user?.id ?? "";

  return useMutation({
    mutationFn: async ({ deal, selectedMenuItemIds = [], eligibleMenuItems, cartItemPayloads }: AddDealToCartInput) => {
      if (!customerId) {
        throw new Error(t("customerNotFound"));
      }

      if (!branchId) {
        throw new Error(t("selectBranchFirst"));
      }

      if (isFixedItemDeal(deal) && deal.scopeMenuItems.length < 1) {
        throw new Error(t("dealNoItems"));
      }

      if (!cartItemPayloads?.length && deal.dealSelectionMode === "FLEXIBLE_ITEMS" && selectedMenuItemIds.length < 1) {
        throw new Error(t("dealNoItems"));
      }

      const payloads = cartItemPayloads?.length
        ? cartItemPayloads
        : deal.dealSelectionMode === "FLEXIBLE_ITEMS"
          ? buildSelectedFlexibleDealCartItemsInput(deal, branchId, selectedMenuItemIds, eligibleMenuItems)
          : buildFixedDealCartItemsInput(deal, branchId);
      const requiredQuantity = Number(deal.dealRequiredQuantity);
      const minimumEligibleItems = Number.isFinite(requiredQuantity) && requiredQuantity > 0
        ? Math.floor(requiredQuantity)
        : 1;

      if (payloads.length < 1) {
        throw new Error(t("dealNoItems"));
      }

      if (!cartItemPayloads?.length && deal.dealSelectionMode === "FLEXIBLE_ITEMS" && payloads.length < minimumEligibleItems) {
        throw new Error(t("dealNoItems"));
      }

      for (const payload of payloads) {
        const response = await addCartItem({
          customerId,
          payload,
        });

        if (!response || response.error || response.success === false) {
          throw new Error(getApiErrorMessage(response, t("failedAddDealItem")));
        }
      }

      const quoteResponse = await refreshCartQuote({ customerId });

      if (!quoteResponse || quoteResponse.error || quoteResponse.success === false) {
        throw new Error(getApiErrorMessage(quoteResponse, t("failedRefreshQuote")));
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
      toast.success(t("dealItemsAdded"));
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t("failedAddDeal")));
    },
  });
};
