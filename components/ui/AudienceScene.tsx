"use client";

import Image from "next/image";
import { AudienceFlows } from "./AudienceFlows";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "@/lib/hooks/browser";

export type Audience = "business" | "community" | "osbb" | "developers" | "donors" | "citizens";

/** Original static artwork with illustrative animated energy pulses, not footage of a real project. */
export function AudienceScene({ audience }: { audience: Audience }) {
  const t = useTranslations("Animation");
  const reduced = useReducedMotion();
  const [choice, setChoice] = useState<{ enabled: boolean; reduced: boolean } | null>(null);
  const [active, setActive] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const enabled = choice?.reduced === reduced ? choice.enabled : !reduced;
  const desktop = ["osbb", "developers", "donors"].includes(audience) ? "mobile" : "desktop";
  const base = `/assets/hero-video/${audience}`;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () => {
      const box = node.getBoundingClientRect();
      setActive(!document.hidden && box.bottom > 0 && box.top < window.innerHeight);
    };
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(update);
    observer?.observe(node);
    document.addEventListener("visibilitychange", update);
    window.addEventListener("pageshow", update);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("pageshow", update);
      window.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <div ref={ref} className="audience-scene" data-audience-scene={audience} data-playing={enabled && active}>
      <div className="audience-scene-window" id={id}>
        <div className="audience-scene-plane">
          <picture>
            <source media="(max-width: 767px)" srcSet={`${base}/mobile.webp`} />
            <Image src={`${base}/${desktop}.webp`} alt={t(`scenes.${audience}`)} width={1280} height={720}
              unoptimized loading="eager" fetchPriority="high" className="audience-scene-image" />
          </picture>
          <AudienceFlows audience={audience} />
        </div>
      </div>
      <div className="audience-scene-shade" aria-hidden="true" />
      <p className="audience-scene-caption">{t("flowsIllustration")}</p>
      <button type="button" className="audience-scene-control" aria-controls={id} aria-pressed={enabled}
        onClick={() => setChoice({ enabled: !enabled, reduced })}>
        {t(enabled ? "pause" : "play")}
      </button>
    </div>
  );
}
