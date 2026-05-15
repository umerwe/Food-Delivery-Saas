"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AboutBanner() {
    
  return (
    <section className="relative w-full h-[450px] md:h-[550px] overflow-hidden">
      {/* Background Image */}
      <Image
        src="/about/banner.png"
        alt="About Banner"
        fill
        priority
        className="object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-[#333333]/80" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
        
        <h1 className="text-white text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
          About Us
        </h1>

        <p className="text-white/80 mt-4 text-base md:text-lg lg:text-xl max-w-2xl">
          Delivering happiness, one meal at a time.
        </p>

        <Link href="/items"
          className="mt-8 bg-[#FF5A2C] hover:bg-[#e14e25] text-white px-8 py-3 text-base md:text-lg rounded-md"
        >
          Order Now
        </Link>
      </div>
    </section>
  );
}