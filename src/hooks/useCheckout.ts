"use client";

import { useCallback, useMemo } from "react";

import { queryKeys } from "@/config/query-keys";
import { useDomainApi, type DomainApiHook } from "@/hooks/useDomainApi";
import {
  applyCheckoutCoupon,
  checkoutCustomerCart,
  deleteCheckout,
  getCheckout,
  patchCheckout,
  postCheckout,
  removeCheckoutCoupon,
  type CheckoutCartPayload,
} from "@/services/checkout";
import type { ApiResult } from "@/services/http";

const service = {
  get: getCheckout,
  post: postCheckout,
  patch: patchCheckout,
  del: deleteCheckout,
};

export type CheckoutApi = DomainApiHook & {
  applyCoupon: (args: { customerId: string; couponCode: string }) => Promise<ApiResult>;
  checkoutCustomerCart: (args: { customerId: string; payload: CheckoutCartPayload }) => Promise<ApiResult>;
  removeCoupon: (args: { customerId: string }) => Promise<ApiResult>;
};

export const useCheckout = (token: string | null): CheckoutApi => {
  const api = useDomainApi(token, { service, requestKey: queryKeys.checkout.request });

  const applyCoupon = useCallback(
    ({ customerId, couponCode }: { customerId: string; couponCode: string }) =>
      applyCheckoutCoupon({ customerId, couponCode, token }),
    [token]
  );

  const checkoutCart = useCallback(
    ({ customerId, payload }: { customerId: string; payload: CheckoutCartPayload }) =>
      checkoutCustomerCart({ customerId, payload, token }),
    [token]
  );

  const removeCoupon = useCallback(
    ({ customerId }: { customerId: string }) =>
      removeCheckoutCoupon({ customerId, token }),
    [token]
  );

  return useMemo(
    () => ({
      ...api,
      applyCoupon,
      checkoutCustomerCart: checkoutCart,
      removeCoupon,
    }),
    [api, applyCoupon, checkoutCart, removeCoupon]
  );
};
