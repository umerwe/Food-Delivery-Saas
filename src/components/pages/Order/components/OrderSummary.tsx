"use client";

import Image from "next/image";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Hash,
  Info,
  Loader2,
  MapPin,
  MessageCircle,
  Store,
  Star,
  TicketPercent,
  Timer,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import { formatDisplayAddress } from "@/lib/address-display";
import { formatMoney, resolveCustomerCurrency } from "@/lib/money";
import { canReviewOrder, type Order, type OrderItem, type OrderPricingBreakdownLine } from "@/services/orders";
import { useTranslations } from "next-intl";
import { isPaymentPendingStripeOrder } from "@/components/pages/Order/payment-state";

const getAmountNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const shouldShowAmountLine = (value: unknown) => Math.abs(getAmountNumber(value)) > 0;

const getBreakdownKey = (line: OrderPricingBreakdownLine) =>
  String(line.key || line.label || "").toLowerCase();

const isTaxBreakdownLine = (line: OrderPricingBreakdownLine) => {
  const key = getBreakdownKey(line).replace(/[\s_-]/g, "");

  return key === "tax" || key === "taxes" || key === "taxamount" || key.includes("tax");
};

const getRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const getText = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

const humanizeEnum = (value?: string | null) =>
  getText(value)
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getModifierLines = (item: OrderItem) => {
  const modifiers = Array.isArray(item.modifiers) ? item.modifiers : [];
  const snapshotModifiers = Array.isArray(item.snapshotModifiers) ? item.snapshotModifiers : [];
  const modifierNames = modifiers.flatMap((modifier) => {
    const nestedModifierName = getText(modifier.modifier?.name);
    const name = getText(modifier.name) || nestedModifierName;
    const quantity = getAmountNumber(modifier.quantity);

    return name ? [`${name}${quantity > 1 ? ` x${quantity}` : ""}`] : [];
  });
  const snapshotNames = snapshotModifiers.flatMap((modifier) => {
    const record = getRecord(modifier);
    const name = getText(record?.name);
    const quantity = getAmountNumber(record?.quantity);

    return name ? [`${name}${quantity > 1 ? ` x${quantity}` : ""}`] : [];
  });

  return [...modifierNames, ...snapshotNames];
};

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
  const paymentCurrency = resolveCustomerCurrency({
    moneyCurrency: order?.pricing?.currency || latestCharge?.currency,
  });
  const paymentAmount = order?.payableAmount ?? order?.totalAmount ?? latestCharge?.amount;
  const pricingBreakdown = Array.isArray(order?.pricing?.breakdown)
    ? order.pricing.breakdown
    : [];
  const backendBillRows = pricingBreakdown.filter((line) => {
    const key = getBreakdownKey(line);
    return key !== "total" && key !== "payableamount" && !isTaxBreakdownLine(line) && shouldShowAmountLine(line.amount);
  });
  const fallbackBillRows = [
    { key: "subtotal", label: t("itemTotal"), amount: order?.subtotal },
    { key: "deliveryFee", label: t("deliveryFee"), amount: order?.deliveryFee, info: true },
    { key: "serviceChargeAmount", label: t("serviceCharge"), amount: order?.serviceChargeAmount },
    { key: "tipAmount", label: t("tip"), amount: order?.tipAmount },
  ].filter((line) => line.key === "subtotal" || shouldShowAmountLine(line.amount));
  const billRows = backendBillRows.length > 0 ? backendBillRows : fallbackBillRows;
  const discountRows = [
    { key: "discountAmount", label: t("discount"), amount: order?.pricing?.discountAmount ?? order?.discountAmount },
    { key: "loyaltyDiscountAmount", label: t("loyaltyDiscount"), amount: order?.pricing?.loyaltyDiscountAmount },
    { key: "walletAppliedAmount", label: t("walletApplied"), amount: order?.pricing?.walletAppliedAmount },
  ].filter((line) => shouldShowAmountLine(line.amount));
  const paidAmount = order?.pricing?.paidAmount;
  const remainingAmount = order?.pricing?.remainingAmount;
  const refundedAmount = order?.pricing?.refundedAmount;
  const orderDisplayId = order?.displayId || order?.id || "";
  const restaurantName = order?.restaurant?.name || t("restaurantFallback");
  const branchName = order?.branch?.name || "";
  const orderStatusLabel = order?.statusLabel || humanizeEnum(order?.status) || t("notAvailable");
  const orderTypeLabel =
    order?.fulfillment?.modeLabel ||
    humanizeEnum(order?.orderType || order?.fulfillment?.type) ||
    t("notAvailable");
  const scheduledOrOrderTime = order?.scheduledFor || order?.orderTime || order?.createdAt;
  const estimate = getRecord(order?.fulfillment?.estimate);
  const estimatedReadyAt = getText(estimate?.estimatedReadyAt);
  const estimatedDeliveredAt = getText(estimate?.estimatedDeliveredAt);
  const showDeliveryOtp = Boolean(order?.fulfillment?.showDeliveryOtp && order?.fulfillment?.deliveryOtp);
  const canContinuePayment =
    Boolean(onContinuePayment && order?.id) &&
    paymentMethod === "STRIPE" &&
    (paymentStatus === "PENDING" || paymentStatus === "FAILED");
  const deliveryAddress = formatDisplayAddress(order?.deliveryAddress);
  const paymentPendingStripeOrder = isPaymentPendingStripeOrder(order);

  const formatDateTime = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
      hourCycle: "h23",
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
      {order?.id ? (
        <section className="overflow-hidden rounded-[22px] border border-red-100 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
          <div className="bg-[linear-gradient(135deg,rgba(193,0,10,0.12),rgba(255,245,236,0.92))] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                  {t("orderOverview")}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-gray-950">
                  {orderDisplayId}
                </h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  {paymentPendingStripeOrder
                    ? t("paymentPendingOverviewDescription")
                    : order.statusDescription || t("orderOverviewDescription")}
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-white/70 bg-white px-3 py-1 text-xs font-semibold text-primary shadow-sm">
                {orderStatusLabel}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
            <div className="rounded-2xl bg-gray-50 p-3">
              <div className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                  <Store className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                    {t("restaurant")}
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-gray-900">
                    {restaurantName}
                  </p>
                  {branchName ? (
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {branchName}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 p-3">
              <div className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                  <Utensils className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                    {t("fulfillment")}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {orderTypeLabel}
                  </p>
                </div>
              </div>
            </div>

            {!paymentPendingStripeOrder && scheduledOrOrderTime ? (
              <div className="rounded-2xl bg-gray-50 p-3">
                <div className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                    <Timer className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                      {order?.isScheduled ? t("scheduledFor") : t("placedAt")}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {formatDateTime(scheduledOrOrderTime)}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {!paymentPendingStripeOrder && showDeliveryOtp ? (
              <div className="rounded-2xl bg-gray-50 p-3">
                <div className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                    <Hash className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                      {t("deliveryOtp")}
                    </p>
                    <p className="mt-1 text-sm font-semibold tracking-[0.18em] text-gray-900">
                      {order?.fulfillment?.deliveryOtp}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {!paymentPendingStripeOrder && (estimatedReadyAt || estimatedDeliveredAt) ? (
              <div className="rounded-2xl bg-gray-50 p-3 sm:col-span-2">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {estimatedReadyAt ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                        {t("estimatedReady")}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {formatDateTime(estimatedReadyAt)}
                      </p>
                    </div>
                  ) : null}
                  {estimatedDeliveredAt ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                        {t("estimatedDelivery")}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {formatDateTime(estimatedDeliveredAt)}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ITEMS */}
      <section className="space-y-[20.37px]">
        <h2 className="text-[20px] font-medium text-gray-900">
          {resolvedTitle}
        </h2>

        <div className="space-y-[19px]">
          {orderItems.map((item: OrderItem) => {
            const modifierLines = getModifierLines(item);
            const itemTotal = item.lineTotal ?? getAmountNumber(item.unitPrice) * getAmountNumber(item.quantity);

            return (
            <div key={item.id} className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
              <div className="flex items-center gap-4">
              <div className="relative w-[76px] h-[76px] rounded-[12px] overflow-hidden">
                <Image
                  src={item.imageUrl || item.menuItem?.imageUrl || "/placeholder.png"}
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
                  {[item.variationName, item.menuItem?.category?.name].filter(Boolean).join(" · ")}
                </p>

                <div className="flex justify-between">
                  <p className="text-base font-medium text-primary">
                    {formatMoney(item.unitPrice, paymentCurrency)}
                  </p>

                  <div className="text-sm text-gray-700">
                    {t("quantityShort")}: {item.quantity}
                  </div>
                </div>
              </div>
            </div>
              {modifierLines.length > 0 ? (
                <div className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-500">
                  <span className="font-semibold text-gray-600">{t("modifiers")}:</span>{" "}
                  {modifierLines.join(", ")}
                </div>
              ) : null}
              <div className="mt-3 flex items-center justify-between border-t border-dashed border-gray-100 pt-3 text-sm">
                <span className="text-gray-500">{t("lineTotal")}</span>
                <span className="font-semibold text-gray-900">
                  {formatMoney(itemTotal, paymentCurrency)}
                </span>
              </div>
            </div>
            );
          })}
        </div>
      </section>

      {/* BILL */}
      <section className="space-y-[15px]">
        <h2 className="text-[18px] font-semibold text-gray-900">
          {t("billDetails")}
        </h2>

        <div className="space-y-4 text-gray-500 text-sm">
          {billRows.map((line) => (
            <div key={line.key} className="flex justify-between gap-4">
              <div className="flex items-center gap-1">
                <span>{line.label}</span>
                {"info" in line && line.info ? <Info size={14} /> : null}
              </div>
              <span>{formatMoney(line.amount, paymentCurrency)}</span>
            </div>
          ))}
        </div>

        {discountRows.length > 0 && (
          <div className="bg-primary/20 text-primary p-3 rounded-md flex items-center gap-2 text-sm">
            <TicketPercent size={16} />
            {t("discountApplied")}
          </div>
        )}

        <div className="space-y-[10px] pt-[10px]">
          {discountRows.map((line) => (
            <div key={line.key} className="flex justify-between gap-4 text-sm text-gray-500">
              <span>{line.label}</span>
              <span>-{formatMoney(line.amount, paymentCurrency)}</span>
            </div>
          ))}

          <div className="flex justify-between text-lg font-semibold text-gray-900">
            <span>{t("total")}</span>
            <span>{formatMoney(order?.totalAmount, paymentCurrency)}</span>
          </div>

          {shouldShowAmountLine(order?.payableAmount) && order?.payableAmount !== order?.totalAmount ? (
            <div className="flex justify-between text-sm font-semibold text-gray-700">
              <span>{t("payableAmount")}</span>
              <span>{formatMoney(order?.payableAmount, paymentCurrency)}</span>
            </div>
          ) : null}

          {shouldShowAmountLine(paidAmount) ? (
            <div className="flex justify-between text-sm text-emerald-700">
              <span>{t("paidAmount")}</span>
              <span>{formatMoney(paidAmount, paymentCurrency)}</span>
            </div>
          ) : null}

          {shouldShowAmountLine(remainingAmount) ? (
            <div className="flex justify-between text-sm text-amber-700">
              <span>{t("remainingAmount")}</span>
              <span>{formatMoney(remainingAmount, paymentCurrency)}</span>
            </div>
          ) : null}

          {shouldShowAmountLine(refundedAmount) ? (
            <div className="flex justify-between text-sm text-gray-500">
              <span>{t("refundedAmount")}</span>
              <span>{formatMoney(refundedAmount, paymentCurrency)}</span>
            </div>
          ) : null}
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
                {paymentPendingStripeOrder
                  ? t("stripePaymentPendingDescription")
                  : paymentStatus === "PENDING"
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

      {order?.id && !paymentPendingStripeOrder ? (
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
