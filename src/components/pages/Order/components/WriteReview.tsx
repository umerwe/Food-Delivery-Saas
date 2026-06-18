"use client";

import Image from "next/image";
import { Star, Loader2 } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useSearchParams, useRouter } from "next/navigation";
import useOrders from "@/hooks/useOrders";
import { useAuthContext } from "@/hooks/useAuth";
import { createReviewSchema, type ReviewFormValues } from "@/validations/reviews";
import { canReviewOrder, type Order } from "@/services/orders";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/errors";

export default function WriteReview() {
  const t = useTranslations("orders");
  const validationT = useTranslations("validation");
  const params = useSearchParams();
  const router = useRouter();
  const orderId = params.get("orderId");

  const { token } = useAuthContext();
  const { fetchOrderById, submitOrderReview } = useOrders(token);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const translatedReviewSchema = useMemo(
    () => createReviewSchema({ reviewMax: validationT("reviewMax") }),
    [validationT]
  );

  const { setValue, watch, handleSubmit } = useForm<ReviewFormValues>({
    resolver: zodResolver(translatedReviewSchema),
    defaultValues: { rating: 4, review: "" },
  });
  const rating = watch("rating");
  const review = watch("review") || "";
  const [hover, setHover] = useState(0);

  // ================= FETCH ORDER =================
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId || !token) {
        setNotFound(true);
        setLoading(false);
        return;
      }

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

  const renderStars = (value: number) => (
    <div className="flex justify-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={22}
          className={
            star <= value
              ? "text-[#EC5834] fill-[#EC5834]"
              : "text-gray-300"
          }
        />
      ))}
    </div>
  );

  const onSubmit = async (values: ReviewFormValues) => {
    if (!orderId || submitting || !order || !canReviewOrder(order)) return;

    try {
      setSubmitting(true);

      const response = await submitOrderReview({
        orderId,
        payload: {
          rating: values.rating,
          comment: values.review?.trim() || undefined,
        },
      });

      if (!response || response.success === false) {
        toast.error(getApiErrorMessage(response));
        return;
      }

      toast.success(t("reviewSubmitted"));
      router.push("/orders-history");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
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
          {t("orderNotFound")}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {t("reviewOrderNotFoundDescription")}
        </p>
        <button
          onClick={() => router.push("/orders-history")}
          className="px-4 py-2 bg-primary text-white rounded-md text-sm"
        >
          {t("goBack")}
        </button>
      </div>
    );
  }

  if (order.review) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">
            {t("alreadyReviewedTitle")}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {t("reviewAlreadySubmitted")}
          </p>
          {renderStars(order.review.rating)}
          {order.review.comment ? (
            <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              {order.review.comment}
            </p>
          ) : null}
          <button
            onClick={() => router.push("/orders-history")}
            className="mt-5 px-4 py-2 bg-primary text-white rounded-md text-sm"
          >
            {t("goBack")}
          </button>
        </div>
      </div>
    );
  }

  if (!canReviewOrder(order)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">
            {t("reviewUnavailableTitle")}
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            {t("reviewUnavailableDescription")}
          </p>
          <button
            onClick={() => router.push("/orders-history")}
            className="px-4 py-2 bg-primary text-white rounded-md text-sm"
          >
            {t("goBack")}
          </button>
        </div>
      </div>
    );
  }

  // ================= UI =================

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <h1 className="text-2xl font-semibold mb-1">{t("addReview")}</h1>
        <p className="text-sm text-gray-500 mb-6">
          {t("reviewSubtitle")}
        </p>

        {/* ORDER CARD */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-xl mb-6">
          <div className="w-14 h-14 relative rounded-lg overflow-hidden">
            <Image
              src={
                order?.items?.[0]?.menuItem?.imageUrl ||
                "/placeholder.png"
              }
              alt={t("itemFallback")}
              fill
              className="object-cover"
            />
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Order #{order?.id?.slice(-6)}
            </p>

            <h2 className="font-semibold">
              {order?.branch?.name || t("restaurantFallback")}
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
            {t("overallExperience")}
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
          <p className="text-sm mb-2">{t("yourReview")}</p>
          <textarea
            value={review}
            onChange={(e) => setValue("review", e.target.value, { shouldValidate: true })}
            placeholder={t("reviewPlaceholder")}
            className="w-full border border-[#ACACAC] rounded-lg p-3 text-sm outline-none min-h-[120px]"
          />
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={submitting}
            className="flex-1 bg-[#EC5834] text-white py-3 rounded-lg text-sm font-medium disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? t("submittingReview") : t("submitReview")}
          </button>

          <button
            onClick={() => router.push("/orders-history")}
            className="flex-1 border border-[#EC5834] text-[#EC5834] py-3 rounded-lg text-sm font-medium"
          >
            {t("cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
