"use client";

import Image from "next/image";
import { Star, RefreshCw, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import useOrders from "@/hooks/useOrders";
import { useAuthContext } from "@/hooks/useAuth";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import useBranchSelector from "@/hooks/useBranchSelector";
import BranchPopup from "@/components/common/popups/BranchPopup";
import { getStoredAuthState } from "@/lib/auth";
import type { Order, OrderItem, OrderMeta } from "@/services/orders";
export function OrdersHistoryPage() {
  const { token } = useAuthContext();
  const { addCartItemForReorder, fetchOrdersPage } = useOrders(token);
const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
 const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<OrderMeta | null>(null);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
const {
  showBranchPopup,
  setShowBranchPopup,
  branches,
  loadingBranches,
  fetchBranches,
  selectBranch,
} = useBranchSelector(() => handleReorder(pendingOrder));
  // ================= REORDER FUNCTION =================
  const handleReorder = async (order: Order | null) => {
  try {
    if (!order?.itemsPreview?.length) return;

    setReorderingId(order.id);

    const auth = getStoredAuthState();
    const user = typeof auth?.user === "object" && auth.user !== null ? auth.user as Record<string, unknown> : null;

    const customerId = user?.id ? String(user.id) : "";
    let branchId = user?.branchId ? String(user.branchId) : "";

    if (!customerId) {
      toast.error("User not found");
      return;
    }

    // ❗ If no branch → STOP (same behavior as your other flow)
    if (!branchId) {
  setPendingOrder(order);
  await fetchBranches();
  return;
}


    for (const item of order.itemsPreview) {
      await addCartItemForReorder({ customerId, payload: {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        branchId,
        note: "",
      } });
    }

    toast.success("Reorder successful!");

    //  redirect to checkout
    router.push("/checkout");

  } catch (err) {
    toast.error("Reorder failed");
  } finally {
    setReorderingId(null);
  }
};
  // ================= FETCH ORDERS =================
  useEffect(() => {
    const fetchOrders = async () => {
      if(!token){
        return
      }
      try {
        setLoading(true);
        setError(null);

        const { response: res, orders: nextOrders, meta: nextMeta } = await fetchOrdersPage({ page, limit: 10 });

        if (!res || res.success === false) {
          setError(res?.message || "Failed to fetch orders");
          setOrders([]);
          return;
        }

        setOrders(nextOrders);
        setMeta(nextMeta || null);
      } catch {
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [fetchOrdersPage, page, token]);

  // ================= FORMAT DATE =================
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  // ================= STATUS MAP =================
  const mapStatus = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "Delivered";
      case "CANCELLED":
        return "Cancelled";
      case "PLACED":
        return "Processing";
      case "CONFIRMED":
      case "PREPARING":
      case "PICKED_UP":
        return "Delivered";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">

        <h1 className="text-lg sm:text-[22px] font-semibold text-gray-900 mb-5 sm:mb-6">
          Your Order History
        </h1>

        {/* ================= LOADING ================= */}
        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-xl animate-pulse">
                <div className="h-20 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* ================= ERROR ================= */}
        {!loading && error && (
          <div className="text-center py-10">
            <p className="text-red-500 font-medium">{error}</p>
          </div>
        )}

        {/* ================= EMPTY ================= */}
        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            No orders found
          </div>
        )}

        {/* ================= LIST ================= */}
        {!loading && !error && orders.length > 0 && (
          <div className="space-y-4 sm:space-y-5">
            {orders.map((order) => {
              const firstItem = order.itemsPreview?.[0];

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden border border-[#F2F2F2]"
                >
                  <div className="flex flex-col sm:flex-row gap-4 p-4">
                    <div className="relative w-full sm:w-[110px] h-[180px] sm:h-[90px] rounded-xl overflow-hidden shrink-0">
                      <Image
                        src={firstItem?.imageUrl || "/placeholder.png"}
                        alt={firstItem?.menuItemName || "order"}
                        fill
                        className="object-cover"
                      />

                      <span className="absolute top-2 left-2 text-[11px] px-2 py-[3px] rounded-md font-medium bg-green-100 text-green-700">
                        {mapStatus(order.status)}
                      </span>
                    </div>

                    {/* CONTENT */}
                    <div className="flex-1">

                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">

                        <div>
                          <h2 className="text-[14px] sm:text-[15px] font-semibold text-gray-900">
                            {order.branch?.name || "Restaurant"}
                          </h2>

                          <p className="text-[11px] text-gray-400 mt-[2px]">
                            Order #{String(order.id).slice(-6)} ·{" "}
                            {formatDate(order.createdAt || "")}
                          </p>
                        </div>

                        <p className="text-[14px] sm:text-[15px] font-semibold text-gray-900">
                          Rs {order.totalAmount}
                        </p>
                      </div>

                      {/* ITEMS */}
                      <p className="text-[12px] text-gray-500 mt-2">
                        <span className="font-medium text-gray-600">
                          Items:
                        </span>{" "}
                        {order.itemsPreview
                          ?.map(
                            (item: OrderItem) =>
                              `${item.menuItemName} (x${item.quantity})`
                          )
                          .join(", ")}
                      </p>

                      {/* ACTIONS */}
                      <div className="flex flex-col sm:flex-row sm:justify-end gap-2 mt-3">
                        <Link
                          href={`/order?orderId=${order.id}`}
                          className="w-full sm:w-auto text-[12px] px-3 py-[7px] border border-primary text-primary rounded-md hover:bg-orange-50"
                        >
                          View Details
                        </Link>

  <button
                          onClick={() => handleReorder(order)}
                          disabled={reorderingId === order.id}
                          className="cursor-pointer text-xs px-3 py-1 bg-primary text-white rounded-[8px] flex items-center gap-1 disabled:opacity-60"
                        >
                          {reorderingId === order.id ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Reordering...
                            </>
                          ) : (
                            "Reorder"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM */}
                 <div className="bg-[#f6f6f6] border-t border-[#f2f2f2] px-4 py-3 flex justify-between items-center">

  {order.status === "PLACED" ? (
    order.review ? (
      <>
        {/*  Already reviewed */}
        <span className="text-[12px] text-gray-400">
          You rated this order
        </span>

        <div className="flex gap-[2px]">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={14}
              className={
                star <= (order.review?.rating || 0)
                  ? "text-[#EC5834] fill-[#EC5834]"
                  : "text-gray-300"
              }
            />
          ))}
        </div>
      </>
    ) : (
      <>
        {/*  No review */}
        <span className="text-[12px] text-gray-400">
          How was your food?
        </span>

        <button
          onClick={() =>
            router.push(`/order/write-review?orderId=${order.id}`)
          }
          className="text-xs text-primary font-medium cursor-pointer"
        >
          Write Review
        </button>
      </>
    )
  ) : (
    <span className="text-[12px] text-gray-400">
      Order is being processed
    </span>
  )}
</div>
                </div>
              );
            })}
          </div>
        )}

        {/* ================= PAGINATION ================= */}
        {!loading && meta && (meta.totalPages || 0) > 1 && (
          <div className="flex justify-center mt-6 gap-2 flex-wrap">

            <button
              disabled={!meta.hasPrevious}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              {"<"}
            </button>

            {[...Array(meta.totalPages || 0)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-3 py-1 border rounded ${
                  page === i + 1 ? "bg-primary text-white" : ""
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              disabled={!meta.hasNext}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              {">"}
            </button>
          </div>
        )}
      </div>
      <BranchPopup
  show={showBranchPopup}
  onClose={() => setShowBranchPopup(false)}
  branches={branches}
  loading={loadingBranches}
  onSelect={selectBranch}
/>
    </div>
  );
}
