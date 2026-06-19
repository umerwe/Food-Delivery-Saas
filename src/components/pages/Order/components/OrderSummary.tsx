"use client";

import Image from "next/image";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Info,
  Loader2,
  MapPin,
  MessageCircle,
  Star,
  TicketPercent,
} from "lucide-react";
import Link from "next/link";
import { formatDisplayAddress } from "@/lib/address-display";
import { canReviewOrder, type Order, type OrderItem } from "@/services/orders";
import { useTranslations } from "next-intl";

export default function OrderSummary({
  title,
  order,
  onContinuePayment,
  continuingPayment,
}: {
  title?: string;
  order?: Order | null;
  onContinuePayment?: () => void;
  continuingPayment?: boolean;
}) {
  const t = useTranslations("orders");
  const orderStatusT = useTranslations("orderStatus");
  const orderItems = order?.items || [];
  const resolvedTitle = title ?? t("orderDetails");
  const latestCharge = order?.transactions?.find((transaction) =>
    String(transaction.type || "").toUpperCase() === "CHARGE"
  ) ?? order?.transactions?.[0];
  const paymentStatus = String(order?.paymentStatus || latestCharge?.status || "").toUpperCase();
  const paymentMethod = String(order?.paymentMethod || latestCharge?.paymentMethod || "").toUpperCase();
  const paymentCurrency = latestCharge?.currency || "USD";
  const paymentAmount = order?.payableAmount ?? order?.totalAmount ?? latestCharge?.amount;
  const canContinuePayment =
    Boolean(onContinuePayment && order?.id) &&
    paymentMethod === "STRIPE" &&
    (paymentStatus === "PENDING" || paymentStatus === "FAILED");
  const deliveryAddress = formatDisplayAddress(order?.deliveryAddress);

  const formatMoney = (value?: number | string | null, currency = "USD") => {
    const amount = Number(value || 0);

    if (!Number.isFinite(amount)) {
      return "$0.00";
    }

    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const getPaymentTone = () => {
    if (paymentStatus === "PAID") {
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    }

    if (paymentStatus === "FAILED" || paymentStatus === "CANCELLED") {
      return "border-red-100 bg-red-50 text-red-700";
    }

    return "border-amber-100 bg-amber-50 text-amber-700";
  };

  const paymentStatusLabel = (() => {
    switch (paymentStatus) {
      case "PAID":
        return t("paymentStatus.paid");
      case "FAILED":
        return t("paymentStatus.failed");
      case "CANCELLED":
        return t("paymentStatus.cancelled");
      case "PENDING":
        return t("paymentStatus.pending");
      default:
        return t("paymentStatus.unknown");
    }
  })();

  return (
    <div className="sticky top-10 space-y-[42.63px]">
      {/* ITEMS */}
      <section className="space-y-[20.37px]">
        <h2 className="text-[20px] font-medium text-gray-900">
          {resolvedTitle}
        </h2>

        <div className="space-y-[19px]">
          {orderItems.map((item: OrderItem) => (
            <div key={item.id} className="flex items-center gap-4">
              <div className="relative w-[76px] h-[76px] rounded-[12px] overflow-hidden">
                <Image
                  src={item.menuItem?.imageUrl || "/placeholder.png"}
                  alt={item.menuItemName || t("itemFallback")}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex-1 space-y-[8px]">
                <h4 className="text-base font-medium text-gray-900">
                  {item.menuItemName}
                </h4>

                <p className="text-xs text-gray-500">
                  {item.menuItem?.category?.name}
                </p>

                <div className="flex justify-between">
                  <p className="text-base font-medium text-primary">
                    ${item.unitPrice}
                  </p>

                  <div className="text-sm text-gray-700">
                    {t("quantityShort")}: {item.quantity}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BILL */}
      <section className="space-y-[15px]">
        <h2 className="text-[18px] font-semibold text-gray-900">
          {t("billDetails")}
        </h2>

        <div className="space-y-4 text-gray-500 text-sm">
          <div className="flex justify-between">
            <span>{t("itemTotal")}</span>
            <span>${order?.subtotal}</span>
          </div>

          <div className="flex justify-between">
            <div className="flex items-center gap-1">
              <span>{t("deliveryFee")}</span>
              <Info size={14} />
            </div>
            <span>${order?.deliveryFee}</span>
          </div>

          <div className="flex justify-between">
            <div className="flex items-center gap-1">
              <span>{t("taxes")}</span>
              <Info size={14} />
            </div>
            <span>${order?.taxAmount}</span>
          </div>
        </div>

        {Number(order?.discountAmount || 0) > 0 && (
          <div className="bg-primary/20 text-primary p-3 rounded-md flex items-center gap-2 text-sm">
            <TicketPercent size={16} />
            {t("discountApplied")}
          </div>
        )}

        <div className="space-y-[10px] pt-[10px]">
          <div className="flex justify-between text-sm text-gray-500">
            <span>{t("discount")}</span>
            <span>${order?.discountAmount}</span>
          </div>

          <div className="flex justify-between text-lg font-semibold text-gray-900">
            <span>{t("total")}</span>
            <span>{formatMoney(order?.totalAmount, paymentCurrency)}</span>
          </div>
        </div>
      </section>

      {order?.id ? (
        <section className="rounded-[18px] border border-gray-100 bg-white p-5 shadow-lg">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[18px] font-semibold text-gray-900">
                {t("paymentDetails")}
              </h2>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                {paymentStatus === "PENDING"
                  ? t("paymentPendingDescription")
                  : t("paymentDescription")}
              </p>
            </div>

            <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${getPaymentTone()}`}>
              {paymentStatus === "PAID" ? (
                <CheckCircle2 size={14} />
              ) : (
                <AlertCircle size={14} />
              )}
              {paymentStatusLabel}
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-500">{t("paymentMethod")}</span>
              <span className="font-semibold text-gray-900">
                {paymentMethod || t("notAvailable")}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-500">{t("amountDue")}</span>
              <span className="font-semibold text-gray-900">
                {formatMoney(paymentAmount, paymentCurrency)}
              </span>
            </div>

            {latestCharge?.providerRef ? (
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">{t("paymentReference")}</span>
                <span className="max-w-[170px] truncate font-medium text-gray-700">
                  {latestCharge.providerRef}
                </span>
              </div>
            ) : null}

            {order.isScheduled && order.orderTime ? (
              <div className="rounded-xl bg-gray-50 p-3">
                <div className="flex items-start gap-2 text-gray-700">
                  <CalendarClock className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                      {t("scheduledFor")}
                    </p>
                    <p className="mt-1 font-medium text-gray-900">
                      {formatDateTime(order.orderTime)}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {deliveryAddress ? (
              <div className="rounded-xl bg-gray-50 p-3">
                <div className="flex items-start gap-2 text-gray-700">
                  <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                      {t("deliveryAddress")}
                    </p>
                    <p className="mt-1 line-clamp-3 text-sm text-gray-700">
                      {deliveryAddress}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {canContinuePayment ? (
            <button
              type="button"
              onClick={onContinuePayment}
              disabled={continuingPayment}
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(193,0,10,0.22)] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {continuingPayment ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              {paymentStatus === "FAILED" ? t("retryPayment") : t("continuePayment")}
            </button>
          ) : null}
        </section>
      ) : null}

      {order?.id ? (
        <section className="space-y-3">
          <Link
            href={`/contact/chat?orderId=${order.id}`}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(193,0,10,0.22)] transition hover:bg-primary/90"
          >
            <MessageCircle size={18} />
            {t("chatAboutOrder")}
          </Link>

          {order.review || canReviewOrder(order) ? (
            <div className="rounded-[10px] border border-gray-100 bg-white p-5 shadow-lg">
              {order.review ? (
                <>
                  <p className="text-sm font-semibold text-gray-900">
                    {orderStatusT("youRatedThisOrder")}
                  </p>
                  <div className="mt-3 flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={18}
                        className={
                          star <= (order.review?.rating ?? 0)
                            ? "text-[#EC5834] fill-[#EC5834]"
                            : "text-gray-300"
                        }
                      />
                    ))}
                  </div>
                  {order.review.comment ? (
                    <p className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                      {order.review.comment}
                    </p>
                  ) : null}
                </>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {orderStatusT("howWasYourFood")}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {orderStatusT("reviewCompletedOrder")}
                    </p>
                  </div>
                  <Link
                    href={`/order/write-review?orderId=${order.id}`}
                    className="shrink-0 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90"
                  >
                    {orderStatusT("writeReview")}
                  </Link>
                </div>
              )}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
