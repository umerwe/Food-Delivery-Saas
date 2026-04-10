"use client";

import { useEffect, useState } from "react";
import useApi from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";

export default function useGroupOrder() {
  const { token, user } = useAuth();
  const { get } = useApi(token);

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      const code = localStorage.getItem("groupOrderCode");
      if (!code) return;

      const res = await get(`/v1/group-orders?search=${code}`);
      const found = res?.data?.find((o: any) => o.inviteCode === code);

      setOrder(found);
    } catch (err) {
      console.error("Order fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchOrder();
  }, [token]);

  // ✅ ROLE LOGIC
  const isHost = order?.hostUserId === user?.id;

  const participant = order?.participants?.find(
    (p: any) => p.userId === user?.id
  );

  const isParticipant = !!participant;

  // ✅ PERMISSIONS
  const canEditItems = isParticipant;
  const canCheckout = isHost; // only host finalizes

  return {
    order,
    loading,
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