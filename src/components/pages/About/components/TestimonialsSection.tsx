"use client";

import Image from "next/image";
import { FaStar } from "react-icons/fa";
import { useTranslations } from "next-intl";
import type { AboutTestimonial } from "@/services/public-content";

type TestimonialsSectionProps = {
  testimonials?: AboutTestimonial[];
};

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "DW";

export default function TestimonialsSection({ testimonials: dynamicTestimonials }: TestimonialsSectionProps) {
  const t = useTranslations("about.testimonials");

  const fallbackTestimonials = [
    {
      name: "Lisa Vandermeer",
      role: t("loyalCustomer"),
      imageUrl:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200",
      quote: t("lisaText"),
      rating: 5,
    },
    {
      name: "David Chen",
      role: t("foodCritic"),
      imageUrl:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200",
      quote: t("davidText"),
      rating: 5,
    },
    {
      name: "Mia Roberts",
      role: t("localGuide"),
      imageUrl:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200",
      quote: t("miaText"),
      rating: 5,
    },
  ];
  const testimonials = dynamicTestimonials?.length ? dynamicTestimonials : fallbackTestimonials;

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
                index === 1
                  ? "border border-[#EC58345A]"
                  : "border border-transparent"
              }`}
            >
              {/* Stars */}
              <div className="flex gap-1 text-[#FF5A2C]">
                {[...Array(Math.max(0, Math.min(5, item.rating)))].map((_, i) => (
                  <FaStar key={i} size={14} />
                ))}
              </div>

              {/* Text */}
              <p className="mt-4 text-sm text-gray-600 leading-relaxed">
                {t("quote", { text: item.quote })}
              </p>

              {/* User */}
              <div className="mt-6 flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#FF5A2C]/10">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover object-top"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[#FF5A2C]">
                      {getInitials(item.name)}
                    </div>
                  )}
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
