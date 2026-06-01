"use client";

import { useState, ReactNode } from "react";
import Image from "next/image";
import {
  FaChevronDown,
  FaEnvelope,
  FaPhoneAlt,
} from "react-icons/fa";
import { useRouter } from "next/navigation";

export default function FAQSection() {
  const router = useRouter();
  return (
    <section className="bg-[#F4F4F4] py-16 px-6 md:px-12 lg:px-20">
      <div className="max-w-[1150px] mx-auto grid lg:grid-cols-[1fr_360px] gap-10">

        {/* LEFT SIDE */}
        <div>

          {/* HEADER */}
          <div className="mb-8">
            <h2 className="text-[28px] font-semibold text-gray-900">
              Frequently Asked Questions
            </h2>

            <p className="text-gray-500 text-sm mt-2">
              Essential knowledge for our editorial partners.
            </p>
          </div>

          {/* FAQ LIST */}
          <div className="space-y-4">
            <FAQItem
              question="How do I verify my editorial credentials?"
              answer="Editorial credentials can be verified through the Secure Partner Portal. Navigate to 'Identity Management' and upload your certified documentation for review by our Trust Board."
            />

            <FAQItem
              question="What are the food safety standards for luxury deliveries?"
              answer="Our protocols require real-time temperature tracking and archival-grade packaging. All partners must adhere to the ISO 22000 standard for high-end culinary logistics."
            />

            <FAQItem
              question="How often are compliance registries updated?"
              answer="The Editorial Trust updates the compliance registry on the first Monday of every quarter. Significant regulatory shifts may trigger mid-cycle updates."
            />
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-6">

          {/* DIRECT ASSISTANCE */}
          <div>
            <h3 className="text-[18px] font-semibold text-gray-900">
              Direct Assistance
            </h3>

            <p className="text-gray-500 text-sm mt-2">
              Our curators are available for high-priority inquiries and dispute resolution.
            </p>

            {/* CONTACT */}
            <div className="mt-6 space-y-4 text-sm">

              <div className="flex items-center gap-3 text-gray-700">
                <FaEnvelope className="text-gray-700" />
                concierge@editorialtrust.sys
              </div>

              <div className="flex items-center gap-3 text-gray-700">
                <FaPhoneAlt className="text-gray-700" />
                +1 (800) TRUST-SYS
              </div>
            </div>

            {/* CTA */}
            <button onClick={()=>router.push('/contact/chat')} className="cursor-pointer mt-6 w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition">
              Start Live Consultation
            </button>
          </div>

          {/* FOUNDER NOTE */}
          <div className="bg-[#1C1C1C] text-white rounded-xl p-5">
            <h4 className="text-sm font-semibold text-white mb-3">
              The Archivist’s Note
            </h4>

            <p className="text-sm text-gray-300 leading-relaxed mb-5">
              "Integrity is the final ingredient in every dish we deliver. This helps center serves as our ledger of transparency."
            </p>

            <div className="flex items-center gap-3">
              <Image
                src="/contact/Founder.png"
                alt="Founder"
                width={40}
                height={40}
                className="rounded-full object-cover"
              />

              <div>
                <p className="text-sm font-medium">Arthur P. Vance</p>
                <p className="text-xs text-gray-400">Chief Trust Officer</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

/*  FAQ ITEM (Accordion) */
type FAQItemProps = {
  question: string;
  answer: string;
};

function FAQItem({ question, answer }: FAQItemProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">

      {/* HEADER */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <p className="text-[14px] font-medium text-gray-800">
          {question}
        </p>

        <FaChevronDown
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      {/* CONTENT */}
      {open && (
        <p className="text-gray-500 text-[13px] mt-3 leading-relaxed">
          {answer}
        </p>
      )}
    </div>
  );
}
