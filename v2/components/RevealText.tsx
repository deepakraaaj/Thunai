"use client";

import { useEffect, useState } from "react";

/**
 * Reveals `text` word-by-word to loosely sync with the voice speaking it.
 * Respects prefers-reduced-motion (shows all at once).
 */
export default function RevealText({
  text,
  className = "",
  perWordMs = 90,
}: {
  text: string;
  className?: string;
  perWordMs?: number;
}) {
  const words = text.split(/\s+/).filter(Boolean);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(words.length);
      return;
    }
    setShown(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= words.length) clearInterval(id);
    }, perWordMs);
    return () => {
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <p className={className} aria-label={text}>
      {words.map((w, i) => (
        <span
          key={i}
          className="transition-opacity duration-300"
          style={{ opacity: i < shown ? 1 : 0.12 }}
        >
          {w}{" "}
        </span>
      ))}
    </p>
  );
}
