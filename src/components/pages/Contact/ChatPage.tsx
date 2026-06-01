import ChatUI from "@/components/pages/Contact/components/LiveChat";
import { Suspense } from "react";

export function ChatPage() {
  return (
    <div>
      <Suspense fallback={<p>Loading chat...</p>}>
        <ChatUI />
      </Suspense>
    </div>
  );
}
