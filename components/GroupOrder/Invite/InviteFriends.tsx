"use client";

import Image from "next/image";
import { Users, Sparkles, RefreshCcw } from "lucide-react";
import FeaturesSection from "./FeaturesSection";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import useApi from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";

export default function InviteFriends() {
  const { token } = useAuth();
  const { get } = useApi(token);
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 🔥 FETCH FUNCTION (reusable)
  const fetchOrder = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await get("/v1/group-orders");

      if (!res || res.error) {
        toast.error("Failed to fetch group orders");
        return;
      }

      const orders = res?.data || [];

      if (!orders.length) {
        setOrder(null);
        return;
      }

      const latestOrder =
        orders.find((o: any) => o.status === "OPEN") || orders[0];

      setOrder(latestOrder);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchOrder();
  }, [token]);

  // 🔁 REFRESH HANDLER
  const handleRefresh = () => {
    fetchOrder(true);
  };

  // 🔥 COPY LINK
  const handleCopy = async () => {
    const link = `${window.location.origin}/items?code=${order?.inviteCode}`;
    await navigator.clipboard.writeText(link);
    toast.success("Link copied");
  };

  // 🔹 SKELETON UI
  const Skeleton = () => (
    <div className="animate-pulse space-y-4 mt-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 bg-gray-100 p-4 rounded-xl">
          <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-300 rounded w-1/3"></div>
            <div className="h-2 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div className="h-3 w-10 bg-gray-300 rounded"></div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <section className="w-full bg-[#f4f4f4] py-20 px-6 flex justify-center">
        <div className="w-full max-w-2xl bg-white rounded-2xl p-10">
          <Skeleton />
        </div>
      </section>
    );
  }

  if (!order) {
    return <div className="text-center py-20">No active order</div>;
  }

  return (
    <section className="w-full bg-[#f4f4f4] py-20 px-6 flex flex-col gap-20 items-center">

      <div className="w-full max-w-2xl relative bg-white rounded-2xl shadow-[0_12px_32px_rgba(26,28,28,0.06)] p-8 md:p-12 overflow-hidden">

        {/* HEADER */}
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
            Invite your friends
          </h2>
          <p className="text-gray-500 mt-3 text-sm">
            Share this link to start ordering together.
          </p>
        </div>

        {/* ICON */}
        <div className="flex justify-center mt-10 relative">
          <div className="w-28 h-28 bg-primary/10 rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-primary" />
          </div>

          <div className="absolute bottom-2 right-[38%] bg-white rounded-full shadow p-2">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
        </div>

        {/* INVITE LINK */}
        <div className="mt-10">
          <p className="text-[11px] font-medium text-gray-500 uppercase mb-2">
            Unique Invite Link
          </p>

          <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 gap-3">
            <span className="text-gray-700 text-sm flex-1 truncate">
              {`${window.location.origin}/items?code=${order.inviteCode}`}
            </span>

            <button
              onClick={handleCopy}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full text-sm"
            >
              Copy
            </button>
          </div>
        </div>

        {/* MEMBERS HEADER */}
        <div className="mt-10 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-900">
            Joined Members ({order.participantCount})
          </h3>

          <div className="flex items-center gap-3">
            {/* LIVE */}
            <div className="flex items-center gap-2 text-[11px] text-red-500">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              LIVE
            </div>

            {/* REFRESH */}
            <button
              onClick={handleRefresh}
              className="p-2 rounded-full hover:bg-gray-100 transition"
            >
              <RefreshCcw
                className={`w-4 h-4 text-gray-600 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* MEMBER LIST */}
        <div className="mt-4">
          {refreshing ? (
            <Skeleton />
          ) : (
            <div className="space-y-4">
              {order.participants.map((p: any) => (
                <div
                  key={p.id}
                  className="flex justify-between items-center bg-gray-50 rounded-xl p-4 border border-gray-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                      {p.user?.avatarUrl && (
                        <Image
                          src={p.user.avatarUrl}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">
                          {p.user?.firstName} {p.user?.lastName}
                        </p>

                        {p.isHost && (
                          <span className="text-[10px] px-2 py-0.5 bg-gray-200 rounded">
                            HOST
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500">
                        {p.status === "ACTIVE" ? "Ready" : "Waiting..."}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-green-600">{p.status}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <button
            onClick={() =>
              router.push(`/items?code=${order.inviteCode}`)
            }
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-semibold shadow-md"
          >
            Go to Menu →
          </button>

          <p className="text-[10px] text-gray-400 mt-4">
            Or wait for friends to join
          </p>
        </div>
      </div>

      <FeaturesSection />
    </section>
  );
}