"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2, Users } from "lucide-react";

import RestaurantHeader from "@/components/pages/Items/components/RestaurantHeader";
import { ItemsLayout } from "@/components/pages/Items/components/ItemsLayout";
import useBranches from "@/hooks/useBranches";
import { useGroupOrder, useGroupOrderApi } from "@/hooks/useGroupOrder";
import { useAuth } from "@/hooks/useAuth";
import {
  getDefaultBranchOrderType,
  getSoleActiveBranch,
  persistSelectedBranch,
} from "@/lib/branch-selector";
import {
  clearStoredGroupOrderCode,
  findCurrentGroupOrderParticipant,
  getStoredGroupOrderCode,
  isGroupOrderParticipantCompleted,
  isStoredGroupOrderCompleted,
  markStoredGroupOrderCompleted,
  setStoredGroupOrderCode,
  setStoredGroupOrderId,
  setStoredGroupOrderLobbyId,
} from "@/lib/group-order";
import type { GroupOrder } from "@/types/group-order";

function ItemsPageContent() {
  const t = useTranslations("items.groupOrder");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const categoryId = searchParams.get("categoryId") || "";
  const codeFromUrl = searchParams.get("code") || "";

  const { token, user, loading: authLoading, setUser } = useAuth();
  const {
    order,
    participant,
    refetch: refetchGroupOrder,
    canMutateGroupOrder,
    isHost,
  } = useGroupOrder();
  const branchApi = useBranches(token);
  const {
    joinGroupOrder,
    searchGroupOrdersByInviteCode,
    updateMyGroupOrderParticipantStatus,
  } = useGroupOrderApi(token);

  const [joiningGroupOrder, setJoiningGroupOrder] = useState(false);
  const [hasAddedGroupOrderItem, setHasAddedGroupOrderItem] = useState(false);
  const [markingDone, setMarkingDone] = useState(false);

  const handledInviteCodeRef = useRef<string | null>(null);

  const stripInviteCodeFromUrl = useCallback(() => {
    if (!codeFromUrl) return;

    const params = new URLSearchParams(searchParams.toString());
    params.delete("code");
    const query = params.toString();

    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [codeFromUrl, pathname, router, searchParams]);

  const findJoinedGroupOrder = async (
    code: string,
  ): Promise<GroupOrder | null> => {
    try {
      const { response: res, groupOrder: order } =
        await searchGroupOrdersByInviteCode({ inviteCode: code });

      if (!res || res.error) {
        return null;
      }

      if (!order) return null;

      if (order.hostUserId === user?.id) return order;

      const exists = Boolean(
        findCurrentGroupOrderParticipant({ order, userId: user?.id }),
      );

      return exists ? order : null;
    } catch {
      return null;
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
      if (isStoredGroupOrderCompleted({ inviteCode: codeFromUrl })) {
        clearStoredGroupOrderCode();
        stripInviteCodeFromUrl();
        return;
      }

      setStoredGroupOrderCode(codeFromUrl);
    }
  }, [codeFromUrl, stripInviteCodeFromUrl]);

  useEffect(() => {
    const processGroupOrderInvite = async () => {
      if (!token || !user?.id) return;

      const inviteCode = codeFromUrl || getStoredGroupOrderCode();

      if (!inviteCode) return;

      if (isStoredGroupOrderCompleted({ inviteCode })) {
        clearStoredGroupOrderCode();
        stripInviteCodeFromUrl();
        return;
      }

      if (handledInviteCodeRef.current === inviteCode) return;

      handledInviteCodeRef.current = inviteCode;

      try {
        setJoiningGroupOrder(true);

        setStoredGroupOrderCode(inviteCode);

        let joinedOrder = await findJoinedGroupOrder(inviteCode);

        let joinedNow = false;

        if (!joinedOrder) {
          const joined = await handleJoinGroupOrder(inviteCode);

          if (!joined) {
            clearStoredGroupOrderCode();
            return;
          }

          joinedNow = true;
          joinedOrder = await findJoinedGroupOrder(inviteCode);
        }

        const currentParticipant = joinedOrder
          ? findCurrentGroupOrderParticipant({
              order: joinedOrder,
              userId: user?.id,
            })
          : null;

        if (isGroupOrderParticipantCompleted(currentParticipant)) {
          markStoredGroupOrderCompleted({
            orderId: joinedOrder?.id,
            inviteCode: joinedOrder?.inviteCode || inviteCode,
          });
          clearStoredGroupOrderCode();
          stripInviteCodeFromUrl();
          await refetchGroupOrder();
          return;
        }

        if (joinedOrder?.id) {
          setStoredGroupOrderId(joinedOrder.id);
        }

        await refetchGroupOrder();
        if (joinedNow) {
          toast.success(t("joined"));
        }
      } finally {
        setJoiningGroupOrder(false);
      }
    };

    processGroupOrderInvite();
  }, [token, user?.id, codeFromUrl, refetchGroupOrder, stripInviteCodeFromUrl]);

  const participantSelectionDone =
    !isHost && isGroupOrderParticipantCompleted(participant);

  useEffect(() => {
    if (!participantSelectionDone) return;

    markStoredGroupOrderCompleted({
      orderId: order?.id,
      inviteCode: order?.inviteCode,
    });
    clearStoredGroupOrderCode();
    stripInviteCodeFromUrl();
    setHasAddedGroupOrderItem(false);
  }, [
    participantSelectionDone,
    order?.id,
    order?.inviteCode,
    stripInviteCodeFromUrl,
  ]);

  useEffect(() => {
    const autoSelectSoleBranch = async () => {
      if (
        !token ||
        !user ||
        user.branchId ||
        user.branch?.id ||
        !user.restaurantId
      )
        return;

      const inviteCode = codeFromUrl || getStoredGroupOrderCode();
      if (!inviteCode) return;

      try {
        const response = await branchApi.fetchBranchPage(
          `/v1/branches?restaurantId=${encodeURIComponent(user.restaurantId)}&page=1&limit=2`,
        );
        const soleBranch = getSoleActiveBranch(response);

        if (!soleBranch) return;

        persistSelectedBranch(soleBranch, setUser, {
          orderType: getDefaultBranchOrderType(
            soleBranch,
            user.selectedOrderType,
          ),
        });
      } catch {
        // Branch selection remains user-driven if automatic single-branch lookup fails.
      }
    };

    autoSelectSoleBranch();
  }, [branchApi.fetchBranchPage, codeFromUrl, setUser, token, user]);

  useEffect(() => {
    const handleGroupOrderItemAdded = () => setHasAddedGroupOrderItem(true);

    window.addEventListener(
      "deliveryway:group-order:item-added",
      handleGroupOrderItemAdded,
    );

    return () => {
      window.removeEventListener(
        "deliveryway:group-order:item-added",
        handleGroupOrderItemAdded,
      );
    };
  }, []);

  const participantItemCount = useMemo(() => {
    return (
      participant?.items?.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0,
      ) || 0
    );
  }, [participant?.items]);

  const showGroupOrderLobbyCta = Boolean(
    order?.inviteCode &&
    !participantSelectionDone &&
    (hasAddedGroupOrderItem || participantItemCount > 0),
  );

  const handleDoneSelecting = async () => {
    if (!order?.id || !canMutateGroupOrder || markingDone) return;

    try {
      setMarkingDone(true);
      const res = await updateMyGroupOrderParticipantStatus({
        orderId: order.id,
        status: "COMPLETED",
      });

      if (!res || res.error) {
        toast.error(res?.message || res?.error || t("failedMarkDone"));
        return;
      }

      toast.success(t("markedDone"));
      await refetchGroupOrder();
      markStoredGroupOrderCompleted({
        orderId: order.id,
        inviteCode: order.inviteCode,
      });
      setStoredGroupOrderLobbyId(order.id);
      clearStoredGroupOrderCode();
      router.push(
        `/group-order/lobby?groupOrderId=${encodeURIComponent(String(order.id))}`,
      );
    } catch {
      toast.error(t("failedMarkDone"));
    } finally {
      setMarkingDone(false);
    }
  };

  return (
    <div className="min-h-screen md:px-35">
      {joiningGroupOrder ? (
        <div className="mx-4 mt-4 rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm font-medium text-primary md:mx-10">
          {t("joining")}
        </div>
      ) : null}

      {showGroupOrderLobbyCta ? (
        <div className="relative mx-4 mt-4 overflow-hidden rounded-3xl border border-emerald-200/80 bg-white/95 shadow-[0_18px_55px_rgba(15,118,110,0.16)] backdrop-blur md:mx-10">
          <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-950">
                  {t("selectionSavedTitle")}
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">
                  {t(
                    isHost
                      ? "hostSelectionSavedDescription"
                      : "selectionSavedDescription",
                    { count: Math.max(participantItemCount, 1) },
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    order?.id
                      ? `/group-order/lobby?groupOrderId=${encodeURIComponent(String(order.id))}`
                      : "/group-order/lobby",
                  )
                }
                className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-800 transition hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2"
              >
                {t("goToLobby")}
              </button>
              {!isHost ? (
                <button
                  type="button"
                  onClick={handleDoneSelecting}
                  disabled={markingDone || !canMutateGroupOrder}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {markingDone ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {t("doneSelecting")}
                </button>
              ) : null}
            </div>
          </div>
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
