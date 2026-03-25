"use client";

import { Star, Clock } from "lucide-react";

export default function FiltersSidebar() {
  return (
    <div className="bg-[#FFEDEC] h-full p-5 rounded-3xl">
      <h3 className="text-lg font-semibold text-[#4a2c2a]">Filters</h3>
      <p className="text-sm text-gray-600 mb-6">
        Refine your cravings
      </p>

      {/* Sort */}
      <div className="mb-6">
        <p className="text-xs text-gray-500 mb-3">SORT BY</p>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[#EC5834] font-medium">
            <Clock size={16} />
            Recommended
            <div className="ml-auto w-[3px] h-5 bg-[#EC5834] rounded" />
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <Star size={16} />
            Top Rated
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="mb-6">
        <p className="text-xs text-gray-500 mb-3">PRICE RANGE</p>

        <div className="flex gap-2">
          <button className="px-3 py-1 rounded-full bg-white text-[#EC5834] border">
            $
          </button>
          <button className="px-3 py-1 rounded-full bg-[#EC5834] text-white">
            $$
          </button>
          <button className="px-3 py-1 rounded-full bg-white text-gray-600 border">
            $$$
          </button>
        </div>
      </div>

      {/* Distance */}
      <div className="mb-6">
        <p className="text-xs text-gray-500 mb-3">DISTANCE</p>

        <div className="h-2 bg-gray-200 rounded-full relative">
          <div className="absolute left-0 right-1/3 h-2 bg-[#EC5834] rounded-full" />
        </div>

        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1 km</span>
          <span>20 km</span>
        </div>
      </div>

      {/* Button */}
      <button className="w-full bg-[#FFC882] text-[#4a2c2a] py-3 rounded-lg font-medium">
        Apply Filters
      </button>
    </div>
  );
}