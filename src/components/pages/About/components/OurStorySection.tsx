"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

export default function OurStorySection() {
  const t = useTranslations("about.story");

  return (
    <section className="w-full py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">

        {/* LEFT: Image Card */}
        <div className="relative">
          <div className="relative rounded-xl overflow-hidden">
            <Image
              src="/about/delivery_service.png"
              alt={t("imageAlt")}
              width={500}
              height={500}
              className="object-cover w-full h-auto"
            />
          </div>

          {/* Floating Badge */}
          <div className="absolute bottom-[30px] right-[10px]">
            <div className="bg-[#FF5A2C] text-white px-6 py-4 rounded-md shadow-lg">
            <span className="text-lg md:text-xl font-semibold">
                {t("established")}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: Content */}
        <div>
          <p className="text-[#FF5A2C] text-sm font-semibold tracking-wider uppercase">
            {t("eyebrow")}
          </p>

          <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
            {t("titleLineOne")} <br className="hidden md:block" />
            {t("titleLineTwo")}
          </h2>

          <p className="mt-4 text-gray-600 text-sm md:text-base leading-relaxed">
            {t("paragraphOne")}
          </p>

          <p className="mt-4 text-gray-600 text-sm md:text-base leading-relaxed">
            {t("paragraphTwo")}
          </p>
        </div>
      </div>
    </section>
  );
}
