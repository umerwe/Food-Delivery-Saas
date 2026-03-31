"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import useApi from "@/hooks/useApi";
import { useAuthContext } from "@/context/AuthContext";
import useBranchSelector from "@/hooks/useBranchSelector";
import BranchPopup from "@/components/popups/BranchPopup";

export default function RestaurantCard({
  id,
  name,
  slug,
  image,
  time,
  price,
}: any) {
  const router = useRouter();
  const { token } = useAuthContext();
  const { post } = useApi(token);

  const [loading, setLoading] = useState(false);

const handleAddToCart = async () => {
  try {
    setLoading(true);

    const auth = JSON.parse(localStorage.getItem("auth") || "{}");
    const customerId = auth?.user?.id;
    const branchId = auth?.user?.branchId;

    // ✅ If no branch OR force selection flag
    if (!branchId || showBranchPopup === false) {
      await fetchBranches();
      setShowBranchPopup(true);
      return;
    }

    const res = await post(`/v1/cart/items?customerId=${customerId}`, {
      menuItemId: id,
      quantity: 1,
      branchId,
    });

    if (!res || res.error) {
      toast.error("Failed to add");
      return;
    }

    toast.success("Added to cart");
    router.push("/checkout");

  } finally {
    setLoading(false);
  }
};
  const {
    showBranchPopup,
    setShowBranchPopup,
    branches,
    loadingBranches,
    fetchBranches,
    selectBranch,
  } = useBranchSelector(handleAddToCart);

  const handleNavigateToDetails = () => {
  router.push(`/items/details?itemId=${id}&slug=${slug}`);
};

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex justify-between items-center shadow-sm hover:shadow-md transition-all">

      {/* LEFT CONTENT */}
      <div className="flex-1 pr-5">
        <h3 className="font-semibold text-base md:text-lg leading-snug mb-2 text-gray-900">
          {name}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          1 McChicken™, 1 Big Mac™, 1 Royal Cheeseburger, 3 medium
        </p>

        {/* PRICE */}
        <p className="font-semibold text-base text-gray-900">
          ${price}
        </p>
      </div>

      {/* RIGHT IMAGE BLOCK */}
    {/* RIGHT IMAGE BLOCK */}
<div className="relative w-[140px] h-[130px] md:w-[160px] md:h-[140px] bg-yellow-400 rounded-2xl flex items-center justify-center overflow-hidden">
  
  <Image
    src={image || "/placeholder.png"}
    alt={name}
    fill
    className="object-contain p-2"
     onClick={handleAddToCart}
  />

  {/* PLUS BUTTON */}
 <button
  onClick={handleNavigateToDetails}
  disabled={loading}
  className="cursor-pointer absolute bottom-2 right-2 bg-[#EC5834] hover:bg-[#d94e2d] text-white p-2.5 rounded-full shadow-md transition"
>
  <Plus size={16} />
</button>
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