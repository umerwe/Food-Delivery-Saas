"use client";

import { useRef } from "react";
import type { MouseEvent, PointerEvent } from "react";

type DragState = {
  pointerId: number | null;
  startX: number;
  startScrollLeft: number;
  didDrag: boolean;
};

export function useHorizontalDragScroll<T extends HTMLElement>() {
  const railRef = useRef<T | null>(null);
  const dragStateRef = useRef<DragState>({
    pointerId: null,
    startX: 0,
    startScrollLeft: 0,
    didDrag: false,
  });

  const handlePointerDown = (event: PointerEvent<T>) => {
    const rail = railRef.current;

    if (!rail || event.button !== 0) return;

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: rail.scrollLeft,
      didDrag: false,
    };

    rail.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<T>) => {
    const rail = railRef.current;
    const dragState = dragStateRef.current;

    if (!rail || dragState.pointerId !== event.pointerId) return;

    const dragDistance = event.clientX - dragState.startX;

    if (Math.abs(dragDistance) > 4) {
      dragState.didDrag = true;
    }

    rail.scrollLeft = dragState.startScrollLeft - dragDistance;
  };

  const handlePointerEnd = (event: PointerEvent<T>) => {
    const rail = railRef.current;
    const dragState = dragStateRef.current;

    if (!rail || dragState.pointerId !== event.pointerId) return;

    if (rail.hasPointerCapture(event.pointerId)) {
      rail.releasePointerCapture(event.pointerId);
    }

    dragState.pointerId = null;
  };

  const handleClickCapture = (event: MouseEvent<T>) => {
    if (!dragStateRef.current.didDrag) return;

    event.preventDefault();
    event.stopPropagation();
    dragStateRef.current.didDrag = false;
  };

  return {
    railRef,
    dragScrollHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerEnd,
      onPointerCancel: handlePointerEnd,
      onClickCapture: handleClickCapture,
    },
  };
}
