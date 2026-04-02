"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Apple, Play } from "lucide-react";

export default function CTASection() {
  return (
    <section className="w-full py-16 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* TOP CTA CARD */}
        <div className="bg-gradient-to-r from-[#E94E2F] to-[#FF5A2C] rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-10">
          
          {/* LEFT CONTENT */}
          <div className="text-white max-w-lg">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.2]">
              Great food,
              <br />
              delivered to your
              <br />
              door
            </h2>

            <p className="mt-4 text-sm md:text-base text-white/80 leading-relaxed">
              Download our app for the fastest experience and exclusive daily deals.
            </p>

            {/* Buttons */}
            <div className="mt-6 flex gap-3 flex-wrap">
              <Button className="h-12 bg-black text-white hover:bg-black/80 flex items-center gap-2 px-5">
                <Apple className="w-4 h-4" />
                <span className="text-sm">App Store</span>
              </Button>

              <Button className="h-12 bg-black text-white hover:bg-black/80 flex items-center gap-2 px-5">
                <Play className="w-4 h-4" />
                <span className="text-sm">Google Play</span>
              </Button>
            </div>
          </div>

          {/* RIGHT PHONE MOCK (ENHANCED) */}
          <div className="bg-[#2b2b2b] rounded-2xl p-8 md:p-10 shadow-2xl flex items-center justify-center">
            <div className="relative w-[180px] h-[340px] md:w-[220px] md:h-[420px]">
              <Image
                src="/about/phone.png"
                alt="App Preview"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>

        {/* SUBSCRIBE SECTION */}
        <div className="mt-16 text-center">
          <h3 className="text-xl md:text-2xl font-semibold text-gray-900">
            Subscribe and get 25% off
          </h3>

          <p className="text-sm text-gray-500 mt-2">
            Join our mailing list for curated weekly menus and secret discount codes.
          </p>

          {/* Input + Button (FIXED HEIGHT + ALIGNMENT) */}
          <div className="mt-6 flex flex-col md:flex-row gap-3 justify-center items-center max-w-2xl mx-auto">
            
            <Input
              placeholder="Enter your email address"
              className="h-12 w-full bg-[#f9f9f9] border border-gray-200 focus-visible:ring-0 focus-visible:border-[#FF5A2C]"
            />

            <Button className="h-12 bg-[#FF5A2C] hover:bg-[#e14e25] text-white px-8 whitespace-nowrap">
              Subscribe
            </Button>
          </div>
        </div>

      </div>
    </section>
  );
}