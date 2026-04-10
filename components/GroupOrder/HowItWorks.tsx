"use client";

import { Share2, Users, ShoppingBag } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      icon: Share2,
      title: "Share the link",
      description:
        "Invite friends to join via SMS or messaging apps. Anyone with the link can join your curated session instantly.",
    },
    {
      icon: Users,
      title: "Everyone picks",
      description:
        "Members add their own favorite items to the cart. Real-time updates let you see exactly who's picked what.",
    },
    {
      icon: ShoppingBag,
      title: "Single Checkout",
      description:
        "Review the total list and order everything at once. One payment, one delivery, zero coordination stress.",
    },
  ];

  return (
    <section className="w-full bg-[#f4f4f4] py-20 px-6 md:px-40">
      <div className="mx-auto">
        
        {/* HEADER */}
        <div className="mb-12">
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">
            The Process
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
            How it works
          </h2>
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition"
              >
                {/* ICON */}
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-100 mb-6">
                  <Icon className="w-5 h-5 text-primary" />
                </div>

                {/* TITLE */}
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>

                {/* DESCRIPTION */}
                <p className="text-gray-500 leading-relaxed text-sm">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}