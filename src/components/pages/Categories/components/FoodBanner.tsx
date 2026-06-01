"use client";

import Image from "next/image";
import { MapPin } from "lucide-react";

const FoodBanner = () => {
  return (
    <section className="relative w-full h-[320px] md:h-[430px] flex items-center justify-center overflow-hidden">

      {/* Background Image */}
      <Image
        src="/categories/background_banner.png"
        alt="Food Background"
        fill
        priority
        className="object-cover"
      />

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(255, 244, 243, 0.00) 0%, rgba(255, 244, 243, 0.40) 50%, #FFF4F3 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 w-full">

        {/* Heading */}
        <h1 className="text-[32px] md:text-[48px] font-semibold text-[#5A1E14] mb-6">
          Are you starving?
        </h1>

        {/* Search Bar */}
        <div className="flex items-center bg-white rounded-full shadow-md p-1 w-full max-w-xl">

          {/* Input with Icon */}
          <div className="flex items-center flex-1 px-4">
            <MapPin className="w-5 h-5 text-[#AD2A08] mr-2" />
            <input
              type="text"
              placeholder="Enter your delivery address"
              className="w-full outline-none text-sm text-gray-600 placeholder:text-gray-400"
            />
          </div>

          {/* Button */}
          <button className="bg-[#AD2A08] text-white px-5 py-2.5 rounded-full flex items-center gap-2 text-sm font-medium hover:opacity-90 transition">
            Find Food
            <span className="text-lg">→</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default FoodBanner;
