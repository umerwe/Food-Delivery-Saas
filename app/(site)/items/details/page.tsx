"use client";

import Image from "next/image";
import { useState } from "react";
import TestimonialsSection from "./Testimonials";

export default function ProductPage() {
  const [qty, setQty] = useState(1);

  return (
   <> <div className="mx-auto px-4 sm:px-6 md:px-10 lg:px-40 py-6 md:py-10 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
      
      {/* LEFT SIDE */}
      <div className="flex flex-col gap-6">
        
        {/* Image */}
        <div className="rounded-2xl overflow-hidden">
          <Image
            src="/items/bogo.png"
            alt="Burger"
            width={600}
            height={600}
            className="w-full h-[250px] sm:h-[350px] md:h-auto object-cover"
          />
        </div>

        {/* Ingredients */}
        <div>
          <h3 className="font-semibold mb-2 text-base md:text-lg">
            Ingredients
          </h3>
          <p className="text-sm md:text-[15px] text-gray-600 leading-relaxed">
            Our beef is 100% pasture-raised, aged for 21 days for maximum flavor
            density. We use Vermont white cheddar, heirloom beefsteak tomatoes
            from local farms, wild-grown crisp lettuce, and our proprietary
            butter-toasted brioche bun.
          </p>
        </div>

        {/* Nutrition */}
      <div>
          <h3 className="font-semibold text-lg mb-3">Nutritional Information</h3>

          <div className="text-sm text-gray-600  rounded-xl overflow-hidden">
            <div className="flex justify-between py-2 text-xs uppercase text-gray-400 bg-gray-50">
              <span>Metric</span>
              <span>Per Serving (14oz)</span>
            </div>

            {[
              ["Energy", "1,120 kcal"],
              ["Protein", "68g"],
              ["Total Fat", "84g"],
              ["Carbohydrates", "0g"],
              ["Sodium", "840mg"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-3 ">
                <span>{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex flex-col gap-5">
        
        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">
            Best Seller
          </p>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mt-1">
            Smashed Double Cheeseburger
          </h1>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-gray-500 mt-2">
            <span className="text-orange-500 font-medium">★ 4.8</span>
            <span>(150 reviews)</span>
            <span className="hidden sm:inline">•</span>
            <span>20–25 mins delivery</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm md:text-[15px] text-gray-600 leading-relaxed">
          Experience the ultimate crunch. Two 4oz aged beef patties smashed to
          perfection, topped with molten Vermont cheddar, heirloom tomatoes,
          and secret sauce on a toasted brioche.
        </p>

        {/* Price */}
        <div className="flex items-center gap-3">
          <span className="text-xl sm:text-2xl font-bold text-orange-500">
            $12.50
          </span>
          <span className="text-gray-400 line-through text-sm">$14.00</span>
        </div>

        {/* Size */}
        <div>
          <p className="font-medium mb-2">Select Size</p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button className="flex-1 rounded-xl px-4 py-3 border border-orange-500 text-left">
              <p className="font-medium">Regular</p>
              <p className="text-xs text-gray-500">Standard 8oz beef</p>
            </button>

            <button className="flex-1 rounded-xl px-4 py-3 bg-gray-50 text-left">
              <div className="flex justify-between items-center">
                <p className="font-medium">Large</p>
                <span className="text-orange-500 text-sm font-medium">
                  +$2.00
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Extra patty (12oz total)
              </p>
            </button>
          </div>
        </div>

        {/* Toppings */}
        <div>
          <p className="font-medium mb-2">Add Extra Toppings</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: "Extra Cheese", price: "+$1.00" },
              { name: "Crispy Bacon", price: "+$1.50" },
              { name: "Jalapeños", price: "+$0.50" },
              { name: "Mushrooms", price: "+$0.80" },
            ].map((item) => (
              <label
                key={item.name}
                className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="accent-orange-500" />
                  {item.name}
                </div>
                <span className="text-orange-500 text-sm">
                  {item.price}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Sauce */}
        <div>
          <p className="font-medium mb-2">Choose Sauce</p>

          <div className="flex gap-2 flex-wrap">
            {["Secret Sauce", "Mayo", "BBQ", "Spicy Aioli"].map(
              (sauce, i) => (
                <button
                  key={sauce}
                  className={`px-4 py-2 rounded-full text-sm ${
                    i === 0
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {sauce}
                </button>
              )
            )}
          </div>
        </div>

        {/* Instructions */}
        <div>
          <p className="font-medium mb-2">Special Instructions</p>

          <textarea
            placeholder="Add cooking notes (e.g., no onions)..."
            className="w-full bg-gray-100 rounded-xl p-3 text-sm h-24 resize-none outline-none"
          />
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 pt-2">
          
          {/* Qty */}
          <div className="flex items-center bg-gray-100 rounded-full">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="px-3 py-2"
            >
              −
            </button>
            <span className="px-4">{qty}</span>
            <button
              onClick={() => setQty(qty + 1)}
              className="px-3 py-2"
            >
              +
            </button>
          </div>

          {/* CTA */}
          <button className="w-full sm:flex-1 bg-orange-500 text-white py-3 rounded-full font-medium">
            Add to Cart | $12.50
          </button>
        </div>
      </div>
    </div>
    <TestimonialsSection />
    </>
  );
}