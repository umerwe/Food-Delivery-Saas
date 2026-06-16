export type OrderProgressStepKey =
  | "placed"
  | "confirmed"
  | "preparing"
  | "outForDelivery"
  | "delivered"
  | "readyForPickup"
  | "pickedUp"
  | "readyToServe"
  | "served";

const normalizeValue = (value?: string | null) =>
  String(value || "")
    .trim()
    .toUpperCase();

export const isDeliveryOrder = (orderType?: string | null) =>
  normalizeValue(orderType) === "DELIVERY";

const isDineInOrder = (orderType?: string | null) =>
  ["DINE_IN", "DINEIN", "TABLE"].includes(normalizeValue(orderType));

export const getOrderProgressStepKeys = (
  orderType?: string | null
): OrderProgressStepKey[] => {
  if (isDeliveryOrder(orderType)) {
    return ["placed", "confirmed", "preparing", "outForDelivery", "delivered"];
  }

  if (isDineInOrder(orderType)) {
    return ["placed", "confirmed", "preparing", "readyToServe", "served"];
  }

  return ["placed", "confirmed", "preparing", "readyForPickup", "pickedUp"];
};

export const getOrderProgressStep = (
  status?: string | null,
  orderType?: string | null
) => {
  const normalizedStatus = normalizeValue(status);

  if (["PLACED", "PENDING"].includes(normalizedStatus)) return 1;
  if (["CONFIRMED", "ACCEPTED"].includes(normalizedStatus)) return 2;
  if (["PREPARING", "IN_PROGRESS"].includes(normalizedStatus)) return 3;

  if (isDeliveryOrder(orderType)) {
    if (["OUT_FOR_DELIVERY", "DISPATCHED", "ON_THE_WAY"].includes(normalizedStatus)) {
      return 4;
    }

    if (["DELIVERED", "COMPLETED"].includes(normalizedStatus)) return 5;
  }

  if (isDineInOrder(orderType)) {
    if (["READY_TO_SERVE", "READY"].includes(normalizedStatus)) return 4;
    if (["SERVED", "COMPLETED"].includes(normalizedStatus)) return 5;
  }

  if (["READY_FOR_PICKUP", "READY"].includes(normalizedStatus)) return 4;
  if (["PICKED_UP", "COLLECTED", "DELIVERED", "COMPLETED"].includes(normalizedStatus)) {
    return 5;
  }

  return 1;
};
