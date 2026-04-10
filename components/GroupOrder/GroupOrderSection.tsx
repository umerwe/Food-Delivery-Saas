"use client";

import Image from "next/image";
import { useState } from "react";
import GroupOrderModal from "@/components/GroupOrder/GroupOrderModal";

export default function GroupOrderSection() {

  const [open, setOpen] = useState(false);

  return (
    <section className="w-full py-20 px-6 md:px-40">

      <GroupOrderModal open={open} onClose={() => setOpen(false)} />

      <div className="mx-auto flex flex-col md:flex-row items-center justify-between gap-10">

        <div className="max-w-lg">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Start a <span className="text-primary">Group Order</span>
          </h1>

          <p className="mt-6 text-gray-500 text-lg">
            Coordinate a shared meal effortlessly.
          </p>

          <button
            onClick={() => setOpen(true)}
            className="mt-8 inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full shadow-md hover:shadow-lg transition"
          >
            Start Group Order →
          </button>
        </div>

        <div className="w-full md:w-[420px]">
          <div className="relative w-full h-[300px] rounded-2xl overflow-hidden shadow-xl">
            <Image
              src="/group-order/meal.png"
              alt="Group Order"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

      </div>
    </section>
  );
}