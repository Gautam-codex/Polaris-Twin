"use client";

import { useEffect, useRef, useState } from "react";
import { formatNumber } from "@/shared/alerts";

const DURATION_MS = 700;

function format(value: number, decimals: number): string {
  if (decimals === 0) return formatNumber(value);
  const fixed = value.toFixed(decimals);
  // U+2212 minus reads better than a hyphen in large numerals.
  return fixed.startsWith("-") ? `−${fixed.slice(1)}` : fixed;
}

/** Tweens from the previous value to the new one with an ease-out curve. */
export function AnimatedNumber({ value, decimals = 0, className }: { value: number; decimals?: number; className?: string }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  const current = useRef(value);

  useEffect(() => {
    from.current = current.current;
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION_MS);
      const eased = 1 - (1 - t) ** 3;
      const next = from.current + (value - from.current) * eased;
      current.current = next;
      setShown(next);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span className={className}>{format(shown, decimals)}</span>;
}
