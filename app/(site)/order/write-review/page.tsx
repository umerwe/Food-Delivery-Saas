import React, { Suspense } from "react";
import WriteReview from "./WriteReview";

const Page = () => {
  return (
    <div>
      <Suspense fallback={<Loading />}>
       <WriteReview />
      </Suspense>
    </div>
  );
};

export default Page;

/* 🔥 CLEAN LOADING COMPONENT */
function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-gray-400 text-sm">Loading reviews page...</div>
    </div>
  );
}