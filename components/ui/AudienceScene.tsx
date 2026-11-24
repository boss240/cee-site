"use client";

import Image from "next/image";
import { Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useHydrated } from "@/lib/hooks/browser";
import { AudienceVideoPlayer } from "./AudienceVideoPlayer";

export type Audience = "business" | "community" | "osbb" | "developers" | "donors" | "citizens";

// Keep the approved private-house video for citizens; OSBB uses an explicit neutral symbol.
const media: Record<Exclude<Audience, "osbb">, string> = {
  business: "business", community: "community", developers: "developers",
  donors: "donors", citizens: "home-osbb",
};

/** Approved illustrative video, or an explicitly labelled neutral symbol where no suitable footage exists. */
export function AudienceScene({ audience }: { audience: Audience }) {
  const t = useTranslations("Animation");
  const hydrated = useHydrated();
  if (audience === "osbb") {
    return (
      <div className="audience-scene" data-audience-scene="osbb" data-concept-scene="osbb" role="img" aria-label={t("osbbConcept")}>
        <div className="audience-scene-window flex items-center justify-center bg-[var(--color-surface)] md:justify-end md:pr-10">
          <Building2 aria-hidden="true" className="h-24 w-24 text-[var(--color-brand-text)] sm:h-36 sm:w-36" strokeWidth={1} />
        </div>
        <div className="audience-scene-shade" aria-hidden="true" />
        <p className="audience-scene-caption">{t("osbbConcept")}</p>
      </div>
    );
  }
  const base = `/assets/thematic-video/${media[audience]}`;
  const caption = audience === "donors" ? "videoFiguresIllustrative"
    : audience === "citizens" ? "privateHouseVideo" : "videoIllustration";
  return (
    <div className="audience-scene" data-audience-scene={audience} data-video-scene={media[audience]}>
      <div className="audience-scene-window">
        <link rel="preload" as="image" href={`${base}/mobile.webp`} media="(max-width: 767px)" fetchPriority="high" />
        <link rel="preload" as="image" href={`${base}/desktop.webp`} media="(min-width: 768px)" fetchPriority="high" />
        <picture>
          <source media="(max-width: 767px)" srcSet={`${base}/mobile.webp`} />
          <Image src={`${base}/desktop.webp`} alt="" width={1280} height={720}
            unoptimized loading="eager" fetchPriority="high" className="audience-scene-image" />
        </picture>
        {hydrated && <AudienceVideoPlayer key={base} base={base} />}
      </div>
      <div className="audience-scene-shade" aria-hidden="true" />
      <p className="audience-scene-caption">{t(caption)}</p>
    </div>
  );
}
