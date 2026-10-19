"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useHydrated } from "@/lib/hooks/browser";
import { AudienceVideoPlayer } from "./AudienceVideoPlayer";

export type Audience = "business" | "community" | "osbb" | "developers" | "donors" | "citizens";

// Citizens and OSBB intentionally share the user-approved private-house video.
const media: Record<Audience, string> = {
  business: "business", community: "community", developers: "developers",
  donors: "donors", citizens: "home-osbb", osbb: "home-osbb",
};

/** Actual user-supplied illustrative video; never CSS motion presented as footage. */
export function AudienceScene({ audience }: { audience: Audience }) {
  const t = useTranslations("Animation");
  const hydrated = useHydrated();
  const base = `/assets/thematic-video/${media[audience]}`;
  const caption = audience === "donors" ? "videoFiguresIllustrative"
    : audience === "osbb" || audience === "citizens" ? "privateHouseVideo" : "videoIllustration";
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
