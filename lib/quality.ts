"use client";

/**
 * Detección de capacidades para degradar con elegancia:
 *  - "static":  sin WebGL o prefers-reduced-motion → layout accesible sin 3D
 *  - "low":     mobile / hardware modesto → 3D con DPR bajo, sin reflector
 *  - "high":    desktop → experiencia completa a 60fps
 */

export type QualityTier = "high" | "low";
export type ExperienceMode = "3d" | "static";

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function supportsWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") ?? canvas.getContext("webgl"),
    );
  } catch {
    return false;
  }
}

export function detectTier(): QualityTier {
  if (typeof window === "undefined") return "high";
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = window.innerWidth < 768;
  const weakCpu = (navigator.hardwareConcurrency ?? 8) <= 4;
  return coarse || small || weakCpu ? "low" : "high";
}

const MODE_KEY = "eleven-experience-mode";

/** Preferencia manual del usuario (toggle "versión accesible"). */
export function storedMode(): ExperienceMode | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(MODE_KEY);
  return v === "3d" || v === "static" ? v : null;
}

export function persistMode(mode: ExperienceMode) {
  window.localStorage.setItem(MODE_KEY, mode);
}

export function resolveMode(): ExperienceMode {
  const stored = storedMode();
  if (stored) return stored;
  if (prefersReducedMotion() || !supportsWebGL()) return "static";
  return "3d";
}
