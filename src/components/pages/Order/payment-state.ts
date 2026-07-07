import type { Order } from "@/services/orders";

const normalize = (value?: string | null) => String(value || "").toUpperCase();

export const isStripeOrder = (order?: Pick<Order, "paymentMethod"> | null) =>
  normalize(order?.paymentMethod) === "STRIPE";

export const isPendingOnlinePaymentOrder = (
  order?: Pick<Order, "paymentStatus" | "status"> | null,
) => normalize(order?.status) === "PAYMENT_PENDING" && normalize(order?.paymentStatus) === "PENDING";

export const isPaymentPendingStripeOrder = (
  order?: Pick<Order, "paymentMethod" | "paymentStatus" | "status"> | null,
) => isStripeOrder(order) && isPendingOnlinePaymentOrder(order);

export const isPlacedPaidOrder = (
  order?: Pick<Order, "paymentMethod" | "paymentStatus" | "status"> | null,
) => {
  if (!order) return false;

  if (!isStripeOrder(order)) {
    return normalize(order.status) === "PLACED";
  }

  return normalize(order.status) === "PLACED" && normalize(order.paymentStatus) === "PAID";
};
