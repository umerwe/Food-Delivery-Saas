"use client";

import Image from "next/image";
import { Star, Loader2, Camera } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useSearchParams, useRouter } from "next/navigation";
import useOrders from "@/hooks/useOrders";
import { useAuthContext } from "@/hooks/useAuth";
import { reviewSchema, type ReviewFormValues } from "@/validations/reviews";
import type { Order } from "@/services/orders";

export default function WriteReview() {
  const params = useSearchParams();
  const router = useRouter();
  const orderId = params.get("orderId");

  const { token } = useAuthContext();
  const { fetchOrderById } = useOrders(token);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const { setValue, watch, handleSubmit } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 4, review: "" },
  });
  const rating = watch("rating");
  const review = watch("review") || "";
  const [hover, setHover] = useState(0);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // ================= FETCH ORDER =================
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId || !token) return;

      try {
        setLoading(true);

        const { response: res, order: nextOrder } = await fetchOrderById({ orderId });

        if (!res || res.success === false || !nextOrder) {
          setNotFound(true);
          return;
        }

        setOrder(nextOrder);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [fetchOrderById, orderId, token]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  // ================= IMAGE HANDLER =================
  const handleImageClick = () => {
    fileRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;


    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
    setValue("image", file, { shouldValidate: true });
  };

  // ================= STATES =================

  // 🔄 LOADING UI
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-6 h-6 text-primary" />
      </div>
    );
  }

  //  NOT FOUND
  if (notFound || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-lg font-semibold mb-2">
          Order not found
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          We couldn’t find the order you're trying to review.
        </p>
        <button
          onClick={() => router.push("/orders-history")}
          className="px-4 py-2 bg-primary text-white rounded-md text-sm"
        >
          Go Back
        </button>
      </div>
    );
  }

  // ================= UI =================

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <h1 className="text-2xl font-semibold mb-1">Add Review</h1>
        <p className="text-sm text-gray-500 mb-6">
          Share your culinary journey with the community.
        </p>

        {/* ORDER CARD */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-xl mb-6">
          <div className="w-14 h-14 relative rounded-lg overflow-hidden">
            <Image
              src={
                order?.items?.[0]?.menuItem?.imageUrl ||
                "/placeholder.png"
              }
              alt="item"
              fill
              className="object-cover"
            />
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Order #{order?.id?.slice(-6)}
            </p>

            <h2 className="font-semibold">
              {order?.branch?.name || "Restaurant"}
            </h2>

            <p className="text-xs text-gray-400">
              {formatDate(order.createdAt || "")} · Rs{" "}
              {order.totalAmount}
            </p>
          </div>
        </div>

        {/* REVIEW BOX */}
        <div className="bg-white border border-[#ACACAC] rounded-xl p-5">

          {/* RATING */}
          <p className="text-center text-sm font-medium mb-3">
            Overall Experience
          </p>

          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                size={22}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setValue("rating", i, { shouldValidate: true })}
                className={`cursor-pointer ${
                  (hover || rating) >= i
                    ? "text-[#EC5834] fill-[#EC5834]"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <p className="text-sm mb-2">Your Review</p>
          <textarea
            value={review}
            onChange={(e) => setValue("review", e.target.value, { shouldValidate: true })}
            placeholder="Tell us about your experience... Was the food hot? How was the presentation?"
            className="w-full border border-[#ACACAC] rounded-lg p-3 text-sm outline-none min-h-[120px]"
          />
          <p className="text-sm mt-4 mb-2">Add Photos</p>

          <div className="flex gap-3 items-center">
            <div
              onClick={handleImageClick}
              className="w-[120px] h-[120px] border-2 border-[#ACACAC] border-dashed rounded-xl flex flex-col items-center justify-center text-gray-400 text-xs cursor-pointer hover:border-primary transition"
            >
              <Camera size={20} />
              Upload
            </div>

            {imagePreview && (
              <div className="w-[120px] h-[120px] relative rounded-xl overflow-hidden border">
                <Image
                  src={imagePreview}
                  alt="preview"
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileRef}
            onChange={handleImageChange}
            className="hidden"
            accept="image/*"
          />
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSubmit(() => undefined)}
            className="flex-1 bg-[#EC5834] text-white py-3 rounded-lg text-sm font-medium"
          >
            Submit Review
          </button>

          <button
            onClick={() => router.push("/orders-history")}
            className="flex-1 border border-[#EC5834] text-[#EC5834] py-3 rounded-lg text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
