"use client";

import { Users, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { buildGroupOrderInviteLink } from "@/lib/group-order";
import type { GroupOrder } from "@/types/group-order";

type InviteSectionProps = {
  order: GroupOrder;
};

export default function InviteSection({ order }: InviteSectionProps) {
  const t = useTranslations("groupOrder.lobby.invite");
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const handleCopy = async () => {
    const link = buildGroupOrderInviteLink({ origin: window.location.origin, inviteCode: order?.inviteCode });
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success(t("linkCopied"));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = async () => {
    if (!order?.inviteCode) return;

    await navigator.clipboard.writeText(String(order.inviteCode));
    setCodeCopied(true);
    toast.success(t("codeCopied"));
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <div className="bg-[#FDF7F4] rounded-2xl p-6 text-center border border-orange-100 shadow-md hover:shadow-lg transition duration-300">

      <div className="w-14 h-14 mx-auto rounded-full bg-white flex items-center justify-center shadow-md border border-gray-100">
        <Users className="w-5 h-5 text-orange-500" strokeWidth={2.5} />
      </div>

      <h3 className="mt-4 font-semibold text-gray-900 text-lg">
        {t("title")}
      </h3>

      <p className="text-sm text-gray-500 mt-1">
        {t("description")}
      </p>

      <center>
        <div className="max-w-xl mt-5 flex items-center bg-white rounded-full px-4 py-2 justify-between text-sm border border-gray-200 shadow-sm">

          <span className="text-gray-500 truncate pr-3">
            {order?.inviteCode ? buildGroupOrderInviteLink({ origin: window.location.origin, inviteCode: order?.inviteCode }) : t("generating")}
          </span>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-orange-500 font-medium hover:opacity-80 transition"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                {t("copied")}
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                {t("copy")}
              </>
            )}
          </button>

        </div>
        {order?.inviteCode ? (
          <div className="mt-3 flex flex-col items-center justify-center gap-2 sm:flex-row">
            <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold tracking-[0.18em] text-gray-800 shadow-sm">
              {order.inviteCode}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-500 transition hover:bg-orange-50"
            >
              {codeCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {codeCopied ? t("copied") : t("copyCode")}
            </button>
          </div>
        ) : null}
      </center>
    </div>
  );
}
