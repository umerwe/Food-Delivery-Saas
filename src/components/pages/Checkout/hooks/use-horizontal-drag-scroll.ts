"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent, PointerEvent as ReactPointerEvent } from "react";

type DragState = {
  pointerId: number | null;
  startX: number;
  startScrollLeft: number;
  didDrag: boolean;
  isDragging: boolean;
  previousBodyUserSelect: string;
};

type ScrollDirection = "left" | "right";

export function useHorizontalDragScroll<T extends HTMLElement>() {
  const railRef = useRef<T | null>(null);
  const dragStateRef = useRef<DragState>({
    pointerId: null,
    startX: 0,
    startScrollLeft: 0,
    didDrag: false,
    isDragging: false,
    previousBodyUserSelect: "",
  });
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const cleanupWindowListenersRef = useRef<() => void>(() => {});

  const updateScrollState = useCallback(() => {
    const rail = railRef.current;

    if (!rail) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const maxScrollLeft = rail.scrollWidth - rail.clientWidth;

    setCanScrollLeft(rail.scrollLeft > 1);
    setCanScrollRight(rail.scrollLeft < maxScrollLeft - 1);
  }, []);

  const restoreBodySelection = useCallback(() => {
    if (document.body.style.userSelect === "none") {
      document.body.style.userSelect =
        dragStateRef.current.previousBodyUserSelect;
    }
  }, []);

  const capturePointer = useCallback((pointerId: number) => {
    const rail = railRef.current;

    if (!rail || rail.hasPointerCapture(pointerId)) return;

    try {
      rail.setPointerCapture(pointerId);
    } catch {
      // Pointer capture can fail if the browser has already released the pointer.
    }
  }, []);

  const releasePointer = useCallback((pointerId: number) => {
    const rail = railRef.current;

    if (!rail || !rail.hasPointerCapture(pointerId)) return;

    try {
      rail.releasePointerCapture(pointerId);
    } catch {
      // Ignore late pointer-release races.
    }
  }, []);

  const handlePointerMove = useCallback(
    (event: Pick<PointerEvent, "clientX" | "pointerId" | "preventDefault">) => {
      const rail = railRef.current;
      const dragState = dragStateRef.current;

      if (!rail || dragState.pointerId !== event.pointerId) return;

      const dragDistance = event.clientX - dragState.startX;

      if (Math.abs(dragDistance) <= 4 && !dragState.isDragging) return;

      if (!dragState.isDragging) {
        dragState.isDragging = true;
        dragState.didDrag = true;
        capturePointer(event.pointerId);
      }

      event.preventDefault();
      rail.scrollLeft = dragState.startScrollLeft - dragDistance;
      updateScrollState();
    },
    [capturePointer, updateScrollState],
  );

  const handlePointerEnd = useCallback(
    (event: Pick<PointerEvent, "pointerId">) => {
      const dragState = dragStateRef.current;

      if (dragState.pointerId !== event.pointerId) return;

      releasePointer(event.pointerId);
      restoreBodySelection();

      dragState.pointerId = null;
      dragState.isDragging = false;
      cleanupWindowListenersRef.current();
      updateScrollState();
    },
    [releasePointer, restoreBodySelection, updateScrollState],
  );

  const handlePointerDown = (event: ReactPointerEvent<T>) => {
    const rail = railRef.current;

    if (!rail || event.button !== 0) return;

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: rail.scrollLeft,
      didDrag: false,
      isDragging: false,
      previousBodyUserSelect: document.body.style.userSelect,
    };

    document.body.style.userSelect = "none";
    cleanupWindowListenersRef.current();

    window.addEventListener("pointermove", handlePointerMove, {
      passive: false,
    });
    window.addEventListener("pointerup", handlePointerEnd);
    window.addEventListener("pointercancel", handlePointerEnd);

    cleanupWindowListenersRef.current = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
      cleanupWindowListenersRef.current = () => {};
    };
  };

  const handleClickCapture = (event: MouseEvent<T>) => {
    if (!dragStateRef.current.didDrag) return;

    event.preventDefault();
    event.stopPropagation();
    dragStateRef.current.didDrag = false;
  };

  const scrollByPage = useCallback(
    (direction: ScrollDirection) => {
      const rail = railRef.current;

      if (!rail) return;

      const distance = Math.max(rail.clientWidth * 0.7, 160);

      rail.scrollBy({
        left: direction === "left" ? -distance : distance,
        behavior: "smooth",
      });

      window.setTimeout(updateScrollState, 220);
    },
    [updateScrollState],
  );

  useEffect(() => {
    const rail = railRef.current;

    if (!rail) return undefined;

    updateScrollState();
    rail.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      rail.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  useEffect(
    () => () => {
      restoreBodySelection();
      cleanupWindowListenersRef.current();
    },
    [restoreBodySelection],
  );

  return {
    railRef,
    canScrollLeft,
    canScrollRight,
    scrollByPage,
    updateScrollState,
    dragScrollHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerEnd,
      onPointerCancel: handlePointerEnd,
      onClickCapture: handleClickCapture,
    },
  };
}
