"use client";

import Image from "next/image";
import { Check, MapPin, Clock, Power } from "lucide-react";
import type { GroupOrderParticipant, GroupOrderSuccessData } from "@/types/group-order";

type OrderSuccessProps = {
  data?: GroupOrderSuccessData | null;
};

const OrderSuccess = ({ data }: OrderSuccessProps) => {
  const order = data?.order;
  const session = data?.session;

  const total = order?.totalAmount || session?.finalOrder?.totalAmount || 0;

  const participants =
    session?.participants?.filter((p) => p.status === "ACTIVE") || [];

  return (
    <section className="w-full min-h-screen py-17 px-6 flex flex-col items-center">
      <div className="w-24 h-24 rounded-full bg-white shadow-[0px_8px_10px_-6px_rgba(0,0,0,0.10)] shadow-xl flex items-center justify-center mb-6">
        <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center">
          <Check className="text-white w-7 h-7" strokeWidth={5} />
        </div>
      </div>
      <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">
        Success!
      </h1>

      <p className="text-gray-500 mt-2 text-sm md:text-base">
        Your group order has been placed successfully.
      </p>
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-lg shadow-[0_12px_32px_rgba(26,28,28,0.06)] mt-12 p-6 md:p-8 overflow-hidden">

        {/* 🔶 TOP RIGHT ABSTRACT IMAGE */}
        <div className="absolute top-0 right-0 opacity-60">
          <Image
            src="/group-order/abstract_accent.png"
            alt="accent"
            width={120}
            height={120}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* LEFT SIDE */}
          <div>
            <p className="text-[11px] uppercase text-gray-500 tracking-wider font-semibold">
              Total Paid
            </p>
            <h2 className="text-2xl font-semibold text-orange-500 mt-1">
              ${total}
            </h2>

            {/* ADDRESS */}
            <div className="mt-6">
              <p className="text-[11px] uppercase text-gray-500 tracking-wider font-semibold">
                Delivery Address
              </p>

              <div className="flex items-start gap-2 mt-2 text-sm text-gray-700">
                <MapPin className="w-4 h-4 mt-0.5 text-gray-400" />
                <span>
                  {session?.deliveryAddress
                    ? "Saved address"
                    : "Pickup from restaurant"}
                </span>
              </div>
            </div>

            {/* TIME */}
            <div className="mt-6">
              <p className="text-[11px] uppercase text-gray-500 tracking-wider font-semibold">
                Estimated Arrival
              </p>

              <div className="flex items-start gap-2 mt-2 text-sm text-gray-700">
                <Clock className="w-4 h-4 mt-0.5 text-gray-400" />
                <div>
                  <p>
                    {order?.orderTime
                      ? new Date(order.orderTime).toLocaleTimeString()
                      : "—"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {order?.isScheduled ? "Scheduled Order" : "ASAP"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="bg-[#F3F3F3] rounded-sm p-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-[11px] uppercase text-gray-500 tracking-wider font-semibold">
                Notified Members
              </p>

              <span className="text-[10px] bg-sky-100 text-sky-700 px-2 py-1 rounded-full font-medium">
                ORDER TRACKING SHARED
              </span>
            </div>

            {/* MEMBERS */}
            <div className="space-y-4">
              {participants.map((p: GroupOrderParticipant, i: number) => (
                <div key={i} className="flex items-center gap-3">

                  <div className="w-9 h-9 rounded-full overflow-hidden relative bg-gray-200">
                    {p?.user?.avatarUrl ? (
                      <Image
                        src={p.user.avatarUrl}
                        alt={p.user.firstName || ""}
                        fill
                        className="object-cover"
                      />
                    ) : null}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {p?.user?.firstName} {p?.user?.lastName}
                    </p>
                    <p className="text-xs text-green-600">
                      Active participant
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
      <div className="mt-10 flex gap-4 flex-col sm:flex-row">
        <button className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-medium shadow-md hover:opacity-90 transition">
          <Power className="w-4 h-4" />
          Track Order
        </button>

        <button
          onClick={() => (window.location.href = "/")}
          className="px-6 py-3 rounded-full border border-gray-300 text-gray-600 font-medium hover:bg-gray-100 transition"
        >
          Back to Home
        </button>
      </div>
    </section>
  );
};

export default OrderSuccess;
