"use client";

import HeaderSection from "@/components/GroupOrder/lobby/HeaderSection";
import UserCard from "@/components/GroupOrder/lobby/UserCard";
import OrderSummary from "@/components/GroupOrder/lobby/OrderSummary";
import InviteSection from "@/components/GroupOrder/lobby/InviteSection";
import { useEffect, useState } from "react";
import useApi from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import OrderSuccess from "@/components/GroupOrder/Success/OrderSuccess";
import useGroupOrder from "@/hooks/useGroupOrder";

export default function LobbyPage() {
  const { token } = useAuth();
  const { get } = useApi(token);

const [successData, setSuccessData] = useState<any>(null);

const { order, refetch } = useGroupOrder();
if (successData) {
  return <OrderSuccess data={successData} />;
}
  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 md:px-40">

      <HeaderSection order={order} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-5">

          {order?.participants?.map((p: any) => (
            <UserCard
              key={p.id}
              participant={p}
              orderId={order?.id}
              isHost={p.isHost}
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