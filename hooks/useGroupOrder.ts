"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useApi from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";

const GROUP_ORDER_CODE_KEY = "groupOrderCode";
const GROUP_ORDER_CLOSED_STATUSES = ["CHECKED_OUT", "CANCELLED", "EXPIRED"];

const normalizeApiArray = (res: any) => {
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.items)) return res.items;
  return [];
};

const getStoredGroupOrderCode = () => {
  if (typeof window === "undefined") return "";

  return localStorage.getItem(GROUP_ORDER_CODE_KEY) || "";
};

const clearStoredGroupOrderCode = () => {
  if (typeof window === "undefined") return;

  localStorage.removeItem(GROUP_ORDER_CODE_KEY);
};

const isClosedGroupOrder = (order: any) => {
  const status = String(order?.status || "").toUpperCase();

  return GROUP_ORDER_CLOSED_STATUSES.includes(status);
};

export default function useGroupOrder() {
  const router = useRouter();

  const { token, user } = useAuth();
  const { get } = useApi(token);

  const [order, setOrder] = useState<any>(null);
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

      const res = await get(`/v1/group-orders?search=${encodeURIComponent(code)}`);

      if (!res || res?.error) {
        setOrder(null);
        return;
      }

      const orders = normalizeApiArray(res);

      const found = orders.find((item: any) => {
        return String(item?.inviteCode || "") === String(code);
      });

      if (!found) {
        clearStoredGroupOrderCode();
        setOrder(null);
        return;
      }

      if (isClosedGroupOrder(found)) {
        clearStoredGroupOrderCode();
        setOrder(null);
        setRedirecting(true);
        router.replace("/group-order");
        return;
      }

      setOrder(found);
    } catch (err) {
      console.error("Order fetch error", err);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [get, router]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetchOrder();
  }, [token, fetchOrder]);

  const isHost = order?.hostUserId === user?.id;

  const participant = order?.participants?.find((p: any) => {
    return p.userId === user?.id;
  });

  const isParticipant = Boolean(participant);

  const canEditItems = isParticipant;
  const canCheckout = isHost;

  return {
    order,
    loading,
    redirecting,
    refetch: fetchOrder,

    // roles
    isHost,
    isParticipant,
    participant,

    // permissions
    canEditItems,
    canCheckout,
  };
}