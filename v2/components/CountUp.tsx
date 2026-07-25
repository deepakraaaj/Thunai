"use client";

import { useEffect, useRef, useState } from "react";

/** Animated count-up number. Respects prefers-reduced-motion (jumps to value). */
export default function CountUp({
  value,
  prefix = "",
  durationMs = 900,
  className = "",
}: {
  value: number;
  prefix?: string;
  durationMs?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value, durationMs]);

  return (
    <span className={`tabular ${className}`}>
      {prefix}
      {display.toLocaleString("en-IN")}
    </span>
  );
}
