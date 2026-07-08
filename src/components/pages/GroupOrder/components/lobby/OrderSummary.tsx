"use client";

import { Coins, Info, Loader2, LogOut, RefreshCw, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { toast } from "sonner";
import { useTranslations } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGroupOrderApi } from "@/hooks/useGroupOrder";
import { useAuth } from "@/hooks/useAuth";
import { clearStoredGroupOrderCode } from "@/lib/group-order";
import { PaymentMethodSection } from "@/components/pages/Checkout/components/PaymentMethodSection";
import { isImmediateScheduleAvailable } from "@/components/pages/Checkout/utils/pickup-schedule";
import { getBackendErrorMessage, hasBackendError } from "@/components/pages/Checkout/utils/checkout-normalizers";
import { fetchCustomerLoyaltyPoints, type LoyaltySummary } from "@/services/loyalty";
import type { CheckoutGroupOrderPayload, GroupOrder, GroupOrderParticipant, GroupOrderPaymentMethod, GroupOrderSuccessData } from "@/types/group-order";

type OrderSummaryProps = {
  order: GroupOrder;
  canCheckout: boolean;
  canMutateGroupOrder: boolean;
  isHost: boolean;
  isParticipantCompleted: boolean;
  participant: GroupOrderParticipant | undefined;
  onSuccess: (data: GroupOrderSuccessData) => void;
  onParticipantStatusChange: (participantId: string | number, status: GroupOrderParticipant["status"]) => void;
  onRefresh: () => void;
  refreshing: boolean;
};

export function OrderSummary({
  order,
  canCheckout,
  canMutateGroupOrder,
  isHost,
  isParticipantCompleted,
  participant,
  onSuccess,
  onParticipantStatusChange,
  onRefresh,
  refreshing,
}: OrderSummaryProps) {
  const t = useTranslations("groupOrder.lobby.summary");
  const checkoutT = useTranslations("checkout");
  const cartT = useTranslations("cart");
  const errorT = useTranslations("errors");
  const summary = order?.summary;
  const { token } = useAuth();
  const { cancelGroupOrder, checkoutGroupOrder, leaveGroupOrder, updateMyGroupOrderParticipantStatus } = useGroupOrderApi(token);

  const [noteOpen, setNoteOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [note, setNote] = useState("");
  const [coupon, setCoupon] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<GroupOrderPaymentMethod>("COD");
  const [loyalty, setLoyalty] = useState<LoyaltySummary | null>(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState("");
  const [loadingLoyalty, setLoadingLoyalty] = useState(false);

  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [loadingLeave, setLoadingLeave] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const actionsDisabled = !canMutateGroupOrder || loadingCancel || loadingCheckout || loadingLeave || loadingStatus;
  const isDeliveryOrder = String(order?.orderType || "").toUpperCase() === "DELIVERY";
  const normalizedOrderType = String(order?.orderType || "").toUpperCase();
  const scheduleType = normalizedOrderType === "DELIVERY" ? "delivery" : "pickup";
  const isScheduledGroupOrder = Boolean(order?.isScheduled || summary?.isScheduled);
  const immediateCheckoutUnavailable = Boolean(
    !isScheduledGroupOrder &&
    order?.branch &&
    !isImmediateScheduleAvailable({ branch: order.branch, scheduleType })
  );
  const checkoutDisabled = !canCheckout || actionsDisabled || immediateCheckoutUnavailable;
  const normalizedLoyaltyPoints = Math.max(0, Math.floor(Number(loyaltyPoints) || 0));
  const loyaltyCanRedeem = Boolean(
    loyalty &&
    normalizedLoyaltyPoints >= Math.max(0, loyalty.minimumRedeemPoints) &&
    normalizedLoyaltyPoints <= Math.max(0, loyalty.availablePoints)
  );
  const loyaltyEstimatedDiscount = loyalty
    ? normalizedLoyaltyPoints * Math.max(0, loyalty.redemptionValuePerPoint)
    : 0;

  useEffect(() => {
    if (!checkoutOpen || !token) return;

    let active = true;

    const loadLoyalty = async () => {
      try {
        setLoadingLoyalty(true);
        const { loyalty: nextLoyalty } = await fetchCustomerLoyaltyPoints(token);
        if (active) setLoyalty(nextLoyalty);
      } catch {
        if (active) setLoyalty(null);
      } finally {
        if (active) setLoadingLoyalty(false);
      }
    };

    void loadLoyalty();

    return () => {
      active = false;
    };
  }, [checkoutOpen, token]);

  const handleParticipantStatusToggle = async () => {
    if (isHost || !participant || !canMutateGroupOrder) return;

    const nextStatus = isParticipantCompleted ? "ACTIVE" : "COMPLETED";
    const previousStatus = participant.status;

    try {
      setLoadingStatus(true);
      onParticipantStatusChange(participant.id, nextStatus);
      const res = await updateMyGroupOrderParticipantStatus({ orderId: order.id, status: nextStatus });

      if (hasBackendError(res)) {
        onParticipantStatusChange(participant.id, previousStatus);
        toast.error(getBackendErrorMessage(res, t("failedUpdateStatus")));
        return;
      }

      toast.success(nextStatus === "COMPLETED" ? t("markedDone") : t("editingEnabled"));
    } catch (err) {
      onParticipantStatusChange(participant.id, previousStatus);
      toast.error(err instanceof Error ? err.message : t("failedUpdateStatus"));
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleLeave = async () => {
    if (isHost || !canMutateGroupOrder) return;

    try {
      setLoadingLeave(true);
      const res = await leaveGroupOrder({ orderId: order.id });

      if (hasBackendError(res)) {
        toast.error(getBackendErrorMessage(res, t("failedLeaveGroup")));
        return;
      }

      clearStoredGroupOrderCode();
      toast.success(t("leftGroup"));
      window.location.href = "/";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failedLeaveGroup"));
    } finally {
      setLoadingLeave(false);
    }
  };

  const handleCancel = async () => {
    if (!isHost || !canMutateGroupOrder) return;

    try {
      setLoadingCancel(true);
      const res = await cancelGroupOrder({ orderId: order.id });

      if (hasBackendError(res)) {
        toast.error(getBackendErrorMessage(res, t("failedCancelGroup")));
        return;
      }

      clearStoredGroupOrderCode();
      toast.success(t("cancelledGroup"));
      window.location.href = "/group-order";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failedCancelGroup"));
    } finally {
      setLoadingCancel(false);
    }
  };

 const handleCheckout = async () => {
  if (!canMutateGroupOrder) {
    toast.error(t("cannotModifyClosedGroup"));
    return;
  }

  try {
    setLoadingCheckout(true);

    if (normalizedLoyaltyPoints > 0) {
      if (!loyalty) {
        toast.error(checkoutT("toast.loyaltyUnavailable"));
        return;
      }

      if (normalizedLoyaltyPoints < loyalty.minimumRedeemPoints) {
        toast.error(checkoutT("toast.minimumLoyaltyPoints", { points: loyalty.minimumRedeemPoints }));
        return;
      }

      if (normalizedLoyaltyPoints > loyalty.availablePoints) {
        toast.error(checkoutT("toast.insufficientLoyaltyPoints"));
        return;
      }
    }

    const payload: CheckoutGroupOrderPayload = {
      paymentMethod,
      customerNote: note || "",
      couponCode: coupon || "",
      ...(isScheduledGroupOrder && order?.orderTime ? { orderTime: order.orderTime } : {}),
      ...(normalizedLoyaltyPoints > 0 ? { loyaltyPoints: normalizedLoyaltyPoints } : {}),
    };

    const res = await checkoutGroupOrder({ orderId: order.id, payload });

    if (hasBackendError(res)) {
      toast.error(getBackendErrorMessage(res, t("checkoutFailed")));

      return;
    }

    toast.success(t("orderPlaced"));
    window.dispatchEvent(new Event("loyalty-updated"));
    setCheckoutOpen(false);
onSuccess((res?.data || {}) as GroupOrderSuccessData);
clearStoredGroupOrderCode();
  } catch {
    toast.error(errorT("somethingWentWrong"));
  } finally {
    setLoadingCheckout(false);
  }
};


  return (
    <div className="space-y-6">

      {/* SUMMARY */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">

        {/* TOP ROW */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900 text-lg">
              {t("title")}
            </h2>
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              aria-label={refreshing ? t("refreshing") : t("refresh")}
              title={refreshing ? t("refreshing") : t("refresh")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* LEAVE BUTTON */}
       {isHost && canMutateGroupOrder ? (
          <button
            onClick={handleCancel}
            disabled={actionsDisabled}
            className="flex items-center gap-1 text-red-500 text-sm hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingCancel ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            {t("cancel")}
          </button>
        ) : null}

       {!isHost && canMutateGroupOrder ? (
          <button
            onClick={handleLeave}
            disabled={actionsDisabled}
            className="flex items-center gap-1 text-red-500 text-sm hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingLeave ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            {t("leave")}
          </button>
        ) : null}
        </div>

        {/* PRICES */}
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>{cartT("subtotal")} ({cartT("itemCount", { count: summary?.itemCount || 0 })})</span>
            <span>${summary?.subtotal || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>{cartT("deliveryFee")}</span>
            <span>${summary?.deliveryFee || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>{t("platformFee")}</span>
            <span>$1.50</span>
          </div>
          {Number(summary?.tipAmount || 0) > 0 ? (
            <div className="flex justify-between">
              <span>{cartT("tip")}</span>
              <span>${Number(summary?.tipAmount || 0).toFixed(2)}</span>
            </div>
          ) : null}
          {Number(summary?.loyaltyDiscountAmount || 0) > 0 ? (
            <div className="flex justify-between text-green-700">
              <span>{cartT("loyaltyDiscount")}</span>
              <span>- ${Number(summary?.loyaltyDiscountAmount || 0).toFixed(2)}</span>
            </div>
          ) : null}
        </div>

        <div className="border-t my-5" />

        <div className="flex justify-between font-semibold text-lg">
          <span>{cartT("total")}</span>
          <span className="text-orange-500">
            ${summary?.totalAmount || 0}
          </span>
        </div>

        {/* CHECKOUT BUTTON */}
       {!isHost && participant ? (
          <button
            onClick={handleParticipantStatusToggle}
            disabled={actionsDisabled}
            className="w-full mt-5 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-full font-medium shadow-md hover:shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingStatus ? t("updatingStatus") : isParticipantCompleted ? t("editOrder") : t("done")}
          </button>
        ) : null}

       <button
  onClick={() => {
    if (!canMutateGroupOrder) {
      toast.error(t("cannotModifyClosedGroup"));
      return;
    }

    if (!canCheckout) {
      toast.error(t("onlyHostCanFinalize"));
      return;
    }

    if (immediateCheckoutUnavailable) {
      toast.error(t("instantCheckoutUnavailable"));
      return;
    }

    setCheckoutOpen(true);
  }}
  disabled={checkoutDisabled}
  className={`${!isHost && participant ? "mt-2" : "mt-5"} w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-full font-medium shadow-md hover:shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60`}
>
  {t("finalizeCheckout")}
</button>

        {immediateCheckoutUnavailable ? (
          <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">
            {t("instantCheckoutUnavailable")}
          </p>
        ) : null}

        {/* NOTE BUTTON */}
        <button
          onClick={() => setNoteOpen(true)}
          className="w-full mt-2 bg-gray-100 text-gray-600 py-2 rounded-full text-sm hover:bg-gray-200 transition"
        >
          {t("addRestaurantNote")}
        </button>

        <p className="text-xs text-gray-400 mt-3">
          {isParticipantCompleted ? t("completedEditNotice") : t("hostFinalizeNotice")}
        </p>
      </div>
      <div className="flex items-start gap-3 bg-sky-100/40 text-sky-900 rounded-xl px-4 py-4">
        <Info className="w-5 h-5 mt-0.5 text-sky-700" strokeWidth={2.5} />
        <p className="text-xs leading-relaxed">
          {t("editNotice")}
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm leading-6 text-gray-600 shadow-sm">
        {t("helpfulText")}
      </div>

      {/* NOTE MODAL */}
   <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
  <DialogContent className="rounded-3xl bg-[#f7f7f7] p-6 max-w-md border-none">

    <DialogHeader>
      <DialogTitle className="text-xl font-semibold text-gray-900">
        {t("noteTitle")}
      </DialogTitle>
      <p className="text-sm text-gray-500 mt-1">
        {t("noteDescription")}
      </p>
    </DialogHeader>

    <textarea
      value={note}
      onChange={(e) => setNote(e.target.value)}
      placeholder={t("notePlaceholder")}
      className="w-full mt-4 bg-white border border-gray-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      rows={4}
    />

    <button
      onClick={() => setNoteOpen(false)}
      className="w-full mt-5 bg-primary text-white py-3 rounded-full font-medium hover:opacity-90 transition"
    >
      {t("saveNote")}
    </button>

  </DialogContent>
</Dialog>

    {/* CHECKOUT MODAL */}
    <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
  <DialogContent className="flex max-h-[min(92dvh,900px)] max-w-[min(96vw,920px)] flex-col overflow-hidden rounded-3xl border-none bg-[#f7f7f7] p-0">

    <DialogHeader className="shrink-0 border-b border-gray-100 bg-white px-6 py-5">
      <DialogTitle className="text-xl font-semibold text-gray-900">
        {t("checkoutDetails")}
      </DialogTitle>
      <p className="text-sm text-gray-500 mt-1">
        {t("checkoutDescription")}
      </p>
    </DialogHeader>

    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">

    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <PaymentMethodSection
        paymentMethod={paymentMethod}
        setPaymentMethod={(value) => setPaymentMethod(value as GroupOrderPaymentMethod)}
        cashLabel={isDeliveryOrder ? t("paymentMethods.COD") : checkoutT("cash")}
        allowCardOnDelivery={isDeliveryOrder}
      />
    </div>


    <div className="mt-5 rounded-2xl border border-primary/10 bg-[linear-gradient(135deg,rgba(206,24,27,0.07),rgba(17,24,39,0.03))] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Coins size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-950">{t("loyaltyTitle")}</p>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            {loadingLoyalty
              ? t("loyaltyLoading")
              : loyalty
                ? t("loyaltyAvailable", {
                    points: Math.max(0, Math.round(loyalty.availablePoints)),
                    minimum: Math.max(0, Math.round(loyalty.minimumRedeemPoints)),
                  })
                : t("loyaltyUnavailable")}
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="number"
              min="0"
              value={loyaltyPoints}
              onChange={(event) => setLoyaltyPoints(event.target.value)}
              disabled={loadingLoyalty || !loyalty}
              placeholder={t("loyaltyPlaceholder")}
              className="h-11 flex-1 rounded-full border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
            />
            {normalizedLoyaltyPoints > 0 ? (
              <button
                type="button"
                onClick={() => setLoyaltyPoints("")}
                className="h-11 rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:border-primary/30 hover:text-primary"
              >
                {t("loyaltyClear")}
              </button>
            ) : null}
          </div>
          {normalizedLoyaltyPoints > 0 ? (
            <p className={`mt-2 text-xs font-medium ${loyaltyCanRedeem ? "text-green-700" : "text-amber-700"}`}>
              {loyaltyCanRedeem
                ? t("loyaltyEstimatedDiscount", { amount: `$${loyaltyEstimatedDiscount.toFixed(2)}` })
                : t("loyaltyRequirements")}
            </p>
          ) : null}
        </div>
      </div>
    </div>

    {/* COUPON */}
    <div className="mt-5">
      <p className="text-sm font-medium text-gray-700 mb-1">
        {t("couponCode")}
      </p>
      <input
        value={coupon}
        onChange={(e) => setCoupon(e.target.value)}
        placeholder={t("couponPlaceholder")}
        className="w-full bg-white border border-gray-200 rounded-full px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>

    </div>

    {/* SUBMIT */}
    <div className="shrink-0 border-t border-gray-100 bg-white px-6 py-4">
    <button
      onClick={handleCheckout}
      disabled={loadingCheckout}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loadingCheckout && (
        <Loader2 className="w-4 h-4 animate-spin" />
      )}
      {t("confirmOrder")}
    </button>
    </div>

  </DialogContent>
</Dialog>

    </div>
  );
}
