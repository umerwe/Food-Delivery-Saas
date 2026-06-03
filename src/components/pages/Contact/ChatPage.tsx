"use client";

import ChatUI from "@/components/pages/Contact/components/LiveChat";
import { useTranslations } from "next-intl";
import { Suspense } from "react";

export function ChatPage() {
  const t = useTranslations("contact.chat");

  return (
    <div>
      <Suspense fallback={<p>{t("loadingChat")}</p>}>
        <ChatUI />
      </Suspense>
    </div>
  );
}
