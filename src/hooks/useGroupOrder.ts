"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { queryKeys } from "@/config/query-keys";
import { useAuth } from "@/hooks/useAuth";
import { useDomainApi } from "@/hooks/useDomainApi";
import { canMutateGroupOrder, canParticipantEditGroupOrderItems, clearStoredGroupOrderCode, getStoredGroupOrderCode, isClosedGroupOrder, isGroupOrderParticipantCompleted } from "@/lib/group-order";
import {
  cancelGroupOrder,
  checkoutGroupOrder,
  createGroupOrder,
  deleteGroupOrderItem,
  deleteGroupOrders,
  fetchGroupOrders,
  getGroupOrders,
  joinGroupOrder,
  leaveGroupOrder,
  patchGroupOrders,
  postGroupOrders,
  searchGroupOrdersByInviteCode,
  updateGroupOrderItemQuantity,
  updateMyGroupOrderParticipantStatus,
} from "@/services/group-orders";
import type { ApiResult } from "@/services/http";
import type {
  CheckoutGroupOrderPayload,
  CreateGroupOrderPayload,
  GroupOrder,
  UseGroupOrderResult,
} from "@/types/group-order";

const service = {
  get: getGroupOrders,
  post: postGroupOrders,
  patch: patchGroupOrders,
  del: deleteGroupOrders,
};

export const useGroupOrderApi = (token: string | null) => {
  const api = useDomainApi(token, { service, requestKey: queryKeys.orders.request });

  const listGroupOrders = useCallback(() => fetchGroupOrders(token), [token]);

  const findGroupOrderByInviteCode = useCallback(
    ({ inviteCode }: { inviteCode: string }) => searchGroupOrdersByInviteCode({ inviteCode, token }),
    [token]
  );

  const addGroupOrder = useCallback(
    ({ payload }: { payload: CreateGroupOrderPayload }) => createGroupOrder({ payload, token }),
    [token]
  );

  const leaveOrder = useCallback(
    ({ orderId }: { orderId: string | number }) => leaveGroupOrder({ orderId, token }),
    [token]
  );

  const cancelOrder = useCallback(
    ({ orderId }: { orderId: string | number }) => cancelGroupOrder({ orderId, token }),
    [token]
  );

  const joinOrder = useCallback(
    ({ inviteCode }: { inviteCode: string }) => joinGroupOrder({ inviteCode, token }),
    [token]
  );

  const checkoutOrder = useCallback(
    ({ orderId, payload }: { orderId: string | number; payload: CheckoutGroupOrderPayload }) =>
      checkoutGroupOrder({ orderId, payload, token }),
    [token]
  );

  const updateItemQuantity = useCallback(
    ({ orderId, itemId, quantity }: { orderId: string | number; itemId: string | number; quantity: number }) =>
      updateGroupOrderItemQuantity({ orderId, itemId, quantity, token }),
    [token]
  );

  const deleteItem = useCallback(
    ({ orderId, itemId }: { orderId: string | number; itemId: string | number }) =>
      deleteGroupOrderItem({ orderId, itemId, token }),
    [token]
  );

  const updateMyParticipantStatus = useCallback(
    ({ orderId, status }: { orderId: string | number; status: "ACTIVE" | "COMPLETED" }) =>
      updateMyGroupOrderParticipantStatus({ orderId, status, token }),
    [token]
  );

  return useMemo(
    () => ({
      ...api,
      fetchGroupOrders: listGroupOrders,
      searchGroupOrdersByInviteCode: findGroupOrderByInviteCode,
      createGroupOrder: addGroupOrder,
      leaveGroupOrder: leaveOrder,
      cancelGroupOrder: cancelOrder,
      joinGroupOrder: joinOrder,
      checkoutGroupOrder: checkoutOrder,
      updateGroupOrderItemQuantity: updateItemQuantity,
      deleteGroupOrderItem: deleteItem,
      updateMyGroupOrderParticipantStatus: updateMyParticipantStatus,
    }),
    [api, addGroupOrder, cancelOrder, checkoutOrder, deleteItem, findGroupOrderByInviteCode, joinOrder, leaveOrder, listGroupOrders, updateItemQuantity, updateMyParticipantStatus]
  );
};

export function useGroupOrder(): UseGroupOrderResult {
  const router = useRouter();

  const { token, user } = useAuth();
  const { searchGroupOrdersByInviteCode: findGroupOrderByInviteCode } = useGroupOrderApi(token);

  const [order, setOrder] = useState<GroupOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);

      const code = getStoredGroupOrderCode();

      if (!code) {
        setOrder(null);
        return;
      }

      const { response, groupOrder } = await findGroupOrderByInviteCode({ inviteCode: code });

      if (!response || response.error) {
        setOrder(null);
        return;
      }

      if (!groupOrder) {
        clearStoredGroupOrderCode();
        setOrder(null);
        return;
      }

      if (isClosedGroupOrder(groupOrder)) {
        clearStoredGroupOrderCode();
        setOrder(null);
        setRedirecting(true);
        router.replace("/group-order");
        return;
      }

      setOrder(groupOrder);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [findGroupOrderByInviteCode, router]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetchOrder();
  }, [token, fetchOrder]);

  const participant = order?.participants?.find((item) => {
    return String(item.userId || "") === String(user?.id || "");
  });

  const isHost = Boolean(
    (order?.hostUserId !== null &&
      order?.hostUserId !== undefined &&
      String(order.hostUserId) === String(user?.id || "")) ||
      participant?.isHost
  );
  const isParticipant = Boolean(participant);
  const canMutate = canMutateGroupOrder(order);

  const isParticipantCompleted = isGroupOrderParticipantCompleted(participant);
  const canEditItems = canParticipantEditGroupOrderItems({ order, participant });
  const canCheckout = isHost && canMutate;

  return {
    order,
    loading,
    redirecting,
    refetch: fetchOrder,
    isHost,
    isParticipant,
    participant,
    canEditItems,
    isParticipantCompleted,
    canCheckout,
    canMutateGroupOrder: canMutate,
  };
}

export type GroupOrderApi = ReturnType<typeof useGroupOrderApi>;
export type GroupOrderApiResult = Promise<ApiResult>;
