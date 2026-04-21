"use client";

import { useEffect, useMemo, useState } from "react";
import { Wallet, Sparkles, ShieldCheck, CreditCard } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

import { useAuth } from "@/hooks/useAuth";
import useApi from "@/hooks/useApi";
import { toast } from "sonner";

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
      toast.error(error.message || "Payment failed");
      setPaying(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      toast.success("Funds added successfully");
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
          Back
        </Button>

        <Button
          type="button"
          onClick={handlePay}
          disabled={!stripe || paying}
          className="h-11 rounded-xl text-white"
          style={{ background: "var(--primary)" }}
        >
          {paying ? "Processing..." : "Complete Payment"}
        </Button>
      </div>
    </div>
  );
};
const Balance = ({
  balance = 0,
  currency = "USD",
  loyaltyPoints = 0,
}: Props) => {
  const { token } = useAuth();
  const api = useApi(token);

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("1000");
  const [note, setNote] = useState("Wallet top-up from app checkout flow");

  const [clientSecret, setClientSecret] = useState("");
  const [stripePromise, setStripePromise] = useState<any>(null);

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
      toast.error("Enter valid amount");
      return;
    }

    const res = await api.post("/v1/customer-app/wallet/top-up", {
      amount: numericAmount,
      currency: "PKR",
      note,
    });

    if (!res?.success) {
      toast.error(res?.error || "Failed to create payment");
      return;
    }

    const payment = res?.data?.paymentSession;

    setStripePromise(loadStripe(payment.publishableKey));
    setClientSecret(payment.clientSecret);

    toast.success("Choose payment method below");
  };

  return (
    <>
      <div
        className="mb-8 rounded-[18px] px-5 py-6 text-white shadow-lg"
        style={{ background: "var(--primary)" }}
      >
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/70">
          Current Balance
        </p>

        <div className="mt-2 flex items-end justify-between gap-4">
          <div>
          <h2 className="text-[40px] font-semibold tracking-tight">
  {currency} {Number(balance).toLocaleString()}
</h2>
<div className="mt-6">
  <p className="text-xs text-white/70">
    {loyaltyPoints ? "Wallet Activity" : "Member Status"}
  </p>

  <p className="text-[22px] font-semibold">
    {loyaltyPoints ? `${loyaltyPoints} txns` : "Standard"}
  </p>
</div>
          </div>

          <Button
            onClick={() => setOpen(true)}
            className="h-10 rounded-full bg-white px-5 text-black hover:bg-white/90"
          >
            <Wallet className="mr-2 h-4 w-4" />
            Add Funds
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
                Add Funds
              </DialogTitle>

              <p className="mt-2 text-sm text-white/80">
                Secure wallet top-up with Stripe.
              </p>
            </DialogHeader>
          </div>

          <div className="space-y-5 px-6 py-6">
            {!clientSecret ? (
              <>
                <div>
                  <p className="mb-2 text-sm font-medium text-zinc-700">
                    Select Amount
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
                        PKR {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-zinc-700">
                    Custom Amount
                  </p>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                      PKR
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
                    Payment Note
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
                      Available methods may include Card, Wallets, Apple Pay,
                      Google Pay depending on device/browser.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setOpen(false)}
                    className="h-11 rounded-xl"
                  >
                    Cancel
                  </Button>

                  <Button
                    onClick={handleTopUp}
                    disabled={api.loading}
                    className="h-11 rounded-xl text-white"
                    style={{ background: "var(--primary)" }}
                  >
                    {api.loading ? "Loading..." : "Continue"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                  <CreditCard className="h-4 w-4" />
                  Select Payment Method
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