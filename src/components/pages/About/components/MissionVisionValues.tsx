"use client";

import { Rocket, Eye, Heart } from "lucide-react";

export default function MissionVisionValues() {

    const items = [
  {
    title: "Our Mission",
    description:
      "To deliver fast, fresh, and affordable culinary delights to every doorstep without the environmental footprint.",
    icon: Rocket,
    bg: "bg-[#FFD6CC]", // brighter orange tint
    iconColor: "text-[#FF5A2C]",
  },
  {
    title: "Our Vision",
    description:
      "To become the world’s most loved delivery service, recognized for our taste and logistical precision.",
    icon: Eye,
    bg: "bg-[#D4EEF5]", // brighter blue tint
    iconColor: "text-[#3AA6B9]",
  },
  {
    title: "Our Values",
    description:
      "Quality above all, speed as a standard, and putting the customer at the heart of every decision we make.",
    icon: Heart,
    bg: "bg-[#FFD6CC]", // same as mission (consistent)
    iconColor: "text-[#FF5A2C]",
  },
];

  return (
    <section className="w-full bg-[#f5f5f5] py-16 md:py-20">
      <div className="mx-auto px-4 md:px-30 grid md:grid-cols-3 gap-6">

        {items.map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
            >
              {/* Icon Box */}
              <div
                className={`w-12 h-12 flex items-center justify-center rounded-lg ${item.bg}`}
              >
                <Icon className={`w-5 h-5 ${item.iconColor}`} />
              </div>

              {/* Title */}
              <h3 className="mt-5 text-lg font-semibold text-gray-900">
                {item.title}
              </h3>

              {/* Description */}
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
