"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Gift } from "lucide-react";
import { useTranslations } from "next-intl";
import QRCode from "react-qr-code";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { CARD_PANEL_CLASS } from "@/components/common/common-classes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePurchaseGiftCard } from "@/hooks/useGiftCards";
import type { GiftCardPurchaseResult } from "@/types/gift-cards";
import {
  buildGiftCardPurchasePayload,
  giftCardPurchaseSchema,
  type GiftCardPurchaseFormValues,
} from "@/validations/gift-cards";

type GiftCardPurchaseCardProps = {
  walletBalance?: number;
  walletCurrency?: string;
};

const defaultValues: GiftCardPurchaseFormValues = {
  amount: 0,
  title: "",
  message: "",
  expiresAt: "",
};

const formatWalletAmount = (amount: number, currency = "PKR") =>
  `${currency} ${Number(amount || 0).toLocaleString()}`;

export const GiftCardPurchaseCard = ({
  walletBalance = 0,
  walletCurrency = "PKR",
}: GiftCardPurchaseCardProps) => {
  const t = useTranslations("profile.giftCards");
  const profileT = useTranslations("profile");
  const purchaseGiftCard = usePurchaseGiftCard();
  const [purchaseResult, setPurchaseResult] = useState<GiftCardPurchaseResult | null>(null);
  const formValues = useMemo(() => defaultValues, []);
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<GiftCardPurchaseFormValues>({
    resolver: zodResolver(giftCardPurchaseSchema),
    defaultValues: formValues,
  });

  const copyToClipboard = async (value: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(t("copied"));
  };

  const onSubmit = async (values: GiftCardPurchaseFormValues) => {
    const response = await purchaseGiftCard.mutateAsync({
      payload: buildGiftCardPurchasePayload(values),
    });

    setPurchaseResult(response.result);
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
            {t("purchaseTitle")}
          </h3>
          <p className="mt-1 text-sm font-normal text-[#8A8A8A]">
            {t("purchaseDescription")}
          </p>
          <p className="mt-2 text-sm font-medium text-[#303030]">
            {profileT("currentBalance")}: {formatWalletAmount(walletBalance, walletCurrency)}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label
              htmlFor="gift-card-amount"
              className="mb-2 block text-[11px] uppercase text-[#9A9A9A]"
            >
              {t("amount")}
            </label>
            <Input
              id="gift-card-amount"
              type="number"
              min="1"
              step="1"
              placeholder="1000"
              className="h-11 rounded-full"
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount ? (
              <p className="mt-2 text-sm text-red-600">
                {errors.amount.message}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="gift-card-expires-at"
              className="mb-2 block text-[11px] uppercase text-[#9A9A9A]"
            >
              {t("expiresAt")}
            </label>
            <Input
              id="gift-card-expires-at"
              type="datetime-local"
              className="h-11 rounded-full"
              {...register("expiresAt")}
            />
            {errors.expiresAt ? (
              <p className="mt-2 text-sm text-red-600">
                {errors.expiresAt.message}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="gift-card-title"
              className="mb-2 block text-[11px] uppercase text-[#9A9A9A]"
            >
              {t("title")}
            </label>
            <Input
              id="gift-card-title"
              placeholder={t("titlePlaceholder")}
              className="h-11 rounded-full"
              {...register("title")}
            />
          </div>

          <div>
            <label
              htmlFor="gift-card-message"
              className="mb-2 block text-[11px] uppercase text-[#9A9A9A]"
            >
              {t("message")}
            </label>
            <Input
              id="gift-card-message"
              placeholder={t("messagePlaceholder")}
              className="h-11 rounded-full"
              {...register("message")}
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={purchaseGiftCard.isPending}
          className="mt-4 h-11 rounded-full bg-primary px-6 text-white hover:bg-primary/90"
        >
          {purchaseGiftCard.isPending ? t("purchasing") : t("buy")}
        </Button>
      </form>

      {purchaseResult ? (
        <div className="mt-5 grid gap-4 rounded-2xl bg-[#FAFAFA] p-4">
          <div className="flex justify-center">
            <div className="rounded-2xl bg-white p-4">
              <QRCode value={purchaseResult.qrPayload} size={144} />
            </div>
          </div>
          <p className="text-center text-sm font-medium text-[#303030]">
            {t("scanToRedeem")}
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-[11px] uppercase text-[#9A9A9A]">
                {t("code")}
              </p>
              <p className="mt-1 break-all font-semibold text-[#222]">
                {purchaseResult.code}
              </p>
              <Button
                type="button"
                onClick={() => void copyToClipboard(purchaseResult.code)}
                className="mt-2 h-9 rounded-full bg-[#1A1C1C] px-4 text-white hover:bg-[#1A1C1C]"
              >
                <Copy size={14} />
                {t("copyCode")}
              </Button>
            </div>

            <div>
              <p className="text-[11px] uppercase text-[#9A9A9A]">
                {t("qrPayload")}
              </p>
              <p className="mt-1 break-all font-semibold text-[#222]">
                {purchaseResult.qrPayload}
              </p>
              <Button
                type="button"
                onClick={() => void copyToClipboard(purchaseResult.qrPayload)}
                className="mt-2 h-9 rounded-full bg-[#1A1C1C] px-4 text-white hover:bg-[#1A1C1C]"
              >
                <Copy size={14} />
                {t("copyQrPayload")}
              </Button>
            </div>

            <div>
              <p className="text-[11px] uppercase text-[#9A9A9A]">
                {t("amount")}
              </p>
              <p className="mt-1 font-semibold text-[#222]">
                {formatWalletAmount(purchaseResult.amount, walletCurrency)}
              </p>
            </div>

            <div>
              <p className="text-[11px] uppercase text-[#9A9A9A]">
                {t("walletBalance")}
              </p>
              <p className="mt-1 font-semibold text-[#222]">
                {formatWalletAmount(purchaseResult.walletBalance, walletCurrency)}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
