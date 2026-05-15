"use client";

import HeaderSection from "@/components/GroupOrder/lobby/HeaderSection";
import UserCard from "@/components/GroupOrder/lobby/UserCard";
import OrderSummary from "@/components/GroupOrder/lobby/OrderSummary";
import InviteSection from "@/components/GroupOrder/lobby/InviteSection";
import OrderSuccess from "@/components/GroupOrder/Success/OrderSuccess";
import useGroupOrder from "@/hooks/useGroupOrder";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export default function LobbyPage() {
  const [successData, setSuccessData] = useState<any>(null);

  const { order, loading, redirecting } = useGroupOrder();

  if (successData) {
    return <OrderSuccess data={successData} />;
  }

  if (loading || redirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="rounded-2xl border border-gray-100 bg-white px-6 py-5 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>

          <p className="text-sm font-semibold text-gray-900">
            {redirecting ? "Group order is already checked out" : "Loading lobby"}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {redirecting
              ? "Redirecting you back to group orders..."
              : "Please wait while we prepare your group order."}
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">
            Group order not found
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            This group order may have expired, been checked out, or the invite
            code is no longer valid.
          </p>

          <a
            href="/group-order"
            className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white"
          >
            Go to Group Order
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 md:px-40">
      <HeaderSection order={order} />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* LEFT */}
        <div className="space-y-5 lg:col-span-2">
          {order?.participants?.map((participant: any) => (
            <UserCard
              key={participant.id}
              participant={participant}
              orderId={order?.id}
              isHost={participant.isHost}
            />
          ))}

          <InviteSection order={order} />
        </div>

        {/* RIGHT */}
        <OrderSummary order={order} onSuccess={setSuccessData} />
      </div>
    </div>
  );
}