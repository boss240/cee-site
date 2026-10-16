"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useHydrated, useReducedMotion } from "@/lib/hooks/browser";

const base = "/assets/hero-video/general";

function Poster() {
  return <picture>
    <source media="(max-width: 767px)" srcSet={`${base}/mobile.webp`} />
    <Image className="general-video-poster" src={`${base}/desktop.webp`} alt="" width={1280} height={720}
      unoptimized loading="eager" fetchPriority="high" />
  </picture>;
}

function Player() {
  const t = useTranslations("Animation");
  const reduced = useReducedMotion();
  // Keep one media resource for this visit, including after orientation changes.
  const [profile] = useState(() => window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop");
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);
  const intent = useRef(!reduced);
  const manualPause = useRef(false);
  const failed = useRef(false);
  const pending = useRef(false);
  const id = useId();

  const start = useCallback(() => {
    const video = ref.current;
    if (!video || !intent.current || failed.current || pending.current || document.hidden) return;
    const box = video.getBoundingClientRect();
    if (box.bottom <= 0 || box.top >= window.innerHeight) return;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    if (!video.getAttribute("src")) video.src = `${base}/${profile}.mp4`;
    else if (video.error) video.load();
    pending.current = true;
    void video.play().catch((error: unknown) => {
      // Pausing during navigation/visibility changes may abort an in-flight play.
      if (error instanceof DOMException && error.name === "AbortError") return;
      failed.current = true;
      setBlocked(true);
      setReady(false);
    }).finally(() => { pending.current = false; });
  }, [profile]);

  useEffect(() => {
    const video = ref.current;
    intent.current = !reduced && !manualPause.current;
    if (intent.current) start();
    else video?.pause();
    return () => video?.pause();
  }, [reduced, start]);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const update = () => {
      const box = video.getBoundingClientRect();
      if (document.hidden || box.bottom <= 0 || box.top >= window.innerHeight) video.pause();
      else start();
    };
    const observer = new IntersectionObserver(update);
    observer.observe(video);
    document.addEventListener("visibilitychange", update);
    window.addEventListener("pageshow", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("pageshow", update);
    };
  }, [start]);

  return <>
    <video ref={ref} id={id} data-profile={profile} className="general-video-media" data-ready={ready}
      muted playsInline loop preload="none" poster={`${base}/${profile}.webp`} aria-hidden="true"
      onPlaying={() => { setPlaying(true); setReady(true); setBlocked(false); failed.current = false; }}
      onPause={() => setPlaying(false)}
      onError={() => { failed.current = true; setBlocked(true); setReady(false); setPlaying(false); }} />
    <button type="button" className="audience-scene-control" aria-controls={id} aria-pressed={playing}
      onClick={() => {
        const video = ref.current;
        if (!video) return;
        if (!video.paused) {
          manualPause.current = true; intent.current = false; video.pause();
        } else {
          manualPause.current = false; intent.current = true; failed.current = false;
          setBlocked(false); start();
        }
      }}>{t(playing ? "videoPause" : "videoPlay")}</button>
    {blocked && <p className="general-video-status" role="status">{t("videoUnavailable")}</p>}
  </>;
}

/** Decorative, silent abstract energy animation; no project footage or data. */
export function GeneralHeroVideo() {
  const hydrated = useHydrated();
  return <div className="general-video" data-general-video>
    <Poster />
    {hydrated && <Player />}
  </div>;
}
