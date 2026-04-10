"use client";

import { Users, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function InviteSection({ order }: any) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const link = `${window.location.origin}/categories?code=${order?.inviteCode}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#FDF7F4] rounded-2xl p-6 text-center border border-orange-100 shadow-md hover:shadow-lg transition duration-300">

      <div className="w-14 h-14 mx-auto rounded-full bg-white flex items-center justify-center shadow-md border border-gray-100">
        <Users className="w-5 h-5 text-orange-500" strokeWidth={2.5} />
      </div>

      <h3 className="mt-4 font-semibold text-gray-900 text-lg">
        Waiting for more friends?
      </h3>

      <p className="text-sm text-gray-500 mt-1">
        Send this link to anyone you want to join the feast.
      </p>

      <center>
        <div className="max-w-xl mt-5 flex items-center bg-white rounded-full px-4 py-2 justify-between text-sm border border-gray-200 shadow-sm">

          <span className="text-gray-500 truncate pr-3">
            {order?.inviteCode ? `${window.location.origin}/categories?code=${order?.inviteCode}` : "Generating..."}
          </span>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-orange-500 font-medium hover:opacity-80 transition"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>

        </div>
      </center>
    </div>
  );
}