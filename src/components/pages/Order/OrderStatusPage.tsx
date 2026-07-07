"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import useOrders from "@/hooks/useOrders";
import usePayments from "@/hooks/usePayments";
import { useAuthContext } from "@/hooks/useAuth";
import OrderSummary from "@/components/pages/Order/components/OrderSummary";
import type { Order } from "@/services/orders";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { X } from "lucide-react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  getOrderProgressStep,
  getOrderProgressStepKeys,
  type OrderProgressStepKey,
} from "@/components/pages/Order/order-status-progress";
import { resolveCustomerCurrency } from "@/lib/money";
import { isPaymentPendingStripeOrder, isPendingOnlinePaymentOrder, isPlacedPaidOrder } from "@/components/pages/Order/payment-state";

function OrderStatusContent() {
  const t = useTranslations("orderStatus");
  const checkoutT = useTranslations("checkout");
  const errorT = useTranslations("errors");
  const { token } = useAuthContext();
  const { fetchOrderById } = useOrders(token);
  const { createOrderPaymentAttempt } = usePayments(token);

  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const isSuccessView = searchParams.get("success") === "true";

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [continuingPayment, setContinuingPayment] = useState(false);
  const [changingPaymentMethod, setChangingPaymentMethod] = useState<string | null>(null);
  const [stripePayment, setStripePayment] = useState({
    open: false,
    clientSecret: "",
    publishableKey: "",
    orderId: "",
  });

  const stripePromise = useMemo(() => {
    if (!stripePayment.publishableKey) return null;
    return loadStripe(stripePayment.publishableKey);
  }, [stripePayment.publishableKey]);

  const resetStripePayment = () => {
    setStripePayment({
      open: false,
      clientSecret: "",
      publishableKey: "",
      orderId: "",
    });
  };

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setNotFound(false);

      const { response: res, order: nextOrder } = await fetchOrderById({ orderId });

      if (!res || res.success === false || !nextOrder) {
        setNotFound(true);
        setOrder(null);
        return;
      }

      setOrder(nextOrder);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [fetchOrderById, orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleChangePaymentMethod = async (paymentMethod: string) => {
    if (!order?.id) return;

    const normalizedPaymentMethod = paymentMethod.toUpperCase();

    try {
      setChangingPaymentMethod(normalizedPaymentMethod);

      const attempt = await createOrderPaymentAttempt({
        orderId: order.id,
        payload: {
          paymentMethod: normalizedPaymentMethod,
          currency: resolveCustomerCurrency({
            moneyCurrency: order.transactions?.find((transaction) => transaction.currency)?.currency,
          }),
          note: normalizedPaymentMethod === "STRIPE" ? "Retry order payment" : "Switch order payment method",
        },
      });

      if (!attempt.response || attempt.response.success === false) {
        toast.error(attempt.response?.message || checkoutT("toast.failedInitiatePayment"));
        return;
      }

      if (normalizedPaymentMethod === "STRIPE") {
        if (!attempt.clientSecret || !attempt.publishableKey) {
          toast.error(attempt.response?.message || checkoutT("toast.failedInitiatePayment"));
          return;
        }

        setStripePayment({
          open: true,
          clientSecret: attempt.clientSecret,
          publishableKey: attempt.publishableKey,
          orderId: order.id,
        });
        return;
      }

      toast.success(checkoutT("toast.paymentMethodUpdated"));
      await fetchOrder();
    } catch {
      toast.error(errorT("somethingWentWrong"));
    } finally {
      setChangingPaymentMethod(null);
    }
  };

  const handleContinuePayment = async () => {
    setContinuingPayment(true);

    try {
      await handleChangePaymentMethod("STRIPE");
    } finally {
      setContinuingPayment(false);
    }
  };

  const handlePaymentSuccess = async () => {
    toast.success(checkoutT("toast.paymentSuccessfulPendingWebhook"));
    resetStripePayment();
    await fetchOrder();
  };

  const paymentPendingStripeOrder = isPaymentPendingStripeOrder(order);
  const canSwitchPaymentMethod = isPendingOnlinePaymentOrder(order);
  const placedPaidOrder = isPlacedPaidOrder(order);
  const showSuccessNotice = !loading && order?.id && isSuccessView && placedPaidOrder;
  const showPaymentPendingNotice = !loading && order?.id && paymentPendingStripeOrder;
  const successNoticeTitle = t("successNotice.title");
  const successNoticeDescription = t("successNotice.description");

  const currentStep = paymentPendingStripeOrder
    ? 0
    : getOrderProgressStep(order?.status, order?.orderType);

  const getOrderTypeLabel = (value?: string | null) => {
    switch (String(value || "").toUpperCase()) {
      case "DELIVERY":
        return t("orderType.delivery");
      case "PICKUP":
        return t("orderType.pickup");
      case "TAKEAWAY":
        return t("orderType.takeaway");
      default:
        return value || t("loading");
    }
  };

  const orderSteps = getOrderProgressStepKeys(order?.orderType).map((key, index) => ({
    id: index + 1,
    title: t(`steps.${key}Title` as `steps.${OrderProgressStepKey}Title`),
    desc: t(`steps.${key}Description` as `steps.${OrderProgressStepKey}Description`),
  })).map((step) => ({
    ...step,
    active: step.id <= currentStep,
  }));

  return (
    <div className="max-w-[1400px] mx-auto mt-[36px] mb-[113px] px-6 md:px-30 pt-5">

      {/* ================= NOT FOUND ================= */}
      {!loading && notFound && (
        <div className="bg-white rounded-xl shadow-lg p-10 text-center">
          <h2 className="text-lg font-semibold text-red-500 mb-2">
            {t("orderNotFound")}
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            {t("notFoundDescription")}
          </p>

          <Link
            href="/"
            className="inline-block bg-primary text-white px-5 py-2 rounded-lg text-sm hover:bg-primary/90"
          >
            {t("goToHome")}
          </Link>
        </div>
      )}

      {/* ================= NORMAL FLOW ================= */}
      {!notFound && (
        <>
        {showSuccessNotice ? (
          <div className="mb-6 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-emerald-700">
              {successNoticeTitle}
            </p>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              {successNoticeDescription}
            </p>
          </div>
        ) : null}

        {showPaymentPendingNotice ? (
          <div className="mb-6 rounded-2xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
            <p className="text-sm font-semibold text-amber-800">
              {t("successNotice.paymentPendingTitle")}
            </p>
            <p className="mt-1 text-sm leading-6 text-amber-700">
              {t("successNotice.paymentPendingDescription")}
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

          {/* LEFT */}
          <div className="lg:col-span-7">

            {/* HEADER */}
            <div className="mb-[35px]">
              <h1 className="text-xl font-semibold text-gray-900 mb-[10px]">
                {paymentPendingStripeOrder ? t("paymentPendingHeading") : t("trackYourOrder")}
              </h1>

              <p className="text-sm text-gray-400">
                {t("orderMeta", {
                  id: order?.id || "...",
                  type: getOrderTypeLabel(order?.orderType),
                })}
              </p>
            </div>

            {/* STATUS CARD */}
            <div className="bg-white rounded-[10px] shadow-lg px-[61px] py-[35px] border border-gray-50">

              <h2 className="text-xl font-semibold mb-[36px]">
                {paymentPendingStripeOrder ? t("paymentPendingStatus") : t("orderStatus")}
              </h2>

              {/* LOADING */}
              {loading && (
                <div className="space-y-6 animate-pulse">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex gap-6">
                      <div className="w-9 h-9 bg-gray-200 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-40 bg-gray-200 rounded" />
                        <div className="h-3 w-60 bg-gray-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* DATA */}
              {!loading && paymentPendingStripeOrder ? (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
                  <p className="font-semibold">{t("paymentPendingStatus")}</p>
                  <p className="mt-1">{t("paymentPendingTrackingDescription")}</p>
                </div>
              ) : null}

              {!loading && !paymentPendingStripeOrder && (
                <div className="space-y-0">
                  {orderSteps.map((step, index) => (
                    <div key={step.id} className="relative flex gap-6 pb-10">

                      {index !== orderSteps.length - 1 && (
                        <div className="absolute left-[17px] top-10 w-px h-full border-l-2 border-dashed border-gray-200" />
                      )}

                      <div
                        className={`relative z-10 flex items-center justify-center w-9 h-9 rounded-full text-sm font-medium ${
                          step.active
                            ? "bg-primary text-white"
                            : "bg-[#D9D9D9] text-white"
                        }`}
                      >
                        {step.id}
                      </div>

                      <div className="pt-1">
                        <h3
                          className={`text-[18px] font-medium mb-[4px] ${
                            step.active
                              ? "text-gray-900"
                              : "text-gray-400"
                          }`}
                        >
                          {step.title}
                        </h3>

                        <p className="text-sm text-gray-400">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

          </div>

          {/* RIGHT */}
          <div className="lg:col-span-5">
            <OrderSummary
              order={order}
              onContinuePayment={handleContinuePayment}
              continuingPayment={continuingPayment}
              onChangePaymentMethod={handleChangePaymentMethod}
              changingPaymentMethod={changingPaymentMethod}
              canSwitchPaymentMethod={canSwitchPaymentMethod}
            />
          </div>

        </div>
        </>
      )}

      {stripePayment.open && stripePromise && stripePayment.clientSecret ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="relative max-h-[90vh] w-[min(420px,100%)] overflow-auto rounded-2xl bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
            <button
              type="button"
              onClick={resetStripePayment}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
              aria-label={t("closePaymentPopup")}
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="mb-2 pr-10 text-lg font-semibold">
              {t("completePayment")}
            </h2>
            <p className="mb-5 text-sm leading-6 text-gray-500">
              {t("completePaymentDescription")}
            </p>

            <Elements stripe={stripePromise} options={{ clientSecret: stripePayment.clientSecret }}>
              <OrderPaymentElement onSuccess={handlePaymentSuccess} />
            </Elements>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const OrderPaymentElement = ({ onSuccess }: { onSuccess: () => void }) => {
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
        className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-white disabled:opacity-60"
      >
        {paying ? checkoutT("processing") : checkoutT("payNow")}
      </button>
    </div>
  );
};

export function OrderStatusPage() {
  return (
    <Suspense fallback={<div className="max-w-[1400px] mx-auto mt-[36px] mb-[113px] px-6 md:px-30 pt-5" />}>
      <OrderStatusContent />
    </Suspense>
  );
}
