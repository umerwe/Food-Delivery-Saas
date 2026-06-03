"use client";

import Image from "next/image";
import { FaStar } from "react-icons/fa";
import { useTranslations } from "next-intl";

export default function TestimonialsSection() {
  const t = useTranslations("about.testimonials");

  const testimonials = [
    {
      name: "Lisa Vandermeer",
      role: t("loyalCustomer"),
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200",
      text: t("lisaText"),
      highlighted: false,
    },
    {
      name: "David Chen",
      role: t("foodCritic"),
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200",
      text: t("davidText"),
      highlighted: true,
    },
    {
      name: "Mia Roberts",
      role: t("localGuide"),
      image:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200",
      text: t("miaText"),
      highlighted: false,
    },
  ];

  return (
    <section className="w-full bg-[#f5f5f5] py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-4">

        {/* Heading */}
        <h2 className="text-center text-2xl md:text-3xl font-semibold text-gray-900">
          {t("title")}
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
                {t("quote", { text: item.text })}
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
