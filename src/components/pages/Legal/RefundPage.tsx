"use client";

import { UploadCloud, Lock } from "lucide-react";

const RefundPage = () => {
  return (
    <div className="min-h-screen py-12 px-6 md:px-12 lg:px-20">
      <div className="md:px-27 mx-auto">

        {/* HEADER */}
        <h1 className="text-[32px] md:text-[36px] font-semibold text-gray-900">
          Refund Request
        </h1>

        <p className="text-gray-600 text-sm mt-2 max-w-[600px]">
          The Editorial Trust ensures that every culinary experience meets our rigorous
          standards. If your order fell short, please document the discrepancy below
          for our reconciliation team.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-xs font-semibold tracking-wide text-gray-400 uppercase mb-2">
              Review Timeline
            </h3>
            <p className="text-sm text-gray-600">
              Requests are processed within 24–48 hours. You will receive an electronic
              notice once the credit has been issued to your original payment method.
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-xs font-semibold tracking-wide text-gray-400 uppercase mb-2">
              Evidence Required
            </h3>
            <p className="text-sm text-gray-600">
              For quality or accuracy claims, high-resolution photographic evidence is
              mandatory to facilitate the investigation with our courier partners.
            </p>
          </div>

        </div>

        {/* FORM */}
        <div className="mt-10 space-y-6">

          {/* ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div>
              <label className="text-xs uppercase tracking-wide text-gray-400">
                Order Number
              </label>
              <input
                placeholder="e.g. #ET-88291"
                className="w-full mt-2 bg-gray-100 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-gray-400">
                Date of Order
              </label>
              <input
                placeholder="mm/dd/yyyy"
                className="w-full mt-2 bg-gray-100 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

          </div>

          {/* REASON */}
          <div>
            <label className="text-xs uppercase tracking-wide text-gray-400">
              Reason for Refund
            </label>
            <select className="w-full mt-2 bg-gray-100 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500">
              <option>Select a reason</option>
              <option>Wrong item</option>
              <option>Quality issue</option>
              <option>Missing items</option>
            </select>
          </div>

          {/* UPLOAD */}
          <div>
            <label className="text-xs uppercase tracking-wide text-gray-400">
              Upload Evidence
            </label>

            <div className="mt-2 bg-gray-100 rounded-xl h-[150px] flex flex-col items-center justify-center text-gray-500 text-sm border border-dashed border-gray-300">
              <UploadCloud size={28} className="mb-2 text-gray-400" />
              Drag and drop photos or{" "}
              <span className="text-gray-700 underline cursor-pointer ml-1">
                browse
              </span>
            </div>
          </div>

          {/* MESSAGE */}
          <div>
            <label className="text-xs uppercase tracking-wide text-gray-400">
              Message/Explanation
            </label>

            <textarea
              placeholder="Please provide specific details regarding the issue..."
              className="w-full mt-2 bg-gray-100 rounded-xl px-4 py-3 text-sm h-32 resize-none outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* SUBMIT */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Lock size={14} />
              Secure Submission Protocol
            </div>

            <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full text-sm font-medium transition">
              Submit Request
            </button>
          </div>

        </div>

        {/* BOTTOM SECTION */}
        <div className="mt-14">
          <h3 className="font-semibold text-gray-900 mb-6">
            The Editorial Trust Protocol
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            <div>
              <p className="text-orange-300 text-2xl font-semibold mb-2">01.</p>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                Verification
              </p>
              <p className="text-sm text-gray-600">
                Our system cross-references GPS logs, kitchen timestamps, and your
                provided documentation.
              </p>
            </div>

            <div>
              <p className="text-orange-300 text-2xl font-semibold mb-2">02.</p>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                Adjudication
              </p>
              <p className="text-sm text-gray-600">
                A member of our quality control trust reviews cases that do not
                meet automated approval thresholds.
              </p>
            </div>

            <div>
              <p className="text-orange-300 text-2xl font-semibold mb-2">03.</p>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                Reimbursement
              </p>
              <p className="text-sm text-gray-600">
                Credits are issued as either Editorial Points for immediate use
                or returned to your banking institution.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export { RefundPage };
