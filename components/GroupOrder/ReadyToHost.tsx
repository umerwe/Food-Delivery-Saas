"use client";

import Link from "next/link";

export default function ReadyToHost() {
  return (
    <section className="w-full bg-[#f4f4f4] px-6 md:px-40 py-16 pb-30">
      <div className="mx-auto">
        
        {/* CTA CARD */}
        <div className="relative rounded-[32px] px-6 md:px-16 py-14 text-center overflow-hidden bg-[#2F3131]">
          
          {/* 🔴 ORANGE GLOW (TOP RIGHT) */}
          <div className="absolute w-64 h-64 right-[-80px] top-[-40px] bg-primary/20 rounded-full blur-3xl pointer-events-none" />

          {/* 🔵 BLUE GLOW (LEFT MID) */}
          <div className="absolute w-64 h-64 left-[-40px] top-[120px] bg-sky-700/10 rounded-full blur-[60px] pointer-events-none" />

          {/* OPTIONAL: subtle inner gradient (keeps depth) */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

          {/* CONTENT */}
          <div className="relative z-10 max-w-2xl mx-auto">
            
            {/* TITLE */}
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Ready to host your feast?
            </h2>

            {/* SUBTEXT */}
            <p className="mt-4 text-gray-300 text-sm md:text-base leading-relaxed">
              Gather your colleagues for the perfect lunch or sync up with friends
              for a movie night spread.
            </p>

            {/* BUTTONS */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              
              {/* PRIMARY BUTTON */}
              <Link href="/group-order/invite" className="px-8 py-3 bg-primary text-white rounded-full font-semibold shadow-lg hover:opacity-90 transition">
                Get Started Now
              </Link>

              {/* SECONDARY BUTTON (GLASS EFFECT) */}
              <button className="px-8 py-3 rounded-full font-semibold text-white bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition">
                Learn More
              </button>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
}