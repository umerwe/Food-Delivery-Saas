"use client";

import { useCallback, useMemo } from "react";

import { queryKeys } from "@/config/query-keys";
import { useDomainApi } from "@/hooks/useDomainApi";
import {
  addCartItemForReorder,
  deleteOrders,
  fetchOrderById,
  fetchOrdersPage,
  getOrders,
  patchOrders,
  postOrders,
  submitOrderReview,
  type ReorderPayload,
  type SubmitOrderReviewPayload,
} from "@/services/orders";

const service = {
  get: getOrders,
  post: postOrders,
  patch: patchOrders,
  del: deleteOrders,
};

export const useOrders = (token: string | null) => {
  const api = useDomainApi(token, { service, requestKey: queryKeys.orders.request });

  const getOrderById = useCallback(
    ({ orderId }: { orderId: string }) => fetchOrderById({ orderId, token }),
    [token]
  );

  const getOrdersPage = useCallback(
    ({ page, limit }: { page: number; limit: number }) => fetchOrdersPage({ page, limit, token }),
    [token]
  );

  const reorderCartItem = useCallback(
    ({ customerId, payload }: { customerId: string; payload: ReorderPayload }) =>
      addCartItemForReorder({ customerId, payload, token }),
    [token]
  );

  const reviewOrder = useCallback(
    ({ orderId, payload }: { orderId: string; payload: SubmitOrderReviewPayload }) =>
      submitOrderReview({ orderId, payload, token }),
    [token]
  );

  return useMemo(
    () => ({
      ...api,
      fetchOrderById: getOrderById,
      fetchOrdersPage: getOrdersPage,
      addCartItemForReorder: reorderCartItem,
      submitOrderReview: reviewOrder,
    }),
    [api, getOrderById, getOrdersPage, reorderCartItem, reviewOrder]
  );
};

export default useOrders;
