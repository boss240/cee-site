"use client";

import { useEffect, useState } from "react";

/** Рядок, у якому слова змінюють одне одного. */
export function Ticker({
  words,
  interval = 2200,
}: {
  words: string[];
  interval?: number;
}) {
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAnimate(false);
      return;
    }
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % words.length);
    }, interval);
    return () => clearInterval(id);
  }, [words.length, interval]);

  if (!animate) {
    return (
      <span className="font-semibold text-[var(--color-brand-text)]">
        {words.join(" · ")}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className="pulse-dot h-2 w-2 rounded-full bg-[var(--color-brand)]"
      />
      <span
        key={index}
        className="ticker-item font-semibold text-[var(--color-brand-text)]"
      >
        {words[index]}
      </span>
      <span className="sr-only">{words.join(", ")}</span>
    </span>
  );
}
