"use client";

import { Info, Loader2, LogOut, RefreshCw, X, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

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
import {
  clearStoredGroupOrderCode,
  markStoredGroupOrderCompleted,
  setStoredGroupOrderCode,
  setStoredGroupOrderId,
  setStoredGroupOrderLobbyId,
  unmarkStoredGroupOrderCompleted,
} from "@/lib/group-order";
import { PaymentMethodSection } from "@/components/pages/Checkout/components/PaymentMethodSection";
import { formatMoney } from "@/lib/money";
import { isImmediateScheduleAvailable } from "@/components/pages/Checkout/utils/pickup-schedule";
import {
  asRecord,
  getBackendErrorMessage,
  hasBackendError,
} from "@/components/pages/Checkout/utils/checkout-normalizers";
import type {
  CheckoutGroupOrderPayload,
  GroupOrder,
  GroupOrderParticipant,
  GroupOrderPaymentMethod,
  GroupOrderSuccessData,
} from "@/types/group-order";

type OrderSummaryProps = {
  order: GroupOrder;
  canCheckout: boolean;
  canMutateGroupOrder: boolean;
  isHost: boolean;
  isParticipantCompleted: boolean;
  participant: GroupOrderParticipant | undefined;
  onSuccess: (data: GroupOrderSuccessData) => void;
  onParticipantStatusChange: (
    participantId: string | number,
    status: GroupOrderParticipant["status"],
  ) => void;
  onRefresh: () => void;
  refreshing: boolean;
  currency?: string | null;
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
  currency,
}: OrderSummaryProps) {
  const t = useTranslations("groupOrder.lobby.summary");
  const checkoutT = useTranslations("checkout");
  const cartT = useTranslations("cart");
  const errorT = useTranslations("errors");
  const summary = order?.summary;
  const router = useRouter();
  const { token } = useAuth();
  const {
    cancelGroupOrder,
    checkoutGroupOrder,
    leaveGroupOrder,
    updateMyGroupOrderParticipantStatus,
  } = useGroupOrderApi(token);

  const [noteOpen, setNoteOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [note, setNote] = useState("");
  const [coupon, setCoupon] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<GroupOrderPaymentMethod>("COD");
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [loadingLeave, setLoadingLeave] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [stripePayment, setStripePayment] = useState({
    open: false,
    clientSecret: "",
    publishableKey: "",
  });
  const [pendingSuccessData, setPendingSuccessData] =
    useState<GroupOrderSuccessData | null>(null);
  const stripePromise = useMemo(() => {
    if (!stripePayment.publishableKey) return null;

    return loadStripe(stripePayment.publishableKey);
  }, [stripePayment.publishableKey]);

  const getPendingStripeOrderId = () => {
    const successData = pendingSuccessData;
    const directOrderId = successData?.order?.id;
    const finalOrderId = successData?.session?.finalOrderId;

    return String(directOrderId || finalOrderId || "");
  };

  const resetStripePayment = () => {
    setStripePayment({ open: false, clientSecret: "", publishableKey: "" });
    setPendingSuccessData(null);
  };

  const handleCloseStripePayment = () => {
    const pendingOrderId = getPendingStripeOrderId();

    resetStripePayment();

    if (pendingOrderId) {
      toast.info(checkoutT("toast.paymentPending"));
      setCheckoutOpen(false);
      clearStoredGroupOrderCode();
      router.push(`/order?orderId=${encodeURIComponent(pendingOrderId)}`);
    }
  };

  const actionsDisabled =
    !canMutateGroupOrder ||
    loadingCancel ||
    loadingCheckout ||
    loadingLeave ||
    loadingStatus;
  const isDeliveryOrder =
    String(order?.orderType || "").toUpperCase() === "DELIVERY";
  const normalizedOrderType = String(order?.orderType || "").toUpperCase();
  const scheduleType =
    normalizedOrderType === "DELIVERY" ? "delivery" : "pickup";
  const isScheduledGroupOrder = Boolean(
    order?.isScheduled || summary?.isScheduled,
  );
  const immediateCheckoutUnavailable = Boolean(
    !isScheduledGroupOrder &&
    order?.branch &&
    !isImmediateScheduleAvailable({ branch: order.branch, scheduleType }),
  );
  const checkoutDisabled =
    !canCheckout || actionsDisabled || immediateCheckoutUnavailable;
  const amount = (value: unknown, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const positiveAmount = (value: unknown) => amount(value) > 0;
  const formatAmount = (value: unknown) => formatMoney(value, currency);
  const serviceChargeAmount =
    summary?.serviceChargeAmount ??
    summary?.chargeBreakdown?.totalServiceChargeAmount ??
    0;
  const transactionFeeAmount =
    summary?.transactionFeeAmount ??
    summary?.chargeBreakdown?.totalTransactionFeeAmount ??
    0;
  const taxAmount =
    summary?.taxAmount ?? summary?.chargeBreakdown?.totalTaxAmount ?? 0;
  const payableAmount = summary?.payableAmount ?? summary?.totalAmount ?? 0;
  const serviceChargeLabel = useMemo(() => {
    const firstCharge = summary?.chargeBreakdown?.serviceCharges?.[0];
    const label = firstCharge?.label || t("platformFee");
    const type = String(
      summary?.serviceChargeType || firstCharge?.type || "",
    ).toUpperCase();
    const value = summary?.serviceChargeValue ?? firstCharge?.value;

    if (
      type === "PERCENTAGE" &&
      value !== null &&
      value !== undefined &&
      value !== ""
    ) {
      return `${label} (${Number(value).toString()}%)`;
    }

    return label;
  }, [
    summary?.chargeBreakdown?.serviceCharges,
    summary?.serviceChargeType,
    summary?.serviceChargeValue,
    t,
  ]);
  const transactionFeeLabel =
    summary?.chargeBreakdown?.transactionFees?.[0]?.label ||
    cartT("transactionFee");

  const handleParticipantStatusToggle = async () => {
    if (isHost || !participant || !canMutateGroupOrder) return;

    const nextStatus = isParticipantCompleted ? "ACTIVE" : "COMPLETED";
    const previousStatus = participant.status;

    try {
      setLoadingStatus(true);
      onParticipantStatusChange(participant.id, nextStatus);
      const res = await updateMyGroupOrderParticipantStatus({
        orderId: order.id,
        status: nextStatus,
      });

      if (hasBackendError(res)) {
        onParticipantStatusChange(participant.id, previousStatus);
        toast.error(getBackendErrorMessage(res, t("failedUpdateStatus")));
        return;
      }

      if (nextStatus === "COMPLETED") {
        markStoredGroupOrderCompleted({
          orderId: order.id,
          inviteCode: order.inviteCode,
        });
        clearStoredGroupOrderCode();
      } else {
        unmarkStoredGroupOrderCompleted({
          orderId: order.id,
          inviteCode: order.inviteCode,
        });
        setStoredGroupOrderId(order.id);
        setStoredGroupOrderLobbyId(order.id);
        if (order.inviteCode) {
          setStoredGroupOrderCode(order.inviteCode);
        }
      }

      toast.success(
        nextStatus === "COMPLETED" ? t("markedDone") : t("editingEnabled"),
      );
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

      const payload: CheckoutGroupOrderPayload = {
        paymentMethod,
        customerNote: note || "",
        couponCode: coupon || "",
        ...(isScheduledGroupOrder && order?.orderTime
          ? { orderTime: order.orderTime }
          : {}),
      };

      const res = await checkoutGroupOrder({ orderId: order.id, payload });

      if (hasBackendError(res)) {
        toast.error(getBackendErrorMessage(res, t("checkoutFailed")));

        return;
      }

      const successData = (res?.data || {}) as GroupOrderSuccessData;

      if (paymentMethod === "STRIPE") {
        const dataRecord = asRecord(res?.data);
        const orderRecord = asRecord(dataRecord.order);
        const paymentRecord = asRecord(
          orderRecord.payment || dataRecord.payment,
        );
        const paymentSession = asRecord(
          res?.paymentSession ||
            dataRecord.paymentSession ||
            res?.providerData ||
            dataRecord.providerData ||
            orderRecord.paymentSession ||
            paymentRecord.providerData,
        );
        const clientSecret =
          typeof paymentSession.clientSecret === "string"
            ? paymentSession.clientSecret
            : "";
        const publishableKey =
          typeof paymentSession.publishableKey === "string"
            ? paymentSession.publishableKey
            : "";

        if (!clientSecret || !publishableKey) {
          toast.error(checkoutT("toast.failedInitiatePayment"));
          return;
        }

        setPendingSuccessData(successData);
        setCheckoutOpen(false);
        setStripePayment({ open: true, clientSecret, publishableKey });
        return;
      }

      toast.success(t("orderPlaced"));
      window.dispatchEvent(new Event("loyalty-updated"));
      setCheckoutOpen(false);
      onSuccess(successData);
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
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
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
            <span>
              {cartT("subtotal")} (
              {cartT("itemCount", { count: summary?.itemCount || 0 })})
            </span>
            <span>{formatAmount(summary?.subtotal || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>{cartT("deliveryFee")}</span>
            <span>{formatAmount(summary?.deliveryFee || 0)}</span>
          </div>
          {positiveAmount(serviceChargeAmount) ? (
            <div className="flex justify-between">
              <span>{serviceChargeLabel}</span>
              <span>{formatAmount(serviceChargeAmount)}</span>
            </div>
          ) : null}
          {positiveAmount(transactionFeeAmount) ? (
            <div className="flex justify-between">
              <span>{transactionFeeLabel}</span>
              <span>{formatAmount(transactionFeeAmount)}</span>
            </div>
          ) : null}
          {positiveAmount(summary?.tipAmount) ? (
            <div className="flex justify-between">
              <span>{cartT("tip")}</span>
              <span>{formatAmount(summary?.tipAmount)}</span>
            </div>
          ) : null}
          {positiveAmount(summary?.discountAmount) ? (
            <div className="flex justify-between text-green-700">
              <span>{cartT("discount")}</span>
              <span>- {formatAmount(summary?.discountAmount)}</span>
            </div>
          ) : null}
          {positiveAmount(summary?.loyaltyDiscountAmount) ? (
            <div className="flex justify-between text-green-700">
              <span>{cartT("loyaltyDiscount")}</span>
              <span>- {formatAmount(summary?.loyaltyDiscountAmount)}</span>
            </div>
          ) : null}
          {positiveAmount(summary?.walletAppliedAmount) ? (
            <div className="flex justify-between text-green-700">
              <span>{cartT("walletApplied")}</span>
              <span>- {formatAmount(summary?.walletAppliedAmount)}</span>
            </div>
          ) : null}
        </div>

        <div className="border-t my-5" />

        <div className="flex justify-between font-semibold text-lg">
          <span>{cartT("total")}</span>
          <span className="text-orange-500">{formatAmount(payableAmount)}</span>
        </div>

        {/* CHECKOUT BUTTON */}
        {!isHost && participant ? (
          <button
            onClick={handleParticipantStatusToggle}
            disabled={actionsDisabled}
            className="w-full mt-5 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-full font-medium shadow-md hover:shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingStatus
              ? t("updatingStatus")
              : isParticipantCompleted
                ? t("editOrder")
                : t("done")}
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
          {isParticipantCompleted
            ? t("completedEditNotice")
            : t("hostFinalizeNotice")}
        </p>
      </div>
      <div className="flex items-start gap-3 bg-sky-100/40 text-sky-900 rounded-xl px-4 py-4">
        <Info className="w-5 h-5 mt-0.5 text-sky-700" strokeWidth={2.5} />
        <p className="text-xs leading-relaxed">{t("editNotice")}</p>
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
            <p className="text-sm text-gray-500 mt-1">{t("noteDescription")}</p>
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
                setPaymentMethod={(value) =>
                  setPaymentMethod(value as GroupOrderPaymentMethod)
                }
                cashLabel={
                  isDeliveryOrder ? t("paymentMethods.COD") : checkoutT("cash")
                }
                allowCardOnDelivery={isDeliveryOrder}
              />
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
              {loadingCheckout && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("confirmOrder")}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {stripePayment.open && stripePromise && stripePayment.clientSecret ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative max-h-[90vh] w-[min(420px,calc(100vw-32px))] overflow-auto rounded-2xl bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
            <button
              type="button"
              onClick={handleCloseStripePayment}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
              aria-label="Close payment popup"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="mb-2 pr-10 text-lg font-semibold">
              {checkoutT("completePayment")}
            </h2>
            <p className="mb-5 text-sm leading-6 text-gray-500">
              {checkoutT("paymentPendingDescription")}
            </p>

            <Elements
              stripe={stripePromise}
              options={{ clientSecret: stripePayment.clientSecret }}
            >
              <GroupOrderStripeCheckout
                onSuccess={() => {
                  const successData = pendingSuccessData;

                  resetStripePayment();

                  if (!successData) {
                    toast.success(
                      checkoutT("toast.paymentSuccessfulPendingWebhook"),
                    );
                    setCheckoutOpen(false);
                    clearStoredGroupOrderCode();
                    return;
                  }

                  toast.success(
                    checkoutT("toast.paymentSuccessfulPendingWebhook"),
                  );
                  window.dispatchEvent(new Event("loyalty-updated"));
                  setCheckoutOpen(false);
                  onSuccess(successData);
                  clearStoredGroupOrderCode();
                }}
              />
            </Elements>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const GroupOrderStripeCheckout = ({ onSuccess }: { onSuccess: () => void }) => {
  const checkoutT = useTranslations("checkout");
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;

    try {
      setPaying(true);

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        toast.error(error.message || checkoutT("toast.paymentFailed"));
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        onSuccess();
        return;
      }

      toast.error(checkoutT("toast.paymentNotCompleted"));
    } catch {
      toast.error(checkoutT("toast.paymentFailed"));
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-4">
      <PaymentElement />

      <button
        type="button"
        onClick={handlePay}
        disabled={paying || !stripe || !elements}
        className="h-11 w-full rounded-xl text-white disabled:opacity-60"
        style={{ background: "var(--primary)" }}
      >
        {paying ? checkoutT("processing") : checkoutT("payNow")}
      </button>
    </div>
  );
};
