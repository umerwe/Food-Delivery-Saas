"use client";

import { useCallback, useMemo } from "react";

import { queryKeys } from "@/config/query-keys";
import { useDomainApi } from "@/hooks/useDomainApi";
import {
  deletePayments,
  createOrderPaymentAttempt,
  fetchPaymentsPage,
  fetchWallet,
  getPayments,
  patchPayments,
  postPayments,
} from "@/services/payments";

const service = {
  get: getPayments,
  post: postPayments,
  patch: patchPayments,
  del: deletePayments,
};

export const usePayments = (token: string | null) => {
  const api = useDomainApi(token, { service, requestKey: queryKeys.payments.request });

  const getPaymentsPage = useCallback(
    (args: { page: number; limit: number; search?: string; status?: string; restaurantId?: string | null }) =>
      fetchPaymentsPage({ ...args, token }),
    [token]
  );

  const getWallet = useCallback(() => fetchWallet(token), [token]);

  const startOrderPaymentAttempt = useCallback(
    (args: Parameters<typeof createOrderPaymentAttempt>[0]) =>
      createOrderPaymentAttempt({ ...args, token }),
    [token]
  );

  return useMemo(
    () => ({
      ...api,
      fetchPaymentsPage: getPaymentsPage,
      fetchWallet: getWallet,
      createOrderPaymentAttempt: startOrderPaymentAttempt,
    }),
    [api, getPaymentsPage, getWallet, startOrderPaymentAttempt]
  );
};

export default usePayments;
