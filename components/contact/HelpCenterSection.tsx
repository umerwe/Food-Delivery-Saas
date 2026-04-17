"use client";

import { ReactNode } from "react";
import {
  FaFingerprint,
  FaTruck,
  FaUniversity,
  FaGavel,
} from "react-icons/fa";

export default function HelpCenterSection() {
  return (
    <section className="bg-[#F4F4F4] py-16 px-6 md:px-12 lg:px-20">
      <div className="max-w-[1150px] mx-auto">

        {/* HEADER */}
        <div className="mb-12 max-w-[600px]">
          <h1 className="text-[40px] font-semibold text-gray-900 leading-tight">
            The Help Center.
          </h1>

          <p className="text-gray-500 mt-3 text-[15px] leading-relaxed">
            Navigating the intricacies of culinary governance and editorial standards
            with ease and transparency.
          </p>
        </div>

        {/* CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          <HelpCard
            icon={<FaFingerprint />}
            title="ACCOUNT MANAGEMENT"
            description="Security protocols, profile authentication, and editorial credentials."
          />

          <HelpCard
            icon={<FaTruck />}
            title="DELIVERY PROTOCOLS"
            description="Logistics standards, temperature integrity, and carrier compliance."
          />

          <HelpCard
            icon={<FaUniversity />}
            title="PAYMENT & BILLING"
            description="Invoicing cycles, secure transactions, and financial reconciliation."
          />

          <HelpCard
            icon={<FaGavel />}
            title="LEGAL & COMPLIANCE"
            description="Regulatory updates, privacy terms, and trust framework."
          />

        </div>
      </div>
    </section>
  );
}

/* 🔥 REUSABLE CARD */
type HelpCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
};

function HelpCard({ icon, title, description }: HelpCardProps) {
  return (
    <div className="bg-white rounded-[14px] p-6 shadow-sm hover:shadow-md transition duration-300 border border-gray-100">

      {/* ICON */}
      <div className="text-primary text-[18px] mb-4">
        {icon}
      </div>

      {/* TITLE */}
      <h3 className="text-[13px] font-semibold text-gray-900 tracking-wide mb-3">
        {title}
      </h3>

      {/* DESCRIPTION */}
      <p className="text-gray-500 text-[13px] leading-relaxed mb-6">
        {description}
      </p>

      {/* CTA */}
      <button className="text-primary text-[12px] font-semibold tracking-wide flex items-center gap-1 hover:gap-2 transition-all">
        EXPLORE →
      </button>
    </div>
  );
}