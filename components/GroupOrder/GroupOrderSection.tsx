"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, UsersRound, Utensils, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import GroupOrderModal from "@/components/GroupOrder/GroupOrderModal";

const GROUP_ORDER_CODE_KEY = "groupOrderCode";

export default function GroupOrderSection() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [groupOrderCode, setGroupOrderCode] = useState<string | null>(null);

  const hasActiveGroupOrder = useMemo(() => {
    return Boolean(groupOrderCode && groupOrderCode.trim());
  }, [groupOrderCode]);

  useEffect(() => {
    const syncGroupOrderCode = () => {
      if (typeof window === "undefined") return;

      const storedCode = localStorage.getItem(GROUP_ORDER_CODE_KEY);
      setGroupOrderCode(storedCode);
    };

    syncGroupOrderCode();

    window.addEventListener("storage", syncGroupOrderCode);
    window.addEventListener("focus", syncGroupOrderCode);

    return () => {
      window.removeEventListener("storage", syncGroupOrderCode);
      window.removeEventListener("focus", syncGroupOrderCode);
    };
  }, []);

  const handlePrimaryAction = () => {
    if (hasActiveGroupOrder) {
      router.push("/group-order/lobby");
      return;
    }

    setOpen(true);
  };

  return (
    <section className="relative w-full overflow-hidden bg-white px-4 py-16 sm:px-6 md:px-10 lg:px-24 xl:px-40">
      <GroupOrderModal open={open} onClose={() => setOpen(false)} />

      <div className="absolute left-[-140px] top-[-120px] h-[320px] w-[320px] rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-[-160px] right-[-120px] h-[360px] w-[360px] rounded-full bg-orange-200/30 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_520px]">
        {/* LEFT CONTENT */}
        <div className="max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary">
            <UsersRound size={16} />
            Group dining made simple
          </div>

          <h1 className="text-[40px] font-extrabold leading-[1.05] tracking-[-0.04em] text-gray-950 sm:text-5xl lg:text-6xl">
            Start a{" "}
            <span className="bg-gradient-to-r from-primary to-red-600 bg-clip-text text-transparent">
              Group Order
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-gray-500 sm:text-lg">
            Invite friends, family, or teammates to build one shared order.
            Everyone adds their own meal, and the final checkout stays clean.
          </p>

          <div className="mt-7 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Share2 size={18} />
              </div>
              <p className="text-sm font-semibold text-gray-900">Share Invite</p>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                Send one code to everyone.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Utensils size={18} />
              </div>
              <p className="text-sm font-semibold text-gray-900">Add Meals</p>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                Everyone picks their items.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UsersRound size={18} />
              </div>
              <p className="text-sm font-semibold text-gray-900">Order Together</p>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                Checkout as one group.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePrimaryAction}
            className="mt-8 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-white shadow-[0_14px_30px_rgba(220,38,38,0.22)] transition hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_18px_36px_rgba(220,38,38,0.28)]"
          >
            {hasActiveGroupOrder ? "View Lobby" : "Start Group Order"}
            <ArrowRight size={18} />
          </button>

          {hasActiveGroupOrder ? (
            <p className="mt-3 text-sm text-gray-500">
              Active group order detected. Continue from your lobby.
            </p>
          ) : null}
        </div>

        {/* RIGHT VISUAL */}
        <div className="relative">
          <div className="absolute -left-6 top-8 z-10 hidden rounded-2xl border border-white/60 bg-white/90 px-4 py-3 shadow-xl backdrop-blur md:block">
            <p className="text-xs font-medium text-gray-400">Live Group</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              4 people adding meals
            </p>
          </div>

          <div className="absolute -bottom-5 right-8 z-10 hidden rounded-2xl border border-white/60 bg-white/90 px-4 py-3 shadow-xl backdrop-blur sm:block">
            <p className="text-xs font-medium text-gray-400">Checkout</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              One shared order
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[32px] border border-gray-100 bg-gray-100 shadow-[0_24px_70px_rgba(15,23,42,0.14)]">
            <img
              src="https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=85"
              alt="Friends sharing a meal"
              className="h-[320px] w-full object-cover sm:h-[420px] lg:h-[460px]"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />

            <div className="absolute bottom-5 left-5 right-5 rounded-3xl border border-white/20 bg-white/90 p-4 shadow-lg backdrop-blur-md">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-950">
                    Group Order Experience
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Perfect for office lunches, family dinners, and friends.
                  </p>
                </div>

                <div className="flex -space-x-2">
                  <div className="h-9 w-9 rounded-full border-2 border-white bg-primary/90" />
                  <div className="h-9 w-9 rounded-full border-2 border-white bg-orange-400" />
                  <div className="h-9 w-9 rounded-full border-2 border-white bg-gray-900" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}