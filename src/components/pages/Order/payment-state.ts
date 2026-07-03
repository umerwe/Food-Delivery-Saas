import type { Order } from "@/services/orders";

const normalize = (value?: string | null) => String(value || "").trim().toUpperCase();

export const isStripeOrder = (order?: Pick<Order, "paymentMethod"> | null) =>
  normalize(order?.paymentMethod) === "STRIPE";

export const isPaymentPendingStripeOrder = (
  order?: Pick<Order, "paymentMethod" | "paymentStatus" | "status"> | null,
) =>
  isStripeOrder(order) &&
  (normalize(order?.status) === "PAYMENT_PENDING" || normalize(order?.paymentStatus) === "PENDING");

export const isPlacedPaidOrder = (
  order?: Pick<Order, "paymentMethod" | "paymentStatus" | "status"> | null,
) => {
  if (!order) return false;

  if (isStripeOrder(order)) {
    return normalize(order.status) === "PLACED" && normalize(order.paymentStatus) === "PAID";
  }

  return normalize(order.status) === "PLACED";
};
