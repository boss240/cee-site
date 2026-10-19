"use client";

import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { ComponentProps } from "react";
import type { EnergyField as EnergyFieldType } from "./EnergyField";

const EnergyField = lazy(() => import("./EnergyField").then((module) => ({ default: module.EnergyField })));

/** Keep below-fold decoration out of the initial JS/Canvas work; warm it before scrolling into view. */
export function DeferredEnergyField(props: ComponentProps<typeof EnergyFieldType>) {
  const marker = useRef<HTMLSpanElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const node = marker.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setNear(true); observer.disconnect(); }
    }, { rootMargin: "400px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <>
    <span ref={marker} data-deferred-energy-field aria-hidden="true" className="pointer-events-none absolute inset-0" />
    {near && <Suspense fallback={null}><EnergyField {...props} /></Suspense>}
  </>;
}
