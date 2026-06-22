"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Gift } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { CARD_PANEL_CLASS } from "@/components/common/common-classes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRedeemGiftCard } from "@/hooks/useGiftCards";
import { DEFAULT_DISPLAY_CURRENCY, formatMoney } from "@/lib/money";
import type { GiftCardRedeemResult } from "@/types/gift-cards";
import {
  buildGiftCardRedeemPayload,
  giftCardRedeemSchema,
  type GiftCardRedeemFormValues,
} from "@/validations/gift-cards";

const defaultValues: GiftCardRedeemFormValues = {
  code: "",
};

const formatWalletAmount = (amount: number, currency = DEFAULT_DISPLAY_CURRENCY) =>
  formatMoney(amount, currency, { maximumFractionDigits: 0 });

export const GiftCardRedeemCard = () => {
  const t = useTranslations("profile.giftCards");
  const validationT = useTranslations("validation");
  const redeemGiftCard = useRedeemGiftCard();
  const [redeemResult, setRedeemResult] = useState<GiftCardRedeemResult | null>(null);
  const formValues = useMemo(() => defaultValues, []);
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<GiftCardRedeemFormValues>({
    resolver: zodResolver(giftCardRedeemSchema),
    defaultValues: formValues,
    values: formValues,
  });

  const onSubmit = async (values: GiftCardRedeemFormValues) => {
    const response = await redeemGiftCard.mutateAsync({
      payload: buildGiftCardRedeemPayload(values),
    });

    setRedeemResult(response.result);
    reset(formValues);
  };

  return (
    <div className={CARD_PANEL_CLASS}>
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Gift size={20} />
        </div>

        <div>
          <h3 className="text-[22px] font-medium text-[#222]">
            {t("redeemTitle")}
          </h3>
          <p className="mt-1 text-sm font-normal text-[#8A8A8A]">
            {t("redeemDescription")}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <label
              htmlFor="gift-card-code"
              className="mb-2 block text-[11px] uppercase text-[#9A9A9A]"
            >
              {t("codeOrQrPayload")}
            </label>
            <Input
              id="gift-card-code"
              placeholder="GIFT-XXXXXXXXXX or DWGC:GIFT-XXXXXXXXXX"
              autoComplete="off"
              className="h-11 rounded-full"
              {...register("code")}
            />
            {errors.code ? (
              <p className="mt-2 text-sm text-red-600">
                {validationT("giftCardCodeRequired")}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            disabled={redeemGiftCard.isPending}
            className="mt-[26px] h-11 rounded-full bg-primary px-6 text-white hover:bg-primary/90"
          >
            {redeemGiftCard.isPending ? t("redeeming") : t("redeem")}
          </Button>
        </div>
      </form>

      {redeemResult ? (
        <div className="mt-5 grid gap-3 rounded-2xl bg-[#FAFAFA] p-4 md:grid-cols-2">
          <div>
            <p className="text-[11px] uppercase text-[#9A9A9A]">
              {t("creditedAmount")}
            </p>
            <p className="mt-1 font-semibold text-[#222]">
              {formatWalletAmount(redeemResult.creditedAmount, redeemResult.currency)}
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase text-[#9A9A9A]">
              {t("walletBalance")}
            </p>
            <p className="mt-1 font-semibold text-[#222]">
              {formatWalletAmount(redeemResult.walletBalance, redeemResult.currency)}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};
