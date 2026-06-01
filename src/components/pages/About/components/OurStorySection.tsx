"use client";

import Image from "next/image";

export default function OurStorySection() {
  return (
    <section className="w-full py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">

        {/* LEFT: Image Card */}
        <div className="relative">
          <div className="relative rounded-xl overflow-hidden">
            <Image
              src="/about/delivery_service.png"
              alt="Delivery Service"
              width={500}
              height={500}
              className="object-cover w-full h-auto"
            />
          </div>

          {/* Floating Badge */}
          <div className="absolute bottom-[30px] right-[10px]">
            <div className="bg-[#FF5A2C] text-white px-6 py-4 rounded-md shadow-lg">
              <span className="text-lg md:text-xl font-semibold">
                Est. 2018
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: Content */}
        <div>
          <p className="text-[#FF5A2C] text-sm font-semibold tracking-wider uppercase">
            Our Story
          </p>

          <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
            Redefining the Home <br className="hidden md:block" />
            Dining Experience.
          </h2>

          <p className="mt-4 text-gray-600 text-sm md:text-base leading-relaxed">
            What started in a small kitchen with a single bike has transformed into
            a culinary network that bridges the gap between the world’s best chefs
            and your dining table. Food Editorial was born from the belief that
            convenience should never compromise quality.
          </p>

          <p className="mt-4 text-gray-600 text-sm md:text-base leading-relaxed">
            We curate every restaurant, vet every driver, and test every route to
            ensure that when your doorbell rings, it’s not just a meal—it’s an
            experience.
          </p>
        </div>
      </div>
    </section>
  );
}
