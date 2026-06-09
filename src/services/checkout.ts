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

export const normalizeCheckoutPayload = (payload: CheckoutCartPayload): Record<string, unknown> => {
  const { orderTime, scheduledDeliveryAt, ...rest } = payload;

  if (scheduledDeliveryAt !== undefined) {
    return {
      ...rest,
      scheduledDeliveryAt,
    };
  }

  if (orderTime !== undefined) {
    return {
      ...rest,
      scheduledDeliveryAt: orderTime,
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
