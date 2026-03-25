"use client";

import Image from "next/image";

export default function PizzaBanner() {
  return (
    <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden">
      {/* Background Image */}
      <Image
        src="/categories/background_banner.png"
        alt="Pizza Banner"
        fill
        priority
        className="object-cover"
      />

{/* Dark Overlay */}
<div
  className="absolute inset-0"
  style={{
    background: "linear-gradient(0deg, rgba(78, 33, 34, 0.80) 0%, rgba(78, 33, 34, 0.00) 50%, rgba(78, 33, 34, 0.00) 100%)"
  }}
/>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end pb-10 px-6 md:px-16 text-white">
        <h1 className="text-3xl md:text-5xl font-bold mb-3">
          The Best Pizza Near You
        </h1>
        <p className="text-sm md:text-lg max-w-xl text-white/90">
          Discover artisanal crusts, premium toppings, and the city's
          highest-rated pizzerias.
        </p>
      </div>
    </div>
  );
}