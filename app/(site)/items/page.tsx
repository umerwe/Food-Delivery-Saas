import React, { Suspense } from "react";
import ItemsPage from "./ItemsPage";

const page = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-500">
          Loading items...
        </div>
      }
    >
      <ItemsPage />
    </Suspense>
  );
};

export default page;