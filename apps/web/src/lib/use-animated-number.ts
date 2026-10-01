"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Prototype `animateNumber`: a KPI rolls from its previous value to the new
 * one (650 ms, ease-out cubic) instead of jumping. The first render shows
 * the value as is.
 */
export function useAnimatedNumber(target: number, durationMs = 650): number {
  const [value, setValue] = useState(target);
  const from = useRef(target);

  useEffect(() => {
    const start = from.current;
    if (start === target) return;
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      from.current = target;
      setValue(target);
      return;
    }
    const t0 = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const p = Math.min((now - t0) / durationMs, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = start + (target - start) * eased;
      from.current = current;
      setValue(current);
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}
