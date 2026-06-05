"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { queryKeys } from "@/config/query-keys";
import { getApiErrorMessage } from "@/lib/errors";
import { purchaseGiftCard, redeemGiftCard } from "@/services/gift-cards";
import type {
  GiftCardPurchasePayload,
  GiftCardRedeemParams,
  GiftCardRedeemPayload,
} from "@/types/gift-cards";

type PurchaseGiftCardVariables = {
  payload: GiftCardPurchasePayload;
};

type RedeemGiftCardVariables = {
  payload: GiftCardRedeemPayload;
  params?: GiftCardRedeemParams;
};

const invalidateWalletQueries = async (
  queryClient: ReturnType<typeof useQueryClient>
) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.wallet.summary }),
    queryClient.invalidateQueries({ queryKey: queryKeys.wallet.history }),
    queryClient.invalidateQueries({ queryKey: queryKeys.profile.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.payments.all }),
  ]);
};

export const usePurchaseGiftCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ payload }: PurchaseGiftCardVariables) =>
      purchaseGiftCard(payload),
    onSuccess: () => {
      void invalidateWalletQueries(queryClient);
      window.dispatchEvent(new Event("wallet-updated"));
      toast.success("Gift card purchased successfully");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
};

export const useRedeemGiftCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ payload, params }: RedeemGiftCardVariables) =>
      redeemGiftCard(payload, params),
    onSuccess: (response) => {
      void invalidateWalletQueries(queryClient);
      window.dispatchEvent(new Event("wallet-updated"));
      toast.success(
        response.message || "Gift card redeemed successfully"
      );
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
};
