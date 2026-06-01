"use client";

import { queryKeys } from "@/config/query-keys";
import { useDomainApi } from "@/hooks/useDomainApi";
import { deleteCheckout, getCheckout, patchCheckout, postCheckout } from "@/services/checkout";

const service = {
  get: getCheckout,
  post: postCheckout,
  patch: patchCheckout,
  del: deleteCheckout,
};

export const useCheckout = (token: string | null) =>
  useDomainApi(token, { service, requestKey: queryKeys.checkout.request });

export default useCheckout;
