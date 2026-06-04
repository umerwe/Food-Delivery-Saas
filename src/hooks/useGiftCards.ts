"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { queryKeys } from "@/config/query-keys";
import { getApiErrorMessage } from "@/lib/errors";
import { redeemGiftCard } from "@/services/gift-cards";
import type {
  GiftCardRedeemParams,
  GiftCardRedeemPayload,
} from "@/types/gift-cards";

type RedeemGiftCardVariables = {
  payload: GiftCardRedeemPayload;
  params?: GiftCardRedeemParams;
};

const formatWalletAmount = (amount: number, currency: string) =>
  `${currency} ${Number(amount || 0).toLocaleString()}`;

export const useRedeemGiftCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ payload, params }: RedeemGiftCardVariables) =>
      redeemGiftCard(payload, params),
    onSuccess: (response) => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.wallet.summary }),
        queryClient.invalidateQueries({ queryKey: queryKeys.wallet.history }),
        queryClient.invalidateQueries({ queryKey: queryKeys.profile.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.payments.all }),
      ]);

      window.dispatchEvent(new Event("wallet-updated"));
      toast.success(
        `${response.message || "Gift card redeemed successfully"}: ${formatWalletAmount(
          response.result.creditedAmount,
          response.result.currency
        )} credited, ${formatWalletAmount(
          response.result.walletBalance,
          response.result.currency
        )} balance`
      );
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
};
