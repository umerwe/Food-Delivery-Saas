"use client";

import { useCallback, useMemo } from "react";

import { queryKeys } from "@/config/query-keys";
import { useDomainApi, type DomainApiHook } from "@/hooks/useDomainApi";
import {
  checkoutCustomerCart,
  deleteCheckout,
  getCheckout,
  patchCheckout,
  postCheckout,
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
  checkoutCustomerCart: (args: { customerId: string; payload: CheckoutCartPayload }) => Promise<ApiResult>;
};

export const useCheckout = (token: string | null): CheckoutApi => {
  const api = useDomainApi(token, { service, requestKey: queryKeys.checkout.request });

  const checkoutCart = useCallback(
    ({ customerId, payload }: { customerId: string; payload: CheckoutCartPayload }) =>
      checkoutCustomerCart({ customerId, payload, token }),
    [token]
  );

  return useMemo(
    () => ({
      ...api,
      checkoutCustomerCart: checkoutCart,
    }),
    [api, checkoutCart]
  );
};
