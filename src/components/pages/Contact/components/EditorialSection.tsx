"use client";

import Image from "next/image";

export default function EditorialSection() {
  return (
    <section className="bg-[#F4F4F4] py-16 px-6 md:px-12 lg:px-20">
      <div className="max-w-[1150px] mx-auto grid md:grid-cols-2 gap-2 items-center">

        {/* IMAGE LEFT */}
        <div className="relative w-full max-w-[470px] mx-auto md:mx-0">
          <div className="relative w-full h-[420px] rounded-[10px] overflow-hidden ">
            <Image
              src="/contact/Founder-large.png"
              alt="Founder"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* CONTENT RIGHT */}
        <div className="max-w-[820px]">

          <h2 className="text-[32px] md:text-[36px] font-semibold text-gray-900 leading-tight">
            Elevating Delivery to an <br />
            Editorial Standard.
          </h2>

          <p className="text-gray-500 mt-5 text-[15px] leading-relaxed">
            We don't just deliver packages; we manage reputations. Every
            document, every protocol, and every support ticket is handled with
            the precision of a master chef’s garnish.
          </p>

          <button className="mt-6 text-primary font-semibold text-[14px] hover:underline">
            View Our Compliance Philosophy
          </button>

        </div>
      </div>
    </section>
  );
}
