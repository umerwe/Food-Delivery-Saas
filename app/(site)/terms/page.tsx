"use client";

import React from "react";
import { ShieldCheck, FileWarning } from "lucide-react";

const Page = () => {
  return (
    <div className="bg-[#F7F7F7] min-h-screen py-12 px-6 md:px-12 lg:px-45">

      <div className="max-w-[1000px]">

        {/* Header */}
        <h1 className="text-[32px] md:text-[36px] font-semibold text-gray-900">
          Terms & Conditions
        </h1>

        <p className="mt-3 text-gray-600 text-[15px] leading-relaxed max-w-[700px]">
          Please read these terms carefully. By accessing our services, you agree
          to be bound by the architectural precision of our legal framework.
        </p>

        {/* SECTION 01 */}
        <div className="mt-10">
          <h2 className="text-[#E74C3C] font-semibold text-[14px] mb-3">
            01. Introduction
          </h2>

          <p className="text-[14px] text-gray-600 leading-relaxed mb-3">
            Welcome to our platform. These Terms and Conditions govern your use
            of our website and services. By using our service, you accept these
            terms in full. If you disagree with these terms or any part of these
            terms, you must not use our service.
          </p>

          <p className="text-[14px] text-gray-600 leading-relaxed">
            Our services are designed with intentional clarity to ensure your
            legal rights are protected while maintaining operational excellence.
          </p>
        </div>

        {/* SECTION 02 */}
        <div className="mt-10">
          <h2 className="text-[#E74C3C] font-semibold text-[14px] mb-4">
            02. Use of Service
          </h2>

          <h3 className="font-semibold text-[14px] text-gray-900 mb-1">
            Acceptable Use
          </h3>
          <p className="text-[14px] text-gray-600 mb-4">
            You must not use this website in any way that causes, or may cause,
            damage to the website or impairment of the availability or
            accessibility of the service.
          </p>

          <h3 className="font-semibold text-[14px] text-gray-900 mb-1">
            Restricted Access
          </h3>
          <p className="text-[14px] text-gray-600">
            Access to certain areas of this website is restricted. We reserve the
            right to restrict access to other areas of this website, or indeed
            our whole website, at our discretion.
          </p>
        </div>

        {/* SECTION 03 */}
        <div className="mt-10">
          <h2 className="text-[#E74C3C] font-semibold text-[14px] mb-4">
            03. Limitation of Liability
          </h2>

          <div className="flex items-start gap-3 mb-4">
            <FileWarning size={18} className="text-gray-700 mt-[2px]" />
            <div>
              <h3 className="font-semibold text-[14px] text-gray-900">
                No Warranties
              </h3>
              <p className="text-[14px] text-gray-600">
                This website is provided “as is” without any representations or
                warranties, express or implied. We make no representations in
                relation to this website or the information and materials
                provided.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="text-gray-700 mt-[2px]" />
            <div>
              <h3 className="font-semibold text-[14px] text-gray-900">
                Indemnity
              </h3>
              <p className="text-[14px] text-gray-600">
                You hereby indemnify us and undertake to keep us indemnified
                against any losses, damages, costs, liabilities and expenses
                incurred or suffered by us arising out of any breach by you.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 04 */}
        <div className="mt-10">
          <h2 className="text-[#E74C3C] font-semibold text-[14px] mb-4">
            04. Dispute Resolution
          </h2>

          <h3 className="font-semibold text-[14px] text-gray-900 mb-1">
            Informal Negotiation
          </h3>
          <p className="text-[14px] text-gray-600 mb-4">
            Parties shall first attempt to resolve any dispute informally for at
            least 30 days before initiating arbitration.
          </p>

          <h3 className="font-semibold text-[14px] text-gray-900 mb-1">
            Binding Arbitration
          </h3>
          <p className="text-[14px] text-gray-600">
            If informal talks fail, disputes will be resolved through final and
            binding arbitration under the rules of the local jurisdiction.
          </p>
        </div>

      </div>
    </div>
  );
};

export default Page;