"use client";

import React from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Eleanor M.",
    initials: "EM",
    text: `"The smoke profile is incredible. It’s subtle yet omnipresent. Best Wagyu I’ve had outside of Kyoto."`,
  },
  {
    name: "James R.",
    initials: "JR",
    text: `"That white-oak fire finish gives it a crust that is second to none. Absolutely worth the price for a special occasion."`,
  },
  {
    name: "Sarah W.",
    initials: "SW",
    text: `"Service was impeccable and the steak arrived exactly as requested. The pairing recommendation was spot on."`,
    partial: true,
  },
];

const StarRow = ({ partial = false }: { partial?: boolean }) => {
  return (
    <div className="flex gap-[2px] mb-3">
      {[1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          size={14}
          className="fill-[#E74C3C] text-[#E74C3C]"
        />
      ))}

      {partial ? (
        <Star
          size={14}
          className="text-[#E74C3C] fill-transparent"
        />
      ) : (
        <Star
          size={14}
          className="fill-[#E74C3C] text-[#E74C3C]"
        />
      )}
    </div>
  );
};

const Testimonials = () => {
  return (
    <section className="py-12 px-6 md:px-12 lg:px-20">

      {/* Header */}
      <div className="max-w-[1200px] mx-auto mb-10">
        <h2 className="text-[28px] font-semibold text-gray-900">
          Guest Experiences
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
            <span className="font-medium text-gray-900">4.9 / 5.0</span>
            <span className="ml-1 text-gray-400">
              (124 verified reviews)
            </span>
          </p>
        </div>
      </div>

      {/* Testimonials Grid */}
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        
        {testimonials.map((item, index) => (
          <div key={index} className="flex flex-col">

            {/* Stars */}
            <StarRow partial={item.partial} />

            {/* Text */}
            <p className="text-[15px] text-gray-700 leading-relaxed mb-6">
              {item.text}
            </p>

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
                  Verified Guest
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