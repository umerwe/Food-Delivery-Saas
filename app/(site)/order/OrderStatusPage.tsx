"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import useApi from "@/hooks/useApi";
import { useAuthContext } from "@/context/AuthContext";
import OrderSummary from "@/components/order/OrderSummary";

export default function OrderStatusPage() {
  const { token } = useAuthContext();
  const { get } = useApi(token);

  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false); // ✅ NEW

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setNotFound(false);

        const res = await get(`/v1/orders/${orderId}`);

        // ✅ handle backend "success: false" OR no data
        if (!res || res.success === false || !res?.data) {
          setNotFound(true);
          setOrder(null);
          return;
        }

        setOrder(res.data);
      } catch (err) {
        console.error(err);
        setNotFound(true); // ✅ fallback on error
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, token]);

  // ✅ STATUS MAP
  const statusMap: Record<string, number> = {
    PLACED: 1,
    CONFIRMED: 2,
    PREPARING: 3,
    PICKED_UP: 4,
    DELIVERED: 5,
  };

  const currentStep = statusMap[order?.status] || 1;

  const orderSteps = [
    { id: 1, title: "Order Placed", desc: "Your order has been placed successfully." },
    { id: 2, title: "Order Confirmed", desc: "Your order is confirmed and being prepared." },
    { id: 3, title: "Preparing your food", desc: "We're getting your order ready." },
    { id: 4, title: "Picked Up", desc: "Your order is out for delivery." },
    { id: 5, title: "Delivered", desc: "Your order has been delivered. Enjoy!" },
  ].map((step) => ({
    ...step,
    active: step.id <= currentStep,
  }));

  return (
    <div className="max-w-[1400px] mx-auto mt-[36px] mb-[113px] px-6 md:px-30 pt-5">

      {/* BACK */}
      {/* <Link
        href="/"
        className="flex items-center gap-2 mb-[45px] hover:opacity-70 transition-opacity"
      >
        <ArrowLeft size={37} />
        <span className="text-xl font-semibold">Back</span>
      </Link> */}

      {/* ================= NOT FOUND ================= */}
      {!loading && notFound && (
        <div className="bg-white rounded-xl shadow-lg p-10 text-center">
          <h2 className="text-lg font-semibold text-red-500 mb-2">
            Order Not Found
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            The order you’re looking for doesn’t exist or may have been removed.
          </p>

          <Link
            href="/"
            className="inline-block bg-primary text-white px-5 py-2 rounded-lg text-sm hover:bg-primary/90"
          >
            Go to Home
          </Link>
        </div>
      )}

      {/* ================= NORMAL FLOW ================= */}
      {!notFound && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

          {/* LEFT */}
          <div className="lg:col-span-7">

            {/* HEADER */}
            <div className="mb-[35px]">
              <h1 className="text-xl font-semibold text-gray-900 mb-[10px]">
                Track Your Order
              </h1>

              <p className="text-sm text-gray-400">
                Order #{order?.id || "..."} • {order?.orderType || "Loading..."}
              </p>
            </div>

            {/* STATUS CARD */}
            <div className="bg-white rounded-[10px] shadow-lg px-[61px] py-[35px] border border-gray-50">

              <h2 className="text-xl font-semibold mb-[36px]">
                Order Status
              </h2>

              {/* LOADING */}
              {loading && (
                <div className="space-y-6 animate-pulse">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex gap-6">
                      <div className="w-9 h-9 bg-gray-200 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-40 bg-gray-200 rounded" />
                        <div className="h-3 w-60 bg-gray-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* DATA */}
              {!loading && (
                <div className="space-y-0">
                  {orderSteps.map((step, index) => (
                    <div key={step.id} className="relative flex gap-6 pb-10">

                      {index !== orderSteps.length - 1 && (
                        <div className="absolute left-[17px] top-10 w-px h-full border-l-2 border-dashed border-gray-200" />
                      )}

                      <div
                        className={`relative z-10 flex items-center justify-center w-9 h-9 rounded-full text-sm font-medium ${
                          step.active
                            ? "bg-primary text-white"
                            : "bg-[#D9D9D9] text-white"
                        }`}
                      >
                        {step.id}
                      </div>

                      <div className="pt-1">
                        <h3
                          className={`text-[18px] font-medium mb-[4px] ${
                            step.active
                              ? "text-gray-900"
                              : "text-gray-400"
                          }`}
                        >
                          {step.title}
                        </h3>

                        <p className="text-sm text-gray-400">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-5">
            <OrderSummary order={order} />
          </div>
        </div>
      )}
    </div>
  );
}