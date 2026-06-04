import { z } from "zod";

import type { GiftCardRedeemPayload } from "@/types/gift-cards";

export const giftCardRedeemSchema = z.object({
  code: z.string().trim().min(1, "Gift card code is required"),
  branchId: z.string().trim().optional(),
});

export type GiftCardRedeemFormValues = z.infer<typeof giftCardRedeemSchema>;

export const buildGiftCardRedeemPayload = (
  values: GiftCardRedeemFormValues
): GiftCardRedeemPayload => {
  const branchId = values.branchId?.trim();

  return {
    code: values.code.trim().toUpperCase(),
    ...(branchId ? { branchId } : {}),
  };
};
