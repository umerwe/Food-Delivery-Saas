"use client";

import { useEffect, useMemo, useState } from "react";
import { Wallet, Sparkles, ShieldCheck, CreditCard } from "lucide-react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useAuth } from "@/hooks/useAuth";
import usePayments from "@/hooks/usePayments";
import { DEFAULT_DISPLAY_CURRENCY, formatMoney, normalizeCurrencyCode } from "@/lib/money";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type Props = {
  balance?: number;
  currency?: string;
  loyaltyPoints?: number;
};

const quickAmounts = [500, 1000, 2500, 5000];

const CheckoutForm = ({
  clientSecret,
  onSuccess,
}: {
  clientSecret: string;
  onSuccess: () => void;
}) => {
  const t = useTranslations("profile.wallet");
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;

    setPaying(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      toast.error(error.message || t("paymentFailed"));
      setPaying(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      toast.success(t("fundsAdded"));
      onSuccess();
    }

    setPaying(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-200 p-4">
        <PaymentElement />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="ghost"
          className="h-11 rounded-xl"
          disabled={paying}
        >
          {t("back")}
        </Button>

        <Button
          type="button"
          onClick={handlePay}
          disabled={!stripe || paying}
          className="h-11 rounded-xl text-white"
          style={{ background: "var(--primary)" }}
        >
          {paying ? t("processing") : t("completePayment")}
        </Button>
      </div>
    </div>
  );
};
const Balance = ({
  balance = 0,
  currency = DEFAULT_DISPLAY_CURRENCY,
  loyaltyPoints = 0,
}: Props) => {
  const t = useTranslations("profile.wallet");
  const profileT = useTranslations("profile");
  const commonT = useTranslations("common");
  const { token } = useAuth();
  const api = usePayments(token);
  const walletCurrency = normalizeCurrencyCode(currency);

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("1000");
  const [note, setNote] = useState("Wallet top-up from app checkout flow");

  const [clientSecret, setClientSecret] = useState("");
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  const appearance = useMemo(
    () => ({
      theme: "stripe",
      variables: {
        colorPrimary: "#CE181B",
        borderRadius: "14px",
      },
    }),
    []
  );

  useEffect(() => {
  const handler = () => {
    setOpen(false);
    setClientSecret("");
  };

  window.addEventListener("wallet-updated", handler);

  return () =>
    window.removeEventListener("wallet-updated", handler);
}, []);

  const handleTopUp = async () => {
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount < 1) {
      toast.error(t("enterValidAmount"));
      return;
    }

    const res = await api.post("/customer-app/wallet/top-up", {
      amount: numericAmount,
      currency: walletCurrency,
      note,
    });

    if (!res?.success) {
      toast.error(res?.error ?? t("failedCreatePayment"));
      return;
    }

    const data = typeof res?.data === "object" && res.data !== null ? res.data as { paymentSession?: { publishableKey?: string; clientSecret?: string } } : null;
    const payment = data?.paymentSession;

    if (!payment?.publishableKey || !payment?.clientSecret) {
      toast.error(t("failedCreatePayment"));
      return;
    }

    setStripePromise(loadStripe(payment.publishableKey));
    setClientSecret(payment.clientSecret);

    toast.success(t("choosePaymentMethod"));
  };

  return (
    <>
      <div
        className="mb-8 rounded-[18px] px-5 py-6 text-white shadow-lg"
        style={{ background: "var(--primary)" }}
      >
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/70">
          {profileT("currentBalance")}
        </p>

        <div className="mt-2 flex items-end justify-between gap-4">
          <div>
          <h2 className="text-[40px] font-semibold tracking-tight">
  {formatMoney(balance, walletCurrency, { maximumFractionDigits: 0 })}
</h2>
<div className="mt-6">
  <p className="text-xs text-white/70">
    {loyaltyPoints ? t("walletActivity") : t("memberStatus")}
  </p>

  <p className="text-[22px] font-semibold">
    {loyaltyPoints ? t("transactionsShort", { count: loyaltyPoints }) : t("standard")}
  </p>
</div>
          </div>

          <Button
            onClick={() => setOpen(true)}
            className="h-10 rounded-full bg-white px-5 text-black hover:bg-white/90"
          >
            <Wallet className="mr-2 h-4 w-4" />
            {t("addFunds")}
          </Button>
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={(val) => {
          setOpen(val);
          if (!val) setClientSecret("");
        }}
      >
        <DialogContent className="w-[calc(100%-24px)] max-h-[90vh] max-w-[470px] overflow-y-auto rounded-3xl border-0 p-0 shadow-2xl">
          <div
            className="px-6 py-6 text-white"
            style={{
              background:
                "linear-gradient(135deg, var(--primary), #9f1114)",
            }}
          >
            <DialogHeader className="space-y-0">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <Sparkles className="h-5 w-5" />
              </div>

              <DialogTitle className="text-2xl font-semibold">
                {t("addFunds")}
              </DialogTitle>

              <p className="mt-2 text-sm text-white/80">
                {t("topUpSubtitle")}
              </p>
            </DialogHeader>
          </div>

          <div className="space-y-5 px-6 py-6">
            {!clientSecret ? (
              <>
                <div>
                  <p className="mb-2 text-sm font-medium text-zinc-700">
                    {t("selectAmount")}
                  </p>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {quickAmounts.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setAmount(String(item))}
                        className={`h-11 rounded-xl border text-sm font-medium transition ${
                          amount === String(item)
                            ? "text-white border-transparent"
                            : "border-zinc-200 hover:border-zinc-400"
                        }`}
                        style={
                          amount === String(item)
                            ? { background: "var(--primary)" }
                            : {}
                        }
                      >
                        {formatMoney(item, walletCurrency, { maximumFractionDigits: 0 })}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-zinc-700">
                    {t("customAmount")}
                  </p>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                      {walletCurrency}
                    </span>

                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-12 rounded-xl pl-14"
                    />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-zinc-700">
                    {t("paymentNote")}
                  </p>

                  <Input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>

                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-zinc-700">
                  <div className="flex items-start gap-2">
                    <ShieldCheck
                      className="mt-0.5 h-4 w-4 shrink-0"
                      style={{ color: "var(--primary)" }}
                    />
                    <span>
                      {t("methodsNotice")}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setOpen(false)}
                    className="h-11 rounded-xl"
                  >
                    {commonT("cancel")}
                  </Button>

                  <Button
                    onClick={handleTopUp}
                    disabled={api.loading}
                    className="h-11 rounded-xl text-white"
                    style={{ background: "var(--primary)" }}
                  >
                    {api.loading ? commonT("loading") : commonT("continue")}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                  <CreditCard className="h-4 w-4" />
                  {t("selectPaymentMethod")}
                </div>

                {stripePromise && (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                    }}
                  >
                    <CheckoutForm
                      clientSecret={clientSecret}
                    onSuccess={() => {
  setOpen(false);
  setClientSecret("");
  window.dispatchEvent(new Event("wallet-updated"));
}}
                    />
                  </Elements>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Balance;
