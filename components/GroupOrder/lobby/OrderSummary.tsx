"use client";

import { Info, Loader2, LogOut } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import useApi from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import useGroupOrder from "@/hooks/useGroupOrder";

export default function OrderSummary({ order, onSuccess }: any) {
  const summary = order?.summary;
const { canCheckout, isHost } = useGroupOrder();
  const { token } = useAuth();
  const { post } = useApi(token);

  const [noteOpen, setNoteOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [note, setNote] = useState("");
  const [coupon, setCoupon] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");

  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingLeave, setLoadingLeave] = useState(false);

  // ✅ LEAVE GROUP
  const handleLeave = async () => {
    try {
      setLoadingLeave(true);
      await post(`/v1/group-orders/${order?.id}/leave`);
      toast.success("Left group successfully");
      window.location.href = "/";
    } catch (err) {
      toast.error("Failed to leave group");
    } finally {
      setLoadingLeave(false);
    }
  };

  // ✅ CHECKOUT
 const handleCheckout = async () => {
  try {
    setLoadingCheckout(true);

    const res = await post(`/v1/group-orders/${order?.id}/checkout`, {
      paymentMethod,
      orderTime: order?.orderTime,
      customerNote: note || "",
      couponCode: coupon || "",
    });

    // ✅ HANDLE API ERROR PROPERLY
    if (!res || res.error) {
      toast.error(res?.error || res?.message || "Checkout failed");

      // optional debug
      console.log("Checkout error:", res);

      return;
    }

    // ✅ SUCCESS
    toast.success("Order placed successfully");
    setCheckoutOpen(false);
onSuccess(res?.data);
localStorage.removeItem("groupOrderCode");
  } catch (err) {
    // ❌ this will only catch unexpected runtime errors
    console.error(err);
    toast.error("Something went wrong");
  } finally {
    setLoadingCheckout(false);
  }
};


  return (
    <div className="space-y-6">

      {/* ✅ SUMMARY */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">

        {/* TOP ROW */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-semibold text-gray-900 text-lg">
            Order Summary
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
            Leave
          </button> )}
        </div>

        {/* PRICES */}
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Subtotal ({summary?.itemCount || 0} items)</span>
            <span>${summary?.subtotal || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span>${summary?.deliveryFee || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Platform Fee</span>
            <span>$1.50</span>
          </div>
        </div>

        <div className="border-t my-5" />

        <div className="flex justify-between font-semibold text-lg">
          <span>Total</span>
          <span className="text-orange-500">
            ${summary?.totalAmount || 0}
          </span>
        </div>

        {/* CHECKOUT BUTTON */}
       <button
  onClick={() => {
    if (!canCheckout) {
      toast.error("Only host can finalize order");
      return;
    }
    setCheckoutOpen(true);
  }}
  className="w-full mt-5 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-full font-medium shadow-md hover:shadow-lg transition"
>
  Finalize and Checkout
</button>

        {/* NOTE BUTTON */}
        <button
          onClick={() => setNoteOpen(true)}
          className="w-full mt-2 bg-gray-100 text-gray-600 py-2 rounded-full text-sm hover:bg-gray-200 transition"
        >
          Add a Note for Restaurant
        </button>

        <p className="text-xs text-gray-400 mt-3">
          Orders will only be processed once the host clicks finalize.
        </p>
      </div>

      {/* ✅ INFO */}
      <div className="flex items-start gap-3 bg-sky-100/40 text-sky-900 rounded-xl px-4 py-4">
        <Info className="w-5 h-5 mt-0.5 text-sky-700" strokeWidth={2.5} />
        <p className="text-xs leading-relaxed">
          Orders will only be processed once the host clicks finalize.
          You can still edit your individual items.
        </p>
      </div>

      {/* OFFER */}
      <div className="relative rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition">
        <Image
          src="https://images.unsplash.com/photo-1604908176997-125f25cc6f3d"
          alt="offer"
          width={400}
          height={200}
          className="object-cover"
        />

        <div className="absolute inset-0 bg-black/50 p-4 flex flex-col justify-end">
          <span className="text-xs bg-orange-500 text-white px-2 py-1 w-fit rounded">
            OFFER
          </span>
          <p className="text-white font-semibold mt-2">
            Get 20% off your next group order!
          </p>
        </div>
      </div>

      {/* ========================= */}
      {/* ✅ NOTE MODAL */}
      {/* ========================= */}
   <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
  <DialogContent className="rounded-3xl bg-[#f7f7f7] p-6 max-w-md border-none">

    <DialogHeader>
      <DialogTitle className="text-xl font-semibold text-gray-900">
        Add Note
      </DialogTitle>
      <p className="text-sm text-gray-500 mt-1">
        Add any special instructions for your order.
      </p>
    </DialogHeader>

    <textarea
      value={note}
      onChange={(e) => setNote(e.target.value)}
      placeholder="Allergies, instructions, etc."
      className="w-full mt-4 bg-white border border-gray-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      rows={4}
    />

    <button
      onClick={() => setNoteOpen(false)}
      className="w-full mt-5 bg-primary text-white py-3 rounded-full font-medium hover:opacity-90 transition"
    >
      Save Note
    </button>

  </DialogContent>
</Dialog>

      {/* ========================= */}
      {/* ✅ CHECKOUT MODAL */}
      {/* ========================= */}
    <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
  <DialogContent className="rounded-3xl bg-[#f7f7f7] p-6 max-w-md border-none">

    <DialogHeader>
      <DialogTitle className="text-xl font-semibold text-gray-900">
        Checkout Details
      </DialogTitle>
      <p className="text-sm text-gray-500 mt-1">
        Complete your order details below.
      </p>
    </DialogHeader>

    {/* PAYMENT */}
    <div className="mt-5">
      <p className="text-sm font-medium text-gray-700 mb-2">
        Payment Method
      </p>

      <div className="grid grid-cols-2 gap-3">
        {["COD", "BANK_TRANSFER", "EASYPESA", "JAZZCASH"].map((method) => (
          <button
            key={method}
            onClick={() => setPaymentMethod(method)}
            className={`rounded-full py-2 text-sm font-medium transition border ${
              paymentMethod === method
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
            }`}
          >
            {method}
          </button>
        ))}
      </div>
    </div>

    {/* COUPON */}
    <div className="mt-5">
      <p className="text-sm font-medium text-gray-700 mb-1">
        Coupon Code
      </p>
      <input
        value={coupon}
        onChange={(e) => setCoupon(e.target.value)}
        placeholder="Enter coupon"
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
      Confirm Order
    </button>

  </DialogContent>
</Dialog>

    </div>
  );
}