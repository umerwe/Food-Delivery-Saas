"use client";

import React from "react";
import {
  ShieldCheck,
  Ban,
  Cloud,
  CreditCard,
  BarChart,
} from "lucide-react";

const Page = () => {
  return (
    <div className="min-h-screen py-12 px-6 md:px-12 lg:px-20">
      <div className="md:px-28 mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
        
        {/* LEFT CONTENT */}
        <div>
          {/* Header */}
          <h1 className="text-[32px] md:text-[36px] font-semibold text-gray-900">
            Privacy Policy
          </h1>

          <p className="text-sm text-gray-400 mt-2">
            Last Updated: October 24, 2023
          </p>

          {/* At a Glance */}
          <div className="mt-8">
            <h2 className="text-[#E74C3C] font-semibold text-[14px] mb-3">
              At a Glance
            </h2>

            <p className="text-[14px] text-gray-600 mb-4 max-w-[600px]">
              We prioritize your privacy by design. Our commitment is to be
              transparent about how we collect, use, and protect your data.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <ShieldCheck size={18} className="text-gray-700 mt-[2px]" />
                <div>
                  <p className="font-medium text-sm text-gray-900">
                    Data Security
                  </p>
                  <p className="text-sm text-gray-600">
                    Bank-grade encryption for all storage.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Ban size={18} className="text-gray-700 mt-[2px]" />
                <div>
                  <p className="font-medium text-sm text-gray-900">
                    No Sale of Data
                  </p>
                  <p className="text-sm text-gray-600">
                    We never sell your personal info to third parties.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 1 */}
          <div className="mt-10">
            <h2 className="text-[#E74C3C] font-semibold text-[14px] mb-3">
              1. Data Collection
            </h2>

            <p className="text-[14px] text-gray-600 mb-4">
              We collect information you provide directly to us when you create
              an account, update your profile, or request customer support.
              This information may include:
            </p>

            <div className="mb-3">
              <p className="font-medium text-sm text-gray-900">
                Identity Data
              </p>
              <p className="text-sm text-gray-600">
                Name, username, or similar identifier.
              </p>
            </div>

            <div className="mb-4">
              <p className="font-medium text-sm text-gray-900">
                Contact Data
              </p>
              <p className="text-sm text-gray-600">
                Email address and telephone numbers.
              </p>
            </div>

            <p className="text-sm text-gray-600">
              We also automatically collect technical data such as your IP
              address, browser type, and operating system to improve our
              service delivery and security protocols.
            </p>
          </div>

          {/* SECTION 2 */}
          <div className="mt-10">
            <h2 className="text-[#E74C3C] font-semibold text-[14px] mb-3">
              2. Cookies & Tracking
            </h2>

            <p className="text-sm text-gray-600 mb-4">
              Our website uses cookies to distinguish you from other users.
              This helps us to provide you with a good experience when you
              browse our website and also allows us to improve our site.
            </p>

            {/* Highlight Box */}
            <div className="border-l-4 border-[#E74C3C] bg-gray-50 p-4 text-sm text-gray-600 mb-4">
              “Cookies are small text files that are placed on your computer by
              websites that you visit. They are widely used in order to make
              websites work </div></div></div></div></div>

                );
};

export default Page;