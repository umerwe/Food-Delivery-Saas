"use client";

import Image from "next/image";
import { Star, Clock, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import useApi from "@/hooks/useApi";
import { useState } from "react";
import { useAuthContext } from "@/context/AuthContext";

export default function RestaurantCard({
  id,
  name,
  image,
  rating,
  time,
  price,
}: any) {
  const router = useRouter();
 const { user, token } = useAuthContext();
  const { post, get } = useApi(token);
const [showBranchPopup, setShowBranchPopup] = useState(false);
const [branches, setBranches] = useState<any[]>([]);
const [loadingBranches, setLoadingBranches] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchBranches = async () => {
  try {
    setLoadingBranches(true);

    const res = await get(`/v1/branches`); // or get if your hook supports

    const activeBranches =
      res?.data?.filter((b: any) => b.isActive) || [];

    setBranches(activeBranches);
    setShowBranchPopup(true);
  } catch (err) {
    console.error(err);
    toast.error("Failed to load branches");
  } finally {
    setLoadingBranches(false);
  }
};

  const handleAddToCart = async () => {
    try {
      setLoading(true);

      const authRaw = localStorage.getItem("auth");
      const auth = authRaw ? JSON.parse(authRaw) : null;

      const customerId = auth?.user?.id;
      const branchId = auth?.user?.branchId;
if (!branchId) {
  await fetchBranches();
  return;
}
      if (!customerId) {
        toast.error("User not found");
        return;
      }

      const payload = {
        menuItemId: id,
        quantity: 1,
        branchId,
        note: "",
      };

    const res = await post(`/v1/cart/items?customerId=${customerId}`, payload);

if (!res || res.error) {
  toast.error(res?.error || "Failed to add item");
  return;
}

      toast.success("Item added to cart");

      // 🚀 Redirect to checkout
      router.push("/checkout");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add item");
    } finally {
      setLoading(false);
    }
  };

const handleSelectBranch = async (branch: any) => {
  try {
    const authRaw = localStorage.getItem("auth");
    const auth = authRaw ? JSON.parse(authRaw) : null;

    if (auth?.user) {
      auth.user.branchId = branch.id;
      localStorage.setItem("auth", JSON.stringify(auth));
    }

    toast.success("Branch selected");
    setShowBranchPopup(false);

    // ✅ 🔥 RESUME FLOW (auto add to cart)
    await handleAddToCart();

  } catch (err) {
    console.error(err);
    toast.error("Failed to set branch");
  }
};
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition">

      {/* IMAGE */}
      <div className="relative h-[180px]">
        <Image
          src={image || "/placeholder.png"}
          alt={name}
          fill
          className="object-cover"
        />

        {/* ⭐ Rating */}
        <div className="absolute top-3.5 right-13 bg-white px-2 py-1 rounded-full flex items-center gap-1 text-sm shadow">
          <Star size={14} className="text-yellow-500 fill-yellow-500" />
          {rating}
        </div>

        {/* 🛒 Add to Cart */}
        <button
          onClick={handleAddToCart}
          disabled={loading}
          className="cursor-pointer absolute top-3 right-3 bg-white p-2 rounded-full shadow hover:bg-[#EC5834] hover:text-white transition disabled:opacity-50"
        >
          <ShoppingCart size={16} />
        </button>
      </div>

      {/* CONTENT */}
      <div className="p-4">
        <h3 className="font-semibold mb-2">{name}</h3>

        <div className="flex justify-between text-sm text-gray-600 mb-4">
          <span className="flex items-center gap-1">
            <Clock size={14} /> {time}
          </span>
          <span>{price}</span>
        </div>

        <button className="w-full bg-[#EC5834] text-white py-2 rounded-lg">
          View Item
        </button>
      </div>


    {showBranchPopup && (
  <div className="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
    
    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">

      {/* HEADER */}
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Select Branch
          </h2>
          <p className="text-xs text-gray-500">
            Choose a branch to continue your order
          </p>
        </div>

        <button
          onClick={() => setShowBranchPopup(false)}
          className="text-gray-400 hover:text-gray-600 text-xl"
        >
          ×
        </button>
      </div>

      {/* CONTENT */}
      <div className="max-h-[400px] overflow-y-auto px-5 py-4 space-y-3">

        {loadingBranches ? (
          <div className="flex items-center justify-center py-10 text-sm text-gray-400">
            Loading branches...
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-10 text-sm text-gray-400">
            No active branches found
          </div>
        ) : (
          branches.map((branch) => (
            <div
              key={branch.id}
              onClick={() => handleSelectBranch(branch)}
              className="group p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
            >
              <div className="flex items-center justify-between">
                
                {/* LEFT */}
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-primary">
                    {branch.name}
                  </p>

                  <p className="text-xs text-gray-500">
                    {branch.address?.area}, {branch.address?.city}
                  </p>
                </div>

                {/* RIGHT INDICATOR */}
                <div className="w-2 h-2 rounded-full bg-gray-300 group-hover:bg-primary transition" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* FOOTER */}
      <div className="px-5 py-3 border-t bg-gray-50 text-center">
        <button
          onClick={() => setShowBranchPopup(false)}
          className="text-sm text-gray-500 hover:text-gray-700 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}