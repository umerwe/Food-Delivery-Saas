"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import RestaurantHeader from "@/components/items/RestaurantHeader";
import ItemsLayout from "@/components/items/ItemsLayout";
import useApi from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";

const GROUP_ORDER_CODE_KEY = "groupOrderCode";

export default function ItemsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const categoryId = searchParams.get("categoryId") || "";
  const codeFromUrl = searchParams.get("code") || "";

  const { token, user, loading: authLoading } = useAuth();
  const { get, post } = useApi(token);

  const [joiningGroupOrder, setJoiningGroupOrder] = useState(false);

  const handledInviteCodeRef = useRef<string | null>(null);

  const isUserAlreadyInOrder = async (code: string) => {
    try {
      const res = await get(`/v1/group-orders?search=${code}`);

      if (!res || res.error) {
        return false;
      }

      const groupOrders = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : [];

      const order = groupOrders.find((o: any) => o.inviteCode === code);

      if (!order) return false;

      if (order.hostUserId === user?.id) return true;

      const exists = order.participants?.some(
        (participant: any) => participant.userId === user?.id
      );

      return Boolean(exists);
    } catch (err) {
      console.error("Check group order participant error:", err);
      return false;
    }
  };

  const handleJoinGroupOrder = async (inviteCode: string) => {
    const res = await post("/v1/group-orders/join", { inviteCode });

    if (!res || res.error) {
      toast.error(res?.message || res?.error || "Failed to join group order");
      console.log("Join group order error details:", res?.details);
      return false;
    }

    return true;
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (codeFromUrl) {
      localStorage.setItem(GROUP_ORDER_CODE_KEY, codeFromUrl);
    }
  }, [codeFromUrl]);

  useEffect(() => {
    const processGroupOrderInvite = async () => {
      if (!token || !user?.id) return;

      const inviteCode =
        codeFromUrl ||
        (typeof window !== "undefined"
          ? localStorage.getItem(GROUP_ORDER_CODE_KEY)
          : "");

      if (!inviteCode) return;

      if (handledInviteCodeRef.current === inviteCode) return;

      handledInviteCodeRef.current = inviteCode;

      try {
        setJoiningGroupOrder(true);

        localStorage.setItem(GROUP_ORDER_CODE_KEY, inviteCode);

        const alreadyIn = await isUserAlreadyInOrder(inviteCode);

        if (!alreadyIn) {
          const joined = await handleJoinGroupOrder(inviteCode);

          if (!joined) {
            localStorage.removeItem(GROUP_ORDER_CODE_KEY);
            return;
          }

          toast.success("Joined group order successfully");
        }
      } finally {
        setJoiningGroupOrder(false);
      }
    };

    processGroupOrderInvite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.id, codeFromUrl]);

  return (
    <div className="min-h-screen md:px-35">
      {joiningGroupOrder ? (
        <div className="mx-4 mt-4 rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm font-medium text-primary md:mx-10">
          Joining group order...
        </div>
      ) : null}

      <RestaurantHeader />
      <ItemsLayout categoryId={categoryId} />
    </div>
  );
}