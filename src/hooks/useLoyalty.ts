"use client";

import { useCallback, useMemo } from "react";

import { queryKeys } from "@/config/query-keys";
import { useDomainApi } from "@/hooks/useDomainApi";
import {
  deleteLoyalty,
  fetchCustomerLoyaltyPoints,
  getLoyalty,
  patchLoyalty,
  postLoyalty,
  redeemCustomerLoyaltyPoints,
  type LoyaltyRedeemResult,
  type LoyaltySummary,
} from "@/services/loyalty";
import type { ApiResult } from "@/services/http";

const service = {
  get: getLoyalty,
  post: postLoyalty,
  patch: patchLoyalty,
  del: deleteLoyalty,
};

export type LoyaltyActions = {
  loading: boolean;
  fetchLoyalty: () => Promise<{ response: ApiResult; loyalty: LoyaltySummary | null }>;
  redeemToWallet: (points: number) => Promise<{ response: ApiResult; redemption: LoyaltyRedeemResult | null }>;
};

export const useLoyalty = (token: string | null): LoyaltyActions => {
  const api = useDomainApi(token, { service, requestKey: queryKeys.loyalty.request });

  const fetchLoyalty = useCallback(() => fetchCustomerLoyaltyPoints(token), [token]);

  const redeemToWallet = useCallback(
    (points: number) =>
      redeemCustomerLoyaltyPoints({
        payload: {
          points,
          target: "WALLET",
          note: "Redeemed from customer website",
        },
        token,
      }),
    [token]
  );

  return useMemo(
    () => ({
      loading: api.loading,
      fetchLoyalty,
      redeemToWallet,
    }),
    [api.loading, fetchLoyalty, redeemToWallet]
  );
};

export default useLoyalty;
