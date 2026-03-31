import React, { Suspense } from "react";
import OrderStatusPage from "./OrderStatusPage";

const Page = () => {
  return (
    <div>
      <Suspense fallback={<Loading />}>
       <OrderStatusPage />
      </Suspense>
    </div>
  );
};

export default Page;

/* 🔥 CLEAN LOADING COMPONENT */
function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-gray-400 text-sm">Loading orders page...</div>
    </div>
  );
}