"use client";

import Image from "next/image";
import { FaStar } from "react-icons/fa";

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: "Lisa Vandermeer",
      role: "Loyal Customer",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200",
      text: "The only app that delivers food that actually looks like the pictures. Absolute perfection every time.",
      highlighted: false,
    },
    {
      name: "David Chen",
      role: "Food Critic",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200",
      text: "Lightning fast delivery. I don’t know how they do it, but my pasta is always steaming hot.",
      highlighted: true,
    },
    {
      name: "Mia Roberts",
      role: "Local Guide",
      image:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200",
      text: "Sustainability and quality all in one. The packaging is eco-friendly and the taste is 5-star.",
      highlighted: false,
    },
  ];

  return (
    <section className="w-full bg-[#f5f5f5] py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Heading */}
        <h2 className="text-center text-2xl md:text-3xl font-semibold text-gray-900">
          What Our Users Say
        </h2>

        {/* Cards */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {testimonials.map((item, index) => (
            <div
              key={index}
              className={`rounded-xl p-6 bg-white ${
                item.highlighted
                  ? "border border-[#EC58345A]"
                  : "border border-transparent"
              }`}
            >
              {/* Stars */}
              <div className="flex gap-1 text-[#FF5A2C]">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} size={14} />
                ))}
              </div>

              {/* Text */}
              <p className="mt-4 text-sm text-gray-600 leading-relaxed">
                "{item.text}"
              </p>

              {/* User */}
              <div className="mt-6 flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover object-top"
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}