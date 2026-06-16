"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { CreditCard, Gift } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useGuestPurchaseGiftCard } from "@/hooks/useGiftCards";
import { getApiErrorMessage } from "@/lib/errors";
import type { GiftCardAvailableItem, GiftCardPaymentSession } from "@/types/gift-cards";
import {
  buildGiftCardGuestPurchasePayload,
  giftCardGuestPurchaseSchema,
  type GiftCardGuestPurchaseFormValues,
} from "@/validations/gift-cards";

type GiftCardPurchaseModalProps = {
  open: boolean;
  restaurantId: string;
  branchId?: string | null;
  currency?: string | null;
  selectedGiftCard?: GiftCardAvailableItem | null;
  onOpenChange: (open: boolean) => void;
};

const createDefaultValues = (
  selectedGiftCard?: GiftCardAvailableItem | null,
  branchId?: string | null,
  currency?: string | null
): GiftCardGuestPurchaseFormValues => ({
  amount: selectedGiftCard?.amount ?? 0,
  buyerEmail: "",
  buyerName: "",
  title: selectedGiftCard?.title ?? "",
  message: "",
  expiresAt: selectedGiftCard?.expiresAt ?? "",
  branchId: selectedGiftCard?.branchId ?? branchId ?? "",
  currency: currency ?? "",
});

const isGiftCardsDisabledError = (message: string) =>
  message.toLowerCase().includes("gift card") &&
  message.toLowerCase().includes("not enabled");

const GiftCardStripePaymentForm = ({
  paymentSession,
  onSuccess,
}: {
  paymentSession: GiftCardPaymentSession;
  onSuccess: () => void;
}) => {
  const t = useTranslations("home.giftCards");
  const stripe = useStripe();
  const elements = useElements();
  const [isPaying, setIsPaying] = useState(false);

  const handlePayment = async () => {
    if (!stripe || !elements) {
      return;
    }

    setIsPaying(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      toast.error(error.message || t("paymentFailed"));
      setIsPaying(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      toast.success(t("paymentSuccess"));
      onSuccess();
      setIsPaying(false);
      return;
    }

    toast.error(t("paymentNotCompleted"));
    setIsPaying(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 p-4">
        <PaymentElement />
      </div>

      <Button
        type="button"
        className="h-11 w-full rounded-xl bg-primary text-white hover:bg-primary/90"
        disabled={!stripe || !elements || isPaying || !paymentSession.clientSecret}
        onClick={handlePayment}
      >
        <CreditCard size={16} />
        {isPaying ? t("processingPayment") : t("completePayment")}
      </Button>
    </div>
  );
};

export const GiftCardPurchaseModal = ({
  open,
  restaurantId,
  branchId,
  currency,
  selectedGiftCard,
  onOpenChange,
}: GiftCardPurchaseModalProps) => {
  const t = useTranslations("home.giftCards");
  const purchaseGiftCard = useGuestPurchaseGiftCard();
  const [paymentSession, setPaymentSession] = useState<GiftCardPaymentSession | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const publishableKey = paymentSession?.publishableKey ?? "";
  const stripePromise = useMemo(
    () => publishableKey ? loadStripe(publishableKey) : null,
    [publishableKey]
  );
  const defaultValues = useMemo(
    () => createDefaultValues(selectedGiftCard, branchId, currency),
    [branchId, currency, selectedGiftCard]
  );
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<GiftCardGuestPurchaseFormValues>({
    resolver: zodResolver(giftCardGuestPurchaseSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(defaultValues);
    setPaymentSession(null);
    setIsComplete(false);
  }, [defaultValues, open, reset]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setPaymentSession(null);
      setIsComplete(false);
      purchaseGiftCard.reset();
    }

    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: GiftCardGuestPurchaseFormValues) => {
    try {
      const response = await purchaseGiftCard.mutateAsync({
        payload: buildGiftCardGuestPurchasePayload(values),
        params: {
          restaurantId,
          branchId: values.branchId || branchId,
        },
      });

      if (!response.data.paymentSession?.clientSecret || !response.data.paymentSession.publishableKey) {
        toast.error(t("paymentUnavailable"));
        return;
      }

      setPaymentSession(response.data.paymentSession);
    } catch (error) {
      const message = getApiErrorMessage(error);

      if (isGiftCardsDisabledError(message)) {
        toast.info(t("disabledToast"));
        handleOpenChange(false);
        return;
      }

      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Gift size={20} />
          </div>
          <DialogTitle>{t("modalTitle")}</DialogTitle>
          <DialogDescription>{t("modalDescription")}</DialogDescription>
        </DialogHeader>

        {isComplete ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <h3 className="text-base font-semibold text-emerald-900">
              {t("successTitle")}
            </h3>
            <p className="mt-2 text-sm leading-6 text-emerald-800">
              {t("successDescription")}
            </p>
            <Button
              type="button"
              className="mt-4 h-10 rounded-xl bg-primary text-white hover:bg-primary/90"
              onClick={() => handleOpenChange(false)}
            >
              {t("done")}
            </Button>
          </div>
        ) : paymentSession && stripePromise ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret: paymentSession.clientSecret,
              appearance: { theme: "stripe" },
            }}
          >
            <GiftCardStripePaymentForm
              paymentSession={paymentSession}
              onSuccess={() => setIsComplete(true)}
            />
          </Elements>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="guest-gift-card-amount"
                  className="mb-2 block text-xs font-semibold uppercase text-gray-500"
                >
                  {t("amount")}
                </label>
                <Input
                  id="guest-gift-card-amount"
                  type="number"
                  min="1"
                  step="1"
                  className="h-11 rounded-xl"
                  {...register("amount", { valueAsNumber: true })}
                />
                {errors.amount ? (
                  <p className="mt-2 text-sm text-red-600">{errors.amount.message}</p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="guest-gift-card-email"
                  className="mb-2 block text-xs font-semibold uppercase text-gray-500"
                >
                  {t("buyerEmail")}
                </label>
                <Input
                  id="guest-gift-card-email"
                  type="email"
                  placeholder={t("buyerEmailPlaceholder")}
                  className="h-11 rounded-xl"
                  {...register("buyerEmail")}
                />
                {errors.buyerEmail ? (
                  <p className="mt-2 text-sm text-red-600">{errors.buyerEmail.message}</p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="guest-gift-card-name"
                  className="mb-2 block text-xs font-semibold uppercase text-gray-500"
                >
                  {t("buyerName")}
                </label>
                <Input
                  id="guest-gift-card-name"
                  placeholder={t("buyerNamePlaceholder")}
                  className="h-11 rounded-xl"
                  {...register("buyerName")}
                />
              </div>

              <div>
                <label
                  htmlFor="guest-gift-card-title"
                  className="mb-2 block text-xs font-semibold uppercase text-gray-500"
                >
                  {t("title")}
                </label>
                <Input
                  id="guest-gift-card-title"
                  placeholder={t("titlePlaceholder")}
                  className="h-11 rounded-xl"
                  {...register("title")}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="guest-gift-card-message"
                className="mb-2 block text-xs font-semibold uppercase text-gray-500"
              >
                {t("message")}
              </label>
              <Textarea
                id="guest-gift-card-message"
                placeholder={t("messagePlaceholder")}
                className="min-h-24 rounded-xl"
                {...register("message")}
              />
            </div>

            <Button
              type="submit"
              className="h-11 w-full rounded-xl bg-primary text-white hover:bg-primary/90"
              disabled={purchaseGiftCard.isPending}
            >
              {purchaseGiftCard.isPending ? t("creatingPayment") : t("continueToPayment")}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
