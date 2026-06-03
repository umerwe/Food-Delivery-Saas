"use client";

import { Info, Loader2, LogOut } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { toast } from "sonner";
import { useTranslations } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import useGroupOrder, { useGroupOrderApi } from "@/hooks/useGroupOrder";
import { clearStoredGroupOrderCode } from "@/lib/group-order";
import type { CheckoutGroupOrderPayload, GroupOrder, GroupOrderPaymentMethod, GroupOrderSuccessData } from "@/types/group-order";

type OrderSummaryProps = {
  order: GroupOrder;
  onSuccess: (data: GroupOrderSuccessData) => void;
};

export default function OrderSummary({ order, onSuccess }: OrderSummaryProps) {
  const t = useTranslations("groupOrder.lobby.summary");
  const cartT = useTranslations("cart");
  const errorT = useTranslations("errors");
  const summary = order?.summary;
const { canCheckout, isHost } = useGroupOrder();
  const { checkoutGroupOrder, leaveGroupOrder } = useGroupOrderApi(null);

  const [noteOpen, setNoteOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [note, setNote] = useState("");
  const [coupon, setCoupon] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<GroupOrderPaymentMethod>("COD");

  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingLeave, setLoadingLeave] = useState(false);

  const handleLeave = async () => {
    try {
      setLoadingLeave(true);
      await leaveGroupOrder({ orderId: order.id });
      toast.success(t("leftGroup"));
      window.location.href = "/";
    } catch (err) {
      toast.error(t("failedLeaveGroup"));
    } finally {
      setLoadingLeave(false);
    }
  };

 const handleCheckout = async () => {
  try {
    setLoadingCheckout(true);

    const payload: CheckoutGroupOrderPayload = {
      paymentMethod,
      orderTime: order?.orderTime,
      customerNote: note || "",
      couponCode: coupon || "",
    };

    const res = await checkoutGroupOrder({ orderId: order.id, payload });

    if (!res || res.error) {
      toast.error(res?.error || res?.message || t("checkoutFailed"));

      return;
    }

    toast.success(t("orderPlaced"));
    setCheckoutOpen(false);
onSuccess((res?.data || {}) as GroupOrderSuccessData);
clearStoredGroupOrderCode();
  } catch {
    toast.error(errorT("somethingWentWrong"));
  } finally {
    setLoadingCheckout(false);
  }
};


  return (
    <div className="space-y-6">

      {/* SUMMARY */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">

        {/* TOP ROW */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-semibold text-gray-900 text-lg">
            {t("title")}
          </h2>

          {/* LEAVE BUTTON */}
       {!isHost && (
          <button
            onClick={handleLeave}
            className="flex items-center gap-1 text-red-500 text-sm hover:opacity-80"
          >
            {loadingLeave ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            {t("leave")}
          </button> )}
        </div>

        {/* PRICES */}
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>{cartT("subtotal")} ({cartT("itemCount", { count: summary?.itemCount || 0 })})</span>
            <span>${summary?.subtotal || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>{cartT("deliveryFee")}</span>
            <span>${summary?.deliveryFee || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>{t("platformFee")}</span>
            <span>$1.50</span>
          </div>
        </div>

        <div className="border-t my-5" />

        <div className="flex justify-between font-semibold text-lg">
          <span>{cartT("total")}</span>
          <span className="text-orange-500">
            ${summary?.totalAmount || 0}
          </span>
        </div>

        {/* CHECKOUT BUTTON */}
       <button
  onClick={() => {
    if (!canCheckout) {
      toast.error(t("onlyHostCanFinalize"));
      return;
    }
    setCheckoutOpen(true);
  }}
  className="w-full mt-5 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-full font-medium shadow-md hover:shadow-lg transition"
>
  {t("finalizeCheckout")}
</button>

        {/* NOTE BUTTON */}
        <button
          onClick={() => setNoteOpen(true)}
          className="w-full mt-2 bg-gray-100 text-gray-600 py-2 rounded-full text-sm hover:bg-gray-200 transition"
        >
          {t("addRestaurantNote")}
        </button>

        <p className="text-xs text-gray-400 mt-3">
          {t("hostFinalizeNotice")}
        </p>
      </div>
      <div className="flex items-start gap-3 bg-sky-100/40 text-sky-900 rounded-xl px-4 py-4">
        <Info className="w-5 h-5 mt-0.5 text-sky-700" strokeWidth={2.5} />
        <p className="text-xs leading-relaxed">
          {t("editNotice")}
        </p>
      </div>

      {/* OFFER */}
      <div className="relative rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition">
        <Image
          src="https://images.unsplash.com/photo-1604908176997-125f25cc6f3d"
          alt={t("offerImageAlt")}
          width={400}
          height={200}
          className="object-cover"
        />

        <div className="absolute inset-0 bg-black/50 p-4 flex flex-col justify-end">
          <span className="text-xs bg-orange-500 text-white px-2 py-1 w-fit rounded">
            {t("offer")}
          </span>
          <p className="text-white font-semibold mt-2">
            {t("offerText")}
          </p>
        </div>
      </div>

      {/* NOTE MODAL */}
   <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
  <DialogContent className="rounded-3xl bg-[#f7f7f7] p-6 max-w-md border-none">

    <DialogHeader>
      <DialogTitle className="text-xl font-semibold text-gray-900">
        {t("noteTitle")}
      </DialogTitle>
      <p className="text-sm text-gray-500 mt-1">
        {t("noteDescription")}
      </p>
    </DialogHeader>

    <textarea
      value={note}
      onChange={(e) => setNote(e.target.value)}
      placeholder={t("notePlaceholder")}
      className="w-full mt-4 bg-white border border-gray-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      rows={4}
    />

    <button
      onClick={() => setNoteOpen(false)}
      className="w-full mt-5 bg-primary text-white py-3 rounded-full font-medium hover:opacity-90 transition"
    >
      {t("saveNote")}
    </button>

  </DialogContent>
</Dialog>

      {/* CHECKOUT MODAL */}
    <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
  <DialogContent className="rounded-3xl bg-[#f7f7f7] p-6 max-w-md border-none">

    <DialogHeader>
      <DialogTitle className="text-xl font-semibold text-gray-900">
        {t("checkoutDetails")}
      </DialogTitle>
      <p className="text-sm text-gray-500 mt-1">
        {t("checkoutDescription")}
      </p>
    </DialogHeader>

    {/* PAYMENT */}
    <div className="mt-5">
      <p className="text-sm font-medium text-gray-700 mb-2">
        {t("paymentMethod")}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {(["COD", "BANK_TRANSFER", "EASYPESA", "JAZZCASH"] as GroupOrderPaymentMethod[]).map((method) => (
          <button
            key={method}
            onClick={() => setPaymentMethod(method as GroupOrderPaymentMethod)}
            className={`rounded-full py-2 text-sm font-medium transition border ${
              paymentMethod === method
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
            }`}
          >
            {t(`paymentMethods.${method}`)}
          </button>
        ))}
      </div>
    </div>

    {/* COUPON */}
    <div className="mt-5">
      <p className="text-sm font-medium text-gray-700 mb-1">
        {t("couponCode")}
      </p>
      <input
        value={coupon}
        onChange={(e) => setCoupon(e.target.value)}
        placeholder={t("couponPlaceholder")}
        className="w-full bg-white border border-gray-200 rounded-full px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>

    {/* SUBMIT */}
    <button
      onClick={handleCheckout}
      disabled={loadingCheckout}
      className="w-full mt-6 bg-primary text-white py-3 rounded-full flex items-center justify-center gap-2 font-medium hover:opacity-90 transition"
    >
      {loadingCheckout && (
        <Loader2 className="w-4 h-4 animate-spin" />
      )}
      {t("confirmOrder")}
    </button>

  </DialogContent>
</Dialog>

    </div>
  );
}
