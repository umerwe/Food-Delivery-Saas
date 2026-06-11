"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import RestaurantHeader from "@/components/pages/Items/components/RestaurantHeader";
import { ItemsLayout } from "@/components/pages/Items/components/ItemsLayout";
import { useGroupOrder, useGroupOrderApi } from "@/hooks/useGroupOrder";
import { useAuth } from "@/hooks/useAuth";
import { clearStoredGroupOrderCode, getStoredGroupOrderCode, setStoredGroupOrderCode } from "@/lib/group-order";
import type { GroupOrder, GroupOrderParticipant } from "@/types/group-order";

function ItemsPageContent() {
  const t = useTranslations("items.groupOrder");
  const router = useRouter();
  const searchParams = useSearchParams();

  const categoryId = searchParams.get("categoryId") || "";
  const codeFromUrl = searchParams.get("code") || "";

  const { token, user, loading: authLoading } = useAuth();
  const { joinGroupOrder, searchGroupOrdersByInviteCode } = useGroupOrderApi(token);

  const [joiningGroupOrder, setJoiningGroupOrder] = useState(false);

  const handledInviteCodeRef = useRef<string | null>(null);

  const isUserAlreadyInOrder = async (code: string) => {
    try {
      const { response: res, groupOrder: order } = await searchGroupOrdersByInviteCode({ inviteCode: code });

      if (!res || res.error) {
        return false;
      }

      if (!order) return false;

      if (order.hostUserId === user?.id) return true;

      const exists = order.participants?.some(
        (participant: GroupOrderParticipant) => participant.userId === user?.id
      );

      return Boolean(exists);
    } catch {
      return false;
    }
  };

  const handleJoinGroupOrder = async (inviteCode: string) => {
    const res = await joinGroupOrder({ inviteCode });

    if (!res || res.error) {
      toast.error(res?.message || res?.error || t("failedJoin"));
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
      setStoredGroupOrderCode(codeFromUrl);
    }
  }, [codeFromUrl]);

  useEffect(() => {
    const processGroupOrderInvite = async () => {
      if (!token || !user?.id) return;

      const inviteCode =
        codeFromUrl ||
        getStoredGroupOrderCode();

      if (!inviteCode) return;

      if (handledInviteCodeRef.current === inviteCode) return;

      handledInviteCodeRef.current = inviteCode;

      try {
        setJoiningGroupOrder(true);

        setStoredGroupOrderCode(inviteCode);

        const alreadyIn = await isUserAlreadyInOrder(inviteCode);

        if (!alreadyIn) {
          const joined = await handleJoinGroupOrder(inviteCode);

          if (!joined) {
            clearStoredGroupOrderCode();
            return;
          }

          toast.success(t("joined"));
        }
      } finally {
        setJoiningGroupOrder(false);
      }
    };

    processGroupOrderInvite();
  }, [token, user?.id, codeFromUrl]);

  return (
    <div className="min-h-screen md:px-35">
      {joiningGroupOrder ? (
        <div className="mx-4 mt-4 rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm font-medium text-primary md:mx-10">
          {t("joining")}
        </div>
      ) : null}

      <RestaurantHeader />
      <ItemsLayout categoryId={categoryId} />
    </div>
  );
}

export function ItemsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ItemsPageContent />
    </Suspense>
  );
}
