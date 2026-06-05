import { z } from "zod";

import type {
  GiftCardPurchasePayload,
  GiftCardRedeemPayload,
} from "@/types/gift-cards";

const giftCardCodePattern = /^(?:DWGC:)?GIFT-[A-Z0-9]+$/i;

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""));

const isValidDateTime = (value: string) => {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp);
};

const isFutureDateTime = (value: string) => {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && timestamp > Date.now();
};

export const giftCardPurchaseSchema = z.object({
  amount: z
    .number({
      error: "Gift card amount is required",
    })
    .positive("Gift card amount must be greater than 0"),
  title: optionalTrimmedString,
  message: optionalTrimmedString,
  expiresAt: optionalTrimmedString
    .refine((value) => !value || isValidDateTime(value), "Expiry date must be valid")
    .refine((value) => !value || isFutureDateTime(value), "Expiry date must be in the future"),
});

export const giftCardRedeemSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Gift card code is required")
    .regex(giftCardCodePattern, "Enter a valid gift card code"),
});

export type GiftCardPurchaseFormValues = z.infer<typeof giftCardPurchaseSchema>;
export type GiftCardRedeemFormValues = z.infer<typeof giftCardRedeemSchema>;

const getOptionalText = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export const buildGiftCardPurchasePayload = (
  values: GiftCardPurchaseFormValues
): GiftCardPurchasePayload => {
  const expiresAt = getOptionalText(values.expiresAt);

  return {
    amount: values.amount,
    ...(getOptionalText(values.title) ? { title: getOptionalText(values.title) } : {}),
    ...(getOptionalText(values.message) ? { message: getOptionalText(values.message) } : {}),
    ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
  };
};

export const buildGiftCardRedeemPayload = (
  values: GiftCardRedeemFormValues
): GiftCardRedeemPayload => ({
  code: values.code.trim().toUpperCase(),
});
