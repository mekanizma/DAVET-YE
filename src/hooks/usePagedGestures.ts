"use client";

import { useEffect, useRef } from "react";

/**
 * Vertical mouse wheel + finger swipe (also accepts horizontal swipe)
 * to step one page at a time — same feel as the main stage invites.
 */
export function usePagedGestures(enabled: boolean, go: (dir: -1 | 1) => void) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const goRef = useRef(go);
  goRef.current = go;

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled) return;

    let locked = false;
    let touchX = 0;
    let touchY = 0;

    const interactive = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      return Boolean(target.closest("a, button, input, textarea, select, label, [role='button']"));
    };

    const step = (dir: -1 | 1) => {
      if (locked) return;
      locked = true;
      goRef.current(dir);
      window.setTimeout(() => {
        locked = false;
      }, 420);
    };

    const onWheel = (event: WheelEvent) => {
      if (interactive(event.target)) return;
      const dominant = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (Math.abs(dominant) < 10) return;
      event.preventDefault();
      step(dominant > 0 ? 1 : -1);
    };

    const onTouchStart = (event: TouchEvent) => {
      const point = event.touches[0];
      if (!point) return;
      touchX = point.clientX;
      touchY = point.clientY;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (interactive(event.target)) return;
      event.preventDefault();
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (interactive(event.target)) return;
      const point = event.changedTouches[0];
      if (!point) return;
      const dx = point.clientX - touchX;
      const dy = point.clientY - touchY;
      if (Math.abs(dy) < 42 && Math.abs(dx) < 42) return;
      if (Math.abs(dy) >= Math.abs(dx)) step(dy < 0 ? 1 : -1);
      else step(dx < 0 ? 1 : -1);
    };

    root.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchmove", onTouchMove, { passive: false });
    root.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchmove", onTouchMove);
      root.removeEventListener("touchend", onTouchEnd);
    };
  }, [enabled]);

  return rootRef;
}
