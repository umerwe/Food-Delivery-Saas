import { createDomainApiService } from "@/services/domain-api";
import type { ApiResult } from "@/services/http";

const checkoutService = createDomainApiService();

export const getCheckout = checkoutService.get;
export const postCheckout = checkoutService.post;
export const patchCheckout = checkoutService.patch;
export const deleteCheckout = checkoutService.del;

export type CheckoutCartPayload = Record<string, unknown> & {
  paymentMethod: string;
  scheduledDeliveryAt?: string | null;
  orderTime?: string | null;
  tipAmount?: number;
  loyaltyPoints?: number;
  guestContact?: {
    email: string;
    phone: string;
    privacyPolicyAccepted: boolean;
  };
  guestDeliveryAddress?: {
    street: string;
    area?: string;
    postalCode: string;
    city: string;
    state?: string;
    country: string;
    lat?: string;
    lng?: string;
  };
};

export const normalizeCheckoutPaymentMethod = (paymentMethod: unknown) => {
  const normalized = typeof paymentMethod === "string" ? paymentMethod.trim().toUpperCase() : "";

  if (normalized === "CARD") {
    return "STRIPE";
  }

  if (normalized === "WALLET") {
    return "WALLET";
  }

  if (
    normalized === "CARD_ON_DELIVERY" ||
    normalized === "COD" ||
    normalized === "PAYPAL" ||
    normalized === "STRIPE"
  ) {
    return normalized;
  }

  return typeof paymentMethod === "string" ? paymentMethod : "";
};

export const normalizeCheckoutPayload = (payload: CheckoutCartPayload): Record<string, unknown> => {
  const { orderTime, scheduledDeliveryAt, ...rest } = payload;
  delete rest.orderType;
  rest.paymentMethod = normalizeCheckoutPaymentMethod(rest.paymentMethod);

  if (scheduledDeliveryAt !== undefined) {
    return {
      ...rest,
      orderTime: scheduledDeliveryAt,
    };
  }

  if (orderTime !== undefined) {
    return {
      ...rest,
      orderTime,
    };
  }

  return rest;
};

export const checkoutCustomerCart = ({
  customerId,
  payload,
  token,
}: {
  customerId: string;
  payload: CheckoutCartPayload;
  token?: string | null;
}): Promise<ApiResult> =>
  postCheckout(`/v1/cart/checkout?customerId=${customerId}`, normalizeCheckoutPayload(payload), token);

export const applyCheckoutCoupon = ({
  customerId,
  couponCode,
  token,
}: {
  customerId: string;
  couponCode: string;
  token?: string | null;
}): Promise<ApiResult> =>
  patchCheckout(
    `/v1/cart/coupon?customerId=${encodeURIComponent(customerId)}`,
    { couponCode },
    token
  );

export const removeCheckoutCoupon = ({
  customerId,
  token,
}: {
  customerId: string;
  token?: string | null;
}): Promise<ApiResult> =>
  deleteCheckout(
    `/v1/cart/coupon?customerId=${encodeURIComponent(customerId)}`,
    token
  );
