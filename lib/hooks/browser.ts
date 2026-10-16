"use client";
import { useSyncExternalStore } from "react";
const subscribeHydration = () => () => {};
export function useHydrated() {
  return useSyncExternalStore(subscribeHydration, () => true, () => false);
}
const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(callback: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
export function useReducedMotion() {
  return useSyncExternalStore(subscribeMotion, () => window.matchMedia(motionQuery).matches, () => true);
}
