import { Suspense } from "react";
import WriteReview from "@/components/pages/Order/components/WriteReview";

export function OrderWriteReviewPage() {
  return (
    <div>
      <Suspense fallback={<Loading />}>
       <WriteReview />
      </Suspense>
    </div>
  );
}

/*  CLEAN LOADING COMPONENT */
function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-gray-400 text-sm">Loading reviews page...</div>
    </div>
  );
}
