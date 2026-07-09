"use client";

import HeaderSection from "@/components/pages/GroupOrder/components/lobby/HeaderSection";
import { UserCard } from "@/components/pages/GroupOrder/components/lobby/UserCard";
import { OrderSummary } from "@/components/pages/GroupOrder/components/lobby/OrderSummary";
import InviteSection from "@/components/pages/GroupOrder/components/lobby/InviteSection";
import OrderSuccess from "@/components/pages/GroupOrder/components/Success/OrderSuccess";
import { useGroupOrder } from "@/hooks/useGroupOrder";
import { useGroupOrderApi } from "@/hooks/useGroupOrder";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { getBackendErrorMessage, hasBackendError } from "@/components/pages/Checkout/utils/checkout-normalizers";
import { setStoredGroupOrderCode } from "@/lib/group-order";
import type { GroupOrderParticipant, GroupOrderSuccessData } from "@/types/group-order";

export function GroupOrderLobbyPage() {
  const t = useTranslations("groupOrder.lobby");
  const router = useRouter();
  const { token } = useAuth();
  const { joinGroupOrder } = useGroupOrderApi(token);
  const [successData, setSuccessData] = useState<GroupOrderSuccessData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  const {
    order,
    updateOrder,
    loading,
    redirecting,
    refetch,
    canCheckout,
    canEditItems,
    canMutateGroupOrder,
    isHost,
    isParticipantCompleted,
    participant: currentUserParticipant,
  } = useGroupOrder();

  const updateParticipantStatus = (participantId: string | number, status: GroupOrderParticipant["status"]) => {
    updateOrder((currentOrder) => currentOrder ? {
      ...currentOrder,
      participants: currentOrder.participants?.map((participant) => (
        String(participant.id) === String(participantId)
          ? { ...participant, status }
          : participant
      )),
    } : currentOrder);
  };

  const updateParticipantItemQuantity = (participantId: string | number, itemId: string | number, quantity: number) => {
    updateOrder((currentOrder) => currentOrder ? {
      ...currentOrder,
      participants: currentOrder.participants?.map((participant) => (
        String(participant.id) === String(participantId)
          ? {
              ...participant,
              items: participant.items?.map((item) => (
                String(item.id) === String(itemId)
                  ? { ...item, quantity }
                  : item
              )),
            }
          : participant
      )),
    } : currentOrder);
  };

  const removeParticipantItem = (participantId: string | number, itemId: string | number) => {
    updateOrder((currentOrder) => currentOrder ? {
      ...currentOrder,
      participants: currentOrder.participants?.map((participant) => (
        String(participant.id) === String(participantId)
          ? {
              ...participant,
              items: participant.items?.filter((item) => String(item.id) !== String(itemId)),
            }
          : participant
      )),
    } : currentOrder);
  };

  const updateOrderSchedule = (orderTime: string | null) => {
    updateOrder((currentOrder) => currentOrder ? {
      ...currentOrder,
      orderTime,
      isScheduled: Boolean(orderTime),
      summary: currentOrder.summary ? {
        ...currentOrder.summary,
        orderTime,
        isScheduled: Boolean(orderTime),
      } : currentOrder.summary,
    } : currentOrder);

    void refetch();
  };

  const handleRefresh = async () => {
    if (refreshing) return;

    try {
      setRefreshing(true);
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleJoinWithCode = async () => {
    const code = joinCode.trim();

    if (!code) {
      toast.error(t("joinCodeRequired"));
      return;
    }

    setStoredGroupOrderCode(code);

    if (!token) {
      router.push(`/login?code=${encodeURIComponent(code)}`);
      return;
    }

    try {
      setJoining(true);
      const res = await joinGroupOrder({ inviteCode: code });

      if (hasBackendError(res)) {
        toast.error(getBackendErrorMessage(res, t("failedJoin")));
        return;
      }

      toast.success(t("joined"));
      router.push(`/items?code=${encodeURIComponent(code)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("failedJoin"));
    } finally {
      setJoining(false);
    }
  };

  if (successData) {
    return <OrderSuccess data={successData} />;
  }

  if (loading || redirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="rounded-2xl border border-gray-100 bg-white px-6 py-5 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>

          <p className="text-sm font-semibold text-gray-900">
            {redirecting ? t("alreadyCheckedOut") : t("loadingLobby")}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {redirecting
              ? t("redirecting")
              : t("preparing")}
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">
            {t("notFoundTitle")}
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            {t("notFoundDescription")}
          </p>

          <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 p-3 text-left">
            <p className="text-sm font-semibold text-gray-900">{t("joinWithCodeTitle")}</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleJoinWithCode();
                  }
                }}
                placeholder={t("joinCodePlaceholder")}
                className="h-11 min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold uppercase tracking-[0.18em] text-gray-900 outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
              />
              <button
                type="button"
                onClick={handleJoinWithCode}
                disabled={joining}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {joining ? t("joining") : t("joinGroupOrder")}
              </button>
            </div>
          </div>

          <a
            href="/group-order"
            className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white"
          >
            {t("goToGroupOrder")}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 md:px-40">
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
        {/* LEFT */}
        <div className="space-y-5">
          <HeaderSection
            order={order}
            canEditSchedule={isHost && canMutateGroupOrder}
            onScheduleUpdated={updateOrderSchedule}
          />

          {order?.participants?.map((participant: GroupOrderParticipant) => (
            <UserCard
              key={participant.id}
              participant={participant}
              orderId={order?.id}
              isHost={participant.isHost}
              canEdit={canEditItems && String(participant.userId || "") === String(currentUserParticipant?.userId || "")}
              onItemQuantityChange={updateParticipantItemQuantity}
              onItemRemove={removeParticipantItem}
            />
          ))}

          <InviteSection order={order} />
        </div>

        {/* RIGHT */}
        <OrderSummary
          order={order}
          canCheckout={canCheckout}
          canMutateGroupOrder={canMutateGroupOrder}
          isHost={isHost}
          isParticipantCompleted={isParticipantCompleted}
          participant={currentUserParticipant}
          onSuccess={setSuccessData}
          onParticipantStatusChange={updateParticipantStatus}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      </div>
    </div>
  );
}
