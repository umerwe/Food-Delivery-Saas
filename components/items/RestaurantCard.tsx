"use client";

import Image from "next/image";
import { Star, Clock, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import useApi from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

export default function RestaurantCard({
  id,
  name,
  image,
  rating,
  time,
  price,
}: any) {
  const router = useRouter();
  const { token } = useAuth();
  const { post } = useApi(token);

  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    try {
      setLoading(true);

      const authRaw = localStorage.getItem("auth");
      const auth = authRaw ? JSON.parse(authRaw) : null;

      const customerId = auth?.user?.id;
      const branchId = auth?.user?.branchId ||  "cmmoib210000dfbilh8520qhw";

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
    </div>
  );
}