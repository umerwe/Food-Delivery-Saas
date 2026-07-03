"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useHorizontalDragScroll } from "@/components/pages/Checkout/hooks/use-horizontal-drag-scroll";

type ScheduleRailProps = {
  children: ReactNode;
  ariaLabel: string;
  className?: string;
};

const railClass =
  "flex snap-x scroll-px-14 gap-3 overflow-x-auto scroll-smooth px-14 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

const arrowButtonClass =
  "absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/95 text-gray-700 shadow-[0_10px_24px_rgba(17,24,39,0.14)] ring-1 ring-gray-900/5 backdrop-blur transition-all duration-200 hover:-translate-y-[calc(50%+1px)] hover:text-primary hover:shadow-[0_14px_30px_rgba(17,24,39,0.18)] disabled:pointer-events-none disabled:opacity-0";

export function ScheduleRail({
  children,
  ariaLabel,
  className = "",
}: ScheduleRailProps) {
  const {
    railRef,
    dragScrollHandlers,
    canScrollLeft,
    canScrollRight,
    scrollByPage,
    updateScrollState,
  } = useHorizontalDragScroll<HTMLDivElement>();

  useEffect(() => {
    const frameId = window.requestAnimationFrame(updateScrollState);

    return () => window.cancelAnimationFrame(frameId);
  }, [children, updateScrollState]);

  return (
    <div className={`relative -mx-2 ${className}`}>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-12 bg-gradient-to-r from-white via-white/85 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-12 bg-gradient-to-l from-white via-white/85 to-transparent" />
      <button
        type="button"
        aria-label={`${ariaLabel} previous`}
        disabled={!canScrollLeft}
        onClick={() => scrollByPage("left")}
        className={`${arrowButtonClass} left-2`}
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </button>
      <div
        ref={railRef}
        className={`${railClass} cursor-grab select-none touch-pan-y active:cursor-grabbing`}
        {...dragScrollHandlers}
      >
        {children}
      </div>
      <button
        type="button"
        aria-label={`${ariaLabel} next`}
        disabled={!canScrollRight}
        onClick={() => scrollByPage("right")}
        className={`${arrowButtonClass} right-2`}
      >
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
