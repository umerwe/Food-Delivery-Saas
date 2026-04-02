import ChatUI from "@/components/contact/LiveChat";
import React, { Suspense } from "react";

const Page = () => {
  return (
    <div>
      <Suspense fallback={<p>Loading chat...</p>}>
        <ChatUI />
      </Suspense>
    </div>
  );
};

export default Page;