"use client";

import { Star } from "lucide-react";
import type { CustomerReview } from "@/services/public-content";

type TestimonialItem = {
  name: string;
  initials: string;
  text: string;
  rating: number;
  orderedItems?: string;
};

type TestimonialsProps = {
  reviews?: CustomerReview[];
  menuItemId?: string | null;
  averageRating?: number | null;
};

const fallbackTestimonials: TestimonialItem[] = [
  {
    name: "Eleanor M.",
    initials: "EM",
    text: `"The smoke profile is incredible. It’s subtle yet omnipresent. Best Wagyu I’ve had outside of Kyoto."`,
    rating: 5,
  },
  {
    name: "James R.",
    initials: "JR",
    text: `"That white-oak fire finish gives it a crust that is second to none. Absolutely worth the price for a special occasion."`,
    rating: 5,
  },
  {
    name: "Sarah W.",
    initials: "SW",
    text: `"Service was impeccable and the steak arrived exactly as requested. The pairing recommendation was spot on."`,
    rating: 4,
  },
];

const getInitials = (name: string) => {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "CG";
};

const buildCustomerName = (review: CustomerReview) => {
  return [review.customer.firstName, review.customer.lastName]
    .filter(Boolean)
    .join(" ") || "Customer";
};

const buildOrderedItems = (review: CustomerReview, menuItemId?: string | null) => {
  if (!menuItemId) {
    return "";
  }

  return review.order?.items
    .filter((item) => item.menuItemId === menuItemId)
    .map((item) => item.variationName || item.menuItemName || "This item")
    .join(", ") || "";
};

const StarRow = ({ rating }: { rating: number }) => {
  return (
    <div className="flex gap-[2px] mb-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={
            i <= rating
              ? "fill-[#E74C3C] text-[#E74C3C]"
              : "text-[#E74C3C] fill-transparent"
          }
        />
      ))}
    </div>
  );
};

const Testimonials = ({ reviews = [], menuItemId = null, averageRating = null }: TestimonialsProps) => {
  const dynamicTestimonials = reviews.slice(0, 3).map((review) => {
    const name = buildCustomerName(review);
    const comment = review.comment?.trim();

    return {
      name,
      initials: getInitials(name),
      text: comment ? `"${comment}"` : "Rated this order after enjoying this item.",
      rating: review.rating,
      orderedItems: buildOrderedItems(review, menuItemId),
    };
  });
  const testimonials = dynamicTestimonials.length ? dynamicTestimonials : fallbackTestimonials;
  const displayAverage = averageRating ?? 4.9;
  const reviewCount = reviews.length || 124;

  return (
    <section className="py-12 px-6 md:px-12 lg:px-20">


      <div className="max-w-[1200px] mx-auto mb-10">
        <h2 className="text-[28px] font-semibold text-gray-900">
          User Experiences
        </h2>

        <div className="flex items-center gap-3 mt-2">
          <div className="flex gap-[2px]">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className="fill-[#E74C3C] text-[#E74C3C]"
              />
            ))}
          </div>

          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">
              {displayAverage.toFixed(1)} / 5.0
            </span>
            <span className="ml-1 text-gray-400">
              ({reviewCount} verified {reviewCount === 1 ? "review" : "reviews"})
            </span>
          </p>
        </div>
      </div>

      {/* Testimonials Grid */}
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">

        {testimonials.map((item, index) => (
          <div key={index} className="flex flex-col">

            {/* Stars */}
            <StarRow rating={item.rating} />

            {/* Text */}
            <p className="text-[15px] text-gray-700 leading-relaxed mb-6">
              {item.text}
            </p>

            {item.orderedItems ? (
              <p className="mb-4 text-xs text-gray-400">
                Ordered: {item.orderedItems}
              </p>
            ) : null}

            {/* User */}
            <div className="flex items-center gap-3">

              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
                {item.initials}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900">
                  {item.name}
                </p>
                <p className="text-[11px] tracking-wide uppercase text-gray-400">
                  Verified User
                </p>
              </div>

            </div>
          </div>
        ))}

      </div>
    </section>
  );
};

export default Testimonials;
